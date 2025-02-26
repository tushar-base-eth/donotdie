# DoNotDie Backend Design

## Overview

This document defines the backend implementation and PostgreSQL schema for DoNotDie’s MVP, using Supabase and Next.js API Routes. The architecture is optimized for rapid development and AI tools, supporting dynamic exercise selection and instant dashboard performance.

## Architecture

- **Supabase**: authentication, PostgreSQL database, and RESTful APIs.
- **Next.js API Routes**: Versioned (v1, e.g., `/api/v1/workouts`), secured with Supabase Auth and rate limiting.
- **Supabase Client**: Use `@supabase/ssr` for server-side operations and `@supabase/supabase-js` for client-side operations.

## Database Schema

- **users**: Stores profile data, preferences, stats (total_volume, total_workouts).
- **workouts**: Tracks workout instances per user.
- **Workout_Exercises**: Links workouts to exercises from `available_exercises`.
- **sets**: Records reps and weights (kg) per exercise instance.
- **daily_volume**: Aggregates daily volume for dashboard charts.
- **available_exercises**: Seeded with Fitbod-inspired exercises (e.g., "Bench Press (Chest, Triceps)").

### Tables

- **users**:
  - `id` (UUID, PK)
  - `email` (string, unique)
  - `password` (hashed)
  - `name` (string)
  - `gender` (string: 'Male', 'Female', 'Other')
  - `date_of_birth` (date)
  - `weight_kg` (float)
  - `height_cm` (float)
  - `body_fat_percentage` (float)
  - `unit_preference` (string: 'metric' | 'imperial', default: 'metric')
  - `theme_preference` (string: 'light' | 'dark', default: 'light')
  - `total_volume` (numeric, default: 0) -- Total workout volume in kg
  - `total_workouts` (integer, default: 0) -- Total workout count
  - `created_at`, `updated_at` (timestamps)
- **workouts**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK to users.id)
  - `created_at` (timestamp)
- **Workout_Exercises**:
  - `id` (UUID, PK)
  - `workout_id` (UUID, FK to workouts.id)
  - `exercise_id` (UUID, FK to available_exercises.id)
  - `created_at` (timestamp)
- **sets**:
  - `id` (UUID, PK)
  - `workout_exercise_id` (UUID, FK to Workout_Exercises.id)
  - `reps` (integer)
  - `weight_kg` (float)
  - `created_at` (timestamp)
- **daily_volume**:
  - `id` (SERIAL, PK)
  - `user_id` (UUID, FK to users.id)
  - `date` (DATE, NOT NULL)
  - `volume` (NUMERIC, NOT NULL) -- Total volume for the day in kg
  - UNIQUE (user_id, date) -- Ensure one entry per user per day
- **available_exercises** (seeded with Fitbod-inspired list):
  - `id` (UUID, PK)
  - `name` (string, unique)
  - `primary_muscle_group` (string)
  - `secondary_muscle_group` (string, nullable)
  - **Seed Data**:
    - "Bench Press" (Chest, Triceps)
    - "Squat" (Legs, Glutes)
    - "Deadlift" (Back, Hamstrings)
    - "Pull-up" (Back, Biceps)
    - "Shoulder Press" (Shoulders, Triceps)
    - "Push-up" (Chest, Shoulders)
    - "Lunge" (Legs, Glutes)
    - "Bent-Over Row" (Back, Biceps)

### Relationships

- One `User` → Many `workouts`
- One `Workout` → Many `Workout_Exercises`
- One `Available_Exercise` → Many `Workout_Exercises`
- One `Workout_Exercise` → Many `sets`

## API Endpoints

- **Authentication**:
  - `POST /auth/v1/auth/login`: `{ "email": "string", "password": "string" }` → `{ "access_token": "string", "user": {...} }`
  - `POST /auth/v1/signup`:
    ```json
    {
      "email": "string", "password": "string", "name": "string", "gender": "string",
      "date_of_birth": "date", "weight_kg": float, "height_cm": float,
      "body_fat_percentage": float, "unit_preference": "string"
    }
    ```
    → `{ "user_id": "uuid" }`
  - `GET /auth/v1/auth/google`: Google OAuth redirect.
- **workouts**:
  - `POST /rest/v1/workouts`:
    ```typescript
    // app/api/v1/workouts/route.ts
    import { workoutSchema } from "@/lib/schemas";
    import { errorHandler, APIError } from "@/lib/errors";
    export async function POST(req) {
      try {
        const supabase = createRouteHandlerClient({ cookies });
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new APIError("Unauthorized", 401);
        const body = await req.json();
        const { user_id, exercises } = workoutSchema.parse(body);
        const { data: workout } = await supabase
          .from("workouts")
          .insert({ user_id })
          .select()
          .single();
        const workoutExercises = exercises.map((ex) => ({
          workout_id: workout.id,
          exercise_id: ex.exercise_id,
        }));
        await supabase.from("workout_exercises").insert(workoutExercises);
        const sets = exercises.flatMap((ex) =>
          ex.sets.map((set) => ({
            workout_exercise_id: workoutExercises.find(
              (we) => we.exercise_id === ex.exercise_id
            ).id,
            reps: set.reps,
            weight_kg: set.weight_kg,
          }))
        );
        await supabase.rpc("update_user_stats", {
          p_user_id: user_id,
          p_volume: sets.reduce((sum, s) => sum + s.reps * s.weight_kg, 0),
        });
        return new Response(JSON.stringify(workout), { status: 201 });
      } catch (error) {
        return errorHandler(error);
      }
    }
    ```
  - `GET /rest/v1/workouts`: Paginated with Range headers (20/page).
- **Exercises**:
  - `GET /rest/v1/available_exercises`: Fetch exercise list.
- **Profile**:
  - `PATCH /rest/v1/users`: Update user data with Zod validation.

## Implementation Rules

- **Security**: Supabase row-level security, rate limiting (100 auth, 20 unauth/minute in `middleware.ts`).
- **Performance**:
  - Index `user_id`, `created_at`, `date` for fast queries.
  - Use transactions for stat updates (e.g., `total_volume`, `daily_volume` via RPC `update_user_stats`).
  - Server-side RPCs (`get_total_volume`, `get_volume_by_day`) for dashboard metrics.
- **Validation**: Use Zod for input validation, Supabase policies for data integrity.
- **Unit Handling**: Store weights in kg, heights in cm; convert to lb/ft-in (2 decimals) on display.
- **Transactions**: Use row-level locking for `users` stat updates.

## Coding Standards

- TypeScript for all API routes and utilities.
- Modular code in `lib/` (schemas, errors, utils).
- Use Supabase’s TypeScript client for type safety.
- Avoid complex logic in routes; delegate to `lib/utils.ts`

## Notes for AI

- Generate API routes in `app/api/v1/`; implement Supabase queries in `lib/supabase/`.
- Ensure rate limiting, authentication, and transaction logic.
- Optimize for one-day timeline, prioritizing core functionality (authentication, logging, dashboard).
- Use Supabase to create the tables; add indexes on `user_id`, `created_at`, `date` for performance.
- Seed `available_exercises` during setup; ensure data integrity with foreign keys.

## Few Key Points

- Enable email verification in Supabase settings. New users get a confirmation email before using the app.
- **Data Cleanup Rules**:

  - If a user deletes a workout, the linked exercises and sets might stay in the database, wasting space.
  - **Why It Matters**: Orphaned data can slow down the app and cause bugs.
  - **How to Fix**: Use database cascading deletes:
    - In Supabase, set up foreign keys with ON DELETE CASCADE. Example:
      sql
      ALTER TABLE Workout_Exercises  
       ADD CONSTRAINT fk_workout  
       FOREIGN KEY (workout_id)  
       REFERENCES workouts(id)  
       ON DELETE CASCADE;  
       This ensures deleting a workout automatically deletes its exercises and sets.

- Pagination & Speed
  - The history page shows 20 workouts per page, but as users add more data, loading might slow down.
  - **Why It Matters**: Slow apps annoy users.
  - **How to Fix**: Add database indexes.
    - In Supabase, create indexes for user_id and created_at in the workouts table. This helps the database find data faster.
      - **Example SQL**:
      - CREATE INDEX idx_workouts_user_id ON workouts (user_id);
      - CREATE INDEX idx_workouts_created_at ON workouts (created_at);
