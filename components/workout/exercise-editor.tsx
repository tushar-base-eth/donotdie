"use client";

import { useState, useEffect, useRef } from "react"; // Added useState
import { X, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";
import type { UIWorkoutExercise, Set } from "@/types/workouts";

interface ExerciseEditorProps {
  exercise: UIWorkoutExercise;
  onClose: () => void;
  onUpdateSets: (exerciseIndex: number, sets: Set[]) => void;
  exerciseIndex: number;
}

export function ExerciseEditor({
  exercise: initialExercise,
  onClose,
  onUpdateSets,
  exerciseIndex,
}: ExerciseEditorProps) {
  const { parseInputToKg, convertFromKg, unitLabel } = useUnitPreference();
  const repsInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { uses_reps, uses_weight, uses_duration, uses_distance } = initialExercise.exercise;

  // Local state to ensure immediate UI updates
  const [exercise, setExercise] = useState(initialExercise);

  // Sync local state with prop changes
  useEffect(() => {
    setExercise(initialExercise);
  }, [initialExercise]);

  const handleInput = (value: string, isInt: boolean = false): number => {
    if (value === "") return 0;
    const parsed = isInt ? parseInt(value, 10) : parseFloat(value);
    return isNaN(parsed) || parsed < 0 ? 0 : isInt ? parsed : parseFloat(parsed.toFixed(2));
  };

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>, setIndex: number) => {
    const reps = handleInput(e.target.value, true);
    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], reps };
    setExercise({ ...exercise, sets: newSets });
    onUpdateSets(exerciseIndex, newSets);
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>, setIndex: number) => {
    const weight = handleInput(e.target.value);
    const weightInKg = parseInputToKg(weight.toString());
    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], weight_kg: weightInKg };
    setExercise({ ...exercise, sets: newSets });
    onUpdateSets(exerciseIndex, newSets);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>, setIndex: number) => {
    const duration_seconds = handleInput(e.target.value, true);
    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], duration_seconds };
    setExercise({ ...exercise, sets: newSets });
    onUpdateSets(exerciseIndex, newSets);
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>, setIndex: number) => {
    const distance = handleInput(e.target.value);
    const distance_meters = distance;
    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], distance_meters };
    setExercise({ ...exercise, sets: newSets });
    onUpdateSets(exerciseIndex, newSets);
  };

  useEffect(() => {
    console.log("ExerciseEditor useEffect triggered - sets length:", exercise.sets.length, "uses_reps:", uses_reps);
    if (exercise.sets.length > 0 && uses_reps) {
      const lastSetIndex = exercise.sets.length - 1;
      console.log("Focusing on set index:", lastSetIndex, "ref:", repsInputRefs.current[lastSetIndex]);
      repsInputRefs.current[lastSetIndex]?.focus();
    }
  }, [exercise.sets.length, uses_reps]);

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 rounded-t-3xl z-[101]"
        aria-describedby="exercise-editor-description"
      >
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b sticky top-0 bg-background/80 backdrop-blur-lg z-10 glass">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">{exercise.exercise.name}</SheetTitle>
              <span id="exercise-editor-description" className="sr-only">
                Edit sets for {exercise.exercise.name}.
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

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {exercise.sets.map((set: Set, setIndex: number) => {
                  console.log("Rendering set:", set.id, "setIndex:", setIndex, "set_number:", set.set_number);
                  return (
                    <motion.div
                      key={set.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0, x: -100 }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    >
                      <motion.div
                        layout
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={{ left: 0.2, right: 0 }}
                        onDragEnd={(e, { offset }) => {
                          if (offset.x < -100) {
                            const newSets = exercise.sets.filter((_, i) => i !== setIndex);
                            setExercise({ ...exercise, sets: newSets });
                            onUpdateSets(exerciseIndex, newSets);
                          }
                        }}
                        className="relative"
                      >
                        <div className="absolute right-0 top-0 bottom-0 w-[50px] bg-destructive/10 rounded-r-xl flex items-center justify-center">
                          <Trash className="h-4 w-4 text-destructive" />
                        </div>

                        <motion.div className="relative bg-background rounded-xl glass">
                          <div className="px-4 py-3">
                            <div className="flex gap-3 mb-1">
                              <div className="w-8 text-left" />
                              {uses_reps && <div className="w-[140px] text-left">Reps</div>}
                              {uses_weight && (
                                <div className="w-[140px] text-left">Weight ({unitLabel})</div>
                              )}
                              {uses_duration && (
                                <div className="w-[140px] text-left">Duration (s)</div>
                              )}
                              {uses_distance && (
                                <div className="w-[140px] text-left">Distance (m)</div>
                              )}
                            </div>
                            <div className="flex flex-col gap-3">
                              <div className="flex gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                                    {setIndex + 1}
                                  </div>
                                  {uses_reps && (
                                    <Input
                                      id={`reps-${setIndex}`}
                                      type="text"
                                      inputMode="numeric"
                                      value={set.reps || ""}
                                      onChange={(e) => handleRepsChange(e, setIndex)}
                                      className="rounded-xl bg-background text-foreground shadow-sm w-[140px] sm:w-[160px]"
                                      aria-label={`Reps for set ${setIndex + 1}`}
                                      ref={(el) => {
                                        repsInputRefs.current[setIndex] = el;
                                      }}
                                    />
                                  )}
                                  {uses_weight && (
                                    <Input
                                      id={`weight-${setIndex}`}
                                      type="text"
                                      inputMode="decimal"
                                      value={convertFromKg(set.weight_kg || 0) || ""}
                                      onChange={(e) => handleWeightChange(e, setIndex)}
                                      className="rounded-xl bg-background text-foreground shadow-sm w-[140px] sm:w-[160px]"
                                      aria-label={`Weight for set ${setIndex + 1}`}
                                    />
                                  )}
                                  {uses_duration && (
                                    <Input
                                      id={`duration-${setIndex}`}
                                      type="text"
                                      inputMode="numeric"
                                      value={set.duration_seconds || ""}
                                      onChange={(e) => handleDurationChange(e, setIndex)}
                                      className="rounded-xl bg-background text-foreground shadow-sm w-[140px] sm:w-[160px]"
                                      aria-label={`Duration for set ${setIndex + 1}`}
                                    />
                                  )}
                                  {uses_distance && (
                                    <Input
                                      id={`distance-${setIndex}`}
                                      type="text"
                                      inputMode="decimal"
                                      value={set.distance_meters || ""}
                                      onChange={(e) => handleDistanceChange(e, setIndex)}
                                      className="rounded-xl bg-background text-foreground shadow-sm w-[140px] sm:w-[160px]"
                                      aria-label={`Distance for set ${setIndex + 1}`}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>

          <div className="p-4 bg-background/80 backdrop-blur-sm border-t">
            <Button
              onClick={() => {
                const setNumber = exercise.sets.length + 1;
                const newSet: Set = {
                  id: String(setNumber), // Simplified ID
                  workout_exercise_id: exercise.id,
                  set_number: setNumber,
                  reps: uses_reps ? 0 : null,
                  weight_kg: uses_weight ? 0 : null,
                  duration_seconds: uses_duration ? 0 : null,
                  distance_meters: uses_distance ? 0 : null,
                  created_at: new Date().toISOString(),
                };
                const newSets = [...exercise.sets, newSet];
                console.log("Adding set:", newSet, "to exercise index:", exerciseIndex);
                setExercise({ ...exercise, sets: newSets });
                onUpdateSets(exerciseIndex, newSets);
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