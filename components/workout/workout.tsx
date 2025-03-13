"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WorkoutExercises } from "@/components/workout/workout-exercises";
import { ExerciseSelector } from "@/components/workout/exercise-selector";
import { ExerciseEditor } from "@/components/workout/exercise-editor";
import { ExerciseSkeleton } from "@/components/loading/exercise-skeleton";
import { useUserProfile } from "@/contexts/profile-context";
import { generateUUID } from "@/lib/utils";
import type { Exercise, UIExtendedWorkout, NewWorkout, UIWorkoutExercise, Set } from "@/types/workouts";
import { useRouter } from "next/navigation";
import { useSaveWorkout } from "@/lib/hooks/data-hooks";
import { toast } from "@/components/ui/use-toast";

interface WorkoutProps {
  onExercisesChange?: (exercises: UIExtendedWorkout["exercises"]) => void;
}

function WorkoutPage({ onExercisesChange }: WorkoutProps) {
  const { state: authState } = useUserProfile();
  const { user } = authState;
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { saveWorkout } = useSaveWorkout();

  const [exercises, setExercises] = useState<UIWorkoutExercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<UIWorkoutExercise | null>(null);

  useEffect(() => {
    onExercisesChange?.(exercises);
  }, [exercises, onExercisesChange]);

  const isSetValid = (set: Set, uses_reps: boolean, uses_weight: boolean, uses_duration: boolean, uses_distance: boolean) => {
    const reps = set.reps ?? 0;
    const weight_kg = set.weight_kg ?? 0;
    const duration_seconds = set.duration_seconds ?? 0;
    const distance_meters = set.distance_meters ?? 0;

    let validMetrics = 0;
    let requiredMetrics = 0;

    if (uses_reps) { requiredMetrics++; if (reps > 0) validMetrics++; }
    if (uses_weight) { requiredMetrics++; if (weight_kg > 0) validMetrics++; }
    if (uses_duration) { requiredMetrics++; if (duration_seconds > 0) validMetrics++; }
    if (uses_distance) { requiredMetrics++; if (distance_meters > 0) validMetrics++; }

    return requiredMetrics === 0 || (requiredMetrics > 1 ? validMetrics === requiredMetrics : validMetrics > 0);
  };

  const isWorkoutValid = 
    exercises
      .filter(ex => ex.sets.length > 0)
      .some(ex => 
        ex.sets.some(set => 
          isSetValid(set, ex.exercise.uses_reps!, ex.exercise.uses_weight!, ex.exercise.uses_duration!, ex.exercise.uses_distance!)
        )
      );

  const handleExerciseToggle = (exercise: Exercise) => {
    const selected = selectedExercises.find((se) => se.id === exercise.id);
    if (selected) {
      setSelectedExercises(selectedExercises.filter((se) => se.id !== exercise.id));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleAddExercises = (selected: Exercise[]) => {
    startTransition(() => {
      const newExercises: UIWorkoutExercise[] = selected.map((exercise, index) => {
        const initialSet: Set = {
          id: "1",
          workout_exercise_id: generateUUID(),
          set_number: 1,
          reps: exercise.uses_reps ? 0 : null,
          weight_kg: exercise.uses_weight ? 0 : null,
          duration_seconds: exercise.uses_duration ? 0 : null,
          distance_meters: exercise.uses_distance ? 0 : null,
          created_at: new Date().toISOString(),
        };
        return {
          instance_id: generateUUID(),
          id: generateUUID(),
          workout_id: "",
          exercise_type: "predefined",
          predefined_exercise_id: exercise.id,
          user_exercise_id: null,
          order: exercises.length + index + 1,
          effort_level: null,
          created_at: new Date().toISOString(),
          exercise,
          sets: [initialSet],
        };
      });
      setExercises([...exercises, ...newExercises]);
      setSelectedExercises([]);
      setShowExerciseModal(false);
    });
  };

  const handleUpdateSets = (exerciseIndex: number, newSets: Set[]) => {
    if (exerciseIndex < 0 || exerciseIndex >= exercises.length) {
      console.error(`Invalid exercise index: ${exerciseIndex}`);
      return;
    }
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex] = { ...updatedExercises[exerciseIndex], sets: newSets };
    setExercises(updatedExercises);
    if (selectedExercise && selectedExercise.instance_id === updatedExercises[exerciseIndex].instance_id) {
      setSelectedExercise(updatedExercises[exerciseIndex]);
    }
  };

  const handleRemoveExercise = (index: number) => {
    startTransition(() => {
      const newExercises = exercises
        .filter((_, i) => i !== index)
        .map((ex, i) => ({ ...ex, order: i + 1 }));
      setExercises(newExercises);
    });
  };

  const handleSaveWorkout = async () => {
    if (!isWorkoutValid || !user ) return;

    startTransition(async () => {
      try {
        const filteredExercises = exercises
          .map(ex => ({
            ...ex,
            sets: ex.sets.filter(set => 
              isSetValid(set, ex.exercise.uses_reps!, ex.exercise.uses_weight!, ex.exercise.uses_duration!, ex.exercise.uses_distance!)
            )
          }))
          .filter(ex => ex.sets.length > 0);

        const newWorkout: NewWorkout = {
          user_id: user.id,
          exercises: filteredExercises.map((ex) => ({
            exercise_type: "predefined",
            predefined_exercise_id: ex.predefined_exercise_id!,
            order: ex.order,
            effort_level: ex.effort_level,
            sets: ex.sets.map((set) => {
              let weight_kg = set.weight_kg;
              if (user?.unit_preference === "imperial" && weight_kg !== null) {
                weight_kg = weight_kg / 2.20462; // Convert lb to kg
              }
              return {
                set_number: set.set_number,
                reps: set.reps,
                weight_kg,
                duration_seconds: set.duration_seconds,
                distance_meters: set.distance_meters,
              };
            }),
          })),
        };
        await saveWorkout(newWorkout);
        setExercises([]);
        setSelectedExercises([]);
        setSelectedExercise(null);
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        {isPending ? (
          <ExerciseSkeleton />
        ) : (
          <WorkoutExercises
            exercises={exercises}
            onExerciseSelect={setSelectedExercise}
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
          selectedExercises={selectedExercises}
          onExerciseToggle={handleExerciseToggle}
          onAddExercises={handleAddExercises}
        />
        {selectedExercise && (
          <ExerciseEditor
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
            onUpdateSets={handleUpdateSets}
            exerciseIndex={exercises.findIndex((ex) => ex.instance_id === selectedExercise.instance_id)}
          />
        )}
      </div>
    </div>
  );
}

export default function Workout(props: WorkoutProps) {
  return <WorkoutPage {...props} />;
}