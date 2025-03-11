import type { Database } from "./database";

/**
 * Fetch Types: Full database rows for UI display.
 * These types represent the complete data retrieved from Supabase tables.
 */

/** User profile with aggregate workout stats */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Workout instance tied to a user */
export type Workout = Database["public"]["Tables"]["workouts"]["Row"];

/** Exercise within a workout, linking to predefined or user-defined exercises */
export type WorkoutExercise = Database["public"]["Tables"]["workout_exercises"]["Row"];

/** Individual set within a workout exercise, with flexible metrics */
export type Set = Database["public"]["Tables"]["sets"]["Row"];

/** Predefined exercise available to all users (read-only) */
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

/** Daily workout volume per user */
export type DailyVolume = Database["public"]["Tables"]["daily_volume"]["Row"];

/** Equipment available for exercises (read-only) */
export type Equipment = Database["public"]["Tables"]["equipment"]["Row"];

/** Mapping between predefined exercises and equipment (read-only) */
export type ExerciseEquipment = Database["public"]["Tables"]["exercise_equipment"]["Row"];

/** User-created custom exercise */
export type UserExercise = Database["public"]["Tables"]["user_exercises"]["Row"];

/** Mapping between user-defined exercises and equipment */
export type UserExerciseEquipment = Database["public"]["Tables"]["user_exercise_equipment"]["Row"];

/**
 * Insert Types: Data the UI provides for creating new records.
 * These types define the structure for inserting new rows into Supabase tables.
 */

/** Insert a new workout */
export interface InsertWorkout {
  user_id: string; // UUID from auth.users, required
  workout_date?: string; // ISO date string (e.g., "2023-11-01T14:30:00Z"), defaults to CURRENT_TIMESTAMP if omitted
}

/** Insert a new workout exercise, supporting both predefined and user-defined exercises */
export interface InsertWorkoutExercise {
  workout_id: string; // UUID from workouts, required
  exercise_type: Database["public"]["Enums"]["exercise_source"]; // "predefined" | "user", required
  predefined_exercise_id?: string | null; // UUID from exercises, required if exercise_type is "predefined"
  user_exercise_id?: string | null; // UUID from user_exercises, required if exercise_type is "user"
  order: number; // Integer >= 1, unique per workout, required
  effort_level?: Database["public"]["Enums"]["effort_level_type"] | null; // Optional, defaults to "ok"
}

/** Insert a new set for a workout exercise */
export interface InsertSet {
  workout_exercise_id: string; // UUID from workout_exercises, required
  set_number: number; // Integer >= 1, unique per workout_exercise, required
  reps?: number | null; // 0 to 1000, required if exercise uses_reps
  weight_kg?: number | null; // 0 to 1000, precision 999.9, required if exercise uses_weight
  duration_seconds?: number | null; // 0 to 86400, required if exercise uses_duration
  distance_meters?: number | null; // 0 to 100000, precision 99999.9, required if exercise uses_distance
}

/** Insert a new user-defined exercise */
export interface InsertUserExercise {
  user_id: string; // UUID from auth.users, required
  name: string; // 1-50 chars, alphanumeric + spaces, required
  category: Database["public"]["Enums"]["exercise_category"]; // Required exercise category
  primary_muscle_group: Database["public"]["Enums"]["muscle_group"]; // Required primary muscle group
  secondary_muscle_group?: Database["public"]["Enums"]["muscle_group"] | null; // Optional secondary muscle group
  uses_reps?: boolean; // Defaults to false, at least one metric must be true
  uses_weight?: boolean; // Defaults to false
  uses_duration?: boolean; // Defaults to false
  uses_distance?: boolean; // Defaults to false
}

/** Insert a mapping between a user-defined exercise and equipment */
export interface InsertUserExerciseEquipment {
  user_exercise_id: string; // UUID from user_exercises, required
  equipment_id: string; // UUID from equipment, required
}

/**
 * Update Types: Data the UI can modify.
 * These types define the fields that can be updated in existing Supabase rows.
 */

/** Update user profile details */
export interface UpdateProfile {
  name?: string; // 1-50 chars, alphanumeric + spaces
  gender?: Database["public"]["Enums"]["gender_type"] | null;
  date_of_birth?: string | null; // ISO date string (e.g., "1990-01-01")
  weight_kg?: number | null; // 20 to 500, precision 999.9
  height_cm?: number | null; // 50 to 250, precision 999.9
  body_fat_percentage?: number | null; // 2 to 60, precision 99.9
  unit_preference?: Database["public"]["Enums"]["unit_preference_type"];
  theme_preference?: Database["public"]["Enums"]["theme_preference_type"];
}

/** Update a workout's date */
export interface UpdateWorkout {
  workout_date?: string; // ISO date string (e.g., "2023-11-01T14:30:00Z")
}

/** Update a workout exercise's details */
export interface UpdateWorkoutExercise {
  exercise_type?: Database["public"]["Enums"]["exercise_source"]; // "predefined" | "user"
  predefined_exercise_id?: string | null; // UUID from exercises
  user_exercise_id?: string | null; // UUID from user_exercises
  order?: number; // Integer >= 1, unique per workout
  effort_level?: Database["public"]["Enums"]["effort_level_type"] | null;
}

/** Update a set's metrics */
export interface UpdateSet {
  reps?: number | null; // 0 to 1000
  weight_kg?: number | null; // 0 to 1000, precision 999.9
  duration_seconds?: number | null; // 0 to 86400
  distance_meters?: number | null; // 0 to 100000, precision 99999.9
}

/** Update a user-defined exercise */
export interface UpdateUserExercise {
  name?: string; // 1-50 chars, alphanumeric + spaces
  category?: Database["public"]["Enums"]["exercise_category"];
  primary_muscle_group?: Database["public"]["Enums"]["muscle_group"];
  secondary_muscle_group?: Database["public"]["Enums"]["muscle_group"] | null;
  uses_reps?: boolean;
  uses_weight?: boolean;
  uses_duration?: boolean;
  uses_distance?: boolean;
}

/**
 * UI-Specific Types
 * These types extend database rows with additional fields for UI rendering and logic.
 */

/** Extended workout exercise for UI, including exercise details and sets */
export interface UIWorkoutExercise extends WorkoutExercise {
  instance_id: string; // Unique UI identifier for React keys
  exercise: Exercise | UserExercise; // Details of the linked exercise (predefined or user-defined)
  sets: Set[]; // Sets for this exercise
}

/** Extended workout for UI, including exercises and calculated fields */
export interface UIExtendedWorkout extends Workout {
  exercises: UIWorkoutExercise[]; // Exercises with sets
  date: string; // Local date (e.g., "2023-11-01")
  time: string; // Local time (e.g., "2:30 PM")
  totalVolume: number; // Total volume in kg, calculated by frontend
}

/** Structure for a new set in the UI */
export interface NewSet {
  set_number: number; // Integer >= 1
  reps?: number | null;
  weight_kg?: number | null; // Stored in kg
  duration_seconds?: number | null;
  distance_meters?: number | null;
}

/** Structure for creating a new workout with exercises and sets in the UI */
export interface NewWorkout {
  user_id: string; // UUID from auth.users
  workout_date?: string; // ISO UTC string, defaults to CURRENT_TIMESTAMP if omitted
  exercises: {
    exercise_type: Database["public"]["Enums"]["exercise_source"]; // "predefined" | "user"
    predefined_exercise_id?: string; // Required if exercise_type is "predefined"
    user_exercise_id?: string; // Required if exercise_type is "user"
    order: number; // Integer >= 1, unique per workout
    effort_level?: Database["public"]["Enums"]["effort_level_type"] | null;
    sets: NewSet[]; // Array of sets for this exercise
  }[];
}

/** Daily volume formatted for UI display */
export type UIDailyVolume = {
  date: string; // Local date (e.g., "2023-11-01")
  volume: number; // Volume in kg
};

export { Database };

/**
 * Summary of Supported Features
 * This workout-types.ts file supports the following features as outlined in the Supabase schema enhancements:
 *
 * 1. **Diverse Exercise Types**:
 *    - Weighted (reps, weight_kg): Supported via Exercise, UserExercise, Set, and InsertSet/UpdateSet.
 *    - Cardio (duration_seconds, distance_meters): Supported with metric flags and flexible set fields.
 *    - Flexibility (duration_seconds): Supported with metric flags.
 *    - Bodyweight (reps): Supported with metric flags.
 *    - UI adaptation: UIWorkoutExercise and Exercise/UserExercise metric flags enable dynamic input fields.
 *
 * 2. **Equipment Tracking**:
 *    - Fetch: Equipment and ExerciseEquipment types allow retrieval of equipment and mappings.
 *    - User-defined association: InsertUserExerciseEquipment and UserExerciseEquipment support linking custom exercises to equipment.
 *    - Predefined exercises are read-only, with mappings fetched via ExerciseEquipment.
 *
 * 3. **User-Defined Exercises**:
 *    - Creation: InsertUserExercise supports adding custom exercises with a 10-per-user limit (enforced by backend trigger).
 *    - Fetch/Update: UserExercise and UpdateUserExercise allow retrieval and modification.
 *    - Integration: InsertWorkoutExercise and NewWorkout support adding user exercises to workouts.
 *
 * 4. **Full CRUD Operations**:
 *    - Fetch: All tables have corresponding fetch types (Profile, Workout, etc.).
 *    - Insert: Insert types for workouts, workout exercises, sets, user exercises, and user exercise equipment.
 *    - Update: Update types for profiles, workouts, workout exercises, sets, and user exercises.
 *    - Delete: Not explicitly typed (handled via Supabase client DELETE requests with RLS).
 *
 * 5. **Security Considerations**:
 *    - Predefined exercises and equipment are read-only for authenticated users (no insert/update types).
 *    - RLS enforcement is assumed in the backend schema; types align with user-owned data (e.g., user_id fields).
 *
 * 6. **UI Support**:
 *    - NewWorkout and UIWorkoutExercise enable complex workout creation with nested exercises and sets.
 *    - Metric validation relies on backend trigger (validate_set_metrics), with UI expected to pre-validate based on fetched metric flags.
 *
 * 7. **Performance**:
 *    - Types support denormalized fields (total_volume, daily_volume) for fast UI rendering.
 *
 * Limitations:
 * - No explicit types for exercise_equipment inserts (read-only for users).
 * - Backend enforces limits (e.g., 10 user exercises); UI must handle error feedback.
 */