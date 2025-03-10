import type { Database } from "./database";

/**
 * Fetch Types: Full database rows for UI display.
 */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Workout = Database["public"]["Tables"]["workouts"]["Row"];
export type WorkoutExercise = Database["public"]["Tables"]["workout_exercises"]["Row"];
export type Set = Database["public"]["Tables"]["sets"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type DailyVolume = Database["public"]["Tables"]["daily_volume"]["Row"];

/**
 * Insert Types: Data the UI provides for new records.
 */
export interface InsertWorkout {
  user_id: string; // UUID from auth.users
  workout_date: string; // ISO date string (e.g., "2025-03-09")
}

export interface InsertWorkoutExercise {
  workout_id: string; // UUID from workouts
  exercise_type: "predefined"; // Limited to "predefined" for now
  predefined_exercise_id: string; // UUID from exercises
  user_exercise_id?: null; // Not used yet
  order: number; // Integer >= 1, unique per workout
  effort_level?: Database["public"]["Enums"]["effort_level_type"] | null; // Optional, defaults to "ok"
}

export interface InsertSet {
  workout_exercise_id: string; // UUID from workout_exercises
  set_number: number; // Integer >= 1, unique per workout_exercise
  reps?: number | null; // 0 to 1000, required for strength_training
  weight_kg?: number | null; // 0 to 1000, precision 9999.9, required for strength_training
  duration_seconds?: number | null; // Not used yet
  distance_meters?: number | null; // Not used yet
}

/**
 * Update Types: Data the UI can modify.
 */
export interface UpdateProfile {
  name?: string; // 1-50 chars, alphanumeric + spaces
  gender?: Database["public"]["Enums"]["gender_type"] | null;
  date_of_birth?: string | null; // ISO date string
  weight_kg?: number | null; // 20 to 500, precision 999.9
  height_cm?: number | null; // 50 to 250, precision 999.9
  body_fat_percentage?: number | null; // 2 to 60, precision 99.9
  unit_preference?: Database["public"]["Enums"]["unit_preference_type"];
  theme_preference?: Database["public"]["Enums"]["theme_preference_type"];
}

export interface UpdateWorkout {
  workout_date?: string; // ISO date string
}

/**
 * UI-Specific Types
 */
export interface UIWorkoutExercise extends WorkoutExercise {
  instance_id: string; // Unique UI identifier
  exercise: Exercise; // Predefined exercise details
  sets: Set[]; // Sets for this exercise
}

export interface UIExtendedWorkout extends Workout {
  exercises: UIWorkoutExercise[];
  date: string; // UI-friendly date
  time: string; // UI-friendly time
  totalVolume: number; // Calculated total volume
}

// Add this new interface
export interface NewSet {
  set_number: number;
  reps?: number | null;
  weight_kg?: number | null;
  duration_seconds?: number | null;
  distance_meters?: number | null;
}

// Update NewWorkout to use NewSet
export interface NewWorkout {
  user_id: string;
  workout_date?: string;
  exercises: {
    exercise_type: "predefined";
    predefined_exercise_id: string;
    order: number;
    effort_level?: Database["public"]["Enums"]["effort_level_type"] | null;
    sets: NewSet[]; // Changed from InsertSet[]
  }[];
}

// Export Database type
export { Database };