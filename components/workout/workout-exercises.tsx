"use client";

import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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
  const { isImperial, unitLabel } = useUnitPreference();

  return (
    <ScrollArea className="h-[calc(100vh-13rem)] px-4 bg-background">
      <AnimatePresence initial={false}>
        {exercises.map((exercise, index) => {
          const dragX = useMotionValue(0);
          const opacity = useTransform(dragX, [-120, 0], [1, 0]);
          const xTransform = useTransform(dragX, [-120, 0], [0, 40]);

          const summary = [];
          if (exercise.exercise.uses_weight && exercise.sets.some((s) => s.weight_kg)) {
            const totalVolume = exercise.sets.reduce((acc, set) => acc + ((set.reps || 0) * (set.weight_kg || 0)), 0);
            summary.push(`${totalVolume} ${unitLabel}`);
          }
          if (exercise.exercise.uses_duration && exercise.sets.some((s) => s.duration_seconds)) {
            const totalDuration = exercise.sets.reduce((acc, set) => acc + (set.duration_seconds || 0), 0);
            summary.push(`${totalDuration}s`);
          }
          if (exercise.exercise.uses_distance && exercise.sets.some((s) => s.distance_meters)) {
            const totalDistance = exercise.sets.reduce((acc, set) => acc + (set.distance_meters || 0), 0);
            summary.push(`${totalDistance}m`);
          }
          if (exercise.exercise.uses_reps && !exercise.exercise.uses_weight) {
            const totalReps = exercise.sets.reduce((acc, set) => acc + (set.reps || 0), 0);
            summary.push(`${totalReps} reps`);
          }

          return (
            <motion.div
              key={exercise.instance_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              layout
              className="mb-4 relative"
            >
              <motion.div
                drag="x"
                dragConstraints={{ left: -120, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset }) => {
                  if (offset.x < -60) {
                    onExerciseRemove(index);
                  }
                }}
                whileDrag={{ scale: 1.03 }}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative cursor-grab active:cursor-grabbing"
                style={{ x: dragX }}
              >
                <motion.div
                  className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-4 pointer-events-none rounded-r-lg"
                  style={{
                    opacity,
                    x: xTransform,
                    backgroundColor: "hsl(var(--destructive))",
                    color: "hsl(var(--destructive-foreground))",
                  }}
                >
                  <span className="font-semibold text-sm tracking-wide">DELETE</span>
                </motion.div>

                <Card
                  className="relative z-10 border rounded-lg"
                  onClick={() => onExerciseSelect(exercise)}
                >
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {exercise.exercise.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {exercise.sets.length} sets • {summary.join(", ")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </ScrollArea>
  );
}