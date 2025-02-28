import type { Tables } from "./database";

export interface Exercise {
  id: string;
  name: string;
  primary_muscle_group: string;
  secondary_muscle_group: string | null;
}

export interface Set extends Tables<"sets"> {
  id: string;
  workout_exercise_id: string | null;
  reps: number;
  weight_kg: number;
  created_at: string | null;
}

export interface WorkoutExercise extends Tables<"workout_exercises"> {
  id: string;
  workout_id: string | null;
  exercise_id: string | null;
  created_at: string | null;
  exercise: Exercise;
  sets: { reps: number; weight_kg: number }[];
}

export interface UIWorkoutExercise extends WorkoutExercise {
  instance_id: string;
}

export interface Workout extends Tables<"workouts"> {
  id: string;
  user_id: string | null;
  created_at: string | null;
  exercises: WorkoutExercise[];
}

export interface UIExtendedWorkout extends Workout {
  date: string;
  time: string;
  totalVolume: number;
  utcDate: string;
}