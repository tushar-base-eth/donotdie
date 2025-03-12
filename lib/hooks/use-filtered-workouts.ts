import { useMemo } from "react";
import { useWorkouts } from "@/lib/hooks/data-hooks";
import type { UIExtendedWorkout } from "@/types/workouts";
import { format } from "date-fns";

export function useFilteredWorkouts(userId: string, selectedDate: Date | null, pendingDeletions: string[]) {
  const { workouts, isLoading, isError, mutate } = useWorkouts(userId);

  const displayedWorkouts: UIExtendedWorkout[] = useMemo(() => {
    const filtered = workouts.filter((w: UIExtendedWorkout) => !pendingDeletions.includes(w.id));
    if (!selectedDate) return filtered;
    const selectedLocalDate = format(selectedDate, "yyyy-MM-dd");
    return filtered.filter((w: UIExtendedWorkout) => w.date === selectedLocalDate);
  }, [selectedDate, workouts, pendingDeletions]);

  return {
    displayedWorkouts,
    isLoading,
    isError,
    mutate,
  };
}