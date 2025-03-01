"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/history/calendar";
import { WorkoutList } from "@/components/history/workout-list";
import { WorkoutDetails } from "@/components/history/workout-details";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import type { UIExtendedWorkout } from "@/types/workouts";
import { format, parseISO } from "date-fns";

function HistoryPage() {
  const { state } = useAuth();
  const { user } = state;
  // Initialize selectedDate as null to prevent default highlighting
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<UIExtendedWorkout | null>(null);
  const [workouts, setWorkouts] = useState<UIExtendedWorkout[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  const fetchWorkouts = async () => {
    if (!user) return;
    setIsRefreshing(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          id,
          user_id,
          created_at,
          workout_exercises!fk_workout (
            id,
            exercise_id,
            created_at,
            exercise:available_exercises(*),
            sets!fk_workout_exercise (*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      // Process workouts and convert UTC timestamps to local time
      const formattedWorkouts: UIExtendedWorkout[] = data
        .filter((rawWorkout) => rawWorkout.created_at !== null)
        .map((rawWorkout) => {
          const utcDate = parseISO(rawWorkout.created_at as string); // Parse UTC timestamp
          const localDate = format(utcDate, "yyyy-MM-dd"); // Convert to local date
          const localTime = format(utcDate, "hh:mm a");    // Convert to local time (e.g., 2:09 PM)

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
              (sum, ex) => sum + ex.sets.reduce((setSum, set) => setSum + set.reps * set.weight_kg, 0),
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

  // Filter workouts based on selected date or show all if no date is selected
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

      const { error: workoutError } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workoutId);
      if (workoutError) throw workoutError;

      const { error: statsError } = await supabase.rpc("update_user_stats_on_delete", {
        p_user_id: user!.id,
        p_volume: workout.totalVolume,
        p_date: workout.utcDate,
      });
      if (statsError) throw statsError;

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <div
        className="p-4 space-y-6"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const startY = touch.pageY;

          const handleTouchMove = (e: TouchEvent) => {
            const currentY = e.touches[0].pageY;
            const diff = currentY - startY;

            if (diff > 50 && window.scrollY === 0 && !isRefreshing) {
              handleRefresh();
            }
          };

          document.addEventListener("touchmove", handleTouchMove);
          document.addEventListener(
            "touchend",
            () => document.removeEventListener("touchmove", handleTouchMove),
            { once: true }
          );
        }}
      >
        {isRefreshing && (
          <div className="flex justify-center">
            <div className="pull-indicator" />
          </div>
        )}
        {error && <div className="text-red-500 text-center">{error}</div>}

        <Calendar
          currentDate={selectedDate}
          workoutDates={workoutDates}
          onDateChange={setSelectedDate}
        />

        <WorkoutList
          workouts={displayedWorkouts}
          onWorkoutSelect={setSelectedWorkout}
          onWorkoutDelete={handleDeleteWorkout}
          selectedDate={selectedDate} // Pass selectedDate to customize no-workouts message
        />
      </div>

      <WorkoutDetails workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} />
      <BottomNav />
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