import { supabase } from "./supabaseClient";
import type { UIExtendedWorkout, NewWorkout, WorkoutExercise, Set } from "@/types/workouts";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export async function fetchWorkouts(userId: string): Promise<UIExtendedWorkout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select(`
      id, user_id, created_at,
      workout_exercises!fk_workout (
        id, exercise_id, created_at,
        exercise:available_exercises(*),
        sets!fk_workout_exercise (*)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const formattedWorkouts: UIExtendedWorkout[] = data
    .filter((rawWorkout) => rawWorkout.created_at !== null)
    .map((rawWorkout) => {
      const utcDate = parseISO(rawWorkout.created_at as string);
      const localDate = formatInTimeZone(utcDate, "UTC", "yyyy-MM-dd");
      const localTime = formatInTimeZone(utcDate, "UTC", "hh:mm a");

      const exercises = Array.isArray(rawWorkout.workout_exercises)
        ? rawWorkout.workout_exercises.map((we) => ({
            id: we.id,
            workout_id: rawWorkout.id,
            exercise_id: we.exercise_id ?? "",
            exercise: {
              id: we.exercise?.id ?? "",
              name: we.exercise?.name ?? "",
              primary_muscle_group: we.exercise?.primary_muscle_group ?? "",
              secondary_muscle_group: we.exercise?.secondary_muscle_group ?? null,
            },
            sets: Array.isArray(we.sets) ? we.sets.map((set: Set) => ({ reps: set.reps, weight_kg: set.weight_kg })) : [],
            created_at: we.created_at ?? "",
          }))
        : [];

      return {
        id: rawWorkout.id,
        user_id: rawWorkout.user_id ?? "",
        created_at: rawWorkout.created_at,
        exercises,
        utcDate: localDate,
        date: localDate,
        time: localTime,
        totalVolume: exercises.reduce(
          (sum: number, ex: WorkoutExercise) => sum + ex.sets.reduce(
            (setSum: number, set: { reps: number; weight_kg: number }) => setSum + set.reps * set.weight_kg,
            0
          ),
          0
        ),
      };
    });

  return formattedWorkouts;
}

export async function saveWorkout(workout: NewWorkout): Promise<void> {
  try {
    // Insert workout
    const { data: workoutData, error: workoutError } = await supabase
      .from("workouts")
      .insert({ user_id: workout.user_id })
      .select("id")
      .single();

    if (workoutError) throw workoutError;

    const workoutId = workoutData.id;

    // Insert workout_exercises and sets
    for (const ex of workout.exercises) {
      const { data: weData, error: weError } = await supabase
        .from("workout_exercises")
        .insert({ workout_id: workoutId, exercise_id: ex.exercise_id })
        .select("id")
        .single();

      if (weError) throw weError;

      const weId = weData.id;

      const setsToInsert = ex.sets.map((set: { reps: number; weight_kg: number }) => ({
        workout_exercise_id: weId,
        reps: set.reps,
        weight_kg: set.weight_kg,
      }));

      const { error: setsError } = await supabase.from("sets").insert(setsToInsert);

      if (setsError) throw setsError;
    }

    // Calculate total volume
    const totalVolume = workout.exercises.reduce(
      (sum: number, ex: { exercise_id: string; sets: { reps: number; weight_kg: number }[] }) => 
        sum + ex.sets.reduce(
          (setSum: number, set: { reps: number; weight_kg: number }) => setSum + set.reps * set.weight_kg,
          0
        ),
      0
    );

    // Update user stats
    const { error: statsError } = await supabase.rpc("update_user_stats", {
      p_user_id: workout.user_id,
      p_volume: totalVolume,
    });

    if (statsError) throw statsError;
  } catch (error) {
    console.error("Error saving workout:", error);
    throw error;
  }
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId);

  if (error) throw error;
}