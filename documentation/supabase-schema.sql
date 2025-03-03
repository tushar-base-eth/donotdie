-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (replaces old users table)
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
  total_volume NUMERIC DEFAULT 0,
  total_workouts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create workouts table
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create available_exercises table
CREATE TABLE public.available_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  primary_muscle_group TEXT NOT NULL,
  secondary_muscle_group TEXT
);

-- Create workout_exercises table
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.available_exercises(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sets table
CREATE TABLE public.sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_exercise_id UUID REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight_kg FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create daily_volume table
CREATE TABLE public.daily_volume (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  volume NUMERIC NOT NULL,
  UNIQUE (user_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_created_at ON public.workouts(created_at);
CREATE INDEX idx_daily_volume_date ON public.daily_volume(date);

-- Grant necessary permissions to supabase_auth_admin for profiles table
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON TABLE public.profiles TO supabase_auth_admin;

-- Create a function to handle new user creation
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

-- Create a trigger to call the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row-Level Security (RLS) on all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_volume ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow auth admin to insert profiles"
  ON public.profiles
  FOR INSERT
  TO supabase_auth_admin
  WITH CHECK (true);

-- RLS policies for workouts table
CREATE POLICY "Users can view their own workouts"
  ON public.workouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts"
  ON public.workouts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
  ON public.workouts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON public.workouts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS policies for workout_exercises table
CREATE POLICY "Users can view their own workout exercises"
  ON public.workout_exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE public.workouts.id = public.workout_exercises.workout_id
      AND public.workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workout exercises for their own workouts"
  ON public.workout_exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE public.workouts.id = public.workout_exercises.workout_id
      AND public.workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own workout exercises"
  ON public.workout_exercises
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE public.workouts.id = public.workout_exercises.workout_id
      AND public.workouts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE public.workouts.id = public.workout_exercises.workout_id
      AND public.workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own workout exercises"
  ON public.workout_exercises
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE public.workouts.id = public.workout_exercises.workout_id
      AND public.workouts.user_id = auth.uid()
    )
  );

-- RLS policies for sets table
CREATE POLICY "Users can view their own sets"
  ON public.sets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON public.workouts.id = public.workout_exercises.workout_id
      WHERE public.workout_exercises.id = public.sets.workout_exercise_id
      AND public.workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sets for their own workout exercises"
  ON public.sets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON public.workouts.id = public.workout_exercises.workout_id
      WHERE public.workout_exercises.id = public.sets.workout_exercise_id
      AND public.workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sets"
  ON public.sets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON public.workouts.id = public.workout_exercises.workout_id
      WHERE public.workout_exercises.id = public.sets.workout_exercise_id
      AND public.workouts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON public.workouts.id = public.workout_exercises.workout_id
      WHERE public.workout_exercises.id = public.sets.workout_exercise_id
      AND public.workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own sets"
  ON public.sets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises
      JOIN public.workouts ON public.workouts.id = public.workout_exercises.workout_id
      WHERE public.workout_exercises.id = public.sets.workout_exercise_id
      AND public.workouts.user_id = auth.uid()
    )
  );

-- RLS policies for daily_volume table
CREATE POLICY "Users can view their own daily volume"
  ON public.daily_volume
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily volume"
  ON public.daily_volume
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily volume"
  ON public.daily_volume
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily volume"
  ON public.daily_volume
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS policies for available_exercises table (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view available exercises"
  ON public.available_exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id UUID, p_volume NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET total_volume = total_volume + p_volume,
      total_workouts = total_workouts + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id;

  INSERT INTO public.daily_volume (user_id, date, volume)
  VALUES (p_user_id, CURRENT_DATE, p_volume)
  ON CONFLICT (user_id, date)
  DO UPDATE SET volume = public.daily_volume.volume + EXCLUDED.volume;
END;
$$ LANGUAGE plpgsql;

-- Function to get total volume
CREATE OR REPLACE FUNCTION get_total_volume(p_user_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (SELECT total_volume FROM public.profiles WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to get volume by day
CREATE OR REPLACE FUNCTION get_volume_by_day(p_user_id UUID, p_days INTEGER)
RETURNS TABLE (date DATE, volume NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT dv.date, dv.volume
  FROM public.daily_volume dv
  WHERE dv.user_id = p_user_id
  AND dv.date > CURRENT_DATE - p_days
  ORDER BY dv.date ASC;
END;
$$ LANGUAGE plpgsql;

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