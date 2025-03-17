"use client";

import InfiniteScroll from "react-infinite-scroll-component";
import { Calendar } from "@/components/history/calendar";
import { WorkoutList } from "@/components/history/workout-list";
import { WorkoutDetails } from "@/components/history/workout-details";
import { useUserProfile } from "@/contexts/profile-context";
import { motion } from "framer-motion";
import { useDeleteWorkout } from "@/lib/hooks/data-hooks";
import type { UIExtendedWorkout } from "@/types/workouts";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useFilteredWorkouts } from "@/lib/hooks/use-filtered-workouts";
import { HistoryProvider, useHistoryContext } from "@/contexts/history-context";

function HistoryPageInner() {
  const { state: { profile } } = useUserProfile();
  const { selectedDate, pendingDeletions, addPendingDeletion, removePendingDeletion } = useHistoryContext();
  const { displayedWorkouts, isLoading, isError, mutate } = useFilteredWorkouts(
    profile?.id || "",
    selectedDate,
    pendingDeletions
  );
  const { deleteWorkout } = useDeleteWorkout();

  const workoutDates: Set<string> = new Set<string>(
    displayedWorkouts.map((w: UIExtendedWorkout) => w.date)
  );

  const handleDeleteWorkout = async (workoutId: string) => {
    addPendingDeletion(workoutId);
    try {
      await deleteWorkout(workoutId);
      removePendingDeletion(workoutId);
      mutate();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete workout. Please try again.",
        variant: "destructive",
      });
      removePendingDeletion(workoutId);
    }
  };

  if (isError) {
    return (
      <div className="p-4">
        Failed to load workouts.{" "}
        <button onClick={() => mutate()} className="text-blue-500 underline">
          Retry
        </button>
      </div>
    );
  }

  if (isLoading && displayedWorkouts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      <InfiniteScroll
        dataLength={displayedWorkouts.length}
        next={() => {}} // No pagination implemented
        hasMore={false} // Disable infinite scroll for now
        loader={<p className="text-center">Loading...</p>}
        endMessage={
          !selectedDate && (
            <div className="flex items-center justify-center p-4">
              <Badge variant="outline" className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span>You’ve seen all your workouts!</span>
              </Badge>
            </div>
          )
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Calendar workoutDates={workoutDates} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <WorkoutList workouts={displayedWorkouts} onWorkoutDelete={handleDeleteWorkout} />
        </motion.div>
      </InfiniteScroll>
      <WorkoutDetails />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <HistoryProvider>
      <HistoryPageInner />
    </HistoryProvider>
  );
}