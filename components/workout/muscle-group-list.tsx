"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface MuscleGroupListProps {
  muscleGroups: string[];
  onSelect: (muscle: string) => void;
}

export function MuscleGroupList({ muscleGroups, onSelect }: MuscleGroupListProps) {
  return (
    <ScrollArea className="h-full p-6">
      {muscleGroups.map((muscle) => (
        <motion.div
          key={muscle}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelect(muscle)}
          className="p-4 rounded-3xl hover:bg-accent/5 cursor-pointer"
        >
          {muscle}
        </motion.div>
      ))}
    </ScrollArea>
  );
}