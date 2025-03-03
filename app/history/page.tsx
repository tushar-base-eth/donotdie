"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/history/calendar";
import { WorkoutList } from "@/components/history/workout-list";
import { WorkoutDetails } from "@/components/history/workout-details";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/auth/protected-route"; 
import { ExerciseSkeleton } from "@/components/loading/exercise-skeleton";
import type { UIExtendedWorkout } from "@/types/workouts";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { WorkoutExercise } from "@/types/workouts";
import { format } from "date-fns";
import { motion } from "framer-motion";

function HistoryPage() {
  const { state } = useAuth();
  const { user } = state;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<UIExtendedWorkout | null>(null);
  const [workouts, setWorkouts] = useState<UIExtendedWorkout[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchWorkouts();
  }, [user]);

  const fetchWorkouts = async () => {
    if (!user) return;
    setIsRefreshing(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          id, user_id, created_at,
          workout_exercises!fk_workout (
            id, exercise_id, created_at,
            exercise:available_exercises(*),
            sets!fk_workout_exercise (*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      const formattedWorkouts: UIExtendedWorkout[] = data
      .filter((rawWorkout) => rawWorkout.created_at !== null)
      .map((rawWorkout) => {
        const utcDate = parseISO(rawWorkout.created_at as string);
        const localDate = formatInTimeZone(utcDate, "UTC", "yyyy-MM-dd");
        const localTime = formatInTimeZone(utcDate, "UTC", "hh:mm a");

        const exercises = Array.isArray(rawWorkout.workout_exercises)
          ? rawWorkout.workout_exercises.map((we) => ({
              id: we.id,
              workout_id: rawWorkout.id,
              exercise_id: we.exercise_id ?? "",
              exercise: {
                id: we.exercise?.id ?? "",
                name: we.exercise?.name ?? "",
                primary_muscle_group: we.exercise?.primary_muscle_group ?? "",
                secondary_muscle_group: we.exercise?.secondary_muscle_group ?? null,
              },
              sets: Array.isArray(we.sets) ? we.sets : [],
              created_at: we.created_at ?? "",
            }))
          : [];

        return {
          id: rawWorkout.id,
          user_id: rawWorkout.user_id ?? "",
          created_at: rawWorkout.created_at,
          exercises,
          utcDate: localDate,
          date: localDate,
          time: localTime,
          totalVolume: exercises.reduce(
            (sum: number, ex: WorkoutExercise) => sum + ex.sets.reduce(
              (setSum: number, set: { reps: number; weight_kg: number }) => setSum + set.reps * set.weight_kg,
              0
            ),
            0
          ),
        };
      });

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
      const workout = workouts.find((w) => w.id === workoutId);
      if (!workout) return;

      const { error: exercisesError } = await supabase
        .from("workout_exercises")
        .delete()
        .eq("workout_id", workoutId);
      if (exercisesError) throw exercisesError;

      const { error: workoutError } = await supabase.from("workouts").delete().eq("id", workoutId);
      if (workoutError) throw workoutError;

      setWorkouts(workouts.filter((w) => w.id !== workoutId));
    } catch (err) {
      console.error("Error deleting workout:", err);
      setError("Failed to delete workout. Please try again.");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWorkouts();
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