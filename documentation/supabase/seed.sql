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
  VALUES (uuid_generate_v4(), 'Bench Press', 'Strength Training', 'Chest', 'Triceps', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, barbell_id), (exercise_id, bench_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Squat', 'Strength Training', 'Quads', 'Glutes', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, barbell_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Deadlift', 'Strength Training', 'Back', 'Hamstrings', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, barbell_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Dumbbell Row', 'Strength Training', 'Back', 'Biceps', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, dumbbell_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Shoulder Press', 'Strength Training', 'Shoulders', 'Triceps', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, dumbbell_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Bicep Curl', 'Strength Training', 'Biceps', NULL, TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, dumbbell_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Tricep Extension', 'Strength Training', 'Triceps', NULL, TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, dumbbell_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps)
  VALUES (uuid_generate_v4(), 'Push-up', 'Strength Training', 'Chest', 'Triceps', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  -- Cardio (6 exercises)
  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_distance)
  VALUES (uuid_generate_v4(), 'Treadmill Run', 'Cardio', 'Legs', 'Cardiovascular', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, treadmill_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration)
  VALUES (uuid_generate_v4(), 'Stationary Bike', 'Cardio', 'Legs', 'Cardiovascular', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, bike_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration, uses_distance)
  VALUES (uuid_generate_v4(), 'Jogging', 'Cardio', 'Legs', 'Cardiovascular', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration)
  VALUES (uuid_generate_v4(), 'Jump Rope', 'Cardio', 'Legs', 'Cardiovascular', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration)
  VALUES (uuid_generate_v4(), 'Rowing Machine', 'Cardio', 'Back', 'Cardiovascular', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration)
  VALUES (uuid_generate_v4(), 'High Knees', 'Cardio', 'Legs', 'Cardiovascular', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  -- Flexibility (6 exercises)
  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration)
  VALUES (uuid_generate_v4(), 'Downward Dog', 'Flexibility', 'Hamstrings', 'Shoulders', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, mat_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration)
  VALUES (uuid_generate_v4(), 'Cat-Cow Stretch', 'Flexibility', 'Back', 'Core', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, mat_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration)
  VALUES (uuid_generate_v4(), 'Seated Forward Bend', 'Flexibility', 'Hamstrings', 'Back', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, mat_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration)
  VALUES (uuid_generate_v4(), 'Hip Flexor Stretch', 'Flexibility', 'Hip Flexors', NULL, TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, mat_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration)
  VALUES (uuid_generate_v4(), 'Child’s Pose', 'Flexibility', 'Back', 'Hips', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, mat_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_duration)
  VALUES (uuid_generate_v4(), 'Cobra Stretch', 'Flexibility', 'Core', 'Chest', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, mat_id);

  -- Other (Bodyweight, 5 exercises)
  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps)
  VALUES (uuid_generate_v4(), 'Plank', 'Other', 'Core', NULL, TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps)
  VALUES (uuid_generate_v4(), 'Lunges', 'Other', 'Quads', 'Glutes', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps)
  VALUES (uuid_generate_v4(), 'Mountain Climbers', 'Other', 'Core', 'Legs', TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps)
  VALUES (uuid_generate_v4(), 'Burpees', 'Other', 'Full Body', NULL, TRUE, FALSE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, none_id);

  INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight)
  VALUES (uuid_generate_v4(), 'Band Pull-Apart', 'Other', 'Shoulders', 'Back', TRUE, TRUE)
  RETURNING id INTO exercise_id;
  INSERT INTO public.exercise_equipment (exercise_id, equipment_id) VALUES (exercise_id, band_id);
END $$;