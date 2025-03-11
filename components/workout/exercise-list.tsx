"use client";

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import type { Exercise } from "@/types/workouts";

interface ExerciseListProps {
  category: string;
  searchQuery: string;
  selectedExercises: Exercise[];
  onExerciseToggle: (exercise: Exercise) => void;
  exercises: Exercise[];
}

export function ExerciseList({ category, searchQuery, selectedExercises, onExerciseToggle, exercises }: ExerciseListProps) {
  const filteredExercises = useMemo(() => {
    let result = exercises;
    if (category === "by_muscles") {
      return result.filter((ex) => searchQuery ? ex.primary_muscle_group === searchQuery : true);
    } else if (category === "by_equipment") {
      return result.filter((ex) => searchQuery ? ex.name.toLowerCase().includes(searchQuery.toLowerCase()) : true);
    } else if (category === "added_by_me") {
      result = result.filter((ex) => ex.source === "user");
    } else if (category !== "all") {
      result = result.filter((ex) => ex.category === category);
    }
    return result.filter((ex) => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [exercises, category, searchQuery]);

  return (
    <ScrollArea className="h-full px-6 py-4">
      {filteredExercises.length === 0 && <div className="p-4 text-muted-foreground">No exercises found</div>}
      {filteredExercises.map((exercise) => {
        const selected = selectedExercises.some((se) => se.id === exercise.id);
        return (
          <motion.div key={exercise.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <div
              className="flex items-center gap-4 p-4 rounded-3xl border cursor-pointer hover:bg-accent/5 transition-colors"
              onClick={() => onExerciseToggle(exercise)}
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
                  ${selected ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
              >
                {selected && "✓"}
              </div>
            </div>
          </motion.div>
        );
      })}
    </ScrollArea>
  );
}