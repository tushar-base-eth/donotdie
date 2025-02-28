"use client"

import { X } from "lucide-react"
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
          <div className="px-6 py-4 border-b sticky top-0 bg-background/80 backdrop-blur-lg z-10">
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
                    <motion.div layout className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#4B7BFF]/10 dark:bg-red-500/10 flex items-center justify-center text-[#4B7BFF] dark:text-red-500 font-medium">
                            {setIndex + 1}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const newSets = exercise.sets.filter((_, i) => i !== setIndex)
                            onUpdateSets(exerciseIndex, newSets)
                          }}
                          className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <Card className="p-4 bg-accent/5 border-0">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`reps-${setIndex}`}>Reps</Label>
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
                                className="rounded-xl bg-background text-foreground"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`weight-${setIndex}`}>Weight ({unitLabel})</Label>
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
                                className="rounded-xl bg-background text-foreground"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.div layout>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newSet: Set = {
                      id: crypto.randomUUID(),
                      workout_exercise_id: null,
                      reps: 0,
                      weight_kg: 0,
                      created_at: null
                    };
                    const newSets = [...exercise.sets, newSet];
                    onUpdateSets(exerciseIndex, newSets);
                  }}
                  className="w-full rounded-xl h-10"
                >
                  Add Set
                </Button>
              </motion.div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}

