import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useSWRConfig } from "swr";
import {
  fetchProfileData,
  fetchWorkouts,
  saveWorkout,
  deleteWorkout,
  fetchVolumeData,
  fetchAvailableExercises,
} from "../supabaseUtils";
import type { UIExtendedWorkout, NewWorkout, Exercise } from "@/types/workouts";
import { format } from "date-fns";

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
    return userId ? ["workouts", userId, pageIndex.toString(), pageSize.toString()] : null;
  };

  const { data, error, size, setSize, mutate } = useSWRInfinite(
    getKey,
    ([, uid, pageIndexStr, psStr]) => fetchWorkouts(uid, parseInt(pageIndexStr, 10), parseInt(psStr, 10)),
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

  const trigger = async (workout: NewWorkout) => {
    const userId = workout.user_id;

    await mutate(
      ["workouts", userId, "0", "10"],
      async (current: UIExtendedWorkout[] = []) => {
        const tempWorkout: UIExtendedWorkout = {
          id: "temp-id",
          user_id: userId,
          created_at: new Date().toISOString(),
          exercises: workout.exercises.map((ex) => ({
            id: "temp-ex-id",
            workout_id: "temp-id",
            exercise_id: ex.exercise_id,
            exercise: { id: ex.exercise_id, name: "Loading...", primary_muscle_group: "", secondary_muscle_group: null },
            sets: ex.sets,
            created_at: new Date().toISOString(),
          })),
          date: format(new Date(), "yyyy-MM-dd"),
          time: format(new Date(), "hh:mm a"),
          totalVolume: workout.exercises.reduce(
            (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * set.weight_kg, 0),
            0
          ),
        };
        return [tempWorkout, ...current];
      },
      { optimisticData: true, rollbackOnError: true }
    );

    await saveWorkout(workout);

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

export function useAvailableExercises() {
  const { data, error, mutate } = useSWR<Exercise[]>(
    "available_exercises",
    fetchAvailableExercises,
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