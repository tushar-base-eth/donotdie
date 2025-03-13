"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProfileState>({ profile: null });

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const { user } = await res.json();
        setState({ profile: user });
      } else {
        setState({ profile: null });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setState({ profile: null });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile!, ...updates },
    }));
  };

  return (
    <ProfileContext.Provider value={{ state, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useUserProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useUserProfile must be used within a ProfileProvider");
  return context;
};