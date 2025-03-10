"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { createBrowserClient } from "@supabase/ssr";
import type { NewWorkout, Exercise, NewSet } from "@/types/workouts";
import { fetchAllWorkouts } from "@/lib/workoutUtils"; // Import fetchAllWorkouts
import type { UIDailyVolume } from "@/types/workouts";
import { useMemo } from "react";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Hook to fetch volume data for a given user over a specified time range.
 * @param userId - The ID of the user.
 * @param timeRange - The time range to fetch ("7days", "8weeks", or "all").
 */
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

  const { data, error, mutate } = useSWR<UIDailyVolume[]>(
    userId ? ["daily_volume", { select: "date, volume", match: { user_id: userId } }] : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const volumeData = useMemo(() => {
    if (!data) return [];
    return data
      .filter((row) => row.date && new Date(row.date) >= startDate)
      .map((row) => ({ date: row.date, volume: row.volume }));
  }, [data, startDate]);

  return {
    volumeData,
    isLoading: !error && !data,
    isError: !!error,
    mutate,
  };
}

/**
 * Hook to fetch all workouts for a given user.
 * @param userId - The ID of the user.
 */
export function useWorkouts(userId: string) {
  const { data, error, mutate } = useSWR(
    userId ? [`workouts-${userId}`, userId] : null,
    () => fetchAllWorkouts(userId) // Use fetchAllWorkouts instead of generic fetcher
  );

  return {
    workouts: data || [],
    isLoading: !error && !data,
    isError: !!error,
    mutate,
  };
}

/**
 * Hook to delete a workout and refresh the workout data.
 */
export function useDeleteWorkout() {
  const mutateWorkouts = useWorkouts("").mutate;

  const deleteWorkoutHandler = useCallback(async (workoutId: string) => {
    const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
    if (error) throw error;
    await mutateWorkouts();
  }, [mutateWorkouts]);

  return { deleteWorkout: deleteWorkoutHandler };
}

/**
 * Hook to fetch available strength training exercises.
 */
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

/**
 * Hook to save a new workout and refresh the workout data.
 */
export function useSaveWorkout() {
  const mutateWorkouts = useWorkouts("").mutate;

  const saveWorkoutHandler = useCallback(async (workout: NewWorkout) => {
    console.log("Frontend sent workout_date:", workout.workout_date);

    const insertData: { user_id: string; workout_date?: string } = {
      user_id: workout.user_id,
    };
    if (workout.workout_date) {
      insertData.workout_date = workout.workout_date;
    }

    const { data: workoutData, error: workoutError } = await supabase
      .from("workouts")
      .insert(insertData)
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

      const setsToInsert = ex.sets.map((set: NewSet, setIndex) => ({
        workout_exercise_id: weId,
        set_number: set.set_number || setIndex + 1,
        reps: set.reps ?? null,
        weight_kg: set.weight_kg ?? null,
        duration_seconds: set.duration_seconds ?? null,
        distance_meters: set.distance_meters ?? null,
      }));

      const { error: setsError } = await supabase.from("sets").insert(setsToInsert);
      if (setsError) throw setsError;
    }
    await mutateWorkouts();
  }, [mutateWorkouts]);

  return { saveWorkout: saveWorkoutHandler };
}