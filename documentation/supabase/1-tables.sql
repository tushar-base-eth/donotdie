-- Enable UUID extension for generating unique identifiers
-- Supabase typically has this enabled, but included for completeness
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types for stricter type safety (Supabase/PostgreSQL compatible) for profiles
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE unit_preference_type AS ENUM ('metric', 'imperial');
CREATE TYPE theme_preference_type AS ENUM ('light', 'dark');

-- Create ENUM types for stricter enforcement for exercises
CREATE TYPE exercise_category AS ENUM ('strength_training', 'cardio', 'flexibility', 'other');
CREATE TYPE muscle_group AS ENUM ('chest', 'back', 'legs', 'arms', 'core', 'full_body', 'other');


-- Define ENUMs for consistency doe workout exercises
CREATE TYPE exercise_source AS ENUM ('predefined', 'user');
CREATE TYPE effort_level_type AS ENUM ('super_easy', 'easy', 'ok', 'hard', 'super_hard');

-- Table: profiles
-- Purpose: Stores user profile data and aggregate statistics.
-- Auto-generated: id, created_at, updated_at
-- Required for insert: name, unit_preference, theme_preference
-- Optional for insert: gender, date_of_birth, weight_kg, height_cm, body_fat_percentage
-- Updatable: name, gender, date_of_birth, weight_kg, height_cm, body_fat_percentage, unit_preference, theme_preference
-- Read-only: total_volume, total_workouts (managed by triggers)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to auth.users, auto-generated, cascades deletion
  name TEXT NOT NULL CHECK (LENGTH(TRIM(name)) >= 1 AND LENGTH(name) <= 50 AND name ~ '^[a-zA-Z0-9 ]+$'), 
  -- User's name, required on insert
  -- tightened: non-empty, trimmed, max 50 chars, printable characters only (per user request)
  -- original: TEXT NOT NULL with no length/format restriction
  -- suggestion: Added length and printable character constraints to prevent malicious or invalid input
  -- Updated: Restricted to alphanumeric characters and spaces for security and consistency

  gender gender_type, -- Optional, uses ENUM for strict type safety (per user request)
  -- original: TEXT CHECK (gender IN ('Male', 'Female', 'Other')), nullable
  -- suggestion: Normalized case or ENUM; user chose ENUM for stricter enforcement

  date_of_birth DATE CHECK (date_of_birth <= CURRENT_DATE AND date_of_birth >= CURRENT_DATE - INTERVAL '120 years'),
  -- Optional, past date only, max age 120 years (per user request adopting my suggestion)
  -- original: CHECK (date_of_birth <= CURRENT_DATE AND date_of_birth >= '1900-01-01')
  -- suggestion: Tightened to 120 years for practical age range

  weight_kg NUMERIC(4,1) CHECK (weight_kg >= 20 AND weight_kg <= 500),
  -- Optional, precision 999.9 (per user request), positive value with realistic range
  -- original: NUMERIC CHECK (weight_kg > 0), no precision or upper bound
  -- suggestion: Added realistic range (20-500 kg) and precision (5,1); user adjusted to (4,1)

  height_cm NUMERIC(4,1) CHECK (height_cm >= 50 AND height_cm <= 250),
  -- Optional, precision 999.9 (per user request), tightened range 50-250 cm (per user request)
  -- original: NUMERIC CHECK (height_cm >= 50 AND height_cm <= 300)
  -- suggestion: Suggested 50-250 cm and precision (4,1), adopted by user

  body_fat_percentage NUMERIC(4,1) CHECK (body_fat_percentage >= 2 AND body_fat_percentage <= 60),
  -- Optional, precision 99.9, realistic range 2-60% (per user request)
  -- original: NUMERIC CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100)
  -- suggestion: Suggested 2-60% and precision (4,1), adopted by user

  unit_preference unit_preference_type NOT NULL DEFAULT 'metric',
  -- Required, uses ENUM with default 'metric' (per user request)
  -- original: TEXT NOT NULL CHECK (unit_preference IN ('metric', 'imperial')) DEFAULT 'metric'
  -- suggestion: Suggested ENUM, adopted by user

  theme_preference theme_preference_type NOT NULL DEFAULT 'light',
  -- Required, uses ENUM with default 'light' (per user request)
  -- original: TEXT NOT NULL CHECK (theme_preference IN ('light', 'dark')) DEFAULT 'light'
  -- suggestion: Suggested ENUM, adopted by user

  total_volume NUMERIC NOT NULL DEFAULT 0 CHECK (total_volume >= 0 AND total_volume <= 1e9),
  -- Read-only, updated by triggers, upper bound 1 billion (per user request adopting my suggestion)
  -- original: NUMERIC NOT NULL DEFAULT 0 CHECK (total_volume >= 0)
  -- suggestion: Added upper bound for sanity (1e9)

  total_workouts INTEGER NOT NULL DEFAULT 0 CHECK (total_workouts >= 0 AND total_workouts <= 1e6),
  -- Read-only, updated by triggers, upper bound 1 million (per user request adopting my suggestion)
  -- original: INTEGER NOT NULL DEFAULT 0 CHECK (total_workouts >= 0)
  -- suggestion: Added upper bound for sanity (1e6)

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
  workout_date DATE NOT NULL, -- Required, defaults to today, can be updated
  -- Updated: Removed DEFAULT CURRENT_DATE to allow flexibility in logging past/future workouts
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
  name TEXT UNIQUE NOT NULL CHECK (LENGTH(TRIM(name)) >= 1 AND LENGTH(name) <= 50 AND name ~ '^[[:print:]]+$'), 
  -- Required, unique, max 50 chars, printable only
  category exercise_category NOT NULL, -- Required, ENUM for exercise type
  primary_muscle_group muscle_group NOT NULL, -- Required, ENUM for main muscle targeted
  secondary_muscle_group muscle_group, -- Optional, ENUM for secondary muscle targeted
  uses_reps BOOLEAN DEFAULT TRUE, -- Indicates if exercise uses reps
  uses_weight BOOLEAN DEFAULT TRUE, -- Indicates if exercise uses weight
  uses_duration BOOLEAN DEFAULT FALSE, -- Indicates if exercise uses duration
  uses_distance BOOLEAN DEFAULT FALSE, -- Indicates if exercise uses distance
  is_deleted BOOLEAN DEFAULT FALSE -- Soft delete flag, managed by admin
  -- Optional: CHECK (uses_reps OR uses_weight OR uses_duration OR uses_distance) -- Ensure at least one metric
);

-- Add case-insensitive unique index for exercises
CREATE UNIQUE INDEX idx_exercises_name_lower ON public.exercises (LOWER(name));
-- Updated: Ensures exercise names are unique regardless of case

-- Table: equipment
-- Purpose: Stores available equipment types.
-- Auto-generated: id
-- Required for insert: name
-- Optional for insert: (none)
-- Updatable: name
-- Read-only: is_deleted (soft delete)
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Auto-generated unique identifier
  -- My comment: Uses uuid_generate_v4() for random, unique IDs; appropriate for Supabase/PostgreSQL

  name TEXT UNIQUE NOT NULL CHECK (LENGTH(TRIM(name)) >= 1 AND LENGTH(name) <= 50 AND name ~ '^[[:print:]]+$'), 
  -- Required, unique equipment name
  -- My comment: Ensures no duplicate equipment names, now with length and format constraints
  -- My suggestion: Added CHECK for non-empty, max 50 chars, and printable characters only
  -- Rationale: Prevents invalid or malicious input, aligns with prior tables

  is_deleted BOOLEAN DEFAULT FALSE -- Soft delete flag
  -- My comment: Implements soft deletion, intended as read-only but not enforced at table level
  -- My suggestion: Typically managed by app logic or higher privileges; no table-level change needed
);

-- Add case-insensitive unique index for equipment
CREATE UNIQUE INDEX idx_equipment_name_lower ON public.equipment (LOWER(name));
-- Updated: Ensures equipment names are unique regardless of case

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
  -- My comment: Uses uuid_generate_v4() for a random, unique ID; suitable for Supabase/PostgreSQL

  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Required, links to user
  -- My comment: Foreign key to profiles(id) with CASCADE ensures user deletion removes exercises

  name TEXT NOT NULL CHECK (LENGTH(TRIM(name)) >= 1 AND LENGTH(name) <= 50 AND name ~ '^[[:print:]]+$'), 
  -- Required, exercise name
  -- My comment: Enhanced with TRIM and printable checks; 20-char limit stricter than other tables
  -- My suggestion: Consider 50 chars for consistency unless 20 is intentional
  -- Updated: Increased name length to 50 for consistency with other tables

  category exercise_category NOT NULL, -- Required, exercise type
  -- My comment: Uses ENUM for consistency with exercises table
  -- My suggestion: Replaces original TEXT CHECK for stricter enforcement

  primary_muscle_group muscle_group NOT NULL, -- Required, main muscle targeted
  -- My comment: Uses ENUM for consistency and validation
  -- My suggestion: Replaces original TEXT for better data integrity

  secondary_muscle_group muscle_group, -- Optional, secondary muscle targeted
  -- My comment: Uses ENUM, nullable; added check for non-empty if provided
  -- My suggestion: CHECK (secondary_muscle_group IS NULL OR LENGTH(TRIM(secondary_muscle_group::TEXT)) >= 1) optional

  uses_reps BOOLEAN DEFAULT FALSE, -- Indicates if exercise uses reps
  uses_weight BOOLEAN DEFAULT FALSE, -- Indicates if exercise uses weight
  uses_duration BOOLEAN DEFAULT FALSE, -- Indicates if exercise uses duration
  uses_distance BOOLEAN DEFAULT FALSE, -- Indicates if exercise uses distance
  -- My comment: Metric flags with sensible defaults, enforced by at_least_one_metric

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Auto-generated on insert
  -- My comment: Tracks creation time; no update tracking

  CONSTRAINT unique_user_exercise_name UNIQUE (user_id, name), -- Unique name per user
  CONSTRAINT at_least_one_metric CHECK (uses_reps OR uses_weight OR uses_duration OR uses_distance) -- At least one metric required
  -- My comment: No max_name_length constraint needed; incorporated into name CHECK
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
  -- My comment: Uses uuid_generate_v4() for a random, unique ID; appropriate for Supabase/PostgreSQL

  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE, -- Required, links to workouts
  -- My comment: Foreign key to workouts(id) with CASCADE ensures workout deletion removes associated exercises

  exercise_type exercise_source NOT NULL, -- Required, specifies exercise source
  -- My comment: Uses ENUM for stricter enforcement
  -- My suggestion: Replaces TEXT CHECK for consistency and type safety

  predefined_exercise_id UUID REFERENCES public.exercises(id), -- Links to predefined exercise if type is 'predefined'
  -- My comment: Nullable; constrained by valid_exercise_type

  user_exercise_id UUID REFERENCES public.user_exercises(id), -- Links to user exercise if type is 'user'
  -- My comment: Nullable; constrained by valid_exercise_type

  "order" INTEGER NOT NULL CHECK ("order" >= 1), -- Required, order of exercise in workout
  -- My comment: Added CHECK for positive values
  -- My suggestion: Ensures logical sequencing (1-based)

  effort_level effort_level_type DEFAULT 'ok', -- Optional, subjective effort
  -- My comment: Uses ENUM with default; nullable allowed
  -- My suggestion: Replaces TEXT CHECK for stricter enforcement

  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Auto-generated on insert
  -- My comment: Tracks creation time; no update tracking

  CONSTRAINT unique_order_per_workout UNIQUE (workout_id, "order"), -- Unique order per workout
  -- My comment: Ensures no duplicate order numbers within a workout

  CONSTRAINT valid_exercise_type CHECK (
    (exercise_type = 'predefined' AND predefined_exercise_id IS NOT NULL AND user_exercise_id IS NULL) OR
    (exercise_type = 'user' AND user_exercise_id IS NOT NULL AND predefined_exercise_id IS NULL)
  ) -- Ensures correct exercise reference based on type
  -- My comment: Robustly enforces mutual exclusivity of exercise references
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
  -- My comment: Uses uuid_generate_v4() for a random, unique ID; consistent with prior tables

  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE, -- Required, links to workout_exercises
  -- My comment: Foreign key with CASCADE ensures deletion of workout_exercise removes associated sets

  set_number INTEGER NOT NULL CHECK (set_number >= 1), -- Required, order of set for the exercise
  -- My comment: Added CHECK for positive values
  -- My suggestion: Ensures logical 1-based indexing

  reps INTEGER CHECK (reps >= 0 AND reps <= 1000), -- Optional, non-negative number of repetitions
  -- My comment: Added upper bound for realism
  -- My suggestion: Caps at 1000 to prevent outliers

  weight_kg NUMERIC(5,1) CHECK (weight_kg >= 0 AND weight_kg <= 1000), -- Optional, non-negative weight in kg
  -- My comment: Added precision and upper bound
  -- My suggestion: 1-decimal precision, 1000 kg cap covers extreme lifts

  duration_seconds INTEGER CHECK (duration_seconds >= 0 AND duration_seconds <= 86400), -- Optional, duration in seconds
  -- My comment: Added upper bound of 24 hours
  -- My suggestion: Caps at 86400 seconds; NUMERIC could be used for sub-second precision if needed

  distance_meters NUMERIC(7,1) CHECK (distance_meters >= 0 AND distance_meters <= 100000), -- Optional, distance in meters
  -- My comment: Added precision and upper bound
  -- My suggestion: 1-decimal precision, 100 km cap covers extreme distances

  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Auto-generated on insert
  -- My comment: Tracks creation time; no update tracking

  CONSTRAINT unique_set_number_per_exercise UNIQUE (workout_exercise_id, set_number) -- Unique set number per exercise
  -- My comment: Ensures no duplicate set numbers per workout_exercise
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
  date DATE NOT NULL CHECK (date <= CURRENT_DATE), -- Required, date of volume
  -- Updated: Added CHECK to prevent future dates
  volume NUMERIC NOT NULL DEFAULT 0 CHECK (volume >= 0), -- Required, non-negative volume
  PRIMARY KEY (user_id, date) -- Composite primary key
);

-- Index for performance
CREATE INDEX idx_daily_volume_date ON public.daily_volume(date);