"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/history/calendar";
import { WorkoutList } from "@/components/history/workout-list";
import { WorkoutDetails } from "@/components/history/workout-details";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/auth-context";
import { withAuth } from '@/components/auth/protected-route';
import type { UIExtendedWorkout } from "@/types/workouts";

function HistoryPage() {
  const { state } = useAuth();
  const { user } = state;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<UIExtendedWorkout | null>(null);
  const [workouts, setWorkouts] = useState<UIExtendedWorkout[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  const fetchWorkouts = async () => {
    if (!user) return;
    setIsRefreshing(true);
    const { data, error } = await supabase
      .from("workouts")
      .select(
        "id, user_id, created_at, workout_exercises(id, exercise_id, created_at, exercise:available_exercises(*), sets(*))"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching workouts:", error.message);
    } else {
      const formattedWorkouts: UIExtendedWorkout[] = data.map((rawWorkout) => {
        const createdAt = new Date(rawWorkout.created_at ?? "");
        const exercises = Array.isArray(rawWorkout.workout_exercises)
          ? rawWorkout.workout_exercises.map((we) => ({
              id: we.id,
              workout_id: rawWorkout.id,
              exercise_id: we.exercise_id ?? "",
              exercise: {
                id: we.exercise?.id ?? "",
                name: we.exercise?.name ?? "",
                primary_muscle_group: we.exercise?.primary_muscle_group ?? "",
                secondary_muscle_group: we.exercise?.secondary_muscle_group
              },
              sets: Array.isArray(we.sets) ? we.sets : [],
              created_at: we.created_at ?? ""
            }))
          : [];
        
        return {
          id: rawWorkout.id,
          user_id: rawWorkout.user_id ?? "",
          created_at: rawWorkout.created_at ?? "",
          exercises,
          date: createdAt.toISOString().split("T")[0],
          time: createdAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit"
          }),
          totalVolume: exercises.reduce(
            (sum, ex) => sum + ex.sets.reduce((setSum, set) => setSum + set.reps * set.weight_kg, 0),
            0
          )
        };
      });
      setWorkouts(formattedWorkouts);
    }
    setIsRefreshing(false);
  };

  const displayedWorkouts = selectedDate
    ? workouts.filter(
        (w) => w.date === selectedDate.toISOString().split("T")[0]
      )
    : workouts;

  const workoutDates = new Set(workouts.map((w) => w.date));

  const handleDeleteWorkout = async (workout: UIExtendedWorkout) => {
    try {
      const { error } = await supabase.rpc('update_user_stats_on_delete', {
        p_user_id: user!.id,
        p_volume: workout.totalVolume
      });
      
      if (error) throw error;
      
      setWorkouts(workouts.filter((w) => w.id !== workout.id));
    } catch (err) {
      console.error("Error deleting workout:", err instanceof Error ? err.message : String(err));
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

        <Calendar
          currentDate={selectedDate || new Date()}
          workoutDates={workoutDates}
          onDateChange={setSelectedDate}
          onDateSelect={(date) => {
            const workout = displayedWorkouts.find((w) => w.date === date);
            if (workout) setSelectedWorkout(workout);
          }}
        />

        <WorkoutList
          workouts={displayedWorkouts}
          onWorkoutSelect={setSelectedWorkout}
          onWorkoutDelete={handleDeleteWorkout}
        />
      </div>

      <WorkoutDetails
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
      />

      <BottomNav />
    </div>
  );
}

export default withAuth(HistoryPage, { requireComplete: true });
