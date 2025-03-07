import type { Tables } from "./database";

// Interface for an exercise from available_exercises table
export interface Exercise {
  id: string;
  name: string;
  primary_muscle_group: string;
  secondary_muscle_group: string | null;
}

// Interface for a set, extending the database table definition
export interface Set extends Tables<"sets"> {
  id: string;
  workout_exercise_id: string; // References workout_exercises.id
  set_number: number;
  reps: number;
  weight_kg: number;
  created_at: string; // Changed to string to match Tables<"sets">
}

// Interface for a workout exercise, including related exercise and sets
export interface WorkoutExercise extends Tables<"workout_exercises"> {
  id: string;
  workout_id: string; // References workouts.id
  exercise_id: string; // References available_exercises.id
  order: number; // Added to match schema
  created_at: string; // Changed to string to match Tables<"workout_exercises">
  exercise: Exercise;
  sets: { reps: number; weight_kg: number }[]; // Simplified set data for UI
}

// Extended interface for UI-specific workout exercise data
export interface UIWorkoutExercise extends WorkoutExercise {
  instance_id: string; // Unique identifier for UI instances
}

// Interface for a workout, extending the database table definition
export interface Workout extends Tables<"workouts"> {
  id: string;
  user_id: string; // References profiles.id
  created_at: string; // Changed to string to match Tables<"workouts">
  exercises: WorkoutExercise[];
}

// Extended interface for UI-specific workout data with local date/time
export interface UIExtendedWorkout extends Workout {
  date: string; // Local date string (e.g., "2023-10-15") in user's time zone
  time: string; // Local time string (e.g., "12:00 PM") in user's time zone
  totalVolume: number; // Calculated total volume in kg
}

// Interface for creating a new workout
export interface NewWorkout {
  user_id: string;
  exercises: {
    exercise_id: string;
    sets: { reps: number; weight_kg: number }[];
  }[];
}