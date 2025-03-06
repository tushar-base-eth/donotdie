-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing triggers, functions, policies, and tables to start fresh
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

-- Profiles table: Stores user information with constraints and timestamps
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to auth.users
  name TEXT NOT NULL, -- User's name
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')) DEFAULT 'Other', -- Gender with restricted options
  date_of_birth DATE NOT NULL DEFAULT '2000-01-01', -- Default DOB for new users
  weight_kg NUMERIC DEFAULT 70, -- User's weight in kg
  height_cm NUMERIC DEFAULT 170, -- User's height in cm
  body_fat_percentage NUMERIC, -- Optional body fat percentage
  unit_preference TEXT NOT NULL CHECK (unit_preference IN ('metric', 'imperial')) DEFAULT 'metric', -- Metric or imperial units
  theme_preference TEXT NOT NULL CHECK (theme_preference IN ('light', 'dark')) DEFAULT 'light', -- Light or dark theme
  total_volume NUMERIC DEFAULT 0 CHECK (total_volume >= 0), -- Total lifetime volume, non-negative
  total_workouts INTEGER DEFAULT 0 CHECK (total_workouts >= 0), -- Total number of workouts, non-negative
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP -- Last update timestamp
);

-- Enable row-level security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions to Supabase auth admin for profile insertion
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON TABLE public.profiles TO supabase_auth_admin;

-- Policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow auth admin to insert profiles" 
  ON public.profiles FOR INSERT TO supabase_auth_admin WITH CHECK (true);

-- Function to handle new user creation, populating profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, unit_preference)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'), -- Default name if not provided
    COALESCE(NEW.raw_user_meta_data->>'unit_preference', 'metric') -- Default to metric
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Workouts table: Tracks user workouts with timestamps
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique workout ID
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Links to profiles
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP -- Workout creation timestamp
);

-- Indexes for performance on workouts table
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON public.workouts(created_at);

-- Enable row-level security for workouts
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Policies for workouts table
CREATE POLICY "Users can view their own workouts" 
  ON public.workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workouts" 
  ON public.workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workouts" 
  ON public.workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to adjust volume and counts when a workout is deleted
CREATE OR REPLACE FUNCTION public.on_workout_delete()
RETURNS TRIGGER AS $$
DECLARE
  workout_volume NUMERIC;
  workout_date DATE;
BEGIN
  -- Calculate total volume for the workout being deleted
  SELECT SUM(CAST(s.reps * s.weight_kg AS numeric)) INTO workout_volume
  FROM public.sets s
  JOIN public.workout_exercises we ON s.workout_exercise_id = we.id
  WHERE we.workout_id = OLD.id;

  workout_volume := ROUND(COALESCE(workout_volume, 0), 2); -- Round to 2 decimals, default to 0 if null
  workout_date := OLD.created_at::DATE; -- Extract date from workout timestamp

  -- Update profiles, ensuring total_volume stays non-negative
  UPDATE public.profiles
  SET total_volume = GREATEST(ROUND(total_volume - workout_volume, 2), 0), -- Prevent negative volume
      total_workouts = total_workouts - 1
  WHERE id = OLD.user_id;

  -- Update daily_volume, ensuring volume stays non-negative
  UPDATE public.daily_volume
  SET volume = GREATEST(ROUND(volume - workout_volume, 2), 0) -- Prevent negative volume
  WHERE user_id = OLD.user_id AND date = workout_date;

  -- Clean up zero-volume entries in daily_volume
  DELETE FROM public.daily_volume
  WHERE user_id = OLD.user_id AND date = workout_date AND volume = 0;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workout deletion
CREATE TRIGGER trigger_on_workout_delete
  BEFORE DELETE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.on_workout_delete();

-- Function to increment total_workouts when a workout is added
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
CREATE TRIGGER trigger_on_workout_insert
  AFTER INSERT ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.on_workout_insert();

-- Available_exercises table: Predefined list of exercises
CREATE TABLE public.available_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique exercise ID
  name TEXT UNIQUE NOT NULL, -- Exercise name, must be unique
  primary_muscle_group TEXT NOT NULL, -- Primary muscle targeted
  secondary_muscle_group TEXT -- Secondary muscle targeted (optional)
);

-- Enable row-level security for available_exercises
ALTER TABLE public.available_exercises ENABLE ROW LEVEL SECURITY;

-- Policy for available_exercises
CREATE POLICY "Authenticated users can view available exercises" 
  ON public.available_exercises FOR SELECT TO authenticated USING (true);

-- Seed data for available_exercises
INSERT INTO public.available_exercises (id, name, primary_muscle_group, secondary_muscle_group) VALUES
  (uuid_generate_v4(), 'Bench Press', 'Chest', 'Triceps'),
  (uuid_generate_v4(), 'Squat', 'Legs', 'Glutes'),
  (uuid_generate_v4(), 'Deadlift', 'Back', 'Hamstrings'),
  (uuid_generate_v4(), 'Pull-up', 'Back', 'Biceps'),
  (uuid_generate_v4(), 'Shoulder Press', 'Shoulders', 'Triceps'),
  (uuid_generate_v4(), 'Push-up', 'Chest', 'Shoulders'),
  (uuid_generate_v4(), 'Lunge', 'Legs', 'Glutes'),
  (uuid_generate_v4(), 'Bent-Over Row', 'Back', 'Biceps');

-- Workout_exercises table: Links workouts to exercises
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique ID
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE, -- Links to workouts
  exercise_id UUID NOT NULL REFERENCES public.available_exercises(id), -- Links to exercises
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP -- Creation timestamp
);

-- Indexes for performance on workout_exercises
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON public.workout_exercises(exercise_id);

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

-- Sets table: Tracks individual sets for exercises in workouts
CREATE TABLE public.sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique set ID
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE, -- Links to workout_exercises
  reps INTEGER NOT NULL CHECK (reps >= 0), -- Number of reps, allows 0 for special cases
  weight_kg NUMERIC NOT NULL CHECK (weight_kg >= 0), -- Weight in kg, non-negative
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP -- Creation timestamp
);

-- Index for performance on sets
CREATE INDEX IF NOT EXISTS idx_sets_workout_exercise_id ON public.sets(workout_exercise_id);

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

-- Function to update volume when a set is inserted
CREATE OR REPLACE FUNCTION public.update_volume_on_set_insert()
RETURNS TRIGGER AS $$
DECLARE
  workout_id UUID;
  func_user_id UUID;
  workout_date DATE;
  set_volume NUMERIC;
BEGIN
  -- Get workout_id from workout_exercises
  SELECT we.workout_id INTO workout_id
  FROM public.workout_exercises we
  WHERE we.id = NEW.workout_exercise_id;

  -- Get user_id and date from workouts
  SELECT w.user_id, w.created_at::DATE INTO func_user_id, workout_date
  FROM public.workouts w
  WHERE w.id = workout_id;

  -- Calculate set volume, rounded to 2 decimals
  set_volume := ROUND(CAST(NEW.reps * NEW.weight_kg AS numeric), 2);

  -- Update total_volume in profiles
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

-- Function to adjust volume when a set is deleted
CREATE OR REPLACE FUNCTION public.update_volume_on_set_delete()
RETURNS TRIGGER AS $$
DECLARE
  workout_id UUID;
  func_user_id UUID;
  workout_date DATE;
  set_volume NUMERIC;
BEGIN
  -- Get workout_id from workout_exercises
  SELECT we.workout_id INTO workout_id
  FROM public.workout_exercises we
  WHERE we.id = OLD.workout_exercise_id;

  -- Get user_id and date from workouts
  SELECT w.user_id, w.created_at::DATE INTO func_user_id, workout_date
  FROM public.workouts w
  WHERE w.id = workout_id;

  -- Calculate set volume, rounded to 2 decimals
  set_volume := ROUND(CAST(OLD.reps * OLD.weight_kg AS numeric), 2);

  -- Update total_volume, ensuring it stays non-negative
  UPDATE public.profiles
  SET total_volume = GREATEST(ROUND(total_volume - set_volume, 2), 0)
  WHERE id = func_user_id;

  -- Update daily_volume, ensuring it stays non-negative
  UPDATE public.daily_volume
  SET volume = GREATEST(ROUND(volume - set_volume, 2), 0)
  WHERE user_id = func_user_id AND date = workout_date;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to adjust volume when a set is updated
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
  -- Skip if no relevant changes
  IF NEW.reps = OLD.reps AND NEW.weight_kg = OLD.weight_kg THEN
    RETURN NEW;
  END IF;

  -- Get workout_id from workout_exercises
  SELECT we.workout_id INTO workout_id
  FROM public.workout_exercises we
  WHERE we.id = NEW.workout_exercise_id;

  -- Get user_id and date from workouts
  SELECT w.user_id, w.created_at::DATE INTO func_user_id, workout_date
  FROM public.workouts w
  WHERE w.id = workout_id;

  -- Calculate old and new volumes, rounded to 2 decimals
  old_volume := ROUND(CAST(OLD.reps * OLD.weight_kg AS numeric), 2);
  new_volume := ROUND(CAST(NEW.reps * NEW.weight_kg AS numeric), 2);
  volume_diff := new_volume - old_volume;

  -- Update total_volume, ensuring it stays non-negative
  UPDATE public.profiles
  SET total_volume = GREATEST(ROUND(total_volume + volume_diff, 2), 0)
  WHERE id = func_user_id;

  -- Update daily_volume, ensuring it stays non-negative
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

-- Daily_volume table: Tracks daily workout volume per user
CREATE TABLE public.daily_volume (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Links to profiles
  date DATE NOT NULL, -- Date of volume
  volume NUMERIC NOT NULL DEFAULT 0 CHECK (volume >= 0), -- Daily volume, non-negative
  PRIMARY KEY (user_id, date) -- Composite primary key
);

-- Index for performance on daily_volume
CREATE INDEX IF NOT EXISTS idx_daily_volume_date ON public.daily_volume(date);

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