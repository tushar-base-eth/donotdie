"use client"

import { X, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import type { UIExtendedWorkout } from "@/types/workouts"
import type { Set } from "@/types/workouts"
import { useUnitPreference } from "@/lib/hooks/use-unit-preference"

interface ExerciseEditorProps {
  exercise: UIExtendedWorkout["exercises"][0]
  onClose: () => void
  onUpdateSets: (exerciseIndex: number, sets: Set[]) => void
  exerciseIndex: number
}

export function ExerciseEditor({ exercise, onClose, onUpdateSets, exerciseIndex }: ExerciseEditorProps) {
  const { formatWeight, parseInputToKg, convertFromKg, unitLabel } = useUnitPreference()

  const handleNumberInput = (value: string) => {
    // Allow only numbers and one decimal point
    const regex = /^\d*\.?\d*$/
    if (value === "" || regex.test(value)) {
      const numValue = value === "" ? 0 : Number.parseFloat(value)
      if (numValue >= 0) {
        return numValue
      }
    }
    return null
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0" aria-describedby="exercise-editor-description">
        <div className="flex flex-col h-full">
          {/* Header with glassmorphism */}
          <div className="px-6 py-4 border-b sticky top-0 bg-background/80 backdrop-blur-lg z-10 glass">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">{exercise.exercise.name}</SheetTitle>
              <span id="exercise-editor-description" className="sr-only">
                Edit sets for {exercise.exercise.name}. You can add, remove, or modify sets with reps and weight.
              </span>
              <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {exercise.sets.map((set: Set, setIndex: number) => (
                  <motion.div
                    key={set.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  >
                    <motion.div 
                      layout 
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={{ left: 0.2, right: 0 }}
                      onDragEnd={(e, { offset, velocity }) => {
                        const swipe = offset.x;
                        if (swipe < -100) {
                          const newSets = exercise.sets.filter((_, i) => i !== setIndex);
                          onUpdateSets(exerciseIndex, newSets);
                        }
                      }}
                      className="relative"
                    >
                      {/* Delete indicator */}
                      <div className="absolute right-0 top-0 bottom-0 w-[50px] bg-destructive/10 rounded-r-xl flex items-center justify-center">
                        <Trash className="h-4 w-4 text-destructive" />
                      </div>

                      {/* Set card with glassmorphism */}
                      <motion.div 
                        className="relative bg-background rounded-xl glass"
                        style={{ x: 0 }}
                      >
                        <div className="px-4 py-3">
                          <div className="flex gap-3 mb-1">
                            <div className="w-8" /> {/* Spacer for set number */}
                            <div className="w-[140px] text-left">Reps</div>
                            <div className="w-[140px] text-left">Weight ({unitLabel})</div>
                          </div>
                          <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                                  {setIndex + 1}
                                </div>
                                <Input
                                  id={`reps-${setIndex}`}
                                  type="text"
                                  inputMode="decimal"
                                  value={set.reps || ""}
                                  onChange={(e) => {
                                    const newValue = handleNumberInput(e.target.value)
                                    if (newValue !== null) {
                                      const newSets = [...exercise.sets]
                                      newSets[setIndex] = { ...set, reps: newValue }
                                      onUpdateSets(exerciseIndex, newSets)
                                    }
                                  }}
                                  className="rounded-xl bg-background text-foreground shadow-sm w-[140px]"
                                />
                              </div>
                              <Input
                                id={`weight-${setIndex}`}
                                type="text"
                                inputMode="decimal"
                                value={convertFromKg(set.weight_kg) || ""}
                                onChange={(e) => {
                                  const newValue = handleNumberInput(e.target.value)
                                  if (newValue !== null) {
                                    const newSets = [...exercise.sets]
                                    newSets[setIndex] = { ...set, weight_kg: parseInputToKg(e.target.value) }
                                    onUpdateSets(exerciseIndex, newSets)
                                  }
                                }}
                                className="rounded-xl bg-background text-foreground shadow-sm w-[140px]"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add Set button */}
              <motion.div layout>
                <div className="px-4">
                  <div className="flex gap-3">
                    <div className="w-8" /> {/* Spacer for alignment with set number */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newSet: Set = {
                          id: Date.now().toString(),
                          workout_exercise_id: null,
                          reps: 0,
                          weight_kg: 0,
                          created_at: null
                        };
                        const newSets = [...exercise.sets, newSet];
                        onUpdateSets(exerciseIndex, newSets);
                      }}
                      className="rounded-xl h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Add Set
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}