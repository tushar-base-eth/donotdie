"use client";

import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useAvailableExercises } from "@/lib/hooks/data-hooks";
import type { Exercise, Filter } from "@/types/workouts";
import { useAuth } from "@/contexts/auth-context";
import { CategoryList } from "./category-list";
import { ExerciseList } from "./exercise-list";
import { MuscleGroupList } from "./muscle-group-list";
import { EquipmentList } from "./equipment-list";

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

  const { exercises, equipment, exerciseEquipment, userExerciseEquipment, isLoading, isError, mutate } = useAvailableExercises();

  const muscleGroups = useMemo(() => {
    const groups = new Set<string>();
    exercises.forEach(ex => {
      if (ex.primary_muscle_group) groups.add(ex.primary_muscle_group);
      if (ex.secondary_muscle_group) groups.add(ex.secondary_muscle_group);
    });
    return Array.from(groups).sort();
  }, [exercises]);

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

  const buttonText = selectedExercises.length === 0
    ? "Add Exercise"
    : `Add ${selectedExercises.length} Exercise${selectedExercises.length > 1 ? "s" : ""}`;

  const getFilterFromNavStack = (navStack: string[]): Filter => {
    if (navStack.length === 1) {
      if (navStack[0] === "added_by_me") {
        return { type: "added_by_me" };
      } else {
        return { type: "category", value: navStack[0] };
      }
    } else if (navStack.length === 2) {
      if (navStack[0] === "by_muscles") {
        return { type: "muscle", value: navStack[1] };
      } else if (navStack[0] === "by_equipment") {
        return { type: "equipment", value: navStack[1] };
      }
    }
    return { type: "all" };
  };

  const getTitle = () => {
    if (selectedTab === "all") return "All Exercises";
    if (navStack.length === 0) return "Categories";
    if (navStack.length === 1) {
      if (navStack[0] === "by_muscles") return "Select Muscle Group";
      if (navStack[0] === "by_equipment") return "Select Equipment";
      return navStack[0].replace('_', ' ');
    }
    if (navStack.length === 2) {
      if (navStack[0] === "by_muscles") return `${navStack[1]}`;
      if (navStack[0] === "by_equipment") {
        const equipmentName = equipment.find(eq => eq.id === navStack[1])?.name || "Equipment";
        return `${equipmentName}`;
      }
    }
    return "Exercises";
  };

  // Handler to reset navStack when "Categories" tab is clicked
  const handleCategoriesClick = () => {
    if (selectedTab !== "categories" || navStack.length > 0) {
      setSelectedTab("categories");
      setNavStack([]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[80vh] px-0 z-[101] rounded-t-3xl flex flex-col"
        aria-describedby="exercise-selector-description"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="px-6 pb-6 flex items-center border-b shrink-0">
          {navStack.length > 0 && (
            <Button variant="ghost" onClick={() => setNavStack(navStack.slice(0, -1))} className="mr-2">
              <ChevronLeft />
            </Button>
          )}
          <SheetTitle className="text-xl">{getTitle()}</SheetTitle>
          <span id="exercise-selector-description" className="sr-only">
            Select exercises to add to your workout. You can search or filter by category.
          </span>
        </div>

        <div className="px-6 pt-4 space-y-4 shrink-0">
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
              const newTab = value as "all" | "categories";
              setSelectedTab(newTab);
              if (newTab === "categories" && navStack.length > 0) {
                setNavStack([]);
              }
            }}
            className="w-full"
          >
            <TabsList className="w-full p-0.5 h-10 bg-accent/10 rounded-xl">
              <TabsTrigger value="all" className="flex-1 rounded-lg">
                All
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="flex-1 rounded-lg"
                onClick={handleCategoriesClick} // Added custom click handler
              >
                Categories
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {selectedTab === "all" && (
              <ExerciseList
                filter={{ type: "all" }}
                searchQuery={searchQuery}
                selectedExercises={selectedExercises}
                onExerciseToggle={onExerciseToggle}
                exercises={exercises}
                exerciseEquipment={exerciseEquipment}
                userExerciseEquipment={userExerciseEquipment}
              />
            )}
            {selectedTab === "categories" && navStack.length === 0 && (
              <motion.div initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: 100 }}>
                <CategoryList onCategorySelect={(category) => setNavStack([category])} />
              </motion.div>
            )}
            {selectedTab === "categories" && navStack.length === 1 && navStack[0] === "by_muscles" && (
              <motion.div initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: 100 }}>
                <MuscleGroupList muscleGroups={muscleGroups} onSelect={(muscle) => setNavStack([...navStack, muscle])} />
              </motion.div>
            )}
            {selectedTab === "categories" && navStack.length === 1 && navStack[0] === "by_equipment" && (
              <motion.div initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: 100 }}>
                <EquipmentList equipment={equipment} onSelect={(eqId) => setNavStack([...navStack, eqId])} />
              </motion.div>
            )}
            {selectedTab === "categories" && (navStack.length > 1 || (navStack.length === 1 && navStack[0] !== "by_muscles" && navStack[0] !== "by_equipment")) && (
              <motion.div initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: 100 }}>
                <ExerciseList
                  filter={getFilterFromNavStack(navStack)}
                  searchQuery={searchQuery}
                  selectedExercises={selectedExercises}
                  onExerciseToggle={onExerciseToggle}
                  exercises={exercises}
                  exerciseEquipment={exerciseEquipment}
                  userExerciseEquipment={userExerciseEquipment}
                />
              </motion.div>
            )}
          </ScrollArea>
        </div>

        <div className="p-4 bg-background/80 backdrop-blur-sm border-t shrink-0">
          <Button
            onClick={handleAdd}
            disabled={selectedExercises.length === 0}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12"
          >
            {buttonText}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}