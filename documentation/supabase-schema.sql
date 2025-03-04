-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables, triggers, functions, and policies (in reverse order due to dependencies)

-- Drop triggers only on auth.users (managed by Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.on_workout_add();
DROP FUNCTION IF EXISTS public.on_workout_delete();
DROP FUNCTION IF EXISTS public.update_volume_on_set_insert();
DROP FUNCTION IF EXISTS public.update_volume_on_set_delete();
DROP FUNCTION IF EXISTS public.update_volume_on_set_update();


DROP TABLE IF EXISTS public.sets CASCADE;
DROP TABLE IF EXISTS public.workout_exercises CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;
DROP TABLE IF EXISTS public.daily_volume CASCADE;
DROP TABLE IF EXISTS public.available_exercises CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table to store user data and stats
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')) DEFAULT 'Other',
  date_of_birth DATE DEFAULT '2000-01-01',
  weight_kg FLOAT DEFAULT 70,
  height_cm FLOAT DEFAULT 170,
  body_fat_percentage FLOAT,
  unit_preference TEXT CHECK (unit_preference IN ('metric', 'imperial')) DEFAULT 'metric',
  theme_preference TEXT CHECK (theme_preference IN ('light', 'dark')) DEFAULT 'light',
  total_volume NUMERIC DEFAULT 0, -- Tracks lifetime volume across all workouts
  total_workouts INTEGER DEFAULT 0, -- Tracks total number of workouts
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to supabase_auth_admin for profiles table
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON TABLE public.profiles TO supabase_auth_admin;

-- RLS policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow auth admin to insert profiles"
  ON public.profiles FOR INSERT TO supabase_auth_admin WITH CHECK (true);

-- Function to handle new user creation
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

-- Trigger to call handle_new_user after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create workouts table to store workout instances
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON public.workouts(created_at);

-- Enable RLS on workouts table
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for workouts table
CREATE POLICY "Users can view their own workouts"
  ON public.workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts"
  ON public.workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON public.workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to handle workout addition
CREATE OR REPLACE FUNCTION public.on_workout_add()
RETURNS TRIGGER AS $$
DECLARE
  workout_volume NUMERIC;
  workout_date DATE;
BEGIN
  -- Calculate total volume for the workout (reps * weight_kg summed across all sets)
  SELECT SUM(s.reps * s.weight_kg) INTO workout_volume
  FROM public.sets s
  JOIN public.workout_exercises we ON s.workout_exercise_id = we.id
  WHERE we.workout_id = NEW.id;

  -- Handle case where workout_volume might be NULL (no sets yet)
  workout_volume := COALESCE(workout_volume, 0);

  -- Get the workout date
  workout_date := NEW.created_at::DATE;

  -- Update total_volume and total_workouts in profiles
  UPDATE public.profiles
  SET total_volume = total_volume + workout_volume,
      total_workouts = total_workouts + 1
  WHERE id = NEW.user_id;

  -- Update or insert daily_volume
  INSERT INTO public.daily_volume (user_id, date, volume)
  VALUES (NEW.user_id, workout_date, workout_volume)
  ON CONFLICT (user_id, date)
  DO UPDATE SET volume = public.daily_volume.volume + workout_volume;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle workout deletion
CREATE OR REPLACE FUNCTION public.on_workout_delete()
RETURNS TRIGGER AS $$
DECLARE
  workout_volume NUMERIC;
  workout_date DATE;
BEGIN
  -- Calculate total volume for the workout being deleted
  SELECT SUM(s.reps * s.weight_kg) INTO workout_volume
  FROM public.sets s
  JOIN public.workout_exercises we ON s.workout_exercise_id = we.id
  WHERE we.workout_id = OLD.id;

  -- Handle case where workout_volume might be NULL (no sets)
  workout_volume := COALESCE(workout_volume, 0);

  -- Get the workout date
  workout_date := OLD.created_at::DATE;

  -- Update total_volume and total_workouts in profiles
  UPDATE public.profiles
  SET total_volume = total_volume - workout_volume,
      total_workouts = total_workouts - 1
  WHERE id = OLD.user_id;

  -- Update daily_volume (subtract the volume)
  UPDATE public.daily_volume
  SET volume = volume - workout_volume
  WHERE user_id = OLD.user_id AND date = workout_date;

  -- Clean up daily_volume entries with zero volume
  DELETE FROM public.daily_volume
  WHERE user_id = OLD.user_id AND date = workout_date AND volume = 0;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers for workouts table
CREATE TRIGGER trigger_on_workout_add
  AFTER INSERT ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.on_workout_add();

CREATE TRIGGER trigger_on_workout_delete
  BEFORE DELETE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.on_workout_delete();

-- Create available_exercises table for exercise catalog
CREATE TABLE public.available_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  primary_muscle_group TEXT NOT NULL,
  secondary_muscle_group TEXT
);

-- Enable RLS on available_exercises table
ALTER TABLE public.available_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policy for available_exercises table
CREATE POLICY "Authenticated users can view available exercises"
  ON public.available_exercises FOR SELECT TO authenticated USING (true);

-- Seed initial exercise data
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
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.available_exercises(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on workout_exercises table
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_exercises table
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

-- Create sets table to store individual sets for exercises
CREATE TABLE public.sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight_kg FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on sets table
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

-- RLS policies for sets table
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
  -- Check for null workout_exercise_id
  IF NEW.workout_exercise_id IS NULL THEN
    RAISE EXCEPTION 'workout_exercise_id cannot be null';
  END IF;

  -- Get workout_id from workout_exercises
  SELECT we.workout_id INTO workout_id
  FROM public.workout_exercises we
  WHERE we.id = NEW.workout_exercise_id;

  -- Get user_id and date from workouts
  SELECT w.user_id, w.created_at::DATE INTO func_user_id, workout_date
  FROM public.workouts w
  WHERE w.id = workout_id;

  -- Calculate volume for this set
  set_volume := NEW.reps * NEW.weight_kg;

  -- Update total_volume in profiles
  UPDATE public.profiles
  SET total_volume = total_volume + set_volume
  WHERE id = func_user_id;

  -- Update or insert daily_volume
  INSERT INTO public.daily_volume (user_id, date, volume)
  VALUES (func_user_id, workout_date, set_volume)
  ON CONFLICT (user_id, date)
  DO UPDATE SET volume = public.daily_volume.volume + set_volume;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update volume when a set is deleted
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

  -- Calculate volume for this set
  set_volume := OLD.reps * OLD.weight_kg;

  -- Update total_volume in profiles
  UPDATE public.profiles
  SET total_volume = total_volume - set_volume
  WHERE id = func_user_id;

  -- Update daily_volume
  UPDATE public.daily_volume
  SET volume = volume - set_volume
  WHERE user_id = func_user_id AND date = workout_date;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to update volume when a set is updated
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
  -- Skip if reps and weight_kg are unchanged
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

  -- Calculate old and new volumes
  old_volume := OLD.reps * OLD.weight_kg;
  new_volume := NEW.reps * NEW.weight_kg;
  volume_diff := new_volume - old_volume;

  -- Update total_volume in profiles
  UPDATE public.profiles
  SET total_volume = total_volume + volume_diff
  WHERE id = func_user_id;

  -- Update daily_volume
  UPDATE public.daily_volume
  SET volume = volume + volume_diff
  WHERE user_id = func_user_id AND date = workout_date;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for sets table to manage volume
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

-- Create daily_volume table to track volume per day
CREATE TABLE public.daily_volume (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  volume NUMERIC NOT NULL,
  UNIQUE (user_id, date)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_daily_volume_date ON public.daily_volume(date);

-- Enable RLS on daily_volume table
ALTER TABLE public.daily_volume ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_volume table
CREATE POLICY "Users can view their own daily volume"
  ON public.daily_volume FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily volume"
  ON public.daily_volume FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily volume"
  ON public.daily_volume FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);