import type { Database } from "./database";

/**
 * This file defines TypeScript types for interacting with database tables managed by Supabase.
 * It includes types for fetching, inserting, and updating data, ensuring that the client only
 * provides data it is responsible for, while Supabase handles auto-generated and read-only fields.
 *
 * ### Type Categories:
 * - **Fetch Types**: Include all fields from the database for displaying data in the UI.
 * - **Insert Types**: Omit auto-generated fields (e.g., `id`, `created_at`) and read-only fields
 *   (e.g., `total_volume`), as these are managed by Supabase.
 * - **Update Types**: Exclude auto-generated and read-only fields to prevent the client from
 *   modifying them.
 *
 * ### Notes:
 * - For readonly tables (e.g., `equipment`, `exercise_equipment`, `exercises`), only fetch types
 *   are provided since the UI cannot insert or update these tables.
 * - Auto-generated fields are typically set by Supabase (e.g., via triggers or defaults).
 * - Read-only fields are computed or managed by the database and should not be altered by the client.
 */

/**
 * ## Fetch Types
 * These types represent the full structure of database rows as retrieved from Supabase.
 * They are used for displaying data in the UI and include all fields, including auto-generated
 * and read-only ones.
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

/**
 * ## Insert Types
 * These types define the data the client must provide when creating new records in Supabase.
 * Auto-generated fields (e.g., `id`, `created_at`, `updated_at`) and read-only fields
 * (e.g., `total_volume`, `total_workouts`) are omitted since they are managed by Supabase.
 */
export type InsertProfile = Omit<
  Database["public"]["Tables"]["profiles"]["Insert"],
  "id" | "created_at" | "updated_at" | "total_volume" | "total_workouts"
>;
export type InsertWorkout = Omit<
  Database["public"]["Tables"]["workouts"]["Insert"],
  "id" | "created_at"
>;
export type InsertUserExercise = Omit<
  Database["public"]["Tables"]["user_exercises"]["Insert"],
  "id" | "created_at"
>;
export type InsertUserExerciseEquipment = Database["public"]["Tables"]["user_exercise_equipment"]["Insert"];
export type InsertWorkoutExercise = Omit<
  Database["public"]["Tables"]["workout_exercises"]["Insert"],
  "id" | "created_at"
>;
export type InsertSet = Omit<
  Database["public"]["Tables"]["sets"]["Insert"],
  "id" | "created_at"
>;

/**
 * ## Update Types
 * These types define the data the client can modify when updating existing records in Supabase.
 * Auto-generated fields (e.g., `id`, `created_at`, `updated_at`) and read-only fields
 * (e.g., `total_volume`, `total_workouts`) are excluded to ensure the client cannot alter them.
 */
export type UpdateProfile = Omit<
  Database["public"]["Tables"]["profiles"]["Update"],
  "id" | "created_at" | "updated_at" | "total_volume" | "total_workouts"
>;
export type UpdateWorkout = Omit<
  Database["public"]["Tables"]["workouts"]["Update"],
  "id" | "created_at"
>;
export type UpdateUserExercise = Omit<
  Database["public"]["Tables"]["user_exercises"]["Update"],
  "id" | "created_at"
>;
export type UpdateUserExerciseEquipment = Database["public"]["Tables"]["user_exercise_equipment"]["Update"];
export type UpdateWorkoutExercise = Omit<
  Database["public"]["Tables"]["workout_exercises"]["Update"],
  "id" | "created_at"
>;
export type UpdateSet = Omit<
  Database["public"]["Tables"]["sets"]["Update"],
  "id" | "created_at"
>;