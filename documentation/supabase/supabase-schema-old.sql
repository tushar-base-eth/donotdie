-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
-- Purpose: Stores user profile data and aggregate statistics.
-- Auto-generated: id, created_at, updated_at
-- Required for insert: name, unit_preference, theme_preference
-- Optional for insert: gender, date_of_birth, weight_kg, height_cm, body_fat_percentage
-- Updatable: name, gender, date_of_birth, weight_kg, height_cm, body_fat_percentage, unit_preference, theme_preference
-- Read-only: total_volume, total_workouts (managed by triggers)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to auth.users, auto-generated
  name TEXT NOT NULL, -- User's name, required on insert
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')), -- Optional, restricted to specific values
  date_of_birth DATE CHECK (date_of_birth <= CURRENT_DATE AND date_of_birth >= '1900-01-01'), -- Optional, past date only
  weight_kg NUMERIC CHECK (weight_kg > 0), -- Optional, positive value if provided
  height_cm NUMERIC CHECK (height_cm >= 50 AND height_cm <= 300), -- Optional, between 50-300 cm
  body_fat_percentage NUMERIC CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100), -- Optional, 0-100%
  unit_preference TEXT NOT NULL CHECK (unit_preference IN ('metric', 'imperial')) DEFAULT 'metric', -- Required, defaults to 'metric'
  theme_preference TEXT NOT NULL CHECK (theme_preference IN ('light', 'dark')) DEFAULT 'light', -- Required, defaults to 'light'
  total_volume NUMERIC NOT NULL DEFAULT 0 CHECK (total_volume >= 0), -- Read-only, updated by triggers
  total_workouts INTEGER NOT NULL DEFAULT 0 CHECK (total_workouts >= 0), -- Read-only, updated by triggers
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Auto-generated on insert
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP -- Auto-generated, updated by trigger
);

-- Enable row-level security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow auth admin to insert profiles" 
  ON public.profiles FOR INSERT TO supabase_auth_admin WITH CHECK (true);

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

-- Table: workouts
-- Purpose: Tracks user workouts with dates.
-- Auto-generated: id, created_at
-- Required for insert: user_id, workout_date
-- Optional for insert: (none)
-- Updatable: workout_date
-- Read-only: (none)
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Auto-generated unique identifier
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Required, links to profiles
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Required, defaults to today, can be updated
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP -- Auto-generated on insert
);

-- Indexes for performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_workout_date ON public.workouts(workout_date);
CREATE INDEX idx_workouts_created_at ON public.workouts(created_at);

-- Enable row-level security for workouts
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Policies for workouts table
CREATE POLICY "Users can view their own workouts" 
  ON public.workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workouts" 
  ON public.workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workouts" 
  ON public.workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own workouts"
  ON public.workouts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Table: available_exercises
-- Purpose: Stores predefined exercises available to all users.
-- Auto-generated: id
-- Required for insert: name, primary_muscle_group
-- Optional for insert: secondary_muscle_group
-- Updatable: name, primary_muscle_group, secondary_muscle_group
-- Read-only: (none)
CREATE TABLE public.available_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Auto-generated unique identifier
  name TEXT UNIQUE NOT NULL, -- Required, unique exercise name
  primary_muscle_group TEXT NOT NULL, -- Required, main muscle targeted
  secondary_muscle_group TEXT -- Optional, secondary muscle targeted
);

-- Enable row-level security for available_exercises
ALTER TABLE public.available_exercises ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view exercises
CREATE POLICY "Authenticated users can view available exercises" 
  ON public.available_exercises FOR SELECT TO authenticated USING (true);

-- Seed data for available_exercises
INSERT INTO public.available_exercises (id, name, primary_muscle_group, secondary_muscle_group) VALUES
  (uuid_generate_v4(), 'Bench Press', 'Chest', 'Triceps'),
  (uuid_generate_v4(), 'Squat', 'Legs', 'Glutes'),
  (uuid_generate_v4(), 'Deadlift', 'Back', 'Hamstrings'),
  (uuid_generate_v4(), 'Pull-up', 'Back', 'Biceps'),
  (uuid_generate_v4(), 'Shoulder Press', 'Shoulders', 'Triceps');

-- Table: workout_exercises
-- Purpose: Links exercises to workouts with an order.
-- Auto-generated: id, created_at
-- Required for insert: workout_id, exercise_id, "order"
-- Optional for insert: (none)
-- Updatable: exercise_id, "order"
-- Read-only: (none)
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Auto-generated unique identifier
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE, -- Required, links to workouts
  exercise_id UUID NOT NULL REFERENCES public.available_exercises(id), -- Required, links to exercises
  "order" INTEGER NOT NULL, -- Required, order of exercise in workout
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP -- Auto-generated on insert
);

-- Unique constraint: Ensures unique order per workout
ALTER TABLE public.workout_exercises
ADD CONSTRAINT unique_order_per_workout UNIQUE (workout_id, "order");

-- Indexes for performance
CREATE INDEX idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise_id ON public.workout_exercises(exercise_id);

-- Enable row-level security for workout_exercises
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Policies for workout_exercises
CREATE POLICY "Users can view their own workout exercises" 
  ON public.workout_exercises FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE public.workouts.id = public.workout_exercises.workout_id
      AND public.workouts.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create workout exercises for their own workouts" 
  ON public.workout_exercises FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE public.workouts.id = public.workout_exercises.workout_id
      AND public.workouts.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update their own workout exercises"
  ON public.workout_exercises FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE public.workouts.id = public.workout_exercises.workout_id
      AND public.workouts.user_id = auth.uid()
    )
  );

-- Table: sets
-- Purpose: Tracks individual sets for exercises in workouts.
-- Auto-generated: id, created_at
-- Required for insert: workout_exercise_id, set_number, reps, weight_kg
-- Optional for insert: (none)
-- Updatable: reps, weight_kg
-- Read-only: (none)
CREATE TABLE public.sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Auto-generated unique identifier
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE, -- Required, links to workout_exercises
  set_number INTEGER NOT NULL, -- Required, order of set for the exercise
  reps INTEGER NOT NULL CHECK (reps >= 0), -- Required, non-negative number of repetitions
  weight_kg NUMERIC NOT NULL CHECK (weight_kg >= 0), -- Required, non-negative weight in kg
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP -- Auto-generated on insert
);

-- Unique constraint: Ensures unique set_number per workout_exercise
ALTER TABLE public.sets
ADD CONSTRAINT unique_set_number_per_exercise UNIQUE (workout_exercise_id, set_number);

-- Index for performance
CREATE INDEX idx_sets_workout_exercise_id ON public.sets(workout_exercise_id);

-- Enable row-level security for sets
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

-- Policies for sets
CREATE POLICY "Users can view their own sets" 
  ON public.sets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON public.workouts.id = public.workout_exercises.workout_id
      WHERE public.workout_exercises.id = public.sets.workout_exercise_id
      AND public.workouts.user_id = auth.uid()
    )
  );
CREATE POLICY "Authenticated users can insert sets" 
  ON public.sets FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.workouts
      WHERE id = (
        SELECT workout_id FROM public.workout_exercises
        WHERE id = public.sets.workout_exercise_id
      )
    )
  );
CREATE POLICY "Users can update their own sets"
  ON public.sets FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON public.workouts.id = public.workout_exercises.workout_id
      WHERE public.workout_exercises.id = public.sets.workout_exercise_id
      AND public.workouts.user_id = auth.uid()
    )
  );

-- Table: daily_volume
-- Purpose: Tracks daily workout volume per user.
-- Auto-generated: (none)
-- Required for insert: user_id, date, volume
-- Optional for insert: (none)
-- Updatable: volume
-- Read-only: (none)
CREATE TABLE public.daily_volume (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Required, links to profiles
  date DATE NOT NULL, -- Required, date of volume
  volume NUMERIC NOT NULL DEFAULT 0 CHECK (volume >= 0), -- Required, non-negative volume
  PRIMARY KEY (user_id, date) -- Composite primary key
);

-- Index for performance
CREATE INDEX idx_daily_volume_date ON public.daily_volume(date);

-- Enable row-level security for daily_volume
ALTER TABLE public.daily_volume ENABLE ROW LEVEL SECURITY;

-- Policies for daily_volume
CREATE POLICY "Users can view their own daily volume" 
  ON public.daily_volume FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own daily volume" 
  ON public.daily_volume FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily volume" 
  ON public.daily_volume FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function: Handles new user creation, populating profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, unit_preference)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'unit_preference', 'metric')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Calls handle_new_user after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Adjusts volume and counts when a workout is deleted
CREATE OR REPLACE FUNCTION public.on_workout_delete()
RETURNS TRIGGER AS $$
DECLARE
  workout_volume NUMERIC;
  workout_date DATE;
BEGIN
  -- Calculate total volume with rounding per set
  SELECT SUM(ROUND(CAST(s.reps * s.weight_kg AS numeric), 2)) INTO workout_volume
  FROM public.sets s
  JOIN public.workout_exercises we ON s.workout_exercise_id = we.id
  WHERE we.workout_id = OLD.id;

  workout_volume := COALESCE(workout_volume, 0); -- No need to round again
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

-- Function: Updates volume when a set is inserted
CREATE OR REPLACE FUNCTION public.update_volume_on_set_insert()
RETURNS TRIGGER AS $$
DECLARE
  workout_id UUID;
  func_user_id UUID;
  workout_date DATE;
  set_volume NUMERIC;
BEGIN
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

  -- Update profiles total_volume
  UPDATE public.profiles
  SET total_volume = ROUND(total_volume + set_volume, 2)
  WHERE id = func_user_id;

  -- Insert or update daily_volume
  INSERT INTO public.daily_volume (user_id, date, volume)
  VALUES (func_user_id, workout_date, set_volume)
  ON CONFLICT (user_id, date)
  DO UPDATE SET volume = ROUND(public.daily_volume.volume + set_volume, 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Adjusts volume when a set is deleted
CREATE OR REPLACE FUNCTION public.update_volume_on_set_delete()
RETURNS TRIGGER AS $$
DECLARE
  workout_id UUID;
  func_user_id UUID;
  workout_date DATE;
  set_volume NUMERIC;
BEGIN
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

-- Function: Adjusts volume when a set is updated
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
  -- Skip if no change in reps or weight
  IF NEW.reps = OLD.reps AND NEW.weight_kg = OLD.weight_kg THEN
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

  -- Calculate volume difference
  old_volume := ROUND(CAST(OLD.reps * OLD.weight_kg AS numeric), 2);
  new_volume := ROUND(CAST(NEW.reps * NEW.weight_kg AS numeric), 2);
  volume_diff := new_volume - old_volume;

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