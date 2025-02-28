"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WorkoutExercises } from "@/components/workout/workout-exercises";
import { ExerciseSelector } from "@/components/workout/exercise-selector";
import { ExerciseEditor } from "@/components/workout/exercise-editor";
import { WorkoutWelcome } from "@/components/workout/workout-welcome";
import { ExerciseSkeleton } from "@/components/loading/exercise-skeleton";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/auth-context";
import { generateUUID } from "@/lib/utils";
import type { Exercise, UIExtendedWorkout } from "@/types/workouts";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from '@/components/auth/protected-route';

function WorkoutPage() {
  const { state } = useAuth();
  const { user } = state;
  const isLoading = state.status === 'loading';
  const router = useRouter();
  const [exercises, setExercises] = useState<UIExtendedWorkout["exercises"]>(
    []
  );
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<
    UIExtendedWorkout["exercises"][0] | null
  >(null);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/auth");
    }
  }, [user, isLoading, router]);

  const isWorkoutValid =
    exercises.length > 0 &&
    exercises.every(
      (exercise) =>
        exercise.sets.length > 0 &&
        exercise.sets.every((set) => set.reps > 0 && set.weight_kg > 0)
    );

  const calculateTotalVolume = (exercises: UIExtendedWorkout["exercises"]) => {
    return exercises.reduce(
      (total, exercise) =>
        total +
        exercise.sets.reduce(
          (setTotal, set) => setTotal + set.weight_kg * set.reps,
          0
        ),
      0
    );
  };

  const handleExerciseToggle = (id: string) => {
    setSelectedExercises((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddExercises = (selected: Exercise[]) => {
    startTransition(() => {
      const newExercises = selected.map((exercise) => ({
        id: generateUUID(),
        workout_id: "",
        exercise_id: exercise.id,
        exercise,
        sets: [
          {
            id: generateUUID(),
            workout_exercise_id: "",
            reps: 0,
            weight_kg: 0,
            created_at: "",
          },
        ],
        created_at: "",
      }));
      setExercises([...exercises, ...newExercises]);
      setSelectedExercises([]);
      setShowExerciseModal(false);
    });
  };

  const handleUpdateSets = (
    exerciseIndex: number,
    newSets: UIExtendedWorkout["exercises"][0]["sets"]
  ) => {
    if (exerciseIndex === -1) return;
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      sets: newSets,
    };
    setExercises(updatedExercises);

    if (
      selectedExercise &&
      selectedExercise.exercise.id ===
        updatedExercises[exerciseIndex].exercise.id
    ) {
      setSelectedExercise(updatedExercises[exerciseIndex]);
    }
  };

  const handleRemoveExercise = (index: number) => {
    startTransition(() => {
      setExercises(exercises.filter((_, i) => i !== index));
    });
  };

  const handleSaveWorkout = async () => {
    if (!isWorkoutValid || !user || isLoading) return;

    startTransition(async () => {
      try {
        // Create the workout first
        const { data: workoutData, error: workoutError } = await supabase
          .from("workouts")
          .insert([{ user_id: user.id }])
          .select()
          .single();
        if (workoutError) throw new Error(workoutError.message);

        const workoutId = workoutData.id;

        // Insert all workout exercises and their sets
        for (const ex of exercises) {
          const { data: workoutExData, error: workoutExError } = await supabase
            .from("workout_exercises")
            .insert([{ workout_id: workoutId, exercise_id: ex.exercise_id }])
            .select()
            .single();
          if (workoutExError) throw new Error(workoutExError.message);

          const workoutExerciseId = workoutExData.id;
          const setsData = ex.sets.map((set) => ({
            workout_exercise_id: workoutExerciseId,
            reps: set.reps,
            weight_kg: set.weight_kg,
          }));
          const { error: setsError } = await supabase
            .from("sets")
            .insert(setsData);
          if (setsError) throw new Error(setsError.message);
        }

        // Update user stats with the total volume
        const totalVolume = calculateTotalVolume(exercises);
        const { error: statsError } = await supabase.rpc('update_user_stats', {
          p_user_id: user.id,
          p_volume: totalVolume,
          p_date: new Date().toISOString().split('T')[0] // Store date in UTC
        });
        if (statsError) throw new Error(statsError.message);

        setExercises([]);
      } catch (error: any) {
        console.error("Error saving workout:", error.message);
      }
    });
  };

  const handleDeleteWorkout = async (workout: UIExtendedWorkout) => {
    try {
      const volumeToSubtract = calculateTotalVolume(workout.exercises);
      const { error: statsError } = await supabase.rpc('update_user_stats_on_delete', {
        p_user_id: user!.id,
        p_volume: volumeToSubtract,
        p_date: workout.utcDate // Use the stored UTC date
      });
      
      if (statsError) throw statsError;
      
      // ... rest of delete logic
    } catch (err) {
      console.error("Error deleting workout:", err instanceof Error ? err.message : String(err));
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        <WorkoutWelcome />
        {isPending ? (
          <ExerciseSkeleton />
        ) : (
          <WorkoutExercises
            exercises={exercises}
            onExerciseSelect={setSelectedExercise}
            onExerciseRemove={handleRemoveExercise}
          />
        )}
        <div className="fixed bottom-20 right-4 flex flex-col gap-4">
          <AnimatePresence>
            {isWorkoutValid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <Button
                  size="icon"
                  onClick={handleSaveWorkout}
                  className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-green-500 hover:bg-green-600"
                >
                  <Save className="h-6 w-6" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              onClick={() => setShowExerciseModal(true)}
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-[#4B7BFF] hover:bg-[#4B7BFF]/90 dark:bg-red-500 dark:hover:bg-red-600"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </motion.div>
        </div>
        <ExerciseSelector
          open={showExerciseModal}
          onOpenChange={setShowExerciseModal}
          selectedExercises={selectedExercises}
          onExerciseToggle={handleExerciseToggle}
          onAddExercises={handleAddExercises}
        />
        {selectedExercise && (
          <ExerciseEditor
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
            onUpdateSets={handleUpdateSets}
            exerciseIndex={exercises.findIndex(
              (ex) => ex.exercise.id === selectedExercise.exercise.id
            )}
          />
        )}
      </div>
    </div>
  );
}

export default function Workout() {
  return (
    <ProtectedRoute>
      <WorkoutPage />
    </ProtectedRoute>
  );
}
