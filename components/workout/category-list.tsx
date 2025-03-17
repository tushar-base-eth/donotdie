"use client";

import { Leaf, Dumbbell, Heart, User, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface CategoryListProps {
  onCategorySelect: (category: string) => void;
}

export function CategoryList({ onCategorySelect }: CategoryListProps) {
  const categories = [
    { name: "Strength Training", icon: <Dumbbell className="h-5 w-5" />, value: "strength_training" },
    { name: "Cardio", icon: <Heart className="h-5 w-5" />, value: "cardio" },
    { name: "Flexibility", icon: <Leaf className="h-5 w-5" />, value: "flexibility" },
    { name: "By Muscles", icon: <Dumbbell className="h-5 w-5" />, value: "by_muscles" },
    { name: "By Equipment", icon: <Dumbbell className="h-5 w-5" />, value: "by_equipment" },
    { name: "Added by Me", icon: <User className="h-5 w-5" />, value: "added_by_me" },
  ];

  return (
    <ScrollArea className="h-full px-6 py-4">
      {categories.map((cat) => (
        <motion.div
          key={cat.name}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={() => onCategorySelect(cat.value)}
          className="flex items-center p-4 rounded-xl hover:bg-accent/10 cursor-pointer border border-border/50 transition-all duration-300"
          role="button"
          aria-label={`Select ${cat.name} category`}
        >
          {cat.icon}
          <span className="flex-1 ml-4 text-foreground font-medium">{cat.name}</span>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      ))}
    </ScrollArea>
  );
}