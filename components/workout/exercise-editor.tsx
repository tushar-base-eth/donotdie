"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import type { Set, WorkoutExercise } from "@/types/exercises"

interface ExerciseEditorProps {
  exercise: WorkoutExercise
  onClose: () => void
  onUpdateSets: (exerciseIndex: number, newSets: Set[]) => void
  exerciseIndex: number
}

export function ExerciseEditor({ exercise, onClose, onUpdateSets, exerciseIndex }: ExerciseEditorProps) {
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
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b sticky top-0 bg-background/80 backdrop-blur-lg z-10">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">{exercise.exercise.name}</SheetTitle>
              <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              <AnimatePresence initial={false}>
                {exercise.sets.map((set, setIndex) => (
                  <motion.div
                    key={setIndex}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
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
                          const newSets = [...exercise.sets]
                          newSets.splice(setIndex, 1)
                          onUpdateSets(exerciseIndex, newSets)
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
                              <Label htmlFor={`weight-${setIndex}`}>Weight (kg)</Label>
                              <Input
                                id={`weight-${setIndex}`}
                                type="text"
                                inputMode="decimal"
                                value={set.weight_kg || ""}
                                onChange={(e) => {
                                  const newValue = handleNumberInput(e.target.value)
                                  if (newValue !== null) {
                                    const newSets = [...exercise.sets]
                                    newSets[setIndex] = { ...set, weight_kg: newValue }
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
                    const newSets = [...exercise.sets, { weight_kg: 0, reps: 0 }]
                    onUpdateSets(exerciseIndex, newSets)
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

