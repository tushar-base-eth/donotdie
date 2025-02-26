"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { WorkoutExercise } from "@/types/exercises"

interface WorkoutExercisesProps {
  exercises: WorkoutExercise[]
  onExerciseSelect: (exercise: WorkoutExercise) => void
  onExerciseRemove: (index: number) => void
}

export function WorkoutExercises({ exercises, onExerciseSelect, onExerciseRemove }: WorkoutExercisesProps) {
  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <AnimatePresence initial={false}>
        {exercises.map((exercise, index) => (
          <motion.div
            key={exercise.exercise.id}
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
                  onExerciseRemove(index)
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
                whileDrag={{
                  opacity: 1,
                  transition: { duration: 0.2 },
                }}
              >
                <span className="text-destructive-foreground font-medium">Delete</span>
              </motion.div>

              <Card
                className="mb-4 overflow-hidden hover:bg-accent/5 transition-colors cursor-pointer"
                onClick={() => onExerciseSelect(exercise)}
              >
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold">{exercise.exercise.name}</h3>
                  <p className="text-muted-foreground">
                    {exercise.exercise.primary_muscle_group} • {exercise.sets.length} set
                    {exercise.sets.length !== 1 ? "s" : ""} •{" "}
                    {exercise.sets.reduce((acc, set) => acc + set.weight_kg * set.reps, 0)}
                    kg
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </ScrollArea>
  )
}

