"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UIWorkoutExercise } from "@/types/workouts";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";

interface WorkoutExercisesProps {
  exercises: UIWorkoutExercise[];
  onExerciseSelect: (exercise: UIWorkoutExercise) => void;
  onExerciseRemove: (exerciseIndex: number) => void;
}

export function WorkoutExercises({ exercises, onExerciseSelect, onExerciseRemove }: WorkoutExercisesProps) {
  const { formatWeight } = useUnitPreference();

  return (
    <ScrollArea className="h-[calc(100vh-13rem)]">
      <AnimatePresence initial={false}>
        {exercises.map((exercise, index) => (
          <motion.div
            key={exercise.instance_id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          >
            <motion.div layout>
              <Card
                className="mb-4 overflow-hidden hover:bg-accent/5 transition-colors cursor-pointer"
                onClick={() => onExerciseSelect(exercise)}
              >
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold">{exercise.exercise.name}</h3>
                  <p className="text-muted-foreground">
                    {exercise.exercise.primary_muscle_group} • {exercise.sets.length} set
                    {exercise.sets.length !== 1 ? "s" : ""} •{" "}
                    {formatWeight(exercise.sets.reduce((acc, set) => acc + set.weight_kg * set.reps, 0))}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </ScrollArea>
  );
}