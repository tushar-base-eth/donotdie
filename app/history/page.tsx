"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/history/calendar";
import { WorkoutList } from "@/components/history/workout-list";
import { WorkoutDetails } from "@/components/history/workout-details";
import { useAuth } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/auth/protected-route";
import { ExerciseSkeleton } from "@/components/loading/exercise-skeleton";
import type { UIExtendedWorkout } from "@/types/workouts";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { fetchWorkouts, deleteWorkout } from "@/lib/supabaseUtils";

function HistoryPage() {
  const { state } = useAuth();
  const { user } = state;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<UIExtendedWorkout | null>(null);
  const [workouts, setWorkouts] = useState<UIExtendedWorkout[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchWorkoutsData();
  }, [user]);

  const fetchWorkoutsData = async () => {
    if (!user) return;
    setIsRefreshing(true);
    setError(null);
    try {
      const formattedWorkouts = await fetchWorkouts(user.id);
      setWorkouts(formattedWorkouts);
    } catch (err) {
      console.error("Error fetching workouts:", err);
      setError("Failed to load workouts. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const displayedWorkouts = useMemo(() => {
    if (!selectedDate) return workouts;
    const selectedUtc = format(selectedDate, "yyyy-MM-dd");
    return workouts.filter((w) => w.utcDate === selectedUtc);
  }, [selectedDate, workouts]);

  const workoutDates = useMemo(() => new Set(workouts.map((w) => w.date)), [workouts]);

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      await deleteWorkout(workoutId);
      setWorkouts(workouts.filter((w) => w.id !== workoutId));
    } catch (err) {
      console.error("Error deleting workout:", err);
      setError("Failed to delete workout. Please try again.");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWorkoutsData();
    setIsRefreshing(false);
  };

  if (isRefreshing && workouts.length === 0) {
    return (
      <div className="p-4">
        <ExerciseSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="p-4 space-y-6">
        {isRefreshing && (
          <div className="flex justify-center">
            <div className="pull-indicator" />
          </div>
        )}
        {error && <div className="text-destructive text-center">{error}</div>}
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