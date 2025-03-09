import type { Database } from "./database";

/**
 * This file defines TypeScript types for interacting with database tables managed by Supabase.
 * It includes types for fetching, inserting, and updating data, ensuring that the client only
 * provides data it is responsible for, while Supabase handles auto-generated and read-only fields.
 *
 * ### Type Categories:
 * - **Fetch Types**: Include all fields from the database for displaying data in the UI.
 * - **Insert Types**: Define fields the UI must provide for new records, omitting auto-generated
 *   (e.g., `id`, `created_at`) and read-only fields (e.g., `total_volume`).
 * - **Update Types**: Define fields the UI can modify, excluding auto-generated and read-only fields.
 *
 * ### Notes:
 * - Read-only tables (e.g., `equipment`, `exercise_equipment`, `exercises`) only have fetch types.
 * - `daily_volume` is managed by triggers; UI only fetches it, so only a fetch type is included.
 * - Auto-generated fields are set by Supabase (e.g., via triggers or defaults).
 * - Read-only fields are computed or managed by the database and cannot be altered by the client.
 */

/**
 * ## Fetch Types
 * Full structure of database rows for UI display, including all fields.
 */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Workout = Database["public"]["Tables"]["workouts"]["Row"];
export type UserExercise = Database["public"]["Tables"]["user_exercises"]["Row"];
export type UserExerciseEquipment = Database["public"]["Tables"]["user_exercise_equipment"]["Row"];
export type WorkoutExercise = Database["public"]["Tables"]["workout_exercises"]["Row"];
export type Set = Database["public"]["Tables"]["sets"]["Row"];
export type Equipment = Database["public"]["Tables"]["equipment"]["Row"];
export type ExerciseEquipment = Database["public"]["Tables"]["exercise_equipment"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type DailyVolume = Database["public"]["Tables"]["daily_volume"]["Row"];

/**
 * ## Insert Types
 * Define data the UI must provide for creating new records. Auto-generated fields (e.g., `id`, `created_at`)
 * and read-only fields (e.g., `total_volume`) are omitted.
 */
export interface InsertProfile {
  // Note: UI doesn’t directly insert profiles (handled by handle_new_user trigger), but type is kept for potential use.
  body_fat_percentage?: number | null; // Optional: 2 to 60, precision 99.9 (e.g., 12.5)
  date_of_birth?: string | null; // Optional: ISO date string, past dates up to 120 years ago (e.g., "1990-01-01")
  gender?: Database["public"]["Enums"]["gender_type"] | null; // Optional: "male" | "female" | "other"
  height_cm?: number | null; // Optional: 50 to 250, precision 999.9 (e.g., 175.5)
  name: string; // Required: 1-50 chars, alphanumeric + spaces (e.g., "John Doe")
  theme_preference?: Database["public"]["Enums"]["theme_preference_type"]; // Optional: "light" | "dark", defaults to "light"
  unit_preference?: Database["public"]["Enums"]["unit_preference_type"]; // Optional: "metric" | "imperial", defaults to "metric"
  weight_kg?: number | null; // Optional: 20 to 500, precision 999.9 (e.g., 70.5)
}

export interface InsertWorkout {
  user_id: string; // Required: Valid UUID from auth.users (e.g., "550e8400-e29b-41d4-a716-446655440000")
  workout_date: string; // Required: ISO date string (e.g., "2025-03-09")
}

export interface InsertUserExercise {
  user_id: string; // Required: Valid UUID from auth.users (e.g., "550e8400-e29b-41d4-a716-446655440000")
  name: string; // Required: 1-50 chars, printable characters (e.g., "Custom Push-Up")
  category: Database["public"]["Enums"]["exercise_category"]; // Required: "strength_training" | "cardio" | "flexibility" | "other"
  primary_muscle_group: Database["public"]["Enums"]["muscle_group"]; // Required: "chest" | "back" | "legs" | "arms" | "core" | "full_body" | "other"
  secondary_muscle_group?: Database["public"]["Enums"]["muscle_group"] | null; // Optional: Same as primary_muscle_group (e.g., "arms")
  uses_reps?: boolean; // Optional: true | false, defaults to false
  uses_weight?: boolean; // Optional: true | false, defaults to false
  uses_duration?: boolean; // Optional: true | false, defaults to false
  uses_distance?: boolean; // Optional: true | false, defaults to false
  // Note: At least one of uses_reps, uses_weight, uses_duration, uses_distance must be true (schema constraint)
}

export interface InsertUserExerciseEquipment {
  user_exercise_id: string; // Required: Valid UUID from user_exercises (e.g., "550e8400-e29b-41d4-a716-446655440000")
  equipment_id: string; // Required: Valid UUID from equipment (e.g., "550e8400-e29b-41d4-a716-446655440001")
}

export interface InsertWorkoutExercise {
  workout_id: string; // Required: Valid UUID from workouts (e.g., "550e8400-e29b-41d4-a716-446655440000")
  exercise_type: Database["public"]["Enums"]["exercise_source"]; // Required: "predefined" | "user"
  predefined_exercise_id?: string | null; // Conditional: Valid UUID from exercises if exercise_type is "predefined" (e.g., "550e8400-e29b-41d4-a716-446655440002")
  user_exercise_id?: string | null; // Conditional: Valid UUID from user_exercises if exercise_type is "user" (e.g., "550e8400-e29b-41d4-a716-446655440003")
  order: number; // Required: Integer >= 1, unique per workout (e.g., 1, 2, 3)
  effort_level?: Database["public"]["Enums"]["effort_level_type"] | null; // Optional: "super_easy" | "easy" | "ok" | "hard" | "super_hard" | null, defaults to "ok"
  // Note: Exactly one of predefined_exercise_id or user_exercise_id must be non-null based on exercise_type
}

export interface InsertSet {
  workout_exercise_id: string; // Required: Valid UUID from workout_exercises (e.g., "550e8400-e29b-41d4-a716-446655440000")
  set_number: number; // Required: Integer >= 1, unique per workout_exercise (e.g., 1, 2, 3)
  reps?: number | null; // Optional: 0 to 1000, must match exercise’s uses_reps (e.g., 10)
  weight_kg?: number | null; // Optional: 0 to 1000, precision 9999.9, must match exercise’s uses_weight (e.g., 50.5)
  duration_seconds?: number | null; // Optional: 0 to 86400 (24 hours), must match exercise’s uses_duration (e.g., 300)
  distance_meters?: number | null; // Optional: 0 to 100000, precision 999999.9, must match exercise’s uses_distance (e.g., 5000.5)
  // Note: Metrics must align with exercise requirements (enforced by validate_set_metrics trigger)
}

/**
 * ## Update Types
 * Define data the UI can modify. Auto-generated and read-only fields are excluded.
 */
export interface UpdateProfile {
  body_fat_percentage?: number | null; // Optional: 2 to 60, precision 99.9 (e.g., 12.5)
  date_of_birth?: string | null; // Optional: ISO date string, past dates up to 120 years ago (e.g., "1990-01-01")
  gender?: Database["public"]["Enums"]["gender_type"] | null; // Optional: "male" | "female" | "other"
  height_cm?: number | null; // Optional: 50 to 250, precision 999.9 (e.g., 175.5)
  name?: string; // Optional: 1-50 chars, alphanumeric + spaces (e.g., "Jane Doe")
  theme_preference?: Database["public"]["Enums"]["theme_preference_type"]; // Optional: "light" | "dark"
  unit_preference?: Database["public"]["Enums"]["unit_preference_type"]; // Optional: "metric" | "imperial"
  weight_kg?: number | null; // Optional: 20 to 500, precision 999.9 (e.g., 70.5)
}

export interface UpdateWorkout {
  user_id?: string; // Optional: Valid UUID from auth.users (e.g., "550e8400-e29b-41d4-a716-446655440000"), rarely updated
  workout_date?: string; // Optional: ISO date string (e.g., "2025-03-10")
}

export interface UpdateUserExercise {
  user_id?: string; // Optional: Valid UUID from auth.users (e.g., "550e8400-e29b-41d4-a716-446655440000"), rarely updated
  name?: string; // Optional: 1-50 chars, printable characters (e.g., "Modified Push-Up")
  category?: Database["public"]["Enums"]["exercise_category"]; // Optional: "strength_training" | "cardio" | "flexibility" | "other"
  primary_muscle_group?: Database["public"]["Enums"]["muscle_group"]; // Optional: "chest" | "back" | "legs" | "arms" | "core" | "full_body" | "other"
  secondary_muscle_group?: Database["public"]["Enums"]["muscle_group"] | null; // Optional: Same as primary_muscle_group (e.g., "arms")
  uses_reps?: boolean; // Optional: true | false
  uses_weight?: boolean; // Optional: true | false
  uses_duration?: boolean; // Optional: true | false
  uses_distance?: boolean; // Optional: true | false
  // Note: At least one of uses_reps, uses_weight, uses_duration, uses_distance must remain true
}

export interface UpdateUserExerciseEquipment {
  user_exercise_id?: string; // Optional: Valid UUID from user_exercises (e.g., "550e8400-e29b-41d4-a716-446655440000")
  equipment_id?: string; // Optional: Valid UUID from equipment (e.g., "550e8400-e29b-41d4-a716-446655440001")
}

export interface UpdateWorkoutExercise {
  workout_id?: string; // Optional: Valid UUID from workouts (e.g., "550e8400-e29b-41d4-a716-446655440000"), rarely updated
  exercise_type?: Database["public"]["Enums"]["exercise_source"]; // Optional: "predefined" | "user"
  predefined_exercise_id?: string | null; // Conditional: Valid UUID from exercises if exercise_type is "predefined" (e.g., "550e8400-e29b-41d4-a716-446655440002")
  user_exercise_id?: string | null; // Conditional: Valid UUID from user_exercises if exercise_type is "user" (e.g., "550e8400-e29b-41d4-a716-446655440003")
  order?: number; // Optional: Integer >= 1, unique per workout (e.g., 1, 2, 3)
  effort_level?: Database["public"]["Enums"]["effort_level_type"] | null; // Optional: "super_easy" | "easy" | "ok" | "hard" | "super_hard" | null
  // Note: Exercise reference must remain valid per exercise_type
}

export interface UpdateSet {
  workout_exercise_id?: string; // Optional: Valid UUID from workout_exercises (e.g., "550e8400-e29b-41d4-a716-446655440000"), rarely updated
  set_number?: number; // Optional: Integer >= 1, unique per workout_exercise (e.g., 1, 2, 3)
  reps?: number | null; // Optional: 0 to 1000, must match exercise’s uses_reps (e.g., 12)
  weight_kg?: number | null; // Optional: 0 to 1000, precision 9999.9, must match exercise’s uses_weight (e.g., 60.0)
  duration_seconds?: number | null; // Optional: 0 to 86400, must match exercise’s uses_duration (e.g., 360)
  distance_meters?: number | null; // Optional: 0 to 100000, precision 999999.9, must match exercise’s uses_distance (e.g., 10000.0)
  // Note: Metrics must align with exercise requirements
}

/**
 * ## UI-Specific Types
 * Extended types for UI convenience, combining related data.
 */
export interface UIWorkoutExercise extends WorkoutExercise {
  instance_id: string; // Unique identifier for UI instance
  exercise: ExtendedExercise; // Updated from Exercise to ExtendedExercise
  sets: Set[]; // List of sets for this workout exercise
}

export interface UIExtendedWorkout extends Workout {
  exercises: UIWorkoutExercise[]; // List of exercises in the workout
  date: string; // UI-friendly date string
  time: string; // UI-friendly time string
  totalVolume: number; // Calculated total volume for display
}

export interface NewWorkout {
  user_id: string; // Required: Valid UUID from auth.users
  workout_date?: string; // Optional: ISO date string, defaults to current date if not provided
  exercises: {
    exercise_type: "predefined" | "user"; // Required: Source of the exercise
    predefined_exercise_id?: string | null; // Conditional: UUID if predefined
    user_exercise_id?: string | null; // Conditional: UUID if user-defined
    order: number; // Required: Integer >= 1, unique per workout
    effort_level?: Database["public"]["Enums"]["effort_level_type"] | null; // Optional: Effort level
    sets: InsertSet[]; // List of sets for this exercise
  }[];
}

export interface ExtendedExercise extends Exercise {
  source: "predefined" | "user"; // Indicates the exercise source for UI display
}