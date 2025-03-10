// components/workout/exercise-selector.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useAvailableExercises } from "@/lib/hooks/data-hooks"; // Custom hook for exercises
import type { Exercise } from "@/types/workouts";

interface ExerciseSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedExercises: string[];
  onExerciseToggle: (id: string) => void;
  onAddExercises: (selected: Exercise[]) => void;
}

export function ExerciseSelector({
  open,
  onOpenChange,
  selectedExercises,
  onExerciseToggle,
  onAddExercises,
}: ExerciseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedTab, setSelectedTab] = useState<"all" | "byMuscle">("all");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);

  // Fetch available exercises using custom hook
  const { exercises: availableExercises, isLoading, error, mutate } = useAvailableExercises();

  // Handle loading state
  if (isLoading) {
    return <div className="p-4">Loading exercises...</div>;
  }

  // Handle error state with retry option
  if (error) {
    return (
      <div className="p-4">
        Failed to load exercises.{" "}
        <button onClick={() => mutate()} className="text-blue-500 underline">
          Retry
        </button>
      </div>
    );
  }

  // Extract unique muscle groups for filtering
  const muscleGroups = Array.from(new Set(availableExercises.map((ex) => ex.primary_muscle_group)));

  // Filter exercises based on search query and muscle group
  const filteredExercises = Object.entries(
    availableExercises.reduce((acc, ex) => {
      const group = ex.primary_muscle_group || "Other";
      acc[group] = acc[group] || [];
      acc[group].push(ex);
      return acc;
    }, {} as Record<string, Exercise[]>)
  ).reduce((acc, [group, exercises]) => {
    const filtered = exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedTab === "all" || !selectedMuscleGroup || ex.primary_muscle_group === selectedMuscleGroup)
    );
    if (filtered.length > 0) {
      acc[group] = filtered;
    }
    return acc;
  }, {} as Record<string, Exercise[]>);

  // Add selected exercises and close the modal
  const handleAdd = () => {
    const selected = availableExercises.filter((ex) => selectedExercises.includes(ex.id));
    onAddExercises(selected);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[80vh] px-0 z-[101] rounded-t-3xl"
        aria-describedby="exercise-selector-description"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full">
          <div className="px-6 pb-6 flex items-center border-b">
            <SheetTitle className="text-xl">Add Exercise</SheetTitle>
            <span id="exercise-selector-description" className="sr-only">
              Select exercises to add to your workout. You can search for exercises or filter them by muscle group.
            </span>
          </div>

          <div className="px-6 pt-4 space-y-4">
            <Input
              ref={inputRef}
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl bg-accent/10 border-0"
              autoFocus={false}
            />
            <Tabs
              value={selectedTab}
              onValueChange={(value) => {
                setSelectedTab(value as "all" | "byMuscle");
                setSelectedMuscleGroup(null);
              }}
              className="w-full"
            >
              <TabsList className="w-full p-0.5 h-10 bg-accent/10 rounded-xl">
                <TabsTrigger value="all" className="flex-1 rounded-lg">
                  All
                </TabsTrigger>
                <TabsTrigger value="byMuscle" className="flex-1 rounded-lg">
                  By Muscle
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-6 space-y-6 py-4">
              {selectedTab === "byMuscle" && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {muscleGroups.map((muscle) => (
                    <Button
                      key={muscle}
                      variant={selectedMuscleGroup === muscle ? "default" : "outline"}
                      onClick={() =>
                        setSelectedMuscleGroup(selectedMuscleGroup === muscle ? null : muscle)
                      }
                      className="rounded-full"
                      size="sm"
                    >
                      {muscle}
                    </Button>
                  ))}
                </div>
              )}

              {Object.entries(filteredExercises).map(([group, exercises]) => (
                <div key={group}>
                  <h3 className="font-semibold mb-2">{group}</h3>
                  <div className="space-y-2">
                    {exercises.map((exercise) => (
                      <motion.div
                        key={exercise.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div
                          className="flex items-center gap-4 p-4 rounded-3xl border cursor-pointer hover:bg-accent/5 transition-colors"
                          onClick={() => onExerciseToggle(exercise.id)}
                        >
                          <div className="flex-1">
                            <div>{exercise.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {exercise.primary_muscle_group}
                              {exercise.secondary_muscle_group && `, ${exercise.secondary_muscle_group}`}
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors
                              ${
                                selectedExercises.includes(exercise.id)
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-input"
                              }`}
                          >
                            {selectedExercises.includes(exercise.id) && "✓"}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 bg-background/80 backdrop-blur-sm border-t">
            <Button
              onClick={handleAdd}
              disabled={selectedExercises.length === 0}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12"
            >
              Add {selectedExercises.length} Exercise{selectedExercises.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}