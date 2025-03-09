"use client";

import { useAuth } from "@/contexts/auth-context";
import { supabase } from '@/lib/supabase/browser';
import type { UpdatableProfile } from "@/contexts/auth-context";

// Hook to manage profile updates
export function useProfile() {
  const { state, refreshProfile } = useAuth();

  const updateProfile = async (updates: Partial<UpdatableProfile>) => {
    if (!state.user) throw new Error("No user logged in");

    const dbUpdates = {
      name: updates.name,
      gender: updates.gender,
      date_of_birth: updates.date_of_birth ? updates.date_of_birth.toISOString().split("T")[0] : null,
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