"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { UIExtendedWorkout } from "@/types/workouts";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";
import { motion } from "framer-motion";

interface WorkoutDetailsProps {
  workout: UIExtendedWorkout | null;
  onClose: () => void;
}

export function WorkoutDetails({ workout, onClose }: WorkoutDetailsProps) {
  const { formatWeight } = useUnitPreference();

  if (!workout) return null;

  return (
    <Sheet open={!!workout} onOpenChange={onClose}>
      <SheetContent
        className="w-full sm:max-w-lg p-0 bg-background z-50 rounded-t-3xl"
        style={{ maxHeight: "calc(100vh - 60px)", overflowY: "auto" }}
      >
        <div className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl text-foreground">Workout Details</SheetTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="rounded-full h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-4 space-y-6"
        >
          {workout.exercises.map((exercise, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">{exercise.exercise.name}</h3>
              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} className="flex items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {setIndex + 1}
                    </div>
                    <span className="text-muted-foreground">{set.reps} reps</span>
                    <span className="text-muted-foreground">{formatWeight(set.weight_kg)}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}