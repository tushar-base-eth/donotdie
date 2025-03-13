"use client";

import { useAuth } from "@/contexts/auth-context";
import type { UpdateProfile } from "@/types/workouts";

export function useProfile(userId: string) {
  const { state: { user }, updateUser } = useAuth();

  const updateProfile = async (updates: Partial<UpdateProfile>) => {
    if (!userId) throw new Error("No user ID provided");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to update profile");
    }

    // Update the context with the new profile data
    updateUser(updates);
  };

  return {
    profile: user,
    isLoading: false, // No fetching, so always false
    error: null, // No fetching, so no error
    updateProfile,
    mutate: () => {}, // No-op since no SWR
  };
}