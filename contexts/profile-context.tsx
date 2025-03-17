"use client";

import { createContext, useContext, ReactNode } from "react";
import useSWR from "swr";
import type { Profile } from "@/types/workouts";

interface UserProfile extends Profile {
  email: string;
}

interface ProfileState {
  profile: UserProfile | null;
}

interface ProfileContextType {
  state: ProfileState;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch profile");
  }
  return res.json();
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { data, error, mutate } = useSWR("/api/profile", fetcher);
  const profile = data?.profile || null;

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to update profile");
    }
    const updatedProfile = await res.json();
    mutate({ profile: updatedProfile.profile }, false); // Update cache with server response
  };

  return (
    <ProfileContext.Provider value={{ state: { profile }, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useUserProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useUserProfile must be used within a ProfileProvider");
  return context;
};