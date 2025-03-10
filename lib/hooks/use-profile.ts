"use client";

import useSWR from "swr";
import { supabase } from "@/lib/supabase/browser";
import { useAuth } from "@/contexts/auth-context";
import type { UpdateProfile } from "@/types/workouts";

const fetcher = async (userId: string) => {
  // console.log("Fetching profile for userId:", userId);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
};

export function useProfile(userId: string) {
  const { state, refreshProfile } = useAuth();
  const { data, error, mutate } = useSWR(userId ? `profile_${userId}` : null, fetcher);

  const updateProfile = async (updates: Partial<UpdateProfile>) => {
    if (!state.user) throw new Error("No user logged in");

    const dbUpdates: Partial<UpdateProfile> = {
      name: updates.name,
      gender: updates.gender,
      date_of_birth: updates.date_of_birth || null,
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

    await refreshProfile();
    await mutate();
  };

  return {
    profile: data,
    isLoading: !error && !data,
    error,
    updateProfile,
    mutate,
  };
}