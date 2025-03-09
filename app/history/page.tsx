"use client";

import { useState, useMemo } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { Calendar } from "@/components/history/calendar";
import { WorkoutList } from "@/components/history/workout-list";
import { WorkoutDetails } from "@/components/history/workout-details";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useWorkouts, useDeleteWorkout } from "@/lib/hooks/data-hooks";
import type { UIExtendedWorkout } from "@/types/workouts";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

function HistoryPage() {
  const { state, refreshProfile } = useAuth();
  const { user } = state;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<UIExtendedWorkout | null>(null);
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);

  const { workouts, isLoading, error, size, setSize, mutate } = useWorkouts(user?.id || "", 10);
  const { trigger: deleteWorkout } = useDeleteWorkout(user?.id || "");

  const displayedWorkouts = useMemo(() => {
    const filtered = workouts.filter((w) => !pendingDeletions.includes(w.id));
    if (!selectedDate) return filtered;
    const selectedLocalDate = format(selectedDate, "yyyy-MM-dd");
    return filtered.filter((w) => w.date === selectedLocalDate);
  }, [selectedDate, workouts, pendingDeletions]);

  const workoutDates = useMemo(() => new Set(workouts.map((w) => w.date)), [workouts]);

  const handleDeleteWorkout = async (workoutId: string) => {
    setPendingDeletions((prev) => [...prev, workoutId]);
    try {
      await deleteWorkout(workoutId);
      await refreshProfile();
      setPendingDeletions((prev) => prev.filter((id) => id !== workoutId));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete workout. Please try again.",
        variant: "destructive",
      });
      setPendingDeletions((prev) => prev.filter((id) => id !== workoutId));
      mutate();
    }
  };

  if (error) {
    return (
      <div className="p-4">
        Failed to load workouts.{" "}
        <button onClick={() => mutate()} className="text-blue-500 underline">
          Retry
        </button>
      </div>
    );
  }

  if (isLoading && workouts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      <InfiniteScroll
        dataLength={workouts.length}
        next={() => setSize(size + 1)}
        hasMore={workouts.length % 10 === 0}
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
          <Calendar currentDate={selectedDate} workoutDates={workoutDates} onDateChange={setSelectedDate} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <WorkoutList
            workouts={displayedWorkouts}
            onWorkoutSelect={setSelectedWorkout}
            onWorkoutDelete={handleDeleteWorkout}
            selectedDate={selectedDate}
          />
        </motion.div>
      </InfiniteScroll>
      <WorkoutDetails workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} />
    </div>
  );
}

export default function History() {
  return (
      <HistoryPage />
  );
}