"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { UIExtendedWorkout } from "@/types/workouts";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";

interface WorkoutListProps {
  workouts: UIExtendedWorkout[];
  onWorkoutSelect: (workout: UIExtendedWorkout) => void;
  onWorkoutDelete: (workoutId: string) => void;
}

export function WorkoutList({
  workouts,
  onWorkoutSelect,
  onWorkoutDelete,
}: WorkoutListProps) {
  const { formatWeight } = useUnitPreference();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Past Workouts</h2>
      <AnimatePresence initial={false}>
        {workouts.map((workout) => (
          <motion.div
            key={workout.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            layout
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: -100, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) {
                  onWorkoutDelete(workout.id);
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
                <span className="text-destructive-foreground font-medium">
                  Delete
                </span>
              </motion.div>

              <Card
                className="overflow-hidden cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => onWorkoutSelect(workout)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {new Date(workout.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {workout.time}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Total Volume
                      </div>
                      <div className="font-medium">{formatWeight(workout.totalVolume)}</div>
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
