-- Seed File Summary:
-- strength_training (8 exercises):
-- 1. Bench Press -> reps, weight
-- 2. Squat -> reps, weight
-- 3. Deadlift -> reps, weight
-- 4. Dumbbell Row -> reps, weight
-- 5. Shoulder Press -> reps, weight
-- 6. Bicep Curl -> reps, weight
-- 7. Tricep Extension -> reps, weight
-- 8. Push-up -> reps
--
-- cardio (6 exercises):
-- 1. Treadmill Run -> duration, distance
-- 2. Stationary Bike -> duration
-- 3. Jogging -> duration, distance
-- 4. Jump Rope -> duration
-- 5. Rowing Machine -> duration
-- 6. High Knees -> duration
--
-- flexibility (6 exercises):
-- 1. Downward Dog -> duration
-- 2. Cat-Cow Stretch -> duration
-- 3. Seated Forward Bend -> duration
-- 4. Hip Flexor Stretch -> duration
-- 5. Child’s Pose -> duration
-- 6. Cobra Stretch -> duration
--
-- other (5 exercises):
-- 1. Plank -> reps
-- 2. Lunges -> reps
-- 3. Mountain Climbers -> reps
-- 4. Burpees -> reps
-- 5. Band Pull-Apart -> reps, weight

-- Seed equipment
INSERT INTO public.equipment (id, name) VALUES
  (uuid_generate_v4(), 'Dumbbell'),
  (uuid_generate_v4(), 'Barbell'),
  (uuid_generate_v4(), 'Bench'),
  (uuid_generate_v4(), 'Treadmill'),
  (uuid_generate_v4(), 'Stationary Bike'),
  (uuid_generate_v4(), 'Yoga Mat'),
  (uuid_generate_v4(), 'Resistance Band'),
  (uuid_generate_v4(), 'None');

-- Seed exercises and equipment mappings
DO $$
DECLARE
  dumbbell_id UUID;
  barbell_id UUID;
  bench_id UUID;
  treadmill_id UUID;
  bike_id UUID;
  mat_id UUID;
  band_id UUID;
  none_id UUID;
  exercise_id UUID;
BEGIN
  -- Retrieve equipment IDs
  SELECT id INTO dumbbell_id FROM public.equipment WHERE name = 'Dumbbell';
  SELECT id INTO barbell_id FROM public.equipment WHERE name = 'Barbell';
  SELECT id INTO bench_id FROM public.equipment WHERE name = 'Bench';
  SELECT id INTO treadmill_id FROM public.equipment WHERE name = 'Treadmill';
  SELECT id INTO bike_id FROM public.equipment WHERE name = 'Stationary Bike';
  SELECT id INTO mat_id FROM public.equipment WHERE name = 'Yoga Mat';
  SELECT id INTO band_id FROM public.equipment WHERE name = 'Resistance Band';
  SELECT id INTO none_id FROM public.equipment WHERE name = 'None';

  -- Strength Training (8 exercises)
  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Bench Press', 'strength_training', 'chest', 'arms', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, barbell_id), (exercise_id, bench_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Squat', 'strength_training', 'legs', 'other', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, barbell_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Deadlift', 'strength_training', 'back', 'legs', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, barbell_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Dumbbell Row', 'strength_training', 'back', 'arms', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, dumbbell_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Shoulder Press', 'strength_training', 'arms', 'other', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, dumbbell_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Bicep Curl', 'strength_training', 'arms', NULL, TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, dumbbell_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Tricep Extension', 'strength_training', 'arms', NULL, TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, dumbbell_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Push-up', 'strength_training', 'chest', 'arms', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  -- Cardio (6 exercises)
  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_distance)
  VALUES (uuid_generate_v4(), 'Treadmill Run', 'cardio', 'legs', 'other', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, treadmill_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_weight)
  VALUES (uuid_generate_v4(), 'Stationary Bike', 'cardio', 'legs', 'other', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, bike_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_distance)
  VALUES (uuid_generate_v4(), 'Jogging', 'cardio', 'legs', 'other', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_weight)
  VALUES (uuid_generate_v4(), 'Jump Rope', 'cardio', 'legs', 'other', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_weight)
  VALUES (uuid_generate_v4(), 'Rowing Machine', 'cardio', 'back', 'other', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_weight)
  VALUES (uuid_generate_v4(), 'High Knees', 'cardio', 'legs', 'other', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  -- Flexibility (6 exercises)
  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_weight)
  VALUES (uuid_generate_v4(), 'Downward Dog', 'flexibility', 'legs', 'arms', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, mat_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_weight)
  VALUES (uuid_generate_v4(), 'Cat-Cow Stretch', 'flexibility', 'back', 'core', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, mat_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_weight)
  VALUES (uuid_generate_v4(), 'Seated Forward Bend', 'flexibility', 'legs', 'back', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, mat_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_weight)
  VALUES (uuid_generate_v4(), 'Hip Flexor Stretch', 'flexibility', 'other', NULL, TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, mat_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_weight)
  VALUES (uuid_generate_v4(), 'Child’s Pose', 'flexibility', 'back', 'other', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, mat_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_weight)
  VALUES (uuid_generate_v4(), 'Cobra Stretch', 'flexibility', 'core', 'chest', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, mat_id);

  -- Other (Bodyweight, 5 exercises)
  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Plank', 'other', 'core', NULL, TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Lunges', 'other', 'legs', 'other', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Mountain Climbers', 'other', 'core', 'legs', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Burpees', 'other', 'full_body', NULL, TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Band Pull-Apart', 'other', 'arms', 'back', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, band_id);
END $$;