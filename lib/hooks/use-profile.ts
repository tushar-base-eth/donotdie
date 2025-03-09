"use client";

import { useAuth } from "@/contexts/auth-context";
import { supabase } from '@/lib/supabase/browser';
import type { UpdateProfile } from "@/types/workouts";

// Hook to manage profile updates
export function useProfile() {
  const { state, refreshProfile } = useAuth();

  const updateProfile = async (updates: Partial<UpdateProfile>) => {
    if (!state.user) throw new Error("No user logged in");

    const dbUpdates: Partial<UpdateProfile> = {
      name: updates.name,
      gender: updates.gender,
      date_of_birth: updates.date_of_birth || null, // Directly use string or null, no Date conversion needed
      weight_kg: updates.weight_kg,
      height_cm: updates.height_cm,
      body_fat_percentage: updates.body_fat_percentage,
      unit_preference: updates.unit_preference,
      theme_preference: updates.theme_preference,
    };

    const { error } = await supabase
      .from("profiles")
      .update(dbUpdates)
      .eq("id", state.user.id);

    if (error) throw error;

    // Refresh the profile to update the auth state
    await refreshProfile();
  };

  return { updateProfile };
}