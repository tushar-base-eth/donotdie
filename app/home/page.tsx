"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell } from "lucide-react";
import Workout from "@/components/workout/workout";
import { useAvailableExercises } from "@/lib/hooks/data-hooks";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const { exercises, isLoading } = useAvailableExercises(); // Eager fetch on mount
  const [exercisesState, setExercisesState] = useState([]);

  const handleExercisesChange = (updatedExercises: any) => {
    setExercisesState(updatedExercises);
  };

  return (
    <div className="min-h-screen bg-background pb-16 p-8">
      <AnimatePresence mode="wait">
        {exercisesState.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-8 glass rounded-xl shadow-lg"
            style={{ marginBottom: "60px" }}
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
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
            <Card className="glass shadow-lg rounded-xl">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-foreground">Don't Die!</h2>
                <p className="text-lg text-muted-foreground max-w-sm mt-2">Smash that + button below to start your workout</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {isLoading && (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
      <Workout onExercisesChange={handleExercisesChange} />
    </div>
  );
}