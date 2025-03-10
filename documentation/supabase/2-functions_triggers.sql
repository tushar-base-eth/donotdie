-- Function: Updates the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Updates updated_at on profile changes
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Function: Handles new user creation, populating profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, unit_preference)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    CASE
      WHEN NEW.raw_user_meta_data->>'unit_preference' IN ('metric', 'imperial')
      THEN CAST(NEW.raw_user_meta_data->>'unit_preference' AS public.unit_preference_type)
      ELSE 'metric'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Updated: Added SET ROLE to limit privileges to supabase_auth_admin
-- Change: Removed SET ROLE supabase_auth_admin.
-- Why: The function should run with the privileges of its creator (e.g., postgres or a Supabase admin role), 
-- which already has sufficient permissions to insert into profiles. 
-- The RLS policy will handle restricting the operation to supabase_auth_admin.

-- Trigger: Calls handle_new_user after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Adjusts volume and counts when a workout is deleted
-- Documentation: Decrements total_volume and total_workouts in profiles, adjusts daily_volume, and cleans up zero-volume entries
CREATE OR REPLACE FUNCTION public.on_workout_delete()
RETURNS TRIGGER AS $$
DECLARE
  workout_volume NUMERIC;
  workout_date DATE;
BEGIN
  -- Calculate total volume with rounding per set (only for weighted exercises)
  SELECT SUM(ROUND(CAST(s.reps * s.weight_kg AS numeric), 2)) INTO workout_volume
  FROM public.sets s
  JOIN public.workout_exercises we ON s.workout_exercise_id = we.id
  WHERE we.workout_id = OLD.id AND s.reps IS NOT NULL AND s.weight_kg IS NOT NULL;

  workout_volume := COALESCE(workout_volume, 0);
  workout_date := OLD.workout_date;

  -- Update profiles
  UPDATE public.profiles
  SET total_volume = GREATEST(ROUND(total_volume - workout_volume, 2), 0),
      total_workouts = total_workouts - 1
  WHERE id = OLD.user_id;

  -- Update daily_volume
  UPDATE public.daily_volume
  SET volume = GREATEST(ROUND(volume - workout_volume, 2), 0)
  WHERE user_id = OLD.user_id AND date = workout_date;

  -- Clean up zero-volume entries
  DELETE FROM public.daily_volume
  WHERE user_id = OLD.user_id AND date = workout_date AND volume = 0;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Adjusts volumes on workout deletion
CREATE TRIGGER trigger_on_workout_delete
  BEFORE DELETE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.on_workout_delete();

-- Function: Increments total_workouts when a workout is added
-- Documentation: Increases the total_workouts count in profiles for the user who added the workout
CREATE OR REPLACE FUNCTION public.on_workout_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET total_workouts = total_workouts + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Increments total_workouts on workout insertion
CREATE TRIGGER trigger_on_workout_insert
  AFTER INSERT ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.on_workout_insert();

-- Function: Updates volume when a set is inserted (only for weighted exercises)
-- Documentation: Updates total_volume in profiles and daily_volume for weighted sets, using advisory locks for atomicity
CREATE OR REPLACE FUNCTION public.update_volume_on_set_insert()
RETURNS TRIGGER AS $$
DECLARE
  workout_id UUID;
  func_user_id UUID;
  workout_date DATE;
  set_volume NUMERIC;
BEGIN
  -- Skip if not a weighted set
  IF NEW.reps IS NULL OR NEW.weight_kg IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get workout_id
  SELECT we.workout_id INTO workout_id
  FROM public.workout_exercises we
  WHERE we.id = NEW.workout_exercise_id;

  -- Get user_id and workout_date
  SELECT w.user_id, w.workout_date INTO func_user_id, workout_date
  FROM public.workouts w
  WHERE w.id = workout_id;

  -- Calculate set volume
  set_volume := ROUND(CAST(NEW.reps * NEW.weight_kg AS numeric), 2);

  -- Use advisory lock to prevent race conditions for this user's volume updates
  PERFORM pg_advisory_xact_lock(hashtext(func_user_id::text));
  -- Updated: Replaced invalid FOR UPDATE with advisory lock to ensure atomicity

  -- Update profiles total_volume
  UPDATE public.profiles
  SET total_volume = ROUND(total_volume + set_volume, 2)
  WHERE id = func_user_id;

  -- Update or insert daily_volume
  INSERT INTO public.daily_volume (user_id, date, volume)
  VALUES (func_user_id, workout_date, set_volume)
  ON CONFLICT (user_id, date)
  DO UPDATE SET volume = ROUND(public.daily_volume.volume + set_volume, 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Adjusts volume when a set is deleted (only for weighted exercises)
-- Documentation: Decrements total_volume in profiles and daily_volume for deleted weighted sets, using advisory locks
CREATE OR REPLACE FUNCTION public.update_volume_on_set_delete()
RETURNS TRIGGER AS $$
DECLARE
  workout_id UUID;
  func_user_id UUID;
  workout_date DATE;
  set_volume NUMERIC;
BEGIN
  -- Skip if not a weighted set
  IF OLD.reps IS NULL OR OLD.weight_kg IS NULL THEN
    RETURN OLD;
  END IF;

  -- Get workout_id
  SELECT we.workout_id INTO workout_id
  FROM public.workout_exercises we
  WHERE we.id = OLD.workout_exercise_id;

  -- Get user_id and workout_date
  SELECT w.user_id, w.workout_date INTO func_user_id, workout_date
  FROM public.workouts w
  WHERE w.id = workout_id;

  -- Calculate set volume
  set_volume := ROUND(CAST(OLD.reps * OLD.weight_kg AS numeric), 2);

  -- Use advisory lock to prevent race conditions for this user's volume updates
  PERFORM pg_advisory_xact_lock(hashtext(func_user_id::text));
  -- Updated: Replaced invalid FOR UPDATE with advisory lock to ensure atomicity

  -- Update profiles total_volume
  UPDATE public.profiles
  SET total_volume = GREATEST(ROUND(total_volume - set_volume, 2), 0)
  WHERE id = func_user_id;

  -- Update daily_volume
  UPDATE public.daily_volume
  SET volume = GREATEST(ROUND(volume - set_volume, 2), 0)
  WHERE user_id = func_user_id AND date = workout_date;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function: Adjusts volume when a set is updated (only for weighted exercises)
-- Documentation: Adjusts total_volume and daily_volume based on changes to weighted sets, using advisory locks
CREATE OR REPLACE FUNCTION public.update_volume_on_set_update()
RETURNS TRIGGER AS $$
DECLARE
  workout_id UUID;
  func_user_id UUID;
  workout_date DATE;
  old_volume NUMERIC;
  new_volume NUMERIC;
  volume_diff NUMERIC;
BEGIN
  -- Skip if no change in reps or weight or not a weighted set
  IF (NEW.reps IS NULL AND OLD.reps IS NULL) OR 
     (NEW.weight_kg IS NULL AND OLD.weight_kg IS NULL) OR 
     (NEW.reps = OLD.reps AND NEW.weight_kg = OLD.weight_kg) THEN
    RETURN NEW;
  END IF;

  -- Get workout_id
  SELECT we.workout_id INTO workout_id
  FROM public.workout_exercises we
  WHERE we.id = NEW.workout_exercise_id;

  -- Get user_id and workout_date
  SELECT w.user_id, w.workout_date INTO func_user_id, workout_date
  FROM public.workouts w
  WHERE w.id = workout_id;

  -- Calculate volume difference (handle NULLs)
  old_volume := ROUND(CAST(COALESCE(OLD.reps, 0) * COALESCE(OLD.weight_kg, 0) AS numeric), 2);
  new_volume := ROUND(CAST(COALESCE(NEW.reps, 0) * COALESCE(NEW.weight_kg, 0) AS numeric), 2);
  volume_diff := new_volume - old_volume;

  -- Use advisory lock to prevent race conditions for this user's volume updates
  PERFORM pg_advisory_xact_lock(hashtext(func_user_id::text));
  -- Updated: Replaced invalid FOR UPDATE with advisory lock to ensure atomicity

  -- Update profiles total_volume
  UPDATE public.profiles
  SET total_volume = GREATEST(ROUND(total_volume + volume_diff, 2), 0)
  WHERE id = func_user_id;

  -- Update daily_volume
  UPDATE public.daily_volume
  SET volume = GREATEST(ROUND(volume + volume_diff, 2), 0)
  WHERE user_id = func_user_id AND date = workout_date;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Limits user-created exercises to 10 per user
CREATE OR REPLACE FUNCTION public.check_exercise_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_exercises WHERE user_id = NEW.user_id) >= 10 THEN
    RAISE EXCEPTION 'User has reached the maximum limit of 10 custom exercises.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Validates set metrics against exercise requirements
CREATE OR REPLACE FUNCTION public.validate_set_metrics()
RETURNS TRIGGER AS $$
DECLARE
  ex_uses_reps BOOLEAN;
  ex_uses_weight BOOLEAN;
  ex_uses_duration BOOLEAN;
  ex_uses_distance BOOLEAN;
BEGIN
  -- Fetch exercise type and metrics
  IF EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.exercises e ON we.predefined_exercise_id = e.id
    WHERE we.id = NEW.workout_exercise_id AND we.exercise_type = 'predefined'
  ) THEN
    SELECT uses_reps, uses_weight, uses_duration, uses_distance
    INTO ex_uses_reps, ex_uses_weight, ex_uses_duration, ex_uses_distance
    FROM public.exercises e
    JOIN public.workout_exercises we ON e.id = we.predefined_exercise_id
    WHERE we.id = NEW.workout_exercise_id;
  ELSIF EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.user_exercises ue ON we.user_exercise_id = ue.id
    WHERE we.id = NEW.workout_exercise_id AND we.exercise_type = 'user'
  ) THEN
    SELECT uses_reps, uses_weight, uses_duration, uses_distance
    INTO ex_uses_reps, ex_uses_weight, ex_uses_duration, ex_uses_distance
    FROM public.user_exercises ue
    JOIN public.workout_exercises we ON ue.id = we.user_exercise_id
    WHERE we.id = NEW.workout_exercise_id;
  END IF;

  -- Validate required metrics
  IF ex_uses_reps AND NEW.reps IS NULL THEN
    RAISE EXCEPTION 'Reps are required for this exercise.';
  END IF;
  IF ex_uses_weight AND NEW.weight_kg IS NULL THEN
    RAISE EXCEPTION 'Weight is required for this exercise.';
  END IF;
  IF ex_uses_duration AND NEW.duration_seconds IS NULL THEN
    RAISE EXCEPTION 'Duration is required for this exercise.';
  END IF;
  IF ex_uses_distance AND NEW.distance_meters IS NULL THEN
    RAISE EXCEPTION 'Distance is required for this exercise.';
  END IF;

  -- Validate that irrelevant metrics are not provided
  IF NOT ex_uses_reps AND NEW.reps IS NOT NULL THEN
    RAISE EXCEPTION 'Reps not applicable for this exercise.';
  END IF;
  IF NOT ex_uses_weight AND NEW.weight_kg IS NOT NULL THEN
    RAISE EXCEPTION 'Weight not applicable for this exercise.';
  END IF;
  IF NOT ex_uses_duration AND NEW.duration_seconds IS NOT NULL THEN
    RAISE EXCEPTION 'Duration not applicable for this exercise.';
  END IF;
  IF NOT ex_uses_distance AND NEW.distance_meters IS NOT NULL THEN
    RAISE EXCEPTION 'Distance not applicable for this exercise.';
  END IF;
  -- Updated: Added checks to disallow irrelevant metrics for consistency

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for set operations
CREATE TRIGGER update_volume_after_set_insert
  AFTER INSERT ON public.sets
  FOR EACH ROW EXECUTE FUNCTION public.update_volume_on_set_insert();
CREATE TRIGGER update_volume_after_set_delete
  AFTER DELETE ON public.sets
  FOR EACH ROW EXECUTE FUNCTION public.update_volume_on_set_delete();
CREATE TRIGGER update_volume_after_set_update
  AFTER UPDATE ON public.sets
  FOR EACH ROW
  WHEN (OLD.reps IS DISTINCT FROM NEW.reps OR OLD.weight_kg IS DISTINCT FROM NEW.weight_kg)
  EXECUTE FUNCTION public.update_volume_on_set_update();

-- Trigger: Enforces user exercise limit
CREATE TRIGGER before_insert_user_exercises
  BEFORE INSERT ON public.user_exercises
  FOR EACH ROW EXECUTE FUNCTION public.check_exercise_limit();

-- Trigger: Validates set metrics
CREATE TRIGGER before_insert_update_sets
  BEFORE INSERT OR UPDATE ON public.sets
  FOR EACH ROW EXECUTE FUNCTION public.validate_set_metrics();