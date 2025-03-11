-- Seed Data SQL Script for Supabase
-- Purpose: Populate exercises and equipment tables with realistic data
-- Date: March 11, 2025
-- Notes: 
-- - Includes 5 popular exercises per exercise_category and muscle_group combination
-- - Uses realistic equipment and links them via exercise_equipment table
-- - All data adheres to schema constraints (e.g., ENUMs, CHECKs, length limits)

-- Enable UUID extension (already in schema, included for completeness)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert Equipment Data
-- Purpose: Add common fitness equipment used in exercises
INSERT INTO public.equipment (id, name) VALUES
  (uuid_generate_v4(), 'Barbell'),           -- For heavy lifting (e.g., squats, bench press)
  (uuid_generate_v4(), 'Dumbbell'),          -- Versatile for many exercises
  (uuid_generate_v4(), 'Kettlebell'),        -- For swings and dynamic movements
  (uuid_generate_v4(), 'Treadmill'),         -- For cardio running
  (uuid_generate_v4(), 'Yoga Mat'),          -- For flexibility and bodyweight exercises
  (uuid_generate_v4(), 'Bench'),             -- For presses and step-ups
  (uuid_generate_v4(), 'Pull-Up Bar'),       -- For back and arm exercises
  (uuid_generate_v4(), 'Resistance Band'),   -- For flexibility and light strength
  (uuid_generate_v4(), 'Cable Machine'),     -- For targeted muscle work
  (uuid_generate_v4(), 'Stationary Bike');   -- For cardio cycling

-- Insert Exercises Data
-- Notes:
-- - 5 exercises per category (strength_training, cardio, flexibility) and muscle group (chest, back, legs, arms, core)
-- - Each exercise has appropriate metric flags (uses_reps, uses_weight, etc.)
-- - Names are unique, within 50 chars, and use printable characters

-- Strength Training Exercises
-- Chest
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Barbell Bench Press', 'strength_training', 'chest', 'arms', TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Dumbbell Flyes', 'strength_training', 'chest', NULL, TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Push-Ups', 'strength_training', 'chest', 'arms', TRUE, FALSE, FALSE, FALSE),
  (uuid_generate_v4(), 'Incline Dumbbell Press', 'strength_training', 'chest', 'arms', TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Cable Crossovers', 'strength_training', 'chest', NULL, TRUE, TRUE, FALSE, FALSE);

-- Back
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Deadlift', 'strength_training', 'back', 'legs', TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Pull-Ups', 'strength_training', 'back', 'arms', TRUE, FALSE, FALSE, FALSE),
  (uuid_generate_v4(), 'Bent-Over Barbell Row', 'strength_training', 'back', 'arms', TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Lat Pulldown', 'strength_training', 'back', NULL, TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Dumbbell Row', 'strength_training', 'back', 'arms', TRUE, TRUE, FALSE, FALSE);

-- Legs
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Barbell Squat', 'strength_training', 'legs', 'core', TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Leg Press', 'strength_training', 'legs', NULL, TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Lunges', 'strength_training', 'legs', 'core', TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Romanian Deadlift', 'strength_training', 'legs', 'back', TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Calf Raises', 'strength_training', 'legs', NULL, TRUE, TRUE, FALSE, FALSE);

-- Arms
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Bicep Curl', 'strength_training', 'arms', NULL, TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Tricep Dips', 'strength_training', 'arms', 'chest', TRUE, FALSE, FALSE, FALSE),
  (uuid_generate_v4(), 'Overhead Tricep Extension', 'strength_training', 'arms', NULL, TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Hammer Curl', 'strength_training', 'arms', NULL, TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Cable Tricep Pushdown', 'strength_training', 'arms', NULL, TRUE, TRUE, FALSE, FALSE);

-- Core
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Plank', 'strength_training', 'core', NULL, FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Russian Twist', 'strength_training', 'core', NULL, TRUE, TRUE, FALSE, FALSE),
  (uuid_generate_v4(), 'Hanging Leg Raise', 'strength_training', 'core', NULL, TRUE, FALSE, FALSE, FALSE),
  (uuid_generate_v4(), 'Ab Crunch', 'strength_training', 'core', NULL, TRUE, FALSE, FALSE, FALSE),
  (uuid_generate_v4(), 'Kettlebell Swing', 'strength_training', 'core', 'legs', TRUE, TRUE, FALSE, FALSE);

-- Cardio Exercises
-- Chest
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Burpees', 'cardio', 'chest', 'core', TRUE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Mountain Climbers', 'cardio', 'chest', 'core', TRUE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Jumping Push-Ups', 'cardio', 'chest', 'arms', TRUE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Boxing Punches', 'cardio', 'chest', 'arms', TRUE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Chest-Focused HIIT', 'cardio', 'chest', NULL, FALSE, FALSE, TRUE, FALSE);

-- Back
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Rowing Machine', 'cardio', 'back', 'arms', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Jump Rope', 'cardio', 'back', 'legs', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Back-Focused HIIT', 'cardio', 'back', NULL, FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Swimming (Backstroke)', 'cardio', 'back', 'arms', FALSE, FALSE, TRUE, TRUE),
  (uuid_generate_v4(), 'Battle Rope Pulls', 'cardio', 'back', 'arms', TRUE, FALSE, TRUE, FALSE);

-- Legs
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Running', 'cardio', 'legs', 'core', FALSE, FALSE, TRUE, TRUE),
  (uuid_generate_v4(), 'Cycling', 'cardio', 'legs', NULL, FALSE, FALSE, TRUE, TRUE),
  (uuid_generate_v4(), 'Jump Squats', 'cardio', 'legs', 'core', TRUE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Stair Climbing', 'cardio', 'legs', NULL, FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'High Knees', 'cardio', 'legs', 'core', TRUE, FALSE, TRUE, FALSE);

-- Arms
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Arm Circles', 'cardio', 'arms', 'chest', TRUE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Shadow Boxing', 'cardio', 'arms', 'chest', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Battle Rope Slams', 'cardio', 'arms', 'core', TRUE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Arm-Focused HIIT', 'cardio', 'arms', NULL, FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Rowing Sprints', 'cardio', 'arms', 'back', FALSE, FALSE, TRUE, FALSE);

-- Core
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Bicycle Crunches', 'cardio', 'core', NULL, TRUE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Plank Jacks', 'cardio', 'core', 'legs', TRUE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Core-Focused HIIT', 'cardio', 'core', NULL, FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Skater Jumps', 'cardio', 'core', 'legs', TRUE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Tuck Jumps', 'cardio', 'core', 'legs', TRUE, FALSE, TRUE, FALSE);

-- Flexibility Exercises
-- Chest
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Chest Opener Stretch', 'flexibility', 'chest', 'arms', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Doorway Chest Stretch', 'flexibility', 'chest', NULL, FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Cat-Cow Pose', 'flexibility', 'chest', 'back', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Thread the Needle', 'flexibility', 'chest', 'back', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Chest Expansion Stretch', 'flexibility', 'chest', NULL, FALSE, FALSE, TRUE, FALSE);

-- Back
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Child’s Pose', 'flexibility', 'back', 'core', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Cobra Stretch', 'flexibility', 'back', 'chest', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Seated Forward Bend', 'flexibility', 'back', 'legs', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Supine Spinal Twist', 'flexibility', 'back', 'core', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Bridge Pose', 'flexibility', 'back', 'legs', FALSE, FALSE, TRUE, FALSE);

-- Legs
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Hamstring Stretch', 'flexibility', 'legs', NULL, FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Quad Stretch', 'flexibility', 'legs', NULL, FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Butterfly Stretch', 'flexibility', 'legs', 'core', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Lunge Stretch', 'flexibility', 'legs', 'core', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Calf Stretch', 'flexibility', 'legs', NULL, FALSE, FALSE, TRUE, FALSE);

-- Arms
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Tricep Stretch', 'flexibility', 'arms', NULL, FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Bicep Stretch', 'flexibility', 'arms', NULL, FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Wrist Flexor Stretch', 'flexibility', 'arms', NULL, FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Shoulder Stretch', 'flexibility', 'arms', 'chest', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Arm Circles Stretch', 'flexibility', 'arms', NULL, FALSE, FALSE, TRUE, FALSE);

-- Core
INSERT INTO public.exercises (id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance) VALUES
  (uuid_generate_v4(), 'Seated Twist Stretch', 'flexibility', 'core', 'back', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Side Bend Stretch', 'flexibility', 'core', NULL, FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Downward Dog', 'flexibility', 'core', 'legs', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Pigeon Pose', 'flexibility', 'core', 'legs', FALSE, FALSE, TRUE, FALSE),
  (uuid_generate_v4(), 'Cat Stretch', 'flexibility', 'core', 'back', FALSE, FALSE, TRUE, FALSE);

-- Insert Exercise-Equipment Relationships
-- Notes: Links exercises to appropriate equipment based on common usage
-- Using subqueries to reference IDs dynamically; assumes equipment names are unique

-- Strength Training Equipment Links
INSERT INTO public.exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM public.exercises e
JOIN public.equipment eq ON eq.name = 'Barbell'
WHERE e.name IN ('Barbell Bench Press', 'Deadlift', 'Barbell Squat', 'Bent-Over Barbell Row');

INSERT INTO public.exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM public.exercises e
JOIN public.equipment eq ON eq.name = 'Dumbbell'
WHERE e.name IN ('Dumbbell Flyes', 'Incline Dumbbell Press', 'Dumbbell Row', 'Bicep Curl', 'Overhead Tricep Extension', 'Hammer Curl', 'Lunges');

INSERT INTO public.exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM public.exercises e
JOIN public.equipment eq ON eq.name = 'Kettlebell'
WHERE e.name = 'Kettlebell Swing';

INSERT INTO public.exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM public.exercises e
JOIN public.equipment eq ON eq.name = 'Bench'
WHERE e.name IN ('Barbell Bench Press', 'Incline Dumbbell Press', 'Tricep Dips');

INSERT INTO public.exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM public.exercises e
JOIN public.equipment eq ON eq.name = 'Pull-Up Bar'
WHERE e.name IN ('Pull-Ups', 'Hanging Leg Raise');

INSERT INTO public.exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM public.exercises e
JOIN public.equipment eq ON eq.name = 'Cable Machine'
WHERE e.name IN ('Cable Crossovers', 'Lat Pulldown', 'Cable Tricep Pushdown');

-- Cardio Equipment Links
INSERT INTO public.exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM public.exercises e
JOIN public.equipment eq ON eq.name = 'Treadmill'
WHERE e.name = 'Running';

INSERT INTO public.exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM public.exercises e
JOIN public.equipment eq ON eq.name = 'Stationary Bike'
WHERE e.name = 'Cycling';

INSERT INTO public.exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM public.exercises e
JOIN public.equipment eq ON eq.name = 'Yoga Mat'
WHERE e.name IN ('Burpees', 'Mountain Climbers', 'Jumping Push-Ups', 'Bicycle Crunches', 'Plank Jacks');

INSERT INTO public.exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM public.exercises e
JOIN public.equipment eq ON eq.name = 'Resistance Band'
WHERE e.name = 'Battle Rope Pulls'; -- Assuming resistance band as a substitute

-- Flexibility Equipment Links
INSERT INTO public.exercise_equipment (exercise_id, equipment_id)
SELECT e.id, eq.id
FROM public.exercises e
JOIN public.equipment eq ON eq.name = 'Yoga Mat'
WHERE e.category = 'flexibility' AND e.name IN (
  'Chest Opener Stretch', 'Child’s Pose', 'Cobra Stretch', 'Hamstring Stretch', 'Downward Dog'
);

-- End of Seed Data Script