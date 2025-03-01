"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell } from "lucide-react";
import Workout from "@/components/workout/workout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useWorkout } from "@/contexts/workout-context";

export default function HomePage() {
  const { state } = useWorkout();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AnimatePresence mode="wait">
          {state.currentWorkout.exercises.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6"
              style={{ marginTop: "-60px" }} // Adjust for header and bottom nav
            >
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <div className="relative">
                  <Dumbbell className="w-20 h-20 text-[#4B7BFF] dark:text-red-500" />
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      opacity: [0, 0.2, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  >
                    <Dumbbell className="w-20 h-20 text-[#4B7BFF] dark:text-red-500 blur-lg" />
                  </motion.div>
                </div>
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  Don't Die!
                </h2>
                <p className="text-lg text-muted-foreground max-w-sm">
                  Smash that + button below
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Workout />
      </div>
    </ProtectedRoute>
  );
}