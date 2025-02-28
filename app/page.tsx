"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Dumbbell, Flame, Trophy, TrendingUp } from "lucide-react";

export default function LandingPage() {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "authenticated") {
      router.replace("/home");
    }
  }, [state.status, router]);

  if (state.status === "authenticated" || state.status === "loading") {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="landing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-background flex flex-col"
      >
        <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-12">
          {/* Logo and Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-4"
          >
            <h1 className="text-6xl font-bold bg-gradient-to-r from-[#4B7BFF] to-[#6B8FFF] dark:from-red-500 dark:to-red-600 bg-clip-text text-transparent animate-gradient">
              Do Not Die
            </h1>
            <p className="text-xl text-muted-foreground">
              Transform yourself, one rep at a time
            </p>
          </motion.div>

          {/* Feature Grid */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-6 w-full max-w-lg"
          >
            <div className="bg-[#4B7BFF]/10 dark:bg-red-500/10 rounded-2xl p-6 text-center">
              <Dumbbell className="w-10 h-10 mx-auto mb-3 text-[#4B7BFF] dark:text-red-500" />
              <h3 className="font-semibold text-lg">Track Workouts</h3>
              <p className="text-sm text-muted-foreground">Log your progress</p>
            </div>
            <div className="bg-[#4B7BFF]/10 dark:bg-red-500/10 rounded-2xl p-6 text-center">
              <Flame className="w-10 h-10 mx-auto mb-3 text-[#4B7BFF] dark:text-red-500" />
              <h3 className="font-semibold text-lg">Stay Active</h3>
              <p className="text-sm text-muted-foreground">Build consistency</p>
            </div>
            <div className="bg-[#4B7BFF]/10 dark:bg-red-500/10 rounded-2xl p-6 text-center">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-[#4B7BFF] dark:text-red-500" />
              <h3 className="font-semibold text-lg">Set Goals</h3>
              <p className="text-sm text-muted-foreground">Achieve more</p>
            </div>
            <div className="bg-[#4B7BFF]/10 dark:bg-red-500/10 rounded-2xl p-6 text-center">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 text-[#4B7BFF] dark:text-red-500" />
              <h3 className="font-semibold text-lg">See Progress</h3>
              <p className="text-sm text-muted-foreground">Track your gains</p>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              size="lg"
              className="bg-[#4B7BFF] hover:bg-[#3A6AEE] dark:bg-red-500 dark:hover:bg-red-600 text-white px-8 py-6 rounded-xl text-lg font-semibold"
              onClick={() => router.push("/auth")}
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
