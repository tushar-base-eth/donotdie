"use client";

import Workout from "@/components/workout/workout";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <Workout />
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
