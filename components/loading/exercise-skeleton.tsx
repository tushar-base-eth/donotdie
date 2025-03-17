"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function ExerciseSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          <div className="flex items-center gap-4 p-4">
            <Skeleton className="h-12 w-full rounded-lg glass shadow-lg" />
            <Skeleton className="h-6 w-6 rounded-md glass shadow-lg" />
          </div>
          <div className="space-y-3 pl-8">
            {[1, 2].map((j) => (
              <Skeleton key={j} className="h-10 w-[calc(100%-2rem)] rounded-lg glass shadow-lg" />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}