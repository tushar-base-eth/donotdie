"use client";

import useSWR from "swr";
import type { UpdateProfile } from "@/types/workouts";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch profile");
  const { profile } = await res.json();
  return profile;
};

export function useProfile(userId: string) {
  const { data, error, mutate } = useSWR(userId ? "/api/profile" : null, fetcher);

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

    // Optimistically update the SWR cache without refetching
    mutate({ ...data, ...updates }, false);
  };

  return {
    profile: data,
    isLoading: !error && !data,
    error,
    updateProfile,
    mutate,
  };
}