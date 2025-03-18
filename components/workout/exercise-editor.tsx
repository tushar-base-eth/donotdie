"use client";

import { useState, useEffect, useRef } from "react";
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
  const { isImperial, unitLabel } = useUnitPreference();
  const repsInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [exercise, setExercise] = useState(initialExercise);

  useEffect(() => {
    setExercise(initialExercise);
  }, [initialExercise]);

  const { uses_reps, uses_weight, uses_duration, uses_distance } = exercise.exercise;
  const showReps = uses_reps;
  const showWeight = uses_weight;
  const showDuration = uses_duration;
  const showDistance = uses_distance;

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
    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], weight_kg: weight };
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
    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], distance_meters: distance };
    setExercise({ ...exercise, sets: newSets });
    onUpdateSets(exerciseIndex, newSets);
  };

  useEffect(() => {
    if (exercise.sets.length > 0 && showReps) {
      const lastSetIndex = exercise.sets.length - 1;
      repsInputRefs.current[lastSetIndex]?.focus();
    }
  }, [exercise.sets.length, showReps]);

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 rounded-t-3xl z-[101]"
        aria-describedby="exercise-editor-description"
      >
        <div className="flex flex-col h-full bg-background">
          <div className="px-6 py-4 border-b bg-background z-10">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl text-foreground">{exercise.exercise.name}</SheetTitle>
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
                {exercise.sets.map((set: Set, setIndex: number) => (
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
                      className="relative bg-card"
                    >

                      <div className="px-4 py-3">
                        <div className="flex gap-3 mb-1 text-foreground">
                          <div className="w-8 text-left" />
                          {showReps && <div className="w-[140px] text-left">Reps</div>}
                          {showWeight && <div className="w-[140px] text-left">Weight ({unitLabel})</div>}
                          {showDuration && <div className="w-[140px] text-left">Duration (s)</div>}
                          {showDistance && <div className="w-[140px] text-left">Distance (m)</div>}
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                                {setIndex + 1}
                              </div>
                              {showReps && (
                                <Input
                                  id={`reps-${setIndex}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={set.reps || ""}
                                  onChange={(e) => handleRepsChange(e, setIndex)}
                                  className="rounded-lg bg-card text-foreground w-[140px] sm:w-[160px]"
                                  aria-label={`Reps for set ${setIndex + 1}`}
                                  ref={(el) => {
                                    repsInputRefs.current[setIndex] = el;
                                  }}
                                />
                              )}
                              {showWeight && (
                                <Input
                                  id={`weight-${setIndex}`}
                                  type="text"
                                  inputMode="decimal"
                                  value={set.weight_kg || ""}
                                  onChange={(e) => handleWeightChange(e, setIndex)}
                                  className="rounded-lg bg-card text-foreground w-[140px] sm:w-[160px]"
                                  aria-label={`Weight for set ${setIndex + 1}`}
                                />
                              )}
                              {showDuration && (
                                <Input
                                  id={`duration-${setIndex}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={set.duration_seconds || ""}
                                  onChange={(e) => handleDurationChange(e, setIndex)}
                                  className="rounded-lg bg-card text-foreground w-[140px] sm:w-[160px]"
                                  aria-label={`Duration for set ${setIndex + 1}`}
                                />
                              )}
                              {showDistance && (
                                <Input
                                  id={`distance-${setIndex}`}
                                  type="text"
                                  inputMode="decimal"
                                  value={set.distance_meters || ""}
                                  onChange={(e) => handleDistanceChange(e, setIndex)}
                                  className="rounded-lg bg-card text-foreground w-[140px] sm:w-[160px]"
                                  aria-label={`Distance for set ${setIndex + 1}`}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-card">
            <Button
              onClick={() => {
                const setNumber = exercise.sets.length + 1;
                const newSet: Set = {
                  id: String(setNumber),
                  workout_exercise_id: exercise.id,
                  set_number: setNumber,
                  reps: showReps ? 0 : null,
                  weight_kg: showWeight ? 0 : null,
                  duration_seconds: showDuration ? 0 : null,
                  distance_meters: showDistance ? 0 : null,
                  created_at: new Date().toISOString(),
                };
                const newSets = [...exercise.sets, newSet];
                setExercise({ ...exercise, sets: newSets });
                onUpdateSets(exerciseIndex, newSets);
              }}
              className="w-full rounded-lg h-12 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Add Set
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}