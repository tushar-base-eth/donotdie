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
    <ScrollArea className="h-full px-6 py-4">
      {equipment.map((eq) => (
        <motion.div
          key={eq.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={() => onSelect(eq.id)}
          className="p-4 rounded-xl hover:bg-accent/10 cursor-pointer border border-border/50 transition-all duration-300"
          role="button"
          aria-label={`Select ${eq.name} equipment`}
        >
          <span className="text-foreground font-medium">{eq.name}</span>
        </motion.div>
      ))}
    </ScrollArea>
  );
}