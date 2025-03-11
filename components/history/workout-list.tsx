"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { UIExtendedWorkout } from "@/types/workouts";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";
import { format, parse } from "date-fns";

interface WorkoutListProps {
  workouts: UIExtendedWorkout[];
  onWorkoutSelect: (workout: UIExtendedWorkout) => void;
  onWorkoutDelete: (workoutId: string) => void;
  selectedDate: Date | null;
}

export function WorkoutList({
  workouts,
  onWorkoutSelect,
  onWorkoutDelete,
  selectedDate,
}: WorkoutListProps) {
  const { formatWeight } = useUnitPreference();
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const handleDelete = (workoutId: string) => {
    setDeletingIds((prev) => [...prev, workoutId]);
    onWorkoutDelete(workoutId);
  };

  if (workouts.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {selectedDate ? (
          <div>
            <div className="mb-4">
              <div className="rounded-full bg-muted p-4 inline-block">
                <span role="img" aria-label="Sad face" className="text-4xl">🥱</span>
              </div>
            </div>
            <p className="text-lg font-medium">You were LAZY on this day!</p>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <div className="rounded-full bg-muted p-4 inline-block animate-bounce">
                <span role="img" aria-label="Dumbbell" className="text-4xl">🏋️</span>
              </div>
            </div>
            <p className="text-lg font-medium">Welcome! WTF!?</p>
            <p className="text-sm">You better start your first workout!</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Past Workouts</h2>
      <AnimatePresence initial={false}>
        {workouts
          .filter((workout) => !deletingIds.includes(workout.id))
          .map((workout) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100, height: 0 }}
              transition={{ duration: 0.3 }}
              layout
            >
              <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) {
                    handleDelete(workout.id);
                  }
                }}
                className="cursor-grab active:cursor-grabbing relative"
                whileDrag={{ scale: 1.02 }}
                whileHover={{ scale: 1.01 }}
              >
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
                  <span className="text-destructive-foreground font-medium">Delete</span>
                </motion.div>

                <Card
                  className="overflow-hidden cursor-pointer hover:bg-accent/5 transition-colors rounded-3xl"
                  onClick={() => onWorkoutSelect(workout)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {workout.date
                            ? format(parse(workout.date, "yyyy-MM-dd", new Date()), "eeee, MMMM d")
                            : "Invalid Date"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {workout.time || "No Time"}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        {workout.totalVolume !== null && (
                          <div>
                            <div className="text-sm text-muted-foreground">Total Volume</div>
                            <div className="font-medium">{formatWeight(workout.totalVolume)}</div>
                          </div>
                        )}
                        {workout.totalDistance !== null && (
                          <div>
                            <div className="text-sm text-muted-foreground">Total Distance</div>
                            <div className="font-medium">{workout.totalDistance.toFixed(1)} m</div>
                          </div>
                        )}
                        {workout.totalDuration !== null && (
                          <div>
                            <div className="text-sm text-muted-foreground">Total Duration</div>
                            <div className="font-medium">{workout.totalDuration} s</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}