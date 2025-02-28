-- DoNotDie Supabase RLS Setup Script

-- This script enables Row-Level Security (RLS) and defines policies for the DoNotDie application.
-- It ensures that users can only access and modify their own data, providing a secure foundation for the application.

-- NOTE: Run this script in the Supabase SQL Editor to apply the configurations.

------------------------------------------------------------------------
-- 1. Enable Row-Level Security (RLS) on relevant tables
------------------------------------------------------------------------

-- Enabling RLS restricts direct access to the tables unless policies are defined.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_volume ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------------------
-- 2. Define RLS Policies for each table
------------------------------------------------------------------------

-- Policies control what data users can access based on their authentication status and user ID.

-- 2.1 Policies for 'users' table
-- Purpose: Users can only view and update their own profile.
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 2.2 Policies for 'workouts' table
-- Purpose: Users can manage only their own workouts (view, insert, update, delete).
CREATE POLICY "Users can view their own workouts" ON public.workouts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts" ON public.workouts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" ON public.workouts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" ON public.workouts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2.3 Policies for 'workout_exercises' table
-- Purpose: Users can manage exercises linked to their own workouts.
CREATE POLICY "Users can view their own workout exercises" ON public.workout_exercises
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workouts
    WHERE public.workouts.id = public.workout_exercises.workout_id
    AND public.workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create workout exercises for their own workouts" ON public.workout_exercises
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workouts
    WHERE public.workouts.id = public.workout_exercises.workout_id
    AND public.workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own workout exercises" ON public.workout_exercises
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

CREATE POLICY "Users can delete their own workout exercises" ON public.workout_exercises
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workouts
    WHERE public.workouts.id = public.workout_exercises.workout_id
    AND public.workouts.user_id = auth.uid()
  )
);

-- 2.4 Policies for 'sets' table
-- Purpose: Users can manage sets linked to their own workout exercises.
CREATE POLICY "Users can view their own sets" ON public.sets
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

CREATE POLICY "Users can create sets for their own workout exercises" ON public.sets
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

CREATE POLICY "Users can update their own sets" ON public.sets
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

CREATE POLICY "Users can delete their own sets" ON public.sets
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

-- 2.5 Policies for 'daily_volume' table
-- Purpose: Users can view and manage their own daily volume data.
CREATE POLICY "Users can view their own daily volume" ON public.daily_volume
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily volume" ON public.daily_volume
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily volume" ON public.daily_volume
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily volume" ON public.daily_volume
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2.6 Policies for 'available_exercises' table
-- Purpose: All authenticated users can view the exercise list (read-only).
CREATE POLICY "Authenticated users can view available exercises" ON public.available_exercises
FOR SELECT
TO authenticated
USING (true);

-- 2.7 Policies for 'rate_limits' table
-- Purpose: Managed server-side; no direct client access. Enable RLS but define no policies (access via service key only).
-- No policies defined; access via service key only

------------------------------------------------------------------------
-- 3. Set up Foreign Key Cascades
------------------------------------------------------------------------

-- These commands ensure that deleting a workout automatically deletes related exercises and sets.
-- Note: If constraints already exist, these will fail; modify existing constraints if needed.
ALTER TABLE public.workout_exercises
ADD CONSTRAINT fk_workout
FOREIGN KEY (workout_id)
REFERENCES public.workouts(id)
ON DELETE CASCADE;

ALTER TABLE public.sets
ADD CONSTRAINT fk_workout_exercise
FOREIGN KEY (workout_exercise_id)
REFERENCES public.workout_exercises(id)
ON DELETE CASCADE;

------------------------------------------------------------------------
-- 4. Create Indexes for Performance
------------------------------------------------------------------------

-- These indexes improve query performance for common operations.
-- Using IF NOT EXISTS to avoid errors if indexes already exist.
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts (user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON public.workouts (created_at);
CREATE INDEX IF NOT EXISTS idx_daily_volume_user_id_date ON public.daily_volume (user_id, date);

------------------------------------------------------------------------
-- End of Script
------------------------------------------------------------------------

-- After running this script, test the policies by attempting to access data as different users.
-- Ensure that only authorized data is accessible and that operations are restricted as expected.