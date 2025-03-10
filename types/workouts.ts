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
  workout_date?: string; // ISO date string (e.g., "2023-11-01T14:30:00Z"), defaults to CURRENT_TIMESTAMP
}

export interface InsertWorkoutExercise {
  workout_id: string; // UUID from workouts
  exercise_type: "predefined"; // Limited to "predefined" for now
  predefined_exercise_id: string; // UUID from exercises
  user_exercise_id?: null; // Explicitly null until user exercises are supported
  order: number; // Integer >= 1, unique per workout
  effort_level?: Database["public"]["Enums"]["effort_level_type"] | null; // Optional, defaults to "ok"
}

export interface InsertSet {
  workout_exercise_id: string; // UUID from workout_exercises
  set_number: number; // Integer >= 1, unique per workout_exercise
  reps?: number | null; // 0 to 1000, required if exercise uses_reps
  weight_kg?: number | null; // 0 to 1000, precision 999.9, required if exercise uses_weight
  duration_seconds?: number | null; // 0 to 86400, required if exercise uses_duration
  distance_meters?: number | null; // 0 to 100000, precision 99999.9, required if exercise uses_distance
}

/**
 * Update Types: Data the UI can modify.
 */
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

export interface UpdateWorkout {
  workout_date?: string; // ISO date string (e.g., "2023-11-01T14:30:00Z")
}

/**
 * UI-Specific Types
 */
export interface UIWorkoutExercise extends WorkoutExercise {
  instance_id: string; // Unique UI identifier for React keys
  exercise: Exercise; // Predefined exercise details
  sets: Set[]; // Sets for this exercise
}

export interface UIExtendedWorkout extends Workout {
  exercises: UIWorkoutExercise[]; // Exercises with sets
  date: string; // Local date (e.g., "2023-11-01")
  time: string; // Local time (e.g., "2:30 PM")
  totalVolume: number; // Total volume in kg, calculated by frontend
}

export interface NewSet {
  set_number: number;
  reps?: number | null;
  weight_kg?: number | null; // Stored in kg
  duration_seconds?: number | null;
  distance_meters?: number | null;
}

export interface NewWorkout {
  user_id: string;
  workout_date?: string; // ISO UTC string, defaults to CURRENT_TIMESTAMP if omitted
  exercises: {
    exercise_type: "predefined";
    predefined_exercise_id: string;
    order: number;
    effort_level?: Database["public"]["Enums"]["effort_level_type"] | null;
    sets: NewSet[];
  }[];
}

export type UIDailyVolume = {
  date: string; // Local date (e.g., "2023-11-01")
  volume: number; // Volume in kg
};

export { Database };