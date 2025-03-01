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
    <ScrollArea className="h-[calc(100vh-13rem)]">
      <AnimatePresence initial={false}>
        {exercises.map((exercise, index) => (
          <motion.div
            key={exercise.instance_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            layout
            className="mb-4"
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: -100, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(e, { offset }) => {
                if (offset.x < -50) {
                  onExerciseRemove(index);
                }
              }}
              whileDrag={{ scale: 1.02 }}
              whileHover={{ scale: 1.01 }}
              onTap={() => onExerciseSelect(exercise)}
              className="relative cursor-grab active:cursor-grabbing overflow-hidden rounded-xl"
            >
              {/* Delete indicator */}
              <motion.div
                className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-destructive to-transparent flex items-center justify-end pr-4"
                style={{
                  borderTopRightRadius: "0.5rem",
                  borderBottomRightRadius: "0.5rem",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                whileDrag={{ opacity: 1, transition: { duration: 0.2 } }}
              >
                <span className="text-destructive-foreground font-medium">
                  Delete
                </span>
              </motion.div>
              {/* Exercise card */}
              <Card className="relative z-10">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold">
                    {exercise.exercise.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {exercise.exercise.primary_muscle_group} •{" "}
                    {exercise.sets.length} set
                    {exercise.sets.length !== 1 ? "s" : ""} •{" "}
                    {formatWeight(
                      exercise.sets.reduce(
                        (acc, set) => acc + set.weight_kg * set.reps,
                        0
                      )
                    )}
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