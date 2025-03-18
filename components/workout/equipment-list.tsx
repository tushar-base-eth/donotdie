"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import type { Equipment } from "@/types/workouts";

interface EquipmentListProps {
  equipment: Equipment[];
  onSelect: (equipmentId: string) => void;
}

export function EquipmentList({ equipment, onSelect }: EquipmentListProps) {
  return (
    <ScrollArea className="h-full p-6 bg-background">
      {equipment.map((eq) => (
        <motion.div
          key={eq.id}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelect(eq.id)}
          className="p-4 rounded-lg hover:bg-muted cursor-pointer text-foreground"
        >
          {eq.name}
        </motion.div>
      ))}
    </ScrollArea>
  );
}