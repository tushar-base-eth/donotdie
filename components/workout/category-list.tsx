"use client";

import { Dumbbell, Heart, User, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoryListProps {
  onCategorySelect: (category: string) => void;
}

export function CategoryList({ onCategorySelect }: CategoryListProps) {
  const categories = [
    { name: "Strength Training", icon: <Dumbbell />, value: "strength_training" },
    { name: "Cardio", icon: <Heart />, value: "cardio" },
    { name: "Flexibility", icon: <Heart />, value: "flexibility" },
    { name: "By Muscles", icon: <Dumbbell />, value: "by_muscles" },
    { name: "By Equipment", icon: <Dumbbell />, value: "by_equipment" },
    { name: "Added by Me", icon: <User />, value: "added_by_me" },
  ];
  return (
    <ScrollArea className="h-full p-6">
      {categories.map((cat) => (
        <div
          key={cat.name}
          className="flex items-center p-4 rounded-3xl hover:bg-accent/5 cursor-pointer"
          onClick={() => onCategorySelect(cat.value)}
        >
          {cat.icon}
          <span className="flex-1 ml-4">{cat.name}</span>
          <ChevronRight />
        </div>
      ))}
    </ScrollArea>
  );
}