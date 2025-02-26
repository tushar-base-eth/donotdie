"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/history/calendar";
import { WorkoutList } from "@/components/history/workout-list";
import { WorkoutDetails } from "@/components/history/workout-details";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/auth-context";
import type { UIExtendedWorkout } from "@/types/workouts";

export default function HistoryPage() {
  const { state } = useAuth();
  const { user, isLoading } = state;
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] =
    useState<UIExtendedWorkout | null>(null);
  const [workouts, setWorkouts] = useState<UIExtendedWorkout[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/auth");
    } else if (user) {
      fetchWorkouts();
    }
  }, [user, isLoading, router]);

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
              workout_id: we.workout_id ?? rawWorkout.id,
              exercise_id: we.exercise_id ?? "",
              exercise: we.exercise ?? {
                id: "",
                name: "",
                primary_muscle_group: "",
              },
              sets: Array.isArray(we.sets) ? we.sets : [],
              created_at: we.created_at ?? "",
            }))
          : [];
        const totalVolume = exercises.reduce(
          (sum, ex) =>
            sum +
            ex.sets.reduce(
              (setSum, set) => setSum + set.reps * set.weight_kg,
              0
            ),
          0
        );
        return {
          id: rawWorkout.id,
          user_id: rawWorkout.user_id ?? "",
          created_at: rawWorkout.created_at ?? "",
          exercises,
          date: createdAt.toISOString().split("T")[0],
          time: createdAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          totalVolume,
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

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!user) return;
    try {
      const workoutToDelete = workouts.find((w) => w.id === workoutId);
      const volumeToSubtract = workoutToDelete
        ? workoutToDelete.totalVolume
        : 0;
      const workoutDate = workoutToDelete
        ? workoutToDelete.date
        : new Date().toISOString().split("T")[0];

      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workoutId);
      if (error) throw new Error(error.message);

      if (volumeToSubtract > 0) {
        const { error: statsError } = await supabase.rpc(
          "update_user_stats_on_delete",
          {
            p_user_id: user.id,
            p_volume: volumeToSubtract,
            p_date: workoutDate,
          }
        );
        if (statsError) throw new Error(statsError.message);
      }

      setWorkouts(workouts.filter((w) => w.id !== workoutId));
    } catch (error) {
      console.error("Error deleting workout:", error.message);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWorkouts();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background p-4">Loading...</div>;
  }

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
