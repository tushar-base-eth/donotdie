// types/workouts.ts
export interface Exercise {
  id: string; // UUID from Supabase
  name: string;
  primary_muscle_group: string;
  secondary_muscle_group?: string;
}

export interface Set {
  id: string; // UUID from Supabase
  workout_exercise_id: string; // Links to workout_exercises
  reps: number;
  weight_kg: number; // Standardized to kg per backend design
  created_at: string; // Timestamp from Supabase
}

export interface WorkoutExercise {
  id: string; // UUID from Supabase
  workout_id: string; // Links to workouts
  exercise_id: string; // Links to available_exercises
  exercise: Exercise; // Nested exercise data
  sets: Set[]; // Array of sets
  created_at: string; // Timestamp from Supabase
}

export interface Workout {
  id: string; // UUID from Supabase
  user_id: string; // Links to users
  created_at: string; // Timestamp from Supabase
  exercises: WorkoutExercise[]; // Nested workout exercises
}
