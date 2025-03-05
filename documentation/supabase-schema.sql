-- Enable UUID extension for generating unique identifiers
-- Why: UUIDs provide a robust, globally unique primary key for tables, especially useful in distributed systems.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing objects in reverse dependency order
-- Why: Dropping in reverse order (triggers/functions before tables) prevents dependency errors when re-running the script.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_on_workout_delete ON public.workouts;
DROP TRIGGER IF EXISTS trigger_on_workout_insert ON public.workouts;
DROP TRIGGER IF EXISTS update_volume_after_set_insert ON public.sets;
DROP TRIGGER IF EXISTS update_volume_after_set_delete ON public.sets;
DROP TRIGGER IF EXISTS update_volume_after_set_update ON public.sets;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.on_workout_delete();
DROP FUNCTION IF EXISTS public.on_workout_insert();
DROP FUNCTION IF EXISTS public.update_volume_on_set_insert();
DROP FUNCTION IF EXISTS public.update_volume_on_set_delete();
DROP FUNCTION IF EXISTS public.update_volume_on_set_update();

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow auth admin to insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can create their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Authenticated users can view available exercises" ON public.available_exercises;
DROP POLICY IF EXISTS "Users can view their own workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can create workout exercises for their own workouts" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can view their own sets" ON public.sets;
DROP POLICY IF EXISTS "Authenticated users can insert sets" ON public.sets;
DROP POLICY IF EXISTS "Users can view their own daily volume" ON public.daily_volume;
DROP POLICY IF EXISTS "Users can create their own daily volume" ON public.daily_volume;
DROP POLICY IF EXISTS "Users can update their own daily volume" ON public.daily_volume;

DROP TABLE IF EXISTS public.sets CASCADE;
DROP TABLE IF EXISTS public.workout_exercises CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;
DROP TABLE IF EXISTS public.daily_volume CASCADE;
DROP TABLE IF EXISTS public.available_exercises CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table to store user information
-- Why: Centralizes user data (e.g., name, stats) and links to auth.users for authentication.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to authentication system
  name TEXT NOT NULL, -- User's display name
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')) DEFAULT 'Other', -- Constrained options for consistency
  date_of_birth DATE NOT NULL DEFAULT '2000-01-01', -- Default for simplicity
  weight_kg NUMERIC DEFAULT 70,  -- NUMERIC ensures precision for weight tracking
  height_cm NUMERIC DEFAULT 170, -- Consistent precision with weight_kg
  body_fat_percentage NUMERIC, -- Optional field for advanced tracking
  unit_preference TEXT NOT NULL CHECK (unit_preference IN ('metric', 'imperial')) DEFAULT 'metric', -- Enforces valid units
  theme_preference TEXT NOT NULL CHECK (theme_preference IN ('light', 'dark')) DEFAULT 'light', -- UI customization
  total_volume NUMERIC DEFAULT 0 CHECK (total_volume >= 0),  -- Tracks lifetime volume lifted with precision, non-negative
  total_workouts INTEGER DEFAULT 0 CHECK (total_workouts >= 0), -- Tracks total workout count, non-negative
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Audit trail for creation
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Audit trail for updates
);

-- Enable Row-Level Security (RLS) for profiles
-- Why: RLS restricts access to rows based on user identity, enhancing security.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions to supabase_auth_admin
-- Why: Allows the authentication system to insert profiles for new users.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON TABLE public.profiles TO supabase_auth_admin;

-- RLS policies for profiles
-- Why: Ensures users only access their own data, while allowing admin insertion.
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow auth admin to insert profiles" 
  ON public.profiles FOR INSERT TO supabase_auth_admin WITH CHECK (true);

-- Function to auto-create profiles for new users
-- Why: Streamlines onboarding by linking auth.users to profiles automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, unit_preference)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'), -- Fallback name if none provided
    COALESCE(NEW.raw_user_meta_data->>'unit_preference', 'metric') -- Default to metric
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
-- Why: Executes the profile creation function after a user signs up.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create workouts table for workout instances
-- Why: Tracks individual workouts per user with a timestamp.
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each workout
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Links to user
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- When the workout was logged
);

-- Add indexes for performance
-- Why: Speeds up queries filtering by user or date, common in workout retrieval.
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON public.workouts(created_at);

-- Enable RLS for workouts
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for workouts
-- Why: Restricts workout access to the owning user.
CREATE POLICY "Users can view their own workouts" 
  ON public.workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workouts" 
  ON public.workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workouts" 
  ON public.workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to handle workout deletion
-- Why: Adjusts profile and daily volume stats when a workout is removed.
CREATE OR REPLACE FUNCTION public.on_workout_delete()
RETURNS TRIGGER AS $$
DECLARE
  workout_volume NUMERIC;
  workout_date DATE;
BEGIN
  -- Calculate total volume for the deleted workout
  SELECT SUM(CAST(s.reps * s.weight_kg AS numeric)) INTO workout_volume
  FROM public.sets s
  JOIN public.workout_exercises we ON s.workout_exercise_id = we.id
  WHERE we.workout_id = OLD.id;

  -- Round to 2 decimal places for consistency
  workout_volume := ROUND(COALESCE(workout_volume, 0), 2);

  -- Get workout date for daily volume adjustment
  workout_date := OLD.created_at::DATE;

  -- Update profile stats
  UPDATE public.profiles
  SET total_volume = ROUND(total_volume - workout_volume, 2),
      total_workouts = total_workouts - 1
  WHERE id = OLD.user_id;

  -- Update daily volume
  UPDATE public.daily_volume
  SET volume = ROUND(volume - workout_volume, 2)
  WHERE user_id = OLD.user_id AND date = workout_date;

  -- Remove zero-volume entries
  DELETE FROM public.daily_volume
  WHERE user_id = OLD.user_id AND date = workout_date AND volume = 0;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workout deletion
-- Why: Runs before deletion to update stats accurately.
CREATE TRIGGER trigger_on_workout_delete
  BEFORE DELETE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.on_workout_delete();

-- Function to handle workout insertion
-- Why: Increments total_workouts in profiles when a new workout is added.
CREATE OR REPLACE FUNCTION public.on_workout_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET total_workouts = total_workouts + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workout insertion
-- Why: Executes the increment function after a workout is added.
CREATE TRIGGER trigger_on_workout_insert
  AFTER INSERT ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.on_workout_insert();

-- Create available_exercises table for exercise catalog
-- Why: Provides a reusable list of exercises for users to select from.
CREATE TABLE public.available_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL, -- Ensures no duplicate exercise names
  primary_muscle_group TEXT NOT NULL, -- Main muscle targeted
  secondary_muscle_group TEXT -- Optional secondary muscle
);

-- Enable RLS for available_exercises
ALTER TABLE public.available_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policy for available_exercises
-- Why: Allows all authenticated users to see the exercise catalog.
CREATE POLICY "Authenticated users can view available exercises" 
  ON public.available_exercises FOR SELECT TO authenticated USING (true);

-- Seed initial exercise data
-- Why: Provides a starting set of common exercises for immediate use.
INSERT INTO public.available_exercises (id, name, primary_muscle_group, secondary_muscle_group) VALUES
  (uuid_generate_v4(), 'Bench Press', 'Chest', 'Triceps'),
  (uuid_generate_v4(), 'Squat', 'Legs', 'Glutes'),
  (uuid_generate_v4(), 'Deadlift', 'Back', 'Hamstrings'),
  (uuid_generate_v4(), 'Pull-up', 'Back', 'Biceps'),
  (uuid_generate_v4(), 'Shoulder Press', 'Shoulders', 'Triceps'),
  (uuid_generate_v4(), 'Push-up', 'Chest', 'Shoulders'),
  (uuid_generate_v4(), 'Lunge', 'Legs', 'Glutes'),
  (uuid_generate_v4(), 'Bent-Over Row', 'Back', 'Biceps');

-- Create workout_exercises table to link workouts to exercises
-- Why: Connects specific exercises to a workout instance.
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE, -- Links to workout
  exercise_id UUID NOT NULL REFERENCES public.available_exercises(id), -- Links to exercise
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- When added to workout
);

-- Add indexes for performance
-- Why: Optimizes joins and lookups by workout or exercise.
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON public.workout_exercises(exercise_id);

-- Enable RLS for workout_exercises
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_exercises
-- Why: Ensures users only manage exercises in their own workouts.
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

-- Create sets table for individual sets
-- Why: Logs reps and weight for each exercise in a workout.
CREATE TABLE public.sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE, -- Links to exercise
  reps INTEGER NOT NULL CHECK (reps > 0),  -- Ensures valid reps
  weight_kg NUMERIC NOT NULL CHECK (weight_kg >= 0),  -- Precise weight, non-negative
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- When set was logged
);

-- Add index for performance
-- Why: Speeds up queries joining sets to workout_exercises.
CREATE INDEX IF NOT EXISTS idx_sets_workout_exercise_id ON public.sets(workout_exercise_id);

-- Enable RLS for sets
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

-- RLS policies for sets
-- Why: Limits set access to the owning user.
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

-- Function to update volume on set insertion
-- Why: Automatically updates total and daily volume when a set is added.
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

  -- Get user_id and date
  SELECT w.user_id, w.created_at::DATE INTO func_user_id, workout_date
  FROM public.workouts w
  WHERE w.id = workout_id;

  -- Calculate set volume
  set_volume := ROUND(CAST(NEW.reps * NEW.weight_kg AS numeric), 2);

  -- Update profile total volume
  UPDATE public.profiles
  SET total_volume = ROUND(total_volume + set_volume, 2)
  WHERE id = func_user_id;

  -- Update or insert daily volume
  INSERT INTO public.daily_volume (user_id, date, volume)
  VALUES (func_user_id, workout_date, set_volume)
  ON CONFLICT (user_id, date)
  DO UPDATE SET volume = ROUND(public.daily_volume.volume + set_volume, 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update volume on set deletion
-- Why: Adjusts volume stats when a set is removed.
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

  -- Get user_id and date
  SELECT w.user_id, w.created_at::DATE INTO func_user_id, workout_date
  FROM public.workouts w
  WHERE w.id = workout_id;

  -- Calculate set volume
  set_volume := ROUND(CAST(OLD.reps * OLD.weight_kg AS numeric), 2);

  -- Update profile total volume
  UPDATE public.profiles
  SET total_volume = ROUND(total_volume - set_volume, 2)
  WHERE id = func_user_id;

  -- Update daily volume
  UPDATE public.daily_volume
  SET volume = ROUND(volume - set_volume, 2)
  WHERE user_id = func_user_id AND date = workout_date;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to update volume on set update
-- Why: Adjusts volume when reps or weight changes.
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
  -- Skip if no change in volume-affecting fields
  IF NEW.reps = OLD.reps AND NEW.weight_kg = OLD.weight_kg THEN
    RETURN NEW;
  END IF;

  -- Get workout_id
  SELECT we.workout_id INTO workout_id
  FROM public.workout_exercises we
  WHERE we.id = NEW.workout_exercise_id;

  -- Get user_id and date
  SELECT w.user_id, w.created_at::DATE INTO func_user_id, workout_date
  FROM public.workouts w
  WHERE w.id = workout_id;

  -- Calculate volumes and difference
  old_volume := ROUND(CAST(OLD.reps * OLD.weight_kg AS numeric), 2);
  new_volume := ROUND(CAST(NEW.reps * NEW.weight_kg AS numeric), 2);
  volume_diff := new_volume - old_volume;

  -- Update profile total volume
  UPDATE public.profiles
  SET total_volume = ROUND(total_volume + volume_diff, 2)
  WHERE id = func_user_id;

  -- Update daily volume
  UPDATE public.daily_volume
  SET volume = ROUND(volume + volume_diff, 2)
  WHERE user_id = func_user_id AND date = workout_date;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for sets table
-- Why: Ensures volume updates are automatic and consistent.
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

-- Create daily_volume table for daily stats
-- Why: Enables quick retrieval of daily volume for analytics.
CREATE TABLE public.daily_volume (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  volume NUMERIC NOT NULL DEFAULT 0, -- Precise daily volume
  PRIMARY KEY (user_id, date) -- Unique per user per day
);

-- Add index for performance
-- Why: Speeds up date-based queries for charts/reports.
CREATE INDEX IF NOT EXISTS idx_daily_volume_date ON public.daily_volume(date);

-- Enable RLS for daily_volume
ALTER TABLE public.daily_volume ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_volume
-- Why: Restricts access to user's own daily stats.
CREATE POLICY "Users can view their own daily volume" 
  ON public.daily_volume FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own daily volume" 
  ON public.daily_volume FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily volume" 
  ON public.daily_volume FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);