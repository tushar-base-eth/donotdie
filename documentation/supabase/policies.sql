-- Enable row-level security for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exercise_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_volume ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow auth admin to insert profiles" 
  ON public.profiles FOR INSERT TO supabase_auth_admin WITH CHECK (true);

-- Policies for workouts table
CREATE POLICY "Users can view their own workouts" 
  ON public.workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workouts" 
  ON public.workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workouts" 
  ON public.workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own workouts"
  ON public.workouts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Policy: All authenticated users can view exercises
CREATE POLICY "Authenticated users can view available exercises" 
  ON public.exercises FOR SELECT TO authenticated USING (true);

-- Policy: All authenticated users can view equipment
CREATE POLICY "Authenticated users can view equipment" 
  ON public.equipment FOR SELECT TO authenticated USING (true);

-- Policy: All authenticated users can view exercise-equipment mappings
CREATE POLICY "Authenticated users can view exercise equipment" 
  ON public.exercise_equipment FOR SELECT TO authenticated USING (true);

-- Policies for user_exercises
CREATE POLICY "Users can view their own user exercises" 
  ON public.user_exercises FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own user exercises" 
  ON public.user_exercises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own user exercises" 
  ON public.user_exercises FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own user exercises" 
  ON public.user_exercises FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for user_exercise_equipment
CREATE POLICY "Users can view their own user exercise equipment" 
  ON public.user_exercise_equipment FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_exercises ue
      WHERE ue.id = public.user_exercise_equipment.user_exercise_id
      AND ue.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create their own user exercise equipment" 
  ON public.user_exercise_equipment FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_exercises ue
      WHERE ue.id = public.user_exercise_equipment.user_exercise_id
      AND ue.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete their own user exercise equipment" 
  ON public.user_exercise_equipment FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_exercises ue
      WHERE ue.id = public.user_exercise_equipment.user_exercise_id
      AND ue.user_id = auth.uid()
    )
  );

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

-- Policies for sets
CREATE POLICY "Users can view their own sets" 
  ON public.sets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON w.id = we.workout_id
      WHERE we.id = public.sets.workout_exercise_id
      AND w.user_id = auth.uid()
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
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON w.id = we.workout_id
      WHERE we.id = public.sets.workout_exercise_id
      AND w.user_id = auth.uid()
    )
  );

-- Policies for daily_volume
CREATE POLICY "Users can view their own daily volume" 
  ON public.daily_volume FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own daily volume" 
  ON public.daily_volume FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily volume" 
  ON public.daily_volume FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);