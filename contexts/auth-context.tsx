"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  gender: "Male" | "Female" | "Other" | null;
  dateOfBirth: string | null;
  weight: number | null;
  height: number | null;
  bodyFat: number | null;
  unitPreference: "metric" | "imperial";
  themePreference: "light" | "dark" | null;
  totalVolume: number | null;
  totalWorkouts: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: UserProfile | null;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email || "";

      let { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email,
            name: "New User",
            gender: null,
            date_of_birth: null,
            weight_kg: null,
            height_cm: null,
            body_fat_percentage: null,
            unit_preference: "metric",
            theme_preference: "light",
            total_volume: 0,
            total_workouts: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("*")
          .single();

        if (insertError) throw new Error("Failed to create profile");
        profile = newProfile;
      }

      return {
        id: userId,
        email,
        name: profile.name,
        gender: profile.gender as "Male" | "Female" | "Other" | null,
        dateOfBirth: profile.date_of_birth,
        weight: profile.weight_kg,
        height: profile.height_cm,
        bodyFat: profile.body_fat_percentage,
        unitPreference: profile.unit_preference as "metric" | "imperial",
        themePreference: profile.theme_preference as "light" | "dark" | null,
        totalVolume: profile.total_volume,
        totalWorkouts: profile.total_workouts,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };
    } catch (error) {
      console.error("Error fetching/creating profile:", error);
      throw error;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        if (session?.user) {
          try {
            const profile = await fetchUserProfile(session.user.id);
            setState({ status: "authenticated", user: profile });
          } catch (error) {
            setState({ status: "unauthenticated", user: null });
          }
        } else {
          setState({ status: "unauthenticated", user: null });
        }
      } else if (event === "SIGNED_OUT") {
        setState({ status: "unauthenticated", user: null });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}