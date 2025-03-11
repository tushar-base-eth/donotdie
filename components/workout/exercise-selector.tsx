"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useAvailableExercises } from "@/lib/hooks/data-hooks";
import type { Exercise } from "@/types/workouts";
import { useAuth } from "@/contexts/auth-context";
import { CategoryList } from "@/components/workout/category-list";
import { ExerciseList } from "@/components/workout/exercise-list";

interface ExerciseSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedExercises: Exercise[];
  onExerciseToggle: (exercise: Exercise) => void;
  onAddExercises: (selected: Exercise[]) => void;
}

export function ExerciseSelector({
  open,
  onOpenChange,
  selectedExercises,
  onExerciseToggle,
  onAddExercises,
}: ExerciseSelectorProps) {
  const { state: authState } = useAuth();
  const { user } = authState;
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedTab, setSelectedTab] = useState<"all" | "categories">("all");
  const [navStack, setNavStack] = useState<string[]>([]);

  const { exercises: availableExercises, isLoading, isError, mutate } = useAvailableExercises();

  if (isLoading) {
    return <div className="p-4">Loading exercises...</div>;
  }

  if (isError) {
    return (
      <div className="p-4">
        Failed to load exercises.{" "}
        <button onClick={() => mutate()} className="text-blue-500 underline">
          Retry
        </button>
      </div>
    );
  }

  const handleAdd = () => {
    onAddExercises(selectedExercises);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[80vh] px-0 z-[101] rounded-t-3xl"
        aria-describedby="exercise-selector-description"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full">
          <div className="px-6 pb-6 flex items-center border-b">
            <SheetTitle className="text-xl">Add Exercise</SheetTitle>
            <span id="exercise-selector-description" className="sr-only">
              Select exercises to add to your workout. You can search or filter by category.
            </span>
          </div>

          <div className="px-6 pt-4 space-y-4">
            <Input
              ref={inputRef}
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl bg-accent/10 border-0"
              autoFocus={false}
            />
            <Tabs
              value={selectedTab}
              onValueChange={(value) => {
                setSelectedTab(value as "all" | "categories");
                setNavStack([]);
              }}
              className="w-full"
            >
              <TabsList className="w-full p-0.5 h-10 bg-accent/10 rounded-xl">
                <TabsTrigger value="all" className="flex-1 rounded-lg">
                  All
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex-1 rounded-lg">
                  Categories
                </TabsTrigger>
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
                exercises={availableExercises}
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
                  exercises={availableExercises}
                />
              </motion.div>
            )}
          </div>

          <div className="p-4 bg-background/80 backdrop-blur-sm border-t">
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