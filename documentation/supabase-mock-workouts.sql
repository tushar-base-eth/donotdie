-- Enable the UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Begin the DO block for the script
DO $$
DECLARE
    -- Configurable variables
    v_user_id UUID := '14570f69-5dc3-4914-bffe-abd84c6a2b34';  -- User ID (change this to your desired user UUID)
    v_days INTEGER := 30;                                       -- Number of days to generate data for (change this as needed)

    -- Working variables
    v_date DATE;                -- Current date in the loop
    v_num_workouts INTEGER;     -- Number of workouts per day
    v_workout_id UUID;          -- ID of the inserted workout
    v_num_exercises INTEGER;    -- Number of exercises per workout
    v_workout_exercise_id UUID; -- ID of the inserted workout_exercise
    v_num_sets INTEGER;         -- Number of sets per exercise
    v_reps INTEGER;             -- Number of reps per set
    v_weight_kg FLOAT;          -- Weight in kg for the sets
    exercise_id UUID;           -- Scalar variable for exercise ID
    exercise_name TEXT;         -- Scalar variable for exercise name
BEGIN
    -- Loop over each day in the specified range (past v_days including today)
    FOR i IN 0..(v_days - 1) LOOP
        v_date := CURRENT_DATE - (v_days - 1) + i;

        -- Randomly decide the number of workouts for this day
        -- 70% chance of 1, 25% chance of 2, 5% chance of 3
        IF random() < 0.05 THEN
            v_num_workouts := 3;
        ELSIF random() < 0.3 THEN
            v_num_workouts := 2;
        ELSE
            v_num_workouts := 1;
        END IF;

        -- Loop to create each workout for the day
        FOR j IN 1..v_num_workouts LOOP
            -- Insert a workout with a random timestamp between 6:00 AM and 10:00 PM
            INSERT INTO public.workouts (user_id, created_at)
            VALUES (
                v_user_id,
                v_date::TIMESTAMP + INTERVAL '6 hours' + (random() * INTERVAL '16 hours')
            )
            RETURNING id INTO v_workout_id;

            -- Randomly select 3 to 5 exercises for the workout
            v_num_exercises := 3 + FLOOR(random() * 3)::INTEGER;  -- Results in 3, 4, or 5

            -- Loop over randomly selected exercises using scalar variables
            FOR exercise_id, exercise_name IN (
                SELECT id, name
                FROM public.available_exercises
                ORDER BY random()
                LIMIT v_num_exercises
            ) LOOP
                -- Insert the exercise into workout_exercises
                INSERT INTO public.workout_exercises (workout_id, exercise_id)
                VALUES (v_workout_id, exercise_id)
                RETURNING id INTO v_workout_exercise_id;

                -- Generate consistent reps for all sets (between 5 and 15)
                v_reps := 5 + FLOOR(random() * 11)::INTEGER;

                -- Assign realistic weight based on exercise name
                CASE exercise_name
                    WHEN 'Bench Press' THEN
                        v_weight_kg := 40 + random() * 60;    -- 40–100 kg
                    WHEN 'Squat' THEN
                        v_weight_kg := 50 + random() * 70;    -- 50–120 kg
                    WHEN 'Deadlift' THEN
                        v_weight_kg := 60 + random() * 90;    -- 60–150 kg
                    WHEN 'Pull-up' THEN
                        v_weight_kg := 0;                     -- Bodyweight
                    WHEN 'Shoulder Press' THEN
                        v_weight_kg := 20 + random() * 40;    -- 20–60 kg
                    WHEN 'Push-up' THEN
                        v_weight_kg := 0;                     -- Bodyweight
                    WHEN 'Lunge' THEN
                        v_weight_kg := 20 + random() * 30;    -- 20–50 kg
                    WHEN 'Bent-Over Row' THEN
                        v_weight_kg := 30 + random() * 50;    -- 30–80 kg
                    ELSE
                        v_weight_kg := 0;                     -- Default for unknown exercises
                END CASE;

                -- Randomly decide number of sets (3 to 5)
                v_num_sets := 3 + FLOOR(random() * 3)::INTEGER;

                -- Insert sets with consistent reps and weight
                FOR k IN 1..v_num_sets LOOP
                    INSERT INTO public.sets (workout_exercise_id, reps, weight_kg)
                    VALUES (v_workout_exercise_id, v_reps, v_weight_kg);
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;