"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase/browser";
import type { Database } from "@/types/database";
import type { DailyVolume, Exercise, UIExtendedWorkout, UIDailyVolume, NewWorkout, NewSet, Equipment, ExerciseEquipment, UserExerciseEquipment } from "@/types/workouts";
import { fetchAllWorkouts } from "@/lib/workoutUtils";
import { useUserProfile } from "@/contexts/profile-context";

type TableName = keyof Database["public"]["Tables"];
type FetcherKey = TableName | [TableName, any];

const fetcher = async <T>(key: FetcherKey): Promise<T[]> => {
  if (Array.isArray(key)) {
    const [table, options] = key;
    const { data, error } = await supabase.from(table).select(options.select).match(options.match);
    if (error) throw error;
    return data as T[];
  }
  const { data, error } = await supabase.from(key).select("*");
  if (error) throw error;
  return data as T[];
};

export function useVolumeData(userId: string, timeRange: string) {
  const daysToFetch = timeRange === "7days" ? 7 : timeRange === "8weeks" ? 56 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysToFetch);

  const key: FetcherKey | null = userId
    ? (["daily_volume" as TableName, { select: "date, volume", match: { user_id: userId } }] as FetcherKey)
    : null;

  const { data, error, mutate } = useSWR<UIDailyVolume[]>(
    key,
    (k: FetcherKey) => fetcher<UIDailyVolume>(k),
    { revalidateOnFocus: false }
  );

  const volumeData: UIDailyVolume[] = useMemo(() => {
    if (!data) return [];
    return data
      .filter((row) => row.date && new Date(row.date) >= startDate)
      .map((row) => ({ date: row.date, volume: row.volume }));
  }, [data, startDate]);

  return { volumeData, isLoading: !error && !data, isError: !!error, mutate };
}

export function useWorkouts(userId: string) {
  const { data, error, mutate } = useSWR<UIExtendedWorkout[]>(
    userId ? [`workouts-${userId}`, userId] : null,
    () => fetchAllWorkouts(userId)
  );

  return { workouts: data || [], isLoading: !error && !data, isError: !!error, mutate };
}

export function useDeleteWorkout() {
  const { mutate } = useWorkouts("");

  const deleteWorkoutHandler = useCallback(async (workoutId: string) => {
    const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
    if (error) throw error;
    await mutate();
  }, [mutate]);

  return { deleteWorkout: deleteWorkoutHandler };
}

export function useAvailableExercises() {
  const { state: { profile } } = useUserProfile();

  const { data: predefinedData, error: preError } = useSWR(
    "predefined-exercises",
    async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance, is_deleted")
        .eq("is_deleted", false);
      if (error) throw error;
      return data;
    },
    { dedupingInterval: 7200000 }
  );

  const { data: userData, error: userError, mutate: mutateUser } = useSWR(
    profile ? `user-exercises-${profile.id}` : null,
    async () => {
      const { data, error } = await supabase
        .from("user_exercises")
        .select("id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance")
        .eq("user_id", profile!.id);
      if (error) throw error;
      return data;
    },
    { dedupingInterval: 7200000 }
  );

  const { data: equipmentData, error: equipError } = useSWR(
    "equipment",
    async () => {
      const { data, error } = await supabase.from("equipment").select("*");
      if (error) throw error;
      return data;
    },
    { dedupingInterval: 7200000 }
  );

  const { data: exerciseEquipmentData, error: eeError } = useSWR(
    "exercise_equipment",
    async () => {
      const { data, error } = await supabase.from("exercise_equipment").select("*");
      if (error) throw error;
      return data;
    },
    { dedupingInterval: 7200000 }
  );

  const { data: userExerciseEquipmentData, error: ueeError } = useSWR(
    profile ? `user_exercise_equipment-${profile.id}` : null,
    async () => {
      const { data, error } = await supabase.from("user_exercise_equipment").select("*");
      if (error) throw error;
      return data;
    },
    { dedupingInterval: 7200000 }
  );

  const exercises: Exercise[] = useMemo(() => {
    const predefined = (predefinedData || []).map((ex) => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      primary_muscle_group: ex.primary_muscle_group,
      secondary_muscle_group: ex.secondary_muscle_group,
      uses_reps: ex.uses_reps ?? false,
      uses_weight: ex.uses_weight ?? false,
      uses_duration: ex.uses_duration ?? false,
      uses_distance: ex.uses_distance ?? false,
      is_deleted: ex.is_deleted ?? false,
      source: "predefined" as const,
    }));

    const user = (userData || []).map((ex) => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      primary_muscle_group: ex.primary_muscle_group,
      secondary_muscle_group: ex.secondary_muscle_group,
      uses_reps: ex.uses_reps ?? false,
      uses_weight: ex.uses_weight ?? false,
      uses_duration: ex.uses_duration ?? false,
      uses_distance: ex.uses_distance ?? false,
      is_deleted: false,
      source: "user" as const,
    }));

    return [...predefined, ...user];
  }, [predefinedData, userData]);

  const equipment: Equipment[] = equipmentData || [];
  const exerciseEquipment: ExerciseEquipment[] = exerciseEquipmentData || [];
  const userExerciseEquipment: UserExerciseEquipment[] = userExerciseEquipmentData || [];

  const isLoading = !predefinedData || !equipmentData || !exerciseEquipmentData || (profile && (!userData || !userExerciseEquipmentData));
  const isError = preError || userError || equipError || eeError || ueeError;

  return {
    exercises,
    equipment,
    exerciseEquipment,
    userExerciseEquipment,
    isLoading,
    isError,
    mutate: mutateUser
  };
}

export function useSaveWorkout() {
  const { mutate } = useWorkouts("");

  const saveWorkoutHandler = useCallback(async (workout: NewWorkout) => {
    console.log("Frontend sent workout_date:", workout.workout_date);

    const insertData: { user_id: string; workout_date?: string } = { user_id: workout.user_id };
    if (workout.workout_date) insertData.workout_date = workout.workout_date;

    const { data: workoutData, error: workoutError } = await supabase
      .from("workouts")
      .insert(insertData)
      .select("id")
      .single();

    if (workoutError) throw workoutError;
    if (!workoutData) {
      console.error("Error saving workout: No workout data returned from insert.");
      throw new Error("Failed to save workout");
    }
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

      const setsToInsert = ex.sets.map((set: NewSet, setIndex: number) => ({
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
    await mutate();
  }, [mutate]);

  return { saveWorkout: saveWorkoutHandler };
}