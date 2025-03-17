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
import { CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useFilteredWorkouts } from "@/lib/hooks/use-filtered-workouts";
import { HistoryProvider, useHistoryContext } from "@/contexts/history-context";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="p-8">
        <Card className="glass shadow-lg rounded-xl">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div className="space-y-2">
              <p className="text-foreground font-medium">Failed to load your workout history</p>
              <button
                onClick={() => mutate()}
                className="text-primary hover:bg-primary/10 rounded-lg px-4 py-2 transition-all duration-300"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && displayedWorkouts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-8 space-y-8">
      <InfiniteScroll
        dataLength={displayedWorkouts.length}
        next={() => { }} // No pagination implemented
        hasMore={false} // Disable infinite scroll for now
        loader={<p className="text-center text-muted-foreground py-4">Loading...</p>}
        endMessage={
          !selectedDate && (
            <div className="flex items-center justify-center p-4">
              <Badge variant="outline" className="flex items-center gap-2 rounded-lg px-3 py-2 border-border/50">
                <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground">You’ve seen all your workouts!</span>
              </Badge>
            </div>
          )
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Calendar workoutDates={workoutDates} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
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