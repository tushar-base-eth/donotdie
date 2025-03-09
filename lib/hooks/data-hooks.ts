import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useSWRConfig } from "swr";
import { fetchProfileData } from "../authUtils";
import {
  fetchWorkouts,
  saveWorkout,
  deleteWorkout,
  fetchVolumeData,
} from "../workoutUtils";
import type {
  ExtendedExercise,
  UIExtendedWorkout,
  NewWorkout, // Updated to use NewWorkout instead of InsertWorkout
  Exercise,
} from "@/types/workouts";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase/browser"; // Adjust import based on your setup

export function useProfile(userId: string) {
  const { data, error, mutate } = useSWR(
    userId ? ["profile", userId] : null,
    () => fetchProfileData(userId),
    { dedupingInterval: 60000 }
  );

  return {
    profile: data,
    isLoading: !error && !data,
    error,
    mutate,
  };
}

export function useWorkouts(userId: string, pageSize: number) {
  const getKey = (pageIndex: number, previousPageData: UIExtendedWorkout[]) => {
    if (previousPageData && !previousPageData.length) return null;
    return userId
      ? ["workouts", userId, pageIndex.toString(), pageSize.toString()]
      : null;
  };

  const { data, error, size, setSize, mutate } = useSWRInfinite(
    getKey,
    ([, uid, pageIndexStr, psStr]) =>
      fetchWorkouts(uid, parseInt(pageIndexStr, 10), parseInt(psStr, 10)),
    { revalidateFirstPage: false }
  );

  const workouts = data ? ([] as UIExtendedWorkout[]).concat(...data) : [];

  return {
    workouts,
    isLoading: !error && !data,
    error,
    size,
    setSize,
    mutate,
  };
}

export function useSaveWorkout() {
  const { mutate } = useSWRConfig();

  // Updated to use NewWorkout type, which includes exercises and sets
  const trigger = async (newWorkout: NewWorkout) => {
    const userId = newWorkout.user_id;

    await mutate(
      ["workouts", userId, "0", "10"],
      async (current: UIExtendedWorkout[] = []) => {
        const workoutDate = newWorkout.workout_date || format(new Date(), "yyyy-MM-dd"); // Default to today if not provided
        const tempWorkout: UIExtendedWorkout = {
          id: "temp-id",
          user_id: userId,
          workout_date: workoutDate,
          created_at: new Date().toISOString(),
          exercises: newWorkout.exercises.map((ex, index) => ({
            id: `temp-ex-id-${index}`,
            workout_id: "temp-id",
            exercise_type: ex.exercise_type,
            predefined_exercise_id: ex.predefined_exercise_id || null,
            user_exercise_id: ex.user_exercise_id || null,
            order: ex.order,
            effort_level: ex.effort_level || null,
            created_at: new Date().toISOString(),
            instance_id: `temp-inst-${index}`, // Added instance_id for UIWorkoutExercise
            exercise: {
              id: ex.predefined_exercise_id || ex.user_exercise_id || "temp",
              name: "Loading...",
              primary_muscle_group: "other",
              secondary_muscle_group: null,
              category: "other",
              uses_reps: true,
              uses_weight: true,
              uses_duration: false,
              uses_distance: false,
              is_deleted: false, // Added to satisfy Exercise base type
              source: ex.exercise_type, // Kept for ExtendedExercise
            } as ExtendedExercise, // Updated assertion to ExtendedExercise
            sets: ex.sets.map((set, setIndex) => ({
              id: `temp-set-${setIndex}`,
              workout_exercise_id: `temp-ex-id-${index}`,
              set_number: set.set_number || setIndex + 1, // Ensure set_number is set
              reps: set.reps || null,
              weight_kg: set.weight_kg || null,
              duration_seconds: set.duration_seconds || null,
              distance_meters: set.distance_meters || null,
              created_at: new Date().toISOString(),
            })),
          })),
          date: format(new Date(workoutDate), "yyyy-MM-dd"),
          time: format(new Date(), "hh:mm a"),
          totalVolume: newWorkout.exercises.reduce(
            (sum, ex) =>
              sum +
              ex.sets.reduce(
                (s, set) => s + ((set.reps || 0) * (set.weight_kg || 0)),
                0
              ),
            0
          ),
        };
        return [tempWorkout, ...current];
      },
      { optimisticData: true, rollbackOnError: true }
    );

    await saveWorkout(newWorkout);

    mutate(["workouts", userId, "0", "10"]);
    mutate(["profile", userId]);
  };

  return { trigger };
}

export function useDeleteWorkout(userId: string) {
  const { mutate } = useSWRConfig();

  const trigger = async (workoutId: string) => {
    await mutate(
      (key) => Array.isArray(key) && key[0] === "workouts" && key[1] === userId,
      (current: UIExtendedWorkout[] = []) => current.filter((w) => w.id !== workoutId),
      { optimisticData: true, rollbackOnError: true }
    );

    await deleteWorkout(workoutId);

    mutate((key) => Array.isArray(key) && key[0] === "workouts" && key[1] === userId);
    mutate(["profile", userId]);
  };

  return { trigger };
}

export function useVolumeData(userId: string, timeRange: string) {
  const { data, error, mutate } = useSWR(
    userId ? ["volume", userId, timeRange] : null,
    () => fetchVolumeData(userId, timeRange)
  );

  return {
    volumeData: data,
    isLoading: !error && !data,
    error,
    mutate,
  };
}

export function useAvailableExercises(userId: string) {
  const { data, error, mutate } = useSWR<ExtendedExercise[]>( // Updated return type
    userId ? ["available_exercises", userId] : null,
    async () => {
      const [predefinedRes, userRes] = await Promise.all([
        supabase.from("exercises").select("*").eq("is_deleted", false),
        supabase.from("user_exercises").select("*").eq("user_id", userId),
      ]);

      if (predefinedRes.error) throw predefinedRes.error;
      if (userRes.error) throw userRes.error;

      const predefinedExercises = predefinedRes.data.map((ex) => ({
        ...ex,
        source: "predefined" as const,
      }));
      const userExercises = userRes.data.map((ex) => ({
        ...ex,
        source: "user" as const,
      }));

      return [...predefinedExercises, ...userExercises] as ExtendedExercise[];
    },
    {
      dedupingInterval: 60 * 60 * 1000,
    }
  );

  return {
    exercises: data || [],
    isLoading: !error && !data,
    error,
    mutate,
  };
}