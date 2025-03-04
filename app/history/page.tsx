"use client";

import { useState, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import InfiniteScroll from "react-infinite-scroll-component";
import { Calendar } from "@/components/history/calendar";
import { WorkoutList } from "@/components/history/workout-list";
import { WorkoutDetails } from "@/components/history/workout-details";
import { useAuth } from "@/contexts/auth-context";
import { fetchWorkouts, deleteWorkout } from "@/lib/supabaseUtils";
import ProtectedRoute from "@/components/auth/protected-route";
import { WorkoutListSkeleton } from "@/components/loading/workout-list-skeleton";
import type { UIExtendedWorkout } from "@/types/workouts";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useSWRConfig } from "swr";

function HistoryPage() {
  const { state, refreshProfile } = useAuth();
  const { user } = state;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<UIExtendedWorkout | null>(null);
  const { mutate } = useSWRConfig();

  const getKey = (pageIndex: number, previousPageData: UIExtendedWorkout[] | null) => {
    if (!user) return null;
    if (previousPageData && !previousPageData.length) return null;
    return ["workouts", user.id, pageIndex, 10];
  };

  const { data, error, size, setSize, isLoading } = useSWRInfinite(
    getKey,
    ([_, userId, pageIndex, pageSize]: [string, string, number, number]) =>
      fetchWorkouts(userId, Number(pageIndex), Number(pageSize)),
    { initialSize: 1, revalidateFirstPage: false }
  );

  const workouts = data ? ([] as UIExtendedWorkout[]).concat(...data) : [];

  const displayedWorkouts = useMemo(() => {
    if (!selectedDate) return workouts;
    const selectedUtc = format(selectedDate, "yyyy-MM-dd");
    return workouts.filter((w) => w.utcDate === selectedUtc);
  }, [selectedDate, workouts]);

  const workoutDates = useMemo(() => new Set(workouts.map((w) => w.date)), [workouts]);

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      // Optimistically update the cache for each page
      mutate(
        (key) => Array.isArray(key) && key[0] === "workouts" && key[1] === user?.id,
        (currentPageData: UIExtendedWorkout[] | undefined) => {
          if (!currentPageData) return currentPageData;
          return currentPageData.filter((w) => w.id !== workoutId);
        },
        false // Do not revalidate yet
      );
      await deleteWorkout(workoutId);
      // Revalidate all pages after successful delete
      mutate(
        (key) => Array.isArray(key) && key[0] === "workouts" && key[1] === user?.id,
        undefined,
        { revalidate: true }
      );
      mutate(user ? ["profile", user.id] : null);
      await refreshProfile();
    } catch (err) {
      console.error("Error deleting workout:", err);
      // Revert optimistic update on failure
      mutate(
        (key) => Array.isArray(key) && key[0] === "workouts" && key[1] === user?.id,
        undefined,
        { revalidate: true }
      );
    }
  };

  if (error) {
    return (
      <div className="p-4">
        Failed to load workouts.{" "}
        <button onClick={() => setSize(1)} className="text-blue-500 underline">
          Retry
        </button>
      </div>
    );
  }

  if (isLoading && workouts.length === 0) {
    return (
      <div className="p-4">
        <WorkoutListSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="p-4 space-y-6">
        <InfiniteScroll
          dataLength={workouts.length}
          next={() => setSize(size + 1)}
          hasMore={data?.[data.length - 1]?.length === 10 || false}
          loader={<p className="text-center">Loading...</p>}
          endMessage={<p className="text-center">No more workouts to load.</p>}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Calendar
              currentDate={selectedDate}
              workoutDates={workoutDates}
              onDateChange={setSelectedDate}
            />
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
      </div>
      <WorkoutDetails workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} />
    </div>
  );
}

export default function History() {
  return (
    <ProtectedRoute>
      <HistoryPage />
    </ProtectedRoute>
  );
}