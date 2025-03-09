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
import type { ExtendedExercise, UIExtendedWorkout, NewWorkout, Set, UIWorkoutExercise } from "@/types/workouts";
import { useRouter } from "next/navigation";
import { useWorkout } from "@/contexts/workout-context";
import { toast } from "@/components/ui/use-toast";
import { useSaveWorkout } from "@/lib/hooks/data-hooks";

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
  const { trigger: saveWorkoutTrigger } = useSaveWorkout();

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  const isWorkoutValid =
    state.currentWorkout.exercises.length > 0 &&
    state.currentWorkout.exercises.every((exercise) =>
      exercise.sets.length > 0 &&
      exercise.sets.every((set) =>
        (exercise.exercise.uses_reps ? (set.reps ?? 0) > 0 : true) ||
        (exercise.exercise.uses_weight ? (set.weight_kg ?? 0) > 0 : true) ||
        (exercise.exercise.uses_duration ? (set.duration_seconds ?? 0) > 0 : true) ||
        (exercise.exercise.uses_distance ? (set.distance_meters ?? 0) > 0 : true)
      )
    );

  const handleExerciseToggle = (exercise: ExtendedExercise) => {
    const selected = state.currentWorkout.selectedExerciseIds.find(
      (se) => se.id === exercise.id && se.source === exercise.source
    );
    if (selected) {
      dispatch({
        type: "SET_SELECTED_EXERCISE_IDS",
        ids: state.currentWorkout.selectedExerciseIds.filter(
          (se) => !(se.id === exercise.id && se.source === exercise.source)
        ),
      });
    } else {
      dispatch({
        type: "SET_SELECTED_EXERCISE_IDS",
        ids: [...state.currentWorkout.selectedExerciseIds, exercise],
      });
    }
  };

  const handleAddExercises = (selected: ExtendedExercise[]) => {
    startTransition(() => {
      const newExercises: UIWorkoutExercise[] = selected.map((exercise, index) => ({
        instance_id: generateUUID(),
        id: generateUUID(),
        workout_id: "",
        exercise_type: exercise.source,
        predefined_exercise_id: exercise.source === "predefined" ? exercise.id : null,
        user_exercise_id: exercise.source === "user" ? exercise.id : null,
        order: state.currentWorkout.exercises.length + index + 1,
        effort_level: null,
        created_at: new Date().toISOString(),
        exercise,
        sets: [],
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
    const updatedExercises = [...state.currentWorkout.exercises];
    updatedExercises[exerciseIndex] = { ...updatedExercises[exerciseIndex], sets: newSets };
    dispatch({ type: "SET_EXERCISES", exercises: updatedExercises });
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
        const newWorkout: NewWorkout = {
          user_id: user.id,
          exercises: state.currentWorkout.exercises.map((ex) => ({
            exercise_type: ex.exercise_type,
            predefined_exercise_id: ex.predefined_exercise_id,
            user_exercise_id: ex.user_exercise_id,
            order: ex.order,
            effort_level: ex.effort_level,
            sets: ex.sets.map((set) => ({
              workout_exercise_id: set.workout_exercise_id,
              set_number: set.set_number,
              reps: set.reps,
              weight_kg: set.weight_kg,
              duration_seconds: set.duration_seconds,
              distance_meters: set.distance_meters,
            })),
          })),
        };
        await saveWorkoutTrigger(newWorkout);

        dispatch({ type: "SET_EXERCISES", exercises: [] });
        dispatch({ type: "SET_SELECTED_EXERCISE_IDS", ids: [] });
        dispatch({ type: "SET_SELECTED_EXERCISE", exercise: null });
        localStorage.removeItem("currentWorkout");

        toast({
          title: "Success",
          description: "Workout saved successfully.",
          variant: "default",
          duration: 2000,
        });
      } catch (error: any) {
        console.error("Error saving workout:", error.message);
        toast({
          title: "Error",
          description: "Failed to save workout. Please try again.",
          variant: "destructive",
          duration: 3000,
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
            onExerciseSelect={(exercise) => dispatch({ type: "SET_SELECTED_EXERCISE", exercise })}
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
                  className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 touch-target ios-active"
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
              className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 touch-target ios-active"
            >
              <Plus className="h-8 w-8" />
            </Button>
          </motion.div>
        </div>
        <ExerciseSelector
          open={showExerciseModal}
          onOpenChange={setShowExerciseModal}
          selectedExercises={state.currentWorkout.selectedExerciseIds} // Now ExtendedExercise[]
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
  return <WorkoutPage {...props} />;
}