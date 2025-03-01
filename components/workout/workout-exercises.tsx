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

export function WorkoutExercises({
  exercises,
  onExerciseSelect,
  onExerciseRemove,
}: WorkoutExercisesProps) {
  const { formatWeight } = useUnitPreference();

  return (
    <ScrollArea className="h-[calc(100vh-13rem)] px-4">
      <AnimatePresence initial={false}>
        {exercises.map((exercise, index) => (
          <motion.div
            key={exercise.instance_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            layout
            className="mb-4"
          >
            <motion.div
              drag="x"  // Restrict drag to horizontal direction
              dragConstraints={{ left: -120, right: 0 }}  // Limit drag distance
              dragElastic={0.8}  // Increased to 0.8 to reduce sensitivity
              onDragEnd={(e, { offset }) => {
                if (offset.x < -60) {  // Delete threshold remains unchanged
                  onExerciseRemove(index);
                }
              }}
              whileDrag={{ scale: 1.03 }}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative cursor-grab active:cursor-grabbing"
            >
              {/* Delete Indicator */}
              <motion.div
                className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-red-500/90 to-transparent flex items-center justify-end pr-3 pointer-events-none"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 0, x: 20 }}
                whileDrag={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-white font-medium text-sm">Delete</span>
              </motion.div>

              {/* Exercise Card */}
              <Card
                className="relative z-10 bg-background shadow-md border-none rounded-lg overflow-hidden cursor-pointer hover:bg-accent/10 transition-colors duration-200"
                onClick={() => onExerciseSelect(exercise)}
              >
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">
                    {exercise.exercise.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {exercise.exercise.primary_muscle_group} • {exercise.sets.length} sets •{" "}
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