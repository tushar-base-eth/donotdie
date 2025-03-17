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
import { useUserProfile } from "@/contexts/profile-context";
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
    return (
      <div className="p-6 text-center text-muted-foreground text-sm font-medium">
        Loading exercises...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-foreground font-medium mb-2">Failed to load exercises</p>
        <Button
          variant="ghost"
          onClick={() => mutate()}
          className="text-primary hover:bg-primary/10 rounded-lg px-4 py-2 transition-all duration-300"
        >
          Retry
        </Button>
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
        className="h-[80vh] px-0 z-[101] rounded-t-xl bg-background/85 glass shadow-lg flex flex-col"
        aria-describedby="exercise-selector-description"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="px-6 py-4 flex items-center border-b border-border/50 shrink-0 bg-background/90 backdrop-blur-lg">
          {navStack.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setNavStack(navStack.slice(0, -1))}
              className="mr-2 rounded-full h-8 w-8 text-primary hover:bg-primary/10 transition-all duration-300"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <SheetTitle className="text-xl font-semibold text-foreground">{getTitle()}</SheetTitle>
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
            className="rounded-lg bg-background shadow-md border-input focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
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
            <TabsList className="w-full p-1 h-10 bg-muted/50 rounded-lg grid grid-cols-2 gap-2">
              <TabsTrigger
                value="all"
                className="rounded-md py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="rounded-md py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                onClick={handleCategoriesClick}
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
              <motion.div
                initial={{ x: 100 }}
                animate={{ x: 0 }}
                exit={{ x: 100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <CategoryList onCategorySelect={(category) => setNavStack([category])} />
              </motion.div>
            )}
            {selectedTab === "categories" && navStack.length === 1 && navStack[0] === "by_muscles" && (
              <motion.div
                initial={{ x: 100 }}
                animate={{ x: 0 }}
                exit={{ x: 100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <MuscleGroupList muscleGroups={muscleGroups} onSelect={(muscle) => setNavStack([...navStack, muscle])} />
              </motion.div>
            )}
            {selectedTab === "categories" && navStack.length === 1 && navStack[0] === "by_equipment" && (
              <motion.div
                initial={{ x: 100 }}
                animate={{ x: 0 }}
                exit={{ x: 100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <EquipmentList equipment={equipment} onSelect={(eqId) => setNavStack([...navStack, eqId])} />
              </motion.div>
            )}
            {selectedTab === "categories" && (navStack.length > 1 || (navStack.length === 1 && navStack[0] !== "by_muscles" && navStack[0] !== "by_equipment")) && (
              <motion.div
                initial={{ x: 100 }}
                animate={{ x: 0 }}
                exit={{ x: 100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
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

        <div className="p-6 bg-background/90 backdrop-blur-sm border-t border-border/50 shrink-0">
          <Button
            onClick={handleAdd}
            disabled={selectedExercises.length === 0}
            className="w-full rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-md"
          >
            {buttonText}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}