"use client";

import { X, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";
import { useRef } from "react";

interface ExerciseEditorProps {
  exercise: {
    exercise: { name: string };
    sets: { reps: number; weight_kg: number }[];
  };
  onClose: () => void;
  onUpdateSets: (
    exerciseIndex: number,
    sets: { reps: number; weight_kg: number }[]
  ) => void;
  exerciseIndex: number;
}

export function ExerciseEditor({
  exercise,
  onClose,
  onUpdateSets,
  exerciseIndex,
}: ExerciseEditorProps) {
  const { parseInputToKg, convertFromKg, unitLabel } = useUnitPreference();
  const repsInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // **Input Handling for Reps**
  const handleRepsInput = (value: string): number => {
    if (value === "") return 0; // Return 0 for empty input
    const parsed = parseInt(value, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed; // Ensure >= 0
  };

  // **Input Handling for Weight**
  const handleWeightInput = (value: string): number => {
    if (value === "") return 0; // Return 0 for empty input
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) return 0; // Ensure >= 0
    return parseFloat(parsed.toFixed(2)); // Limit to 2 decimal places
  };

  // **Handle Reps Change**
  const handleRepsChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setIndex: number
  ) => {
    const inputValue = e.target.value;
    const reps = handleRepsInput(inputValue);
    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], reps };
    onUpdateSets(exerciseIndex, newSets);
  };

  // **Handle Weight Change**
  const handleWeightChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setIndex: number
  ) => {
    const inputValue = e.target.value;
    const weight = handleWeightInput(inputValue);
    const weightInKg = parseInputToKg(weight.toString());
    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], weight_kg: weightInKg };
    onUpdateSets(exerciseIndex, newSets);
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 rounded-t-3xl z-[101]"
        aria-describedby="exercise-editor-description"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b sticky top-0 bg-background/80 backdrop-blur-lg z-10 glass">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">{exercise.exercise.name}</SheetTitle>
              <span id="exercise-editor-description" className="sr-only">
                Edit sets for {exercise.exercise.name}. You can add, remove, or
                modify sets with reps and weight.
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="rounded-full h-8 w-8 text-primary"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable Sets Editor */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {exercise.sets.map(
                  (set: { reps: number; weight_kg: number }, setIndex: number) => (
                    <motion.div
                      key={setIndex}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0, x: -100 }} // Slide off to the left
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    >
                      <motion.div
                        layout
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={{ left: 0.2, right: 0 }}
                        onDragEnd={(e, { offset }) => {
                          if (offset.x < -100) {
                            const newSets = exercise.sets.filter(
                              (_, i) => i !== setIndex
                            );
                            onUpdateSets(exerciseIndex, newSets);
                          }
                        }}
                        className="relative"
                      >
                        {/* Trash Icon for Swipe-to-Delete */}
                        <div className="absolute right-0 top-0 bottom-0 w-[50px] bg-destructive/10 rounded-r-xl flex items-center justify-center">
                          <Trash className="h-4 w-4 text-destructive" />
                        </div>

                        {/* Set Input Fields */}
                        <motion.div
                          className="relative bg-background rounded-xl glass"
                          style={{ x: 0 }}
                        >
                          <div className="px-4 py-3">
                            <div className="flex gap-3 mb-1">
                              <div className="w-8 text-left" />
                              <div className="w-[140px] text-left">Reps</div>
                              <div className="w-[140px] text-left">
                                Weight ({unitLabel})
                              </div>
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
                                    inputMode="numeric"
                                    value={set.reps || ""}
                                    onChange={(e) => handleRepsChange(e, setIndex)}
                                    className="rounded-xl bg-background text-foreground shadow-sm w-[140px] sm:w-[160px]"
                                    aria-label={`Reps for set ${setIndex + 1}`}
                                    ref={(el) =>
                                      (repsInputRefs.current[setIndex] = el)
                                    }
                                  />
                                </div>
                                <Input
                                  id={`weight-${setIndex}`}
                                  type="text"
                                  inputMode="decimal"
                                  value={convertFromKg(set.weight_kg) || ""}
                                  onChange={(e) =>
                                    handleWeightChange(e, setIndex)
                                  }
                                  className="rounded-xl bg-background text-foreground shadow-sm w-[140px] sm:w-[160px]"
                                  aria-label={`Weight for set ${setIndex + 1}`}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {/* Fixed Bottom with Add Set Button */}
          <div className="p-4 bg-background/80 backdrop-blur-sm border-t">
            <Button
              onClick={() => {
                const newSet: { reps: number; weight_kg: number } = {
                  reps: 0,
                  weight_kg: 0,
                };
                const newSets = [...exercise.sets, newSet];
                onUpdateSets(exerciseIndex, newSets);
                setTimeout(() => {
                  repsInputRefs.current[newSets.length - 1]?.focus(); // Auto-focus new set's reps input
                }, 0);
              }}
              className="w-full rounded-xl h-12 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Add Set
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}