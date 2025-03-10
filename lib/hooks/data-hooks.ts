"use client";

import { useCallback } from "react";
import useSWR, { KeyedMutator } from "swr";
import { createBrowserClient } from "@supabase/ssr";
import type { NewWorkout, Exercise } from "@/types/workouts";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const fetcher = async (key: string | [string, any]) => {
  if (Array.isArray(key)) {
    const [table, options] = key;
    const { data, error } = await supabase.from(table).select(options.select).match(options.match);
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from(key).select("*");
  if (error) throw error;
  return data;
};

export function useVolumeData(userId: string, timeRange: string) {
  const daysToFetch = timeRange === "7days" ? 7 : timeRange === "8weeks" ? 56 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysToFetch);

  const { data, error, mutate } = useSWR(
    userId ? ["daily_volume", { select: "date, volume", match: { user_id: userId } }] : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onSuccess: (data) =>
        data
          .filter((row: any) => new Date(row.date) >= startDate)
          .map((row: any) => ({ date: row.date, volume: row.volume })),
    }
  );

  return {
    volumeData: data || [],
    isLoading: !error && !data,
    isError: !!error,
    mutate,
  };
}

export function useWorkouts(userId: string) {
  const { data, error, mutate } = useSWR(
    userId ? ["workouts", { select: "*", match: { user_id: userId } }] : null,
    fetcher
  );

  return {
    workouts: data || [],
    isLoading: !error && !data,
    isError: !!error,
    mutate,
  };
}

export function useDeleteWorkout() {
  const mutateWorkouts = useWorkouts("").mutate;

  const deleteWorkoutHandler = useCallback(async (workoutId: string) => {
    const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
    if (error) throw error;
    await mutateWorkouts();
  }, [mutateWorkouts]);

  return { deleteWorkout: deleteWorkoutHandler };
}

export function useAvailableExercises() {
  const { data, error, mutate } = useSWR(
    "exercises_strength_training",
    async () => {
      const { data, error } = await supabase.from("exercises").select("*").eq("category", "strength_training");
      if (error) throw error;
      return data as Exercise[];
    }
  );

  return {
    exercises: data || [],
    isLoading: !error && !data,
    isError: !!error,
    mutate,
  };
}

export function useSaveWorkout() {
  const mutateWorkouts = useWorkouts("").mutate;

  const saveWorkoutHandler = useCallback(async (workout: NewWorkout) => {
    const workoutDate = workout.workout_date || new Date().toISOString().split("T")[0];
    const { data: workoutData, error: workoutError } = await supabase
      .from("workouts")
      .insert({ user_id: workout.user_id, workout_date: workoutDate })
      .select("id")
      .single();

    if (workoutError) throw workoutError;

    const workoutId = workoutData.id;

    for (const ex of workout.exercises) {
      const { data: weData, error: weError } = await supabase
        .from("workout_exercises")
        .insert({
          workout_id: workoutId,
          exercise_type: "predefined",
          predefined_exercise_id: ex.predefined_exercise_id,
          user_exercise_id: null,
          order: ex.order,
          effort_level: ex.effort_level || null,
        })
        .select("id")
        .single();

      if (weError) throw weError;

      const weId = weData.id;

      const setsToInsert = ex.sets.map((set, setIndex) => ({
        workout_exercise_id: weId,
        set_number: set.set_number || setIndex + 1,
        reps: set.reps,
        weight_kg: set.weight_kg,
        duration_seconds: null,
        distance_meters: null,
      }));

      const { error: setsError } = await supabase.from("sets").insert(setsToInsert);
      if (setsError) throw setsError;
    }
    await mutateWorkouts();
  }, [mutateWorkouts]);

  return { saveWorkout: saveWorkoutHandler };
}