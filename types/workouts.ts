// types/workouts.ts
import type { Tables } from "./database";

export interface Exercise extends Tables<"available_exercises">["Row"] {
  // Already matches: id, name, primary_muscle_group, secondary_muscle_group
}

export interface Set extends Tables<"sets">["Row"] {
  // Matches: id, workout_exercise_id, reps, weight_kg, created_at
}

export interface WorkoutExercise extends Tables<"workout_exercises">["Row"] {
  exercise: Exercise; // Nested available_exercises data
  sets: Set[]; // Nested sets data
}

export interface Workout extends Tables<"workouts">["Row"] {
  exercises: WorkoutExercise[]; // Nested workout_exercises data
}

// UI-extended type for HistoryPage and WorkoutDetails
export interface UIExtendedWorkout extends Workout {
  date: string;
  time: string;
  totalVolume: number;
}