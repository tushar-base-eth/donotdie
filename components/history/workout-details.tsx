"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { UIExtendedWorkout } from "@/types/workouts";

interface WorkoutDetailsProps {
  workout: UIExtendedWorkout | null;
  onClose: () => void;
}

export function WorkoutDetails({ workout, onClose }: WorkoutDetailsProps) {
  if (!workout) return null;

  return (
    <Sheet open={!!workout} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0" aria-describedby="workout-details-description">
        <div className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-lg z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">Workout Details</SheetTitle>
            <span id="workout-details-description" className="sr-only">
              View details of your workout, including exercises, sets, reps, and weights.
            </span>
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
        <div className="p-4 space-y-6">
          {workout.exercises.map((exercise, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-lg font-semibold">
                {exercise.exercise.name}
              </h3>
              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} className="flex items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#4B7BFF]/10 dark:bg-red-500/10 flex items-center justify-center text-[#4B7BFF] dark:text-red-500 font-medium">
                      {setIndex + 1}
                    </div>
                    <span className="text-muted-foreground">
                      {set.reps} reps
                    </span>
                    <span className="text-muted-foreground">
                      {set.weight_kg}kg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
