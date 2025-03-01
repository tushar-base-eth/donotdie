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
  const { formatWeight } = useUnitPreference();

  return (
    <ScrollArea className="h-[calc(100vh-13rem)] px-4">
      <AnimatePresence initial={false}>
        {exercises.map((exercise, index) => {
          // Track the swipe distance
          const dragX = useMotionValue(0);
          // Map swipe distance to opacity (fully visible at -60px, hidden at 0px)
          const opacity = useTransform(dragX, [-60, 0], [1, 0]);
          // Map swipe distance to position (shifts slightly for effect)
          const xTransform = useTransform(dragX, [-60, 0], [0, 20]);

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
                dragConstraints={{ left: -120, right: 0 }} // Limit swipe to left direction
                dragElastic={0.2} // Add slight elasticity to swipe
                onDragEnd={(e, { offset }) => {
                  if (offset.x < -60) { // Trigger delete if swiped past threshold
                    onExerciseRemove(index);
                  }
                }}
                whileDrag={{ scale: 1.03 }} // Slight scale-up during drag
                whileHover={{ scale: 1.01 }} // Subtle hover effect
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative cursor-grab active:cursor-grabbing"
                style={{ x: dragX }} // Bind drag position
              >
                {/* DELETE Indicator */}
                <motion.div
                  className="absolute inset-y-0 right-0 w-20 flex items-center justify-end pr-3 pointer-events-none"
                  style={{
                    opacity, // Fade in/out based on swipe
                    x: xTransform, // Move slightly with swipe
                    background: "linear-gradient(to left, var(--color-destructive), transparent)", // Gradient for smooth transition
                    color: "var(--color-destructive-foreground)", // Theme-aware text color
                    borderTopRightRadius: "0.5rem",
                    borderBottomRightRadius: "0.5rem",
                  }}
                >
                  <span className="font-medium text-sm">DELETE</span>
                </motion.div>

                {/* Exercise Card */}
                <Card
                  className="relative z-10 bg-background shadow-md border-none rounded-lg overflow-hidden cursor-pointer hover:bg-accent/10 transition-colors duration-200"
                  onClick={() => onExerciseSelect(exercise)} // Tap to edit
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
          );
        })}
      </AnimatePresence>
    </ScrollArea>
  );
}