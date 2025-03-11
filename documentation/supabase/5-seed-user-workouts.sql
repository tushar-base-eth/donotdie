-- Seed Data SQL Script for Supabase
-- Purpose: Populate user_exercises, workouts, workout_exercises, and sets with realistic data
-- Date: March 11, 2025
-- Notes:
-- - Creates NUM_DAYS workouts for a variable SEED_USER_ID, covering the last NUM_DAYS days from CURRENT_DATE
-- - Seeds 10 user-defined exercises for SEED_USER_ID
-- - Uses all 75 predefined exercises and 10 user-defined exercises across workouts
-- - Includes realistic sets and metrics based on exercise type
-- - Variables: SEED_USER_ID (UUID), NUM_DAYS (INTEGER) for customization

DO $$
DECLARE
  SEED_USER_ID UUID := 'a3b2476a-391a-4939-a1c6-271edfceeb0e'; -- Replace with actual user UUID
  NUM_DAYS INTEGER := 365;                    -- Replace with desired number of days (e.g., 90)
BEGIN

-- Step 1: Seed 10 user-defined exercises
INSERT INTO public.user_exercises (id, user_id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance, created_at)
VALUES
  (uuid_generate_v4(), SEED_USER_ID, 'Weighted Push-Up', 'strength_training', 'chest', 'arms', TRUE, TRUE, FALSE, FALSE, CURRENT_DATE - INTERVAL '10 days'),
  (uuid_generate_v4(), SEED_USER_ID, 'One-Arm Dumbbell Row', 'strength_training', 'back', 'arms', TRUE, TRUE, FALSE, FALSE, CURRENT_DATE - INTERVAL '10 days'),
  (uuid_generate_v4(), SEED_USER_ID, 'Goblet Squat', 'strength_training', 'legs', 'core', TRUE, TRUE, FALSE, FALSE, CURRENT_DATE - INTERVAL '10 days'),
  (uuid_generate_v4(), SEED_USER_ID, 'Concentration Curl', 'strength_training', 'arms', NULL, TRUE, TRUE, FALSE, FALSE, CURRENT_DATE - INTERVAL '10 days'),
  (uuid_generate_v4(), SEED_USER_ID, 'Side Plank Twist', 'strength_training', 'core', NULL, TRUE, FALSE, TRUE, FALSE, CURRENT_DATE - INTERVAL '10 days'),
  (uuid_generate_v4(), SEED_USER_ID, 'Sprint Intervals', 'cardio', 'legs', 'core', FALSE, FALSE, TRUE, TRUE, CURRENT_DATE - INTERVAL '10 days'),
  (uuid_generate_v4(), SEED_USER_ID, 'Arm Swing Cardio', 'cardio', 'arms', 'chest', TRUE, FALSE, TRUE, FALSE, CURRENT_DATE - INTERVAL '10 days'),
  (uuid_generate_v4(), SEED_USER_ID, 'Dynamic Core HIIT', 'cardio', 'core', NULL, FALSE, FALSE, TRUE, FALSE, CURRENT_DATE - INTERVAL '10 days'),
  (uuid_generate_v4(), SEED_USER_ID, 'Chest Wall Stretch', 'flexibility', 'chest', NULL, FALSE, FALSE, TRUE, FALSE, CURRENT_DATE - INTERVAL '10 days'),
  (uuid_generate_v4(), SEED_USER_ID, 'Leg Swing Stretch', 'flexibility', 'legs', NULL, FALSE, FALSE, TRUE, FALSE, CURRENT_DATE - INTERVAL '10 days');

-- Step 2: Link user-defined exercises to equipment
INSERT INTO public.user_exercise_equipment (user_exercise_id, equipment_id)
SELECT
  ue.id,
  eq.id
FROM public.user_exercises ue
JOIN public.equipment eq ON eq.name = 
  CASE ue.name
    WHEN 'Weighted Push-Up' THEN 'Dumbbell'
    WHEN 'One-Arm Dumbbell Row' THEN 'Dumbbell'
    WHEN 'Goblet Squat' THEN 'Kettlebell'
    WHEN 'Concentration Curl' THEN 'Dumbbell'
    WHEN 'Side Plank Twist' THEN 'Yoga Mat'
    WHEN 'Sprint Intervals' THEN 'Treadmill'
    WHEN 'Arm Swing Cardio' THEN 'Resistance Band'
    WHEN 'Dynamic Core HIIT' THEN 'Yoga Mat'
    WHEN 'Chest Wall Stretch' THEN 'Yoga Mat'
    WHEN 'Leg Swing Stretch' THEN 'Yoga Mat'
  END
WHERE ue.user_id = SEED_USER_ID;

-- Step 3: Insert NUM_DAYS of workouts
INSERT INTO public.workouts (id, user_id, workout_date, created_at)
SELECT
  uuid_generate_v4(),
  SEED_USER_ID,
  CURRENT_DATE - (NUM_DAYS - n)::INTEGER,
  CURRENT_DATE - (NUM_DAYS - n)::INTEGER + INTERVAL '1 hour'
FROM generate_series(1, NUM_DAYS) AS n;

-- Step 4: Insert workout_exercises for predefined and user-defined exercises
WITH workout_ids AS (
  SELECT id, workout_date, ROW_NUMBER() OVER (ORDER BY workout_date) AS day_num
  FROM public.workouts
  WHERE user_id = SEED_USER_ID
),
predefined_exercises AS (
  SELECT id, name, category, primary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance,
         ROW_NUMBER() OVER (ORDER BY category, primary_muscle_group, name) AS exercise_num,
         'predefined'::exercise_source AS exercise_type
  FROM public.exercises
  WHERE is_deleted = FALSE
),
user_exercises_list AS (
  SELECT id, name, category, primary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance,
         ROW_NUMBER() OVER (ORDER BY name) + 75 AS exercise_num, -- Offset by 75 to follow predefined
         'user'::exercise_source AS exercise_type
  FROM public.user_exercises
  WHERE user_id = SEED_USER_ID
),
all_exercises AS (
  SELECT * FROM predefined_exercises
  UNION ALL
  SELECT * FROM user_exercises_list
)
INSERT INTO public.workout_exercises (id, workout_id, exercise_type, predefined_exercise_id, user_exercise_id, "order", effort_level, created_at)
SELECT
  uuid_generate_v4(),
  w.id,
  e.exercise_type,
  CASE WHEN e.exercise_type = 'predefined' THEN e.id ELSE NULL END,
  CASE WHEN e.exercise_type = 'user' THEN e.id ELSE NULL END,
  ((e.exercise_num - 1) % 3) + 1, -- Orders 1-3 per workout
  CASE
    WHEN RANDOM() < 0.2 THEN 'easy'::effort_level_type
    WHEN RANDOM() < 0.5 THEN 'ok'::effort_level_type
    ELSE 'hard'::effort_level_type
  END,
  w.workout_date + INTERVAL '1 hour'
FROM workout_ids w
JOIN all_exercises e ON (w.day_num - 1) % 85 + 1 = e.exercise_num; -- 85 = 75 predefined + 10 user-defined

-- Step 5: Insert sets for each workout_exercise
INSERT INTO public.sets (id, workout_exercise_id, set_number, reps, weight_kg, duration_seconds, distance_meters, created_at)
SELECT
  uuid_generate_v4(),
  we.id,
  s.set_num,
  CASE
    WHEN COALESCE(e.uses_reps, ue.uses_reps) THEN
      CASE
        WHEN COALESCE(e.category, ue.category) = 'strength_training' THEN FLOOR(RANDOM() * 12 + 4)::INTEGER -- 4-15 reps
        WHEN COALESCE(e.category, ue.category) = 'cardio' THEN FLOOR(RANDOM() * 20 + 10)::INTEGER -- 10-30 reps
        ELSE NULL
      END
    ELSE NULL
  END,
  CASE
    WHEN COALESCE(e.uses_weight, ue.uses_weight) THEN
      CASE
        WHEN COALESCE(e.primary_muscle_group, ue.primary_muscle_group) IN ('chest', 'back', 'legs') THEN ROUND((RANDOM() * 80 + 20)::NUMERIC, 1) -- 20-100 kg
        WHEN COALESCE(e.primary_muscle_group, ue.primary_muscle_group) IN ('arms', 'core') THEN ROUND((RANDOM() * 30 + 5)::NUMERIC, 1) -- 5-35 kg
        ELSE NULL
      END
    ELSE NULL
  END,
  CASE
    WHEN COALESCE(e.uses_duration, ue.uses_duration) THEN
      CASE
        WHEN COALESCE(e.category, ue.category) = 'cardio' THEN FLOOR(RANDOM() * 300 + 60)::INTEGER -- 60-360 seconds
        WHEN COALESCE(e.category, ue.category) = 'flexibility' THEN FLOOR(RANDOM() * 120 + 30)::INTEGER -- 30-150 seconds
        WHEN COALESCE(e.category, ue.category) = 'strength_training' AND COALESCE(e.name, ue.name) IN ('Plank', 'Side Plank Twist') THEN FLOOR(RANDOM() * 90 + 30)::INTEGER -- 30-120 seconds
        ELSE NULL
      END
    ELSE NULL
  END,
  CASE
    WHEN COALESCE(e.uses_distance, ue.uses_distance) THEN
      CASE
        WHEN COALESCE(e.name, ue.name) IN ('Running', 'Cycling', 'Sprint Intervals') THEN ROUND((RANDOM() * 5000 + 1000)::NUMERIC, 1) -- 1-6 km
        WHEN COALESCE(e.name, ue.name) = 'Swimming (Backstroke)' THEN ROUND((RANDOM() * 1000 + 200)::NUMERIC, 1) -- 200-1200 meters
        ELSE NULL
      END
    ELSE NULL
  END,
  we.created_at + INTERVAL '1 minute'
FROM public.workout_exercises we
LEFT JOIN public.exercises e ON we.predefined_exercise_id = e.id
LEFT JOIN public.user_exercises ue ON we.user_exercise_id = ue.id
CROSS JOIN generate_series(1, CASE
  WHEN COALESCE(e.category, ue.category) = 'strength_training' THEN 3 -- 3 sets for strength
  WHEN COALESCE(e.category, ue.category) = 'cardio' THEN 2 -- 2 sets for cardio
  WHEN COALESCE(e.category, ue.category) = 'flexibility' THEN 1 -- 1 set for flexibility
END) AS s(set_num)
WHERE we.workout_id IN (SELECT id FROM public.workouts WHERE user_id = SEED_USER_ID);

END $$;

-- End of Seed Data Script