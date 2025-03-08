"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

// Define the user profile interface
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  gender: "Male" | "Female" | "Other";
  date_of_birth: Date | null; // Changed to Date | null
  weight_kg: number | null;
  height_cm: number | null;
  body_fat_percentage: number | null;
  unit_preference: "metric" | "imperial";
  theme_preference: "light" | "dark";
  total_volume: number | null;
  total_workouts: number | null;
  created_at: string | null;
  updated_at: string | null;
}

// Define fields that can be updated via updateProfile
export type UpdatableProfile = Pick<
  UserProfile,
  "name" | "gender" | "date_of_birth" | "weight_kg" | "height_cm" | "body_fat_percentage" | "unit_preference" | "theme_preference"
>;

// Define the authentication state
interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: UserProfile | null;
}

// Define the context type with all available methods
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, unitPreference: "metric" | "imperial") => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UpdatableProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  // Fetch or create a user profile from Supabase
  const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email || "";
    const userMetadata = userData.user?.user_metadata || {};

    let { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      // Create a new profile if one doesn’t exist
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          name: userMetadata.name || "New User",
          gender: "Other",
          date_of_birth: "2000-01-01", // Default date string for database
          weight_kg: null,
          height_cm: null,
          body_fat_percentage: null,
          unit_preference: "metric",
          theme_preference: "light",
        })
        .select("*")
        .single();

      if (insertError) throw new Error("Failed to create profile");
      profile = newProfile;
    }

    // Handle null date_of_birth and convert to Date object
    const date_of_birth = profile.date_of_birth ? new Date(profile.date_of_birth) : null;

    // Runtime validation for constrained fields
    const gender = profile.gender ?? "Other"; // Use "Other" if gender is null
    if (!["Male", "Female", "Other"].includes(gender)) {
      throw new Error(`Invalid gender value: ${gender}`);
    }

    const unitPreference = profile.unit_preference;
    if (!["metric", "imperial"].includes(unitPreference)) {
      throw new Error(`Invalid unit preference: ${unitPreference}`);
    }

    const themePreference = profile.theme_preference;
    if (!["light", "dark"].includes(themePreference)) {
      throw new Error(`Invalid theme preference: ${themePreference}`);
    }

    return {
      id: userId,
      email,
      name: profile.name,
      gender: gender as "Male" | "Female" | "Other",
      date_of_birth, // Now a Date object or null
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      body_fat_percentage: profile.body_fat_percentage,
      unit_preference: unitPreference as "metric" | "imperial",
      theme_preference: themePreference as "light" | "dark",
      total_volume: profile.total_volume,
      total_workouts: profile.total_workouts,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  };

  // Restore session on component mount
  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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

  // Listen for auth state changes from Supabase
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        fetchUserProfile(session.user.id).then((userProfile) => {
          setState({ status: "authenticated", user: userProfile });
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, unit_preference: unitPreference },
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  // Update user profile in database and context state
  const updateProfile = async (updates: Partial<UpdatableProfile>) => {
    if (!state.user) throw new Error("No user logged in");

    const dbUpdates = {
      name: updates.name,
      gender: updates.gender,
      date_of_birth: updates.date_of_birth ? updates.date_of_birth.toISOString().split("T")[0] : null, // Convert Date to YYYY-MM-DD
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

    // Update local state with the new values
    const updatedUser = { ...state.user, ...updates };
    setState({ status: "authenticated", user: updatedUser });
  };

  // Refresh profile data from the database
  const refreshProfile = async () => {
    if (!state.user) return;
    const updatedProfile = await fetchUserProfile(state.user.id);
    setState({ status: "authenticated", user: updatedProfile });
  };

  return (
    <AuthContext.Provider value={{ state, login, signup, logout, updateProfile, refreshProfile, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};