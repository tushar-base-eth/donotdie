"use client";

import { Workout } from "@/components/workout/workout";
import { BottomNav } from "@/components/navigation/bottom-nav";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Workout />
      <BottomNav />
    </div>
  );
}
