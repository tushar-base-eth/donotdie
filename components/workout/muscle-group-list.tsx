"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface MuscleGroupListProps {
  muscleGroups: string[];
  onSelect: (muscle: string) => void;
}

export function MuscleGroupList({ muscleGroups, onSelect }: MuscleGroupListProps) {
  return (
    <ScrollArea className="h-full px-6 py-4">
      {muscleGroups.map((muscle) => (
        <motion.div
          key={muscle}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={() => onSelect(muscle)}
          className="p-4 rounded-xl hover:bg-accent/10 cursor-pointer border border-border/50 transition-all duration-300"
          role="button"
          aria-label={`Select ${muscle} muscle group`}
        >
          <span className="text-foreground font-medium">{muscle}</span>
        </motion.div>
      ))}
    </ScrollArea>
  );
}