"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from '@/lib/hooks/data-hooks'; // Updated import to use data-hooks supabase
import type { Database } from "@/types/database";
import type { Profile } from "@/types/workouts";

interface UserProfile extends Profile {
  email: string;
}

interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: UserProfile | null;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, unitPreference: "metric" | "imperial") => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  const fetchUserProfile = async (
    userId: string,
    name?: string,
    unitPreference?: "metric" | "imperial"
  ): Promise<UserProfile> => {
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email || "";
    const userMetadata = userData.user?.user_metadata || {};

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
          name: name || userMetadata.name || "New User",
          gender: null,
          date_of_birth: "2000-01-01",
          weight_kg: null,
          height_cm: null,
          body_fat_percentage: null,
          unit_preference: unitPreference || "metric",
          theme_preference: "light",
        })
        .select("*")
        .single();

      if (insertError) throw new Error("Failed to create profile: " + insertError.message);
      profile = newProfile;
    }

    const gender = profile.gender ?? null;
    if (gender && !["male", "female", "other"].includes(gender)) {
      throw new Error(`Invalid gender value: ${gender}`);
    }

    const unitPreferenceValue = profile.unit_preference;
    if (!["metric", "imperial"].includes(unitPreferenceValue)) {
      throw new Error(`Invalid unit preference: ${unitPreferenceValue}`);
    }

    const themePreference = profile.theme_preference;
    if (!["light", "dark"].includes(themePreference)) {
      throw new Error(`Invalid theme preference: ${themePreference}`);
    }

    return {
      id: userId,
      email,
      name: profile.name,
      gender: gender as "male" | "female" | "other" | null,
      date_of_birth: profile.date_of_birth,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      body_fat_percentage: profile.body_fat_percentage,
      unit_preference: unitPreferenceValue as "metric" | "imperial",
      theme_preference: themePreference as "light" | "dark",
      total_volume: profile.total_volume,
      total_workouts: profile.total_workouts,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  };

  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Session restoration error:", error);
        setState({ status: "unauthenticated", user: null });
        return;
      }
      if (session?.user) {
        try {
          const userProfile = await fetchUserProfile(session.user.id);
          setState({ status: "authenticated", user: userProfile });
        } catch (error) {
          console.error("Error fetching profile:", error);
          setState({ status: "unauthenticated", user: null });
        }
      } else {
        setState({ status: "unauthenticated", user: null });
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        fetchUserProfile(session.user.id).then((userProfile) => {
          setState({ status: "authenticated", user: userProfile });
        }).catch((error) => {
          console.error("Error fetching profile on sign-in:", error);
          setState({ status: "unauthenticated", user: null });
        });
      } else if (event === "TOKEN_REFRESHED") {
        setState((prev) => (prev.user ? { ...prev, status: "authenticated" } : prev));
      } else if (event === "SIGNED_OUT") {
        setState({ status: "unauthenticated", user: null });
      }
    });

    return () => authListener?.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    unitPreference: "metric" | "imperial"
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, unit_preference: unitPreference } },
    });
    if (error) throw error;
    if (data.user) {
      const userProfile = await fetchUserProfile(data.user.id, name, unitPreference);
      setState({ status: "authenticated", user: userProfile });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google sign-in error:", error);
      setState({ status: "unauthenticated", user: null });
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (!state.user) return;
    try {
      const updatedProfile = await fetchUserProfile(state.user.id);
      setState({ status: "authenticated", user: updatedProfile });
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ state, login, signup, logout, refreshProfile, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};