"use client";

import { createContext, useContext, ReactNode, useState } from "react";
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
  fetchProfile: () => Promise<void>;
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
  const [state, setState] = useState<ProfileState>({ profile: null });

  const fetchProfile = async () => {
    try {
      const data = await fetcher("/api/profile");
      setState({ profile: data.profile });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.profile) return;
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
    setState({ profile: updatedProfile.profile });
  };

  return (
    <ProfileContext.Provider value={{ state, updateProfile, fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useUserProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useUserProfile must be used within a ProfileProvider");
  return context;
};