"use client";

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import type { Exercise, ExerciseEquipment, UserExerciseEquipment, Filter } from "@/types/workouts";

interface ExerciseListProps {
  filter: Filter;
  searchQuery: string;
  selectedExercises: Exercise[];
  onExerciseToggle: (exercise: Exercise) => void;
  exercises: Exercise[];
  exerciseEquipment: ExerciseEquipment[];
  userExerciseEquipment: UserExerciseEquipment[];
}

export function ExerciseList({ filter, searchQuery, selectedExercises, onExerciseToggle, exercises, exerciseEquipment, userExerciseEquipment }: ExerciseListProps) {
  const filteredExercises = useMemo(() => {
    let result = exercises;
    if (filter.type === "category") {
      result = result.filter((ex) => ex.category === filter.value);
    } else if (filter.type === "muscle") {
      result = result.filter(
        (ex) => ex.primary_muscle_group === filter.value || ex.secondary_muscle_group === filter.value
      );
    } else if (filter.type === "equipment") {
      const equipmentId = filter.value;
      const predefinedIds = exerciseEquipment
        .filter((ee) => ee.equipment_id === equipmentId)
        .map((ee) => ee.exercise_id);
      const userIds = userExerciseEquipment
        .filter((uee) => uee.equipment_id === equipmentId)
        .map((uee) => uee.user_exercise_id);
      const allIds = new Set([...predefinedIds, ...userIds]);
      result = result.filter((ex) => allIds.has(ex.id));
    } else if (filter.type === "added_by_me") {
      result = result.filter((ex) => ex.source === "user");
    }
    if (searchQuery) {
      result = result.filter((ex) => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [exercises, filter, searchQuery, exerciseEquipment, userExerciseEquipment]);

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