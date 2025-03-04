"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WorkoutExercises } from "@/components/workout/workout-exercises";
import { ExerciseSelector } from "@/components/workout/exercise-selector";
import { ExerciseEditor } from "@/components/workout/exercise-editor";
import { ExerciseSkeleton } from "@/components/loading/exercise-skeleton";
import { useAuth } from "@/contexts/auth-context";
import { generateUUID } from "@/lib/utils";
import type { Exercise, UIExtendedWorkout, Set } from "@/types/workouts";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/protected-route";
import { useWorkout } from "@/contexts/workout-context";
import { toast } from "@/components/ui/use-toast";
import { saveWorkout } from "@/lib/supabaseUtils";
import { useSWRConfig } from "swr";

interface WorkoutProps {
  onExercisesChange?: (exercises: UIExtendedWorkout["exercises"]) => void;
}

function WorkoutPage({ onExercisesChange }: WorkoutProps) {
  const { state, dispatch } = useWorkout();
  const { state: authState } = useAuth();
  const { user } = authState;
  const isLoading = authState.status === "loading";
  const router = useRouter();
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/auth");
    }
  }, [user, isLoading, router]);

  const isWorkoutValid =
    state.currentWorkout.exercises.length > 0 &&
    state.currentWorkout.exercises.every(
      (exercise) =>
        exercise.exercise_id &&
        exercise.sets.length > 0 &&
        exercise.sets.every((set) => set.reps > 0 && set.weight_kg > 0)
    );

  const handleExerciseToggle = (id: string) => {
    dispatch({
      type: "SET_SELECTED_EXERCISE_IDS",
      ids: state.currentWorkout.selectedExerciseIds.includes(id)
        ? state.currentWorkout.selectedExerciseIds.filter((x) => x !== id)
        : [...state.currentWorkout.selectedExerciseIds, id],
    });
  };

  const handleAddExercises = (selected: Exercise[]) => {
    startTransition(() => {
      const newExercises = selected.map((exercise) => ({
        instance_id: generateUUID(),
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
      dispatch({
        type: "SET_EXERCISES",
        exercises: [...state.currentWorkout.exercises, ...newExercises],
      });
      dispatch({ type: "SET_SELECTED_EXERCISE_IDS", ids: [] });
      setShowExerciseModal(false);
    });
  };

  const handleUpdateSets = (exerciseIndex: number, newSets: Set[]) => {
    if (exerciseIndex < 0 || exerciseIndex >= state.currentWorkout.exercises.length) {
      throw new Error(`Invalid exercise index: ${exerciseIndex}`);
    }
    dispatch({ type: "UPDATE_EXERCISE_SETS", exerciseIndex, sets: newSets });
  };

  const handleRemoveExercise = (index: number) => {
    startTransition(() => {
      const newExercises = state.currentWorkout.exercises.filter((_, i) => i !== index);
      dispatch({ type: "SET_EXERCISES", exercises: newExercises });
    });
  };

  const handleSaveWorkout = async () => {
    if (!isWorkoutValid || !user || isLoading) return;

    startTransition(async () => {
      try {
        const newWorkout = {
          user_id: user.id,
          exercises: state.currentWorkout.exercises.map((ex) => ({
            exercise_id: ex.exercise_id!,
            sets: ex.sets.map((set) => ({ reps: set.reps, weight_kg: set.weight_kg })),
          })),
        };
        await saveWorkout(newWorkout);

        // Invalidate caches to refetch updated data
        mutate(["workouts", user.id]);
        mutate(["profile", user.id]);

        dispatch({ type: "SET_EXERCISES", exercises: [] });
        dispatch({ type: "SET_SELECTED_EXERCISE_IDS", ids: [] });
        dispatch({ type: "SET_SELECTED_EXERCISE", exercise: null });

        localStorage.removeItem("currentWorkout");

        toast({
          title: "Success",
          description: "Workout saved successfully.",
          variant: "default",
        });
      } catch (error: any) {
        console.error("Error saving workout:", error.message);
        toast({
          title: "Error",
          description: "Failed to save workout. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <ExerciseSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        {isPending ? (
          <ExerciseSkeleton />
        ) : (
          <WorkoutExercises
            exercises={state.currentWorkout.exercises}
            onExerciseSelect={(exercise) =>
              dispatch({ type: "SET_SELECTED_EXERCISE", exercise })
            }
            onExerciseRemove={handleRemoveExercise}
          />
        )}
        <div className="fixed bottom-24 right-4 flex flex-col gap-4 z-50">
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
                  className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all bg-green-500 hover:bg-green-600 touch-target ios-active"
                >
                  <Save className="h-8 w-8" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              onClick={() => setShowExerciseModal(true)}
              className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all bg-[#4B7BFF] hover:bg-[#4B7BFF]/90 dark:bg-red-500 dark:hover:bg-red-600 touch-target ios-active"
            >
              <Plus className="h-8 w-8" />
            </Button>
          </motion.div>
        </div>
        <ExerciseSelector
          open={showExerciseModal}
          onOpenChange={setShowExerciseModal}
          selectedExercises={state.currentWorkout.selectedExerciseIds}
          onExerciseToggle={handleExerciseToggle}
          onAddExercises={handleAddExercises}
        />
        {state.currentWorkout.selectedExercise && (
          <ExerciseEditor
            exercise={state.currentWorkout.selectedExercise}
            onClose={() => dispatch({ type: "SET_SELECTED_EXERCISE", exercise: null })}
            onUpdateSets={handleUpdateSets}
            exerciseIndex={state.currentWorkout.exercises.findIndex(
              (ex) => ex.instance_id === state.currentWorkout.selectedExercise?.instance_id
            )}
          />
        )}
      </div>
    </div>
  );
}

export default function Workout(props: WorkoutProps) {
  return (
    <ProtectedRoute>
      <WorkoutPage {...props} />
    </ProtectedRoute>
  );
}