-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
-- Purpose: Stores user profile data and aggregate statistics.
-- Auto-generated: id, created_at, updated_at
-- Required for insert: name, unit_preference, theme_preference
-- Optional for insert: gender, date_of_birth, weight_kg, height_cm, body_fat_percentage
-- Updatable: name, gender, date_of_birth, weight_kg, height_cm, body_fat_percentage, unit_preference, theme_preference
-- Read-only: total_volume, total_workouts (managed by triggers)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to auth.users, auto-generated
  name TEXT NOT NULL, -- User's name, required on insert
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')), -- Optional, restricted to specific values
  date_of_birth DATE CHECK (date_of_birth <= CURRENT_DATE AND date_of_birth >= '1900-01-01'), -- Optional, past date only
  weight_kg NUMERIC CHECK (weight_kg > 0), -- Optional, positive value if provided
  height_cm NUMERIC CHECK (height_cm >= 50 AND height_cm <= 300), -- Optional, between 50-300 cm
  body_fat_percentage NUMERIC CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100), -- Optional, 0-100%
  unit_preference TEXT NOT NULL CHECK (unit_preference IN ('metric', 'imperial')) DEFAULT 'metric', -- Required, defaults to 'metric'
  theme_preference TEXT NOT NULL CHECK (theme_preference IN ('light', 'dark')) DEFAULT 'light', -- Required, defaults to 'light'
  total_volume NUMERIC NOT NULL DEFAULT 0 CHECK (total_volume >= 0), -- Read-only, updated by triggers
  total_workouts INTEGER NOT NULL DEFAULT 0 CHECK (total_workouts >= 0), -- Read-only, updated by triggers
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Auto-generated on insert
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP -- Auto-generated, updated by trigger
);

-- Table: workouts
-- Purpose: Tracks user workouts with dates.
-- Auto-generated: id, created_at
-- Required for insert: user_id, workout_date
-- Optional for insert: (none)
-- Updatable: workout_date
-- Read-only: (none)
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Auto-generated unique identifier
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Required, links to profiles
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Required, defaults to today, can be updated
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP -- Auto-generated on insert
);

-- Indexes for performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_workout_date ON public.workouts(workout_date);
CREATE INDEX idx_workouts_created_at ON public.workouts(created_at);

-- Table: exercises (renamed from available_exercises)
-- Purpose: Stores predefined exercises available to all users with categories and metric flags.
-- Auto-generated: id
-- Required for insert: name, category, primary_muscle_group
-- Optional for insert: secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance
-- Updatable: name, category, primary_muscle_group, secondary_muscle_group, metric flags
-- Read-only: is_deleted (soft delete)
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Auto-generated unique identifier
  name TEXT UNIQUE NOT NULL, -- Required, unique exercise name
  category TEXT NOT NULL CHECK (category IN ('Strength Training', 'Cardio', 'Flexibility', 'Other')), -- Required, exercise type
  primary_muscle_group TEXT NOT NULL, -- Required, main muscle targeted
  secondary_muscle_group TEXT, -- Optional, secondary muscle targeted
  uses_reps BOOLEAN DEFAULT TRUE, -- Indicates if exercise uses reps
  uses_weight BOOLEAN DEFAULT TRUE, -- Indicates if exercise uses weight
  uses_duration BOOLEAN DEFAULT FALSE, -- Indicates if exercise uses duration
  uses_distance BOOLEAN DEFAULT FALSE, -- Indicates if exercise uses distance
  is_deleted BOOLEAN DEFAULT FALSE -- Soft delete flag
);

-- Table: equipment
-- Purpose: Stores available equipment types.
-- Auto-generated: id
-- Required for insert: name
-- Optional for insert: (none)
-- Updatable: name
-- Read-only: is_deleted (soft delete)
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Auto-generated unique identifier
  name TEXT UNIQUE NOT NULL, -- Required, unique equipment name
  is_deleted BOOLEAN DEFAULT FALSE -- Soft delete flag
);

-- Table: exercise_equipment
-- Purpose: Links predefined exercises to equipment (many-to-many).
-- Auto-generated: (none)
-- Required for insert: exercise_id, equipment_id
-- Optional for insert: (none)
-- Updatable: (none)
CREATE TABLE public.exercise_equipment (
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE, -- Links to exercises
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE, -- Links to equipment
  PRIMARY KEY (exercise_id, equipment_id) -- Composite primary key
);

-- Table: user_exercises
-- Purpose: Stores user-created exercises with a cap of 10 per user.
-- Auto-generated: id, created_at
-- Required for insert: user_id, name, category, primary_muscle_group
-- Optional for insert: secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance
-- Updatable: name, category, primary_muscle_group, secondary_muscle_group, metric flags
CREATE TABLE public.user_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Auto-generated unique identifier
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Required, links to user
  name TEXT NOT NULL, -- Required, exercise name
  category TEXT NOT NULL CHECK (category IN ('Strength Training', 'Cardio', 'Flexibility', 'Other')), -- Required, exercise type
  primary_muscle_group TEXT NOT NULL, -- Required, main muscle targeted
  secondary_muscle_group TEXT, -- Optional, secondary muscle targeted
  uses_reps BOOLEAN DEFAULT FALSE, -- Indicates if exercise uses reps
  uses_weight BOOLEAN DEFAULT FALSE, -- Indicates if exercise uses weight
  uses_duration BOOLEAN DEFAULT FALSE, -- Indicates if exercise uses duration
  uses_distance BOOLEAN DEFAULT FALSE, -- Indicates if exercise uses distance
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Auto-generated on insert
  CONSTRAINT unique_user_exercise_name UNIQUE (user_id, name), -- Unique name per user
  CONSTRAINT max_name_length CHECK (LENGTH(name) <= 20), -- Name length limit
  CONSTRAINT at_least_one_metric CHECK (uses_reps OR uses_weight OR uses_duration OR uses_distance) -- At least one metric required
);

-- Table: user_exercise_equipment
-- Purpose: Links user-created exercises to equipment (many-to-many).
-- Auto-generated: (none)
-- Required for insert: user_exercise_id, equipment_id
-- Optional for insert: (none)
-- Updatable: (none)
CREATE TABLE public.user_exercise_equipment (
  user_exercise_id UUID NOT NULL REFERENCES public.user_exercises(id) ON DELETE CASCADE, -- Links to user_exercises
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE, -- Links to equipment
  PRIMARY KEY (user_exercise_id, equipment_id) -- Composite primary key
);

-- Table: workout_exercises
-- Purpose: Links exercises (predefined or user-created) to workouts with an order and effort level.
-- Auto-generated: id, created_at
-- Required for insert: workout_id, exercise_type, "order", (predefined_exercise_id OR user_exercise_id)
-- Optional for insert: effort_level
-- Updatable: exercise_type, predefined_exercise_id, user_exercise_id, "order", effort_level
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Auto-generated unique identifier
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE, -- Required, links to workouts
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('predefined', 'user')), -- Required, specifies exercise source
  predefined_exercise_id UUID REFERENCES public.exercises(id), -- Links to predefined exercise if type is 'predefined'
  user_exercise_id UUID REFERENCES public.user_exercises(id), -- Links to user exercise if type is 'user'
  "order" INTEGER NOT NULL, -- Required, order of exercise in workout
  effort_level TEXT DEFAULT 'ok' CHECK (effort_level IN ('super_easy', 'easy', 'ok', 'hard', 'super_hard')), -- Optional, subjective effort
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Auto-generated on insert
  CONSTRAINT unique_order_per_workout UNIQUE (workout_id, "order"), -- Unique order per workout
  CONSTRAINT valid_exercise_type CHECK (
    (exercise_type = 'predefined' AND predefined_exercise_id IS NOT NULL AND user_exercise_id IS NULL) OR
    (exercise_type = 'user' AND user_exercise_id IS NOT NULL AND predefined_exercise_id IS NULL)
  ) -- Ensures correct exercise reference based on type
);

-- Indexes for performance
CREATE INDEX idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_predefined_exercise_id ON public.workout_exercises(predefined_exercise_id);
CREATE INDEX idx_workout_exercises_user_exercise_id ON public.workout_exercises(user_exercise_id);

-- Table: sets
-- Purpose: Tracks individual sets for exercises in workouts with flexible metrics.
-- Auto-generated: id, created_at
-- Required for insert: workout_exercise_id, set_number
-- Optional for insert: reps, weight_kg, duration_seconds, distance_meters
-- Updatable: reps, weight_kg, duration_seconds, distance_meters
CREATE TABLE public.sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Auto-generated unique identifier
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE, -- Required, links to workout_exercises
  set_number INTEGER NOT NULL, -- Required, order of set for the exercise
  reps INTEGER CHECK (reps >= 0), -- Optional, non-negative number of repetitions
  weight_kg NUMERIC CHECK (weight_kg >= 0), -- Optional, non-negative weight in kg
  duration_seconds INTEGER CHECK (duration_seconds >= 0), -- Optional, duration in seconds
  distance_meters NUMERIC CHECK (distance_meters >= 0), -- Optional, distance in meters
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Auto-generated on insert
  CONSTRAINT unique_set_number_per_exercise UNIQUE (workout_exercise_id, set_number) -- Unique set number per exercise
);

-- Index for performance
CREATE INDEX idx_sets_workout_exercise_id ON public.sets(workout_exercise_id);

-- Table: daily_volume
-- Purpose: Tracks daily workout volume per user.
-- Auto-generated: (none)
-- Required for insert: user_id, date, volume
-- Optional for insert: (none)
-- Updatable: volume
-- Read-only: (none)
CREATE TABLE public.daily_volume (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Required, links to profiles
  date DATE NOT NULL, -- Required, date of volume
  volume NUMERIC NOT NULL DEFAULT 0 CHECK (volume >= 0), -- Required, non-negative volume
  PRIMARY KEY (user_id, date) -- Composite primary key
);

-- Index for performance
CREATE INDEX idx_daily_volume_date ON public.daily_volume(date);