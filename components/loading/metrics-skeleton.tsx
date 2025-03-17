import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function MetricsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Skeleton className="h-24 w-full rounded-xl glass shadow-lg" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Skeleton className="h-24 w-full rounded-xl glass shadow-lg" />
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Skeleton className="h-64 w-full rounded-xl glass shadow-lg" />
      </motion.div>
    </div>
  );
}