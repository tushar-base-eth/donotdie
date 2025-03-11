# Don't Die! Fitness App - "Categories" Tab Feature Technical Specification

## 1. System Overview
- **Core Purpose and Value Proposition:** Enhance the exercise selection process with a "Categories" tab and adapt the exercise editor to display category-specific inputs, using cached client-side data to ensure fast performance and persistent selections across navigation. This reduces friction for casual gym-goers, increasing engagement and workout creation rates.
- **Key Workflows:**
  1. On initial page load, fetch and cache all exercises (`exercises` and `user_exercises`) in the background using SWR with separate keys.
  2. User opens the exercise selector, selects the "Categories" tab, and navigates through a sliding sheet to filter exercises by category.
  3. User selects exercises; selections persist if they navigate away and return.
  4. User taps an exercise in the workout, opening the editor with inputs tailored to the exercise’s category (e.g., Strength: Reps + Weight).
  5. User adds sets, with units adapting to their profile’s `unit_preference`.
- **System Architecture:** Fully client-side Next.js application with SWR for caching, Supabase as the backend, and React state management for UI interactions.

## 2. Project Structure
- **Updated Files:**
  - **`app/home/page.tsx`:** Triggers eager fetch of exercises on page load and manages workout state.
  - **`components/workout/workout.tsx`:** Manages `selectedExercises` state for persistence across navigation.
  - **`lib/hooks/data-hooks.ts`:** Implements separate SWR keys for `exercises` and `user_exercises`.
  - **`components/workout/exercise-selector.tsx`:** Replaces "By Muscle" with "Categories" and implements nested navigation.
  - **`components/workout/exercise-editor.tsx`:** Adapts input fields based on exercise category and user unit preferences.
  - **`types/workouts.ts`:** Updates `Exercise` type to align with Supabase schema enums and fields.
- **New Components:**
  - **`components/workout/category-list.tsx`:** Renders a static list of categories with icons.
  - **`components/workout/exercise-list.tsx`:** Filters and displays exercises from the SWR cache.
- **Organization:** All new components reside under `components/workout/` to maintain consistency with existing structure.

## 3. Feature Specification
### 3.1 "Categories" Tab Feature
- **User Story and Requirements:**
  - As a casual gym-goer, I want to browse exercises by category using fast, cached data and edit them with inputs tailored to their type (e.g., Reps + Weight for Strength), with my selections persisting if I navigate away and return, so I can build workouts efficiently without delays or re-selection.
- **Detailed Implementation Steps:**
  1. **Eager Fetch on Page Load:**
     - **File:** `app/home/page.tsx`
       ```tsx
       "use client";
       import { useState } from "react";
       import { motion, AnimatePresence } from "framer-motion";
       import { Dumbbell } from "lucide-react";
       import Workout from "@/components/workout/workout";
       import { useAvailableExercises } from "@/lib/hooks/data-hooks";

       export default function HomePage() {
         const { exercises, isLoading } = useAvailableExercises(); // Eager fetch starts on mount
         const [workoutExercises, setWorkoutExercises] = useState([]);

         const handleExercisesChange = (updatedExercises: any) => {
           setWorkoutExercises(updatedExercises);
         };

         return (
           <div className="min-h-screen bg-background pb-16">
             <AnimatePresence mode="wait">
               {workoutExercises.length === 0 && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   transition={{ duration: 0.3 }}
                   className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6 glass rounded-3xl shadow-md"
                   style={{ marginBottom: "60px" }}
                 >
                   <motion.div
                     animate={{ y: [0, -10, 0] }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                     className="relative"
                   >
                     <Dumbbell className="w-20 h-20 text-primary" />
                     <motion.div
                       className="absolute inset-0"
                       animate={{ opacity: [0, 0.2, 0] }}
                       transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                     >
                       <Dumbbell className="w-20 h-20 text-primary blur-md" />
                     </motion.div>
                   </motion.div>
                   <div className="space-y-2">
                     <h2 className="text-2xl font-semibold text-foreground">Don't Die!</h2>
                     <p className="text-lg text-muted-foreground max-w-sm">Smash that + button below</p>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
             <Workout onExercisesChange={handleExercisesChange} />
           </div>
         );
       }
       ```
       - **Change:** Added `useAvailableExercises` to trigger background fetching on page load, ensuring data is ready before user interaction. No blocking occurs due to SWR’s asynchronous nature.

  2. **Persist Selection State in Workout:**
     - **File:** `components/workout/workout.tsx`
       ```tsx
       "use client";
       import { useState, useTransition, useEffect } from "react";
       import { Plus, Save } from "lucide-react";
       import { motion, AnimatePresence } from "framer-motion";
       import { Button } from "@/components/ui/button";
       import { WorkoutExercises } from "@/components/workout/workout-exercises";
       import { ExerciseSelector } from "@/components/workout/exercise-selector";
       import { ExerciseEditor } from "@/components/workout/exercise-editor";
       import { ExerciseSkeleton } from "@/components/loading/exercise-skeleton";
       import { useAuth } from "@/contexts/auth-context";
       import { generateUUID } from "@/lib/utils";
       import type { Exercise, UIExtendedWorkout, NewWorkout, UIWorkoutExercise, Set } from "@/types/workouts";
       import { useRouter } from "next/navigation";
       import { useSaveWorkout } from "@/lib/hooks/data-hooks";
       import { toast } from "@/components/ui/use-toast";

       interface WorkoutProps {
         onExercisesChange?: (exercises: UIExtendedWorkout["exercises"]) => void;
       }

       function WorkoutPage({ onExercisesChange }: WorkoutProps) {
         const { state: authState } = useAuth();
         const { user } = authState;
         const isLoading = authState.status === "loading";
         const router = useRouter();
         const [showExerciseModal, setShowExerciseModal] = useState(false);
         const [isPending, startTransition] = useTransition();
         const { saveWorkout } = useSaveWorkout();

         const [exercises, setExercises] = useState<UIWorkoutExercise[]>([]);
         const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]); // Persisted state
         const [selectedExercise, setSelectedExercise] = useState<UIWorkoutExercise | null>(null);

         useEffect(() => {
           if (!user && !isLoading) router.push("/auth/login");
         }, [user, isLoading, router]);

         useEffect(() => {
           onExercisesChange?.(exercises);
         }, [exercises, onExercisesChange]);

         const isWorkoutValid = exercises.length > 0 && exercises.every((exercise) =>
           exercise.sets.length > 0 && exercise.sets.every((set) =>
             (exercise.exercise.uses_reps ? (set.reps ?? 0) > 0 : true) &&
             (exercise.exercise.uses_weight ? (set.weight_kg ?? 0) > 0 : true)
           )
         );

         const handleExerciseToggle = (exercise: Exercise) => {
           const exists = selectedExercises.some((se) => se.id === exercise.id);
           if (exists) {
             setSelectedExercises(selectedExercises.filter((se) => se.id !== exercise.id));
           } else {
             setSelectedExercises([...selectedExercises, exercise]);
           }
         };

         const handleAddExercises = (selected: Exercise[]) => {
           startTransition(() => {
             const newExercises: UIWorkoutExercise[] = selected.map((exercise, index) => {
               const initialSet: Set = {
                 id: "1",
                 workout_exercise_id: generateUUID(),
                 set_number: 1,
                 reps: exercise.uses_reps ? 0 : null,
                 weight_kg: exercise.uses_weight ? 0 : null,
                 duration_seconds: exercise.uses_duration ? 0 : null,
                 distance_meters: exercise.uses_distance ? 0 : null,
                 created_at: new Date().toISOString(),
               };
               return {
                 instance_id: generateUUID(),
                 id: generateUUID(),
                 workout_id: "",
                 exercise_type: "predefined",
                 predefined_exercise_id: exercise.id,
                 user_exercise_id: null,
                 order: exercises.length + index + 1,
                 effort_level: null,
                 created_at: new Date().toISOString(),
                 exercise,
                 sets: [initialSet],
               };
             });
             setExercises([...exercises, ...newExercises]);
             setSelectedExercises([]); // Clear only on add
             setShowExerciseModal(false);
           });
         };

         const handleUpdateSets = (exerciseIndex: number, newSets: Set[]) => {
           if (exerciseIndex < 0 || exerciseIndex >= exercises.length) return;
           const updatedExercises = [...exercises];
           updatedExercises[exerciseIndex] = { ...updatedExercises[exerciseIndex], sets: newSets };
           setExercises(updatedExercises);
           if (selectedExercise && selectedExercise.instance_id === updatedExercises[exerciseIndex].instance_id) {
             setSelectedExercise(updatedExercises[exerciseIndex]);
           }
         };

         const handleRemoveExercise = (index: number) => {
           startTransition(() => {
             const newExercises = exercises.filter((_, i) => i !== index);
             setExercises(newExercises);
           });
         };

         const handleSaveWorkout = async () => {
           if (!isWorkoutValid || !user || isLoading) return;
           startTransition(async () => {
             try {
               const newWorkout: NewWorkout = {
                 user_id: user.id,
                 exercises: exercises.map((ex) => ({
                   exercise_type: "predefined",
                   predefined_exercise_id: ex.predefined_exercise_id!,
                   order: ex.order,
                   effort_level: ex.effort_level,
                   sets: ex.sets.map((set) => ({
                     set_number: set.set_number,
                     reps: set.reps,
                     weight_kg: set.weight_kg,
                     duration_seconds: set.duration_seconds,
                     distance_meters: set.distance_meters,
                   })),
                 })),
               };
               await saveWorkout(newWorkout);
               setExercises([]);
               setSelectedExercises([]);
               setSelectedExercise(null);
               toast({ title: "Success", description: "Workout saved successfully.", duration: 2000 });
             } catch (error: any) {
               toast({ title: "Error", description: "Failed to save workout.", variant: "destructive", duration: 3000 });
             }
           });
         };

         if (isLoading) return <div className="min-h-screen bg-background p-4"><ExerciseSkeleton /></div>;

         return (
           <div className="min-h-screen bg-background pb-20">
             <div className="p-4 space-y-6">
               {isPending ? (
                 <ExerciseSkeleton />
               ) : (
                 <WorkoutExercises
                   exercises={exercises}
                   onExerciseSelect={setSelectedExercise}
                   onExerciseRemove={handleRemoveExercise}
                 />
               )}
               <div className="fixed bottom-24 right-4 flex flex-col gap-4 z-50">
                 <AnimatePresence>
                   {isWorkoutValid && (
                     <motion.div
                       initial={{ opacity: 0, scale: 0.8, y: 20 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.8, y: 20 }}
                       transition={{ type: "spring", stiffness: 300, damping: 25 }}
                     >
                       <Button
                         size="icon"
                         onClick={handleSaveWorkout}
                         className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
                       >
                         <Save className="h-8 w-8" />
                       </Button>
                     </motion.div>
                   )}
                 </AnimatePresence>
                 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                   <Button
                     size="icon"
                     onClick={() => setShowExerciseModal(true)}
                     className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
                   >
                     <Plus className="h-8 w-8" />
                   </Button>
                 </motion.div>
               </div>
               <ExerciseSelector
                 open={showExerciseModal}
                 onOpenChange={setShowExerciseModal}
                 selectedExercises={selectedExercises}
                 onExerciseToggle={handleExerciseToggle}
                 onAddExercises={handleAddExercises}
               />
               {selectedExercise && (
                 <ExerciseEditor
                   exercise={selectedExercise}
                   onClose={() => setSelectedExercise(null)}
                   onUpdateSets={handleUpdateSets}
                   exerciseIndex={exercises.findIndex((ex) => ex.instance_id === selectedExercise.instance_id)}
                 />
               )}
             </div>
           </div>
         );
       }

       export default function Workout(props: WorkoutProps) {
         return <WorkoutPage {...props} />;
       }
       ```
       - **Change:** Lifted `selectedExercises` state to persist selections across navigation. Clears only on `handleAddExercises`.

  3. **Cache with Separate Keys:**
     - **File:** `lib/hooks/data-hooks.ts`
       ```tsx
       "use client";
       import { useAuth } from "@/contexts/auth-context";
       import useSWR from "swr";
       import { createBrowserClient } from "@supabase/ssr";
       import type { Database } from "@/types/database";
       import type { Exercise } from "@/types/workouts";
       import { useMemo } from "react";

       export const supabase = createBrowserClient<Database>(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
       );

       export function useAvailableExercises() {
         const { state: { user } } = useAuth();
         // Fetch predefined exercises (static, long cache)
         const { data: predefined, error: preError } = useSWR(
           "predefined-exercises",
           async () => {
             const { data, error } = await supabase
               .from("exercises")
               .select("id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance, is_deleted")
               .eq("is_deleted", false);
             if (error) throw error;
             return data as Exercise[];
           },
           { dedupingInterval: 600000 } // 10 minutes
         );
         // Fetch user exercises (dynamic, shorter cache)
         const { data: userData, error: userError, mutate: mutateUser } = useSWR(
           user ? "user-exercises" : null,
           async () => {
             const { data, error } = await supabase
               .from("user_exercises")
               .select("id, name, category, primary_muscle_group, secondary_muscle_group, uses_reps, uses_weight, uses_duration, uses_distance, user_id, created_at")
               .eq("user_id", user!.id);
             if (error) throw error;
             return data.map(ex => ({ ...ex, source: "user" })) as Exercise[];
           },
           { dedupingInterval: 60000 } // 1 minute
         );
         // Combine and memoize for performance
         const exercises = useMemo(() => [...(predefined || []), ...(userData || [])], [predefined, userData]);
         return {
           exercises,
           isLoading: (!preError && !predefined) || (!userError && !userData && user),
           isError: preError || userError,
           mutateUser // For future invalidation
         };
       }
       ```
       - **Change:** Split SWR keys for `exercises` (static) and `user_exercises` (dynamic), added schema-aligned fields, typed as `Exercise`, included `source` for filtering.

  4. **Update Exercise Selector:**
     - **File:** `components/workout/exercise-selector.tsx`
       ```tsx
       "use client";
       import { useState } from "react";
       import { Button, Input, Sheet, SheetContent, SheetTitle, Tabs, TabsList, TabsTrigger } from "@/components/ui/";
       import { motion } from "framer-motion";
       import { ChevronLeft } from "lucide-react";
       import { useAvailableExercises } from "@/lib/hooks/data-hooks";
       import { CategoryList } from "./category-list";
       import { ExerciseList } from "./exercise-list";
       import type { Exercise } from "@/types/workouts";

       interface ExerciseSelectorProps {
         open: boolean;
         onOpenChange: (open: boolean) => void;
         selectedExercises: Exercise[];
         onExerciseToggle: (exercise: Exercise) => void;
         onAddExercises: (selected: Exercise[]) => void;
       }

       export function ExerciseSelector({ open, onOpenChange, selectedExercises, onExerciseToggle, onAddExercises }: ExerciseSelectorProps) {
         const { exercises, isLoading, isError, mutateUser } = useAvailableExercises();
         const [selectedTab, setSelectedTab] = useState<"all" | "categories">("all");
         const [navStack, setNavStack] = useState<string[]>([]);
         const [searchQuery, setSearchQuery] = useState("");

         if (isLoading) return <div className="p-4">Loading exercises...</div>;
         if (isError) return (
           <div className="p-4">
             Failed to load exercises. <Button onClick={() => mutateUser()}>Retry</Button>
           </div>
         );

         const handleAdd = () => {
           onAddExercises(selectedExercises);
           onOpenChange(false);
         };

         return (
           <Sheet open={open} onOpenChange={onOpenChange}>
             <SheetContent side="bottom" className="h-[80vh] px-0 rounded-t-3xl">
               <div className="flex flex-col h-full">
                 <div className="px-6 pb-6 flex items-center border-b">
                   <SheetTitle className="text-xl">Add Exercise</SheetTitle>
                 </div>
                 <div className="px-6 pt-4 space-y-4">
                   <Input
                     placeholder="Search exercises..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="rounded-xl bg-accent/10 border-0"
                   />
                   <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "all" | "categories")}>
                     <TabsList className="w-full p-0.5 h-10 bg-accent/10 rounded-xl">
                       <TabsTrigger value="all" className="flex-1 rounded-lg">All</TabsTrigger>
                       <TabsTrigger value="categories" className="flex-1 rounded-lg">Categories</TabsTrigger>
                     </TabsList>
                   </Tabs>
                 </div>
                 <div className="flex-1 relative">
                   {selectedTab === "all" && (
                     <ExerciseList
                       category="all"
                       searchQuery={searchQuery}
                       selectedExercises={selectedExercises}
                       onExerciseToggle={onExerciseToggle}
                       exercises={exercises}
                     />
                   )}
                   {selectedTab === "categories" && !navStack.length && (
                     <motion.div initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: 100 }}>
                       <CategoryList onCategorySelect={(category) => setNavStack([category])} />
                     </motion.div>
                   )}
                   {navStack.length > 0 && (
                     <motion.div initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: 100 }}>
                       <div className="flex items-center p-4 border-b">
                         <Button variant="ghost" onClick={() => setNavStack(navStack.slice(0, -1))}>
                           <ChevronLeft />
                         </Button>
                         <SheetTitle>{navStack[navStack.length - 1]}</SheetTitle>
                       </div>
                       <ExerciseList
                         category={navStack[navStack.length - 1]}
                         searchQuery={searchQuery}
                         selectedExercises={selectedExercises}
                         onExerciseToggle={onExerciseToggle}
                         exercises={exercises}
                       />
                     </motion.div>
                   )}
                 </div>
                 <div className="p-4 bg-background/80 border-t">
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
       ```
       - **Change:** Replaced "By Muscle" with "Categories", added sliding sheet navigation with `navStack`, uses parent `selectedExercises` for persistence.

  5. **Category List:**
     - **File:** `components/workout/category-list.tsx`
       ```tsx
       "use client";
       import { Dumbbell, Heart, User, ChevronRight } from "lucide-react";
       import { ScrollArea } from "@/components/ui/scroll-area";

       interface CategoryListProps {
         onCategorySelect: (category: string) => void;
       }

       export function CategoryList({ onCategorySelect }: CategoryListProps) {
         const categories = [
           { name: "Strength Training", icon: <Dumbbell />, value: "strength_training" },
           { name: "Cardio", icon: <Heart />, value: "cardio" },
           { name: "Flexibility", icon: <Heart />, value: "flexibility" }, // Placeholder icon
           { name: "By Muscles", icon: <Dumbbell />, value: "by_muscles" },
           { name: "By Equipment", icon: <Dumbbell />, value: "by_equipment" },
           { name: "Added by Me", icon: <User />, value: "added_by_me" },
         ];
         return (
           <ScrollArea className="h-full p-6">
             {categories.map((cat) => (
               <div
                 key={cat.name}
                 className="flex items-center p-4 rounded-3xl hover:bg-accent/5 cursor-pointer"
                 onClick={() => onCategorySelect(cat.value)}
               >
                 {cat.icon}
                 <span className="flex-1 ml-4">{cat.name}</span>
                 <ChevronRight />
               </div>
             ))}
           </ScrollArea>
         );
       }
       ```
       - **Change:** Static list with `exercise_category` enum values, triggers navigation via `onCategorySelect`.

  6. **Exercise List:**
     - **File:** `components/workout/exercise-list.tsx`
       ```tsx
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
             // Placeholder: No direct equipment field; refine with joins later
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
                     className="flex items-center gap-4 p-4 rounded-3xl border cursor-pointer hover:bg-accent/5"
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
                       className={`w-6 h-6 rounded-md border ${selected ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
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
       ```
       - **Change:** Filters cached exercises based on `category` and `searchQuery`, uses `source` for "Added by Me". `by_equipment` is a placeholder pending join logic.

  7. **Adapt Exercise Editor:**
     - **File:** `components/workout/exercise-editor.tsx`
       ```tsx
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

       export function ExerciseEditor({ exercise: initialExercise, onClose, onUpdateSets, exerciseIndex }: ExerciseEditorProps) {
         const { parseInputToKg, convertFromKg, unitLabel } = useUnitPreference();
         const repsInputRefs = useRef<(HTMLInputElement | null)[]>([]);
         const [exercise, setExercise] = useState(initialExercise);

         useEffect(() => setExercise(initialExercise), [initialExercise]);

         // Determine input fields based on category and flags
         const { category } = exercise.exercise;
         const isStrength = category === "strength_training";
         const isCardio = category === "cardio";
         const isFlexibility = category === "flexibility";
         const isBodyweight = category === "other" && exercise.exercise.uses_reps && !exercise.exercise.uses_weight;
         const showReps = isStrength || isBodyweight || exercise.exercise.uses_reps;
         const showWeight = isStrength || exercise.exercise.uses_weight;
         const showDuration = (isCardio || isFlexibility) || exercise.exercise.uses_duration;
         const showDistance = isCardio || exercise.exercise.uses_distance;

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
           const distance_meters = distance; // Stored in meters per schema
           const newSets = [...exercise.sets];
           newSets[setIndex] = { ...newSets[setIndex], distance_meters };
           setExercise({ ...exercise, sets: newSets });
           onUpdateSets(exerciseIndex, newSets);
         };

         useEffect(() => {
           if (exercise.sets.length > 0 && showReps) {
             repsInputRefs.current[exercise.sets.length - 1]?.focus();
           }
         }, [exercise.sets.length, showReps]);

         return (
           <Sheet open={true} onOpenChange={onClose}>
             <SheetContent side="right" className="w-full sm:max-w-lg p-0 rounded-t-3xl z-[101]">
               <div className="flex flex-col h-full">
                 <div className="px-6 py-4 border-b sticky top-0 bg-background/80 backdrop-blur-lg z-10 glass">
                   <div className="flex items-center justify-between">
                     <SheetTitle className="text-xl">{exercise.exercise.name}</SheetTitle>
                     <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full h-8 w-8 text-primary">
                       <X className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
                 <ScrollArea className="flex-1 p-6">
                   <div className="space-y-4">
                     <AnimatePresence>
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
                             className="relative"
                           >
                             <div className="absolute right-0 top-0 bottom-0 w-[50px] bg-destructive/10 rounded-r-xl flex items-center justify-center">
                               <Trash className="h-4 w-4 text-destructive" />
                             </div>
                             <motion.div className="relative bg-background rounded-xl glass">
                               <div className="px-4 py-3">
                                 <div className="flex gap-3 mb-1">
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
                                           className="rounded-xl bg-background text-foreground shadow-sm w-[140px]"
                                           aria-label={`Reps for set ${setIndex + 1}`}
                                           ref={(el) => (repsInputRefs.current[setIndex] = el)}
                                         />
                                       )}
                                       {showWeight && (
                                         <Input
                                           id={`weight-${setIndex}`}
                                           type="text"
                                           inputMode="decimal"
                                           value={convertFromKg(set.weight_kg || 0) || ""}
                                           onChange={(e) => handleWeightChange(e, setIndex)}
                                           className="rounded-xl bg-background text-foreground shadow-sm w-[140px]"
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
                                           className="rounded-xl bg-background text-foreground shadow-sm w-[140px]"
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
                                           className="rounded-xl bg-background text-foreground shadow-sm w-[140px]"
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
                       ))}
                     </AnimatePresence>
                   </div>
                 </ScrollArea>
                 <div className="p-4 bg-background/80 backdrop-blur-sm border-t">
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
       ```
       - **Change:** Adapted inputs based on `category`:
         - Strength (`strength_training`): Reps + Weight.
         - Cardio (`cardio`): Duration + Distance.
         - Flexibility (`flexibility`): Duration.
         - Bodyweight (`other` + `uses_reps` only): Reps.
         - Fallback to `uses_*` flags for custom exercises. Units handled via `useUnitPreference` (kg/lb for weight, meters for distance).

  8. **Update Types:**
     - **File:** `types/workouts.ts`
       ```tsx
       import type { Database } from "./database";

       export interface Exercise {
         id: string;
         name: string;
         category: "strength_training" | "cardio" | "flexibility" | "other";
         primary_muscle_group: "chest" | "back" | "legs" | "arms" | "core" | "full_body" | "other";
         secondary_muscle_group?: "chest" | "back" | "legs" | "arms" | "core" | "full_body" | "other" | null;
         uses_reps: boolean;
         uses_weight: boolean;
         uses_duration: boolean;
         uses_distance: boolean;
         is_deleted?: boolean; // For predefined
         user_id?: string; // For user_exercises
         created_at?: string; // For user_exercises
         source?: "predefined" | "user"; // Distinguish source
       }

       // Existing types remain unchanged unless relevant
       export interface UIWorkoutExercise extends Database["public"]["Tables"]["workout_exercises"]["Row"] {
         instance_id: string;
         exercise: Exercise;
         sets: Set[];
       }

       export interface Set extends Database["public"]["Tables"]["sets"]["Row"] {}
       export interface NewWorkout {
         user_id: string;
         workout_date?: string;
         exercises: {
           exercise_type: Database["public"]["Enums"]["exercise_source"];
           predefined_exercise_id?: string;
           user_exercise_id?: string;
           order: number;
           effort_level?: Database["public"]["Enums"]["effort_level_type"] | null;
           sets: NewSet[];
         }[];
       }
       export interface NewSet {
         set_number: number;
         reps?: number | null;
         weight_kg?: number | null;
         duration_seconds?: number | null;
         distance_meters?: number | null;
       }
       export interface UIExtendedWorkout extends Database["public"]["Tables"]["workouts"]["Row"] {
         exercises: UIWorkoutExercise[];
         date: string;
         time: string;
         totalVolume: number;
       }
       ```
       - **Change:** Updated `Exercise` to match Supabase schema enums (`exercise_category`, `muscle_group`), added `source` for filtering.

- **Error Handling and Edge Cases:**
  - **Loading State:** "Loading exercises..." in `ExerciseSelector` if `isLoading`.
  - **Fetch Failure:** "Failed to load exercises" with retry button in `ExerciseSelector` if `isError`.
  - **Empty Results:** "No exercises found" in `ExerciseList` if `filteredExercises` is empty.
  - **Missing Category:** Fallback to `uses_*` flags in `ExerciseEditor` if `category` is null or unexpected.
  - **Unit Preference:** Defaults to metric in `ExerciseEditor` if not set (per schema).
  - **Navigation Persistence:** `selectedExercises` persists via `Workout` state.

## 4. Database Schema
- **No Changes Required:** Aligns with provided Supabase schema:
  - `exercises`: `category`, `primary_muscle_group`, `uses_reps`, etc.
  - `user_exercises`: Same fields plus `user_id`.
  - `profiles`: `unit_preference` for unit handling.

## 5. Server Actions
### 5.1 Database Actions
- **Fetch All Exercises:**
  - **Description:** Fetches all predefined and user exercises once on page load, cached client-side.
  - **Implementation:** Handled in `useAvailableExercises` with separate SWR keys (`"predefined-exercises"`, `"user-exercises"`).
  - **Queries:**
    - Predefined: `SELECT * FROM exercises WHERE is_deleted = false`
    - User: `SELECT * FROM user_exercises WHERE user_id = $user_id`

## 6. Design System
### 6.1 Visual Style
- **Color Palette:** Reuse existing (`bg-primary`, `text-muted-foreground`).
- **Typography:** Existing sizes (`text-xl` for titles).
- **Component Styling:** `rounded-3xl`, `hover:bg-accent/5`.
- **Spacing:** `p-4`, `space-y-4`.
- **Animations:** `framer-motion` slide transitions (`x: 100` to `x: 0`).

### 6.2 Core Components
- **Layout Structure:** `ScrollArea` for lists in selector and editor.
- **Navigation Patterns:** Sliding sheets with back button in `ExerciseSelector`.
- **Shared Components:** `Button`, `Input`, `Sheet`.
- **Interactive States:**
  - Hover: `hover:bg-accent/5`.
  - Disabled: `opacity-50 cursor-not-allowed`.

## 7. Component Architecture
### 7.1 Server Components
- **None:** All logic is client-side.

### 7.2 Client Components
- **State Management:**
  - `Workout`: `selectedExercises` (persistent), `exercises`, `selectedExercise`.
  - `ExerciseSelector`: `navStack`, `searchQuery`.
  - `ExerciseEditor`: `exercise` (local copy).
- **Event Handlers:**
  - `onCategorySelect`, `onExerciseToggle` in `ExerciseSelector`.
  - `handleRepsChange`, `handleWeightChange`, etc., in `ExerciseEditor`.
- **Props Interfaces:**
  ```tsx
  interface ExerciseSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedExercises: Exercise[];
    onExerciseToggle: (exercise: Exercise) => void;
    onAddExercises: (selected: Exercise[]) => void;
  }
  interface CategoryListProps {
    onCategorySelect: (category: string) => void;
  }
  interface ExerciseListProps {
    category: string;
    searchQuery: string;
    selectedExercises: Exercise[];
    onExerciseToggle: (exercise: Exercise) => void;
    exercises: Exercise[];
  }
  interface ExerciseEditorProps {
    exercise: UIWorkoutExercise;
    onClose: () => void;
    onUpdateSets: (exerciseIndex: number, sets: Set[]) => void;
    exerciseIndex: number;
  }
  ```

## 8. Authentication & Authorization
- **Implementation:** Use existing `useAuth` from `auth-context.tsx`.
- **Details:**
  - `user.id` filters `user_exercises` in `useAvailableExercises`.
  - `unit_preference` from profile drives unit display in `ExerciseEditor`.

## 9. Data Flow
- **Server/Client Data Passing:** SWR fetches exercises client-side, passed via props from `Workout` to `ExerciseSelector` and `ExerciseEditor`.
- **State Management Architecture:**
  - SWR cache → `Workout` (persistent state) → `ExerciseSelector` (navigation/filtering) → `ExerciseEditor` (set editing).
  - React state manages UI interactions locally within components.

---

### Documentation Notes
- **Eager Fetch:** Added `useAvailableExercises` in `app/home/page.tsx` to start fetching early, improving perceived performance without blocking render.
- **State Persistence:** Lifted `selectedExercises` to `Workout`, ensuring selections persist across navigation; cleared only on `handleAddExercises`.
- **Separate Caches:** Split SWR keys in `useAvailableExercises` (`"predefined-exercises"`, `"user-exercises"`) with different `dedupingInterval`s (10 min vs. 1 min) to optimize refetching.
- **Exercise Editor Adaptation:** Modified `exercise-editor.tsx` to display inputs based on `category` (Strength: Reps + Weight, Cardio: Duration + Distance, etc.), with fallback to `uses_*` flags, and units via `useUnitPreference`.
- **Type Safety:** Updated `Exercise` type in `types/workouts.ts` to match Supabase schema enums (`exercise_category`, `muscle_group`) and added `source` field.
- **Units and Numbers:** Handled correctly in `ExerciseEditor`:
  - `weight_kg` (NUMERIC(5,1)): Converted to/from kg/lb via `useUnitPreference`.
  - `duration_seconds` (INTEGER): Kept in seconds.
  - `distance_meters` (NUMERIC(7,1)): Kept in meters.
- **Performance:** Used `useMemo` in `ExerciseList` for filtering, limited animations to simple slides, and minimized state changes.

This final specification provides a comprehensive, precise guide for implementing the "Categories" tab feature, including all requested functionality, and is ready for AI-driven planning and code generation.