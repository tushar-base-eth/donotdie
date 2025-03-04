"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

// Define the user profile interface
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

// Define what fields can be updated
type UpdatableProfile = Pick<
  UserProfile,
  "name" | "gender" | "dateOfBirth" | "weight" | "height" | "bodyFat" | "unitPreference" | "themePreference"
>;

// Define auth state
interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: UserProfile | null;
}

// Define context type
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, unitPreference: "metric" | "imperial") => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UpdatableProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  // Fetch or create user profile
  const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
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
  };

  // Restore session on mount
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

  // Listen for auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        fetchUserProfile(session.user.id).then((userProfile) => {
          setState({ status: "authenticated", user: userProfile });
        });
      } else if (event === "TOKEN_REFRESHED") {
        // Update session state without fetching profile again
        setState((prev) => prev.user ? { ...prev, status: "authenticated" } : prev);
      } else if (event === "SIGNED_OUT") {
        setState({ status: "unauthenticated", user: null });
      }
    });

    return () => authListener?.subscription.unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // Signup function
  const signup = async (email: string, password: string, name: string, unitPreference: "metric" | "imperial") => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, unit_preference: unitPreference },
      },
    });
    if (error) throw error;
  };

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
  };

  // Update profile function
  const updateProfile = async (updates: Partial<UpdatableProfile>) => {
    if (!state.user) throw new Error("No user logged in");
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", state.user.id);
    if (error) throw error;
    const updatedUser = { ...state.user, ...updates };
    setState({ status: "authenticated", user: updatedUser });
  };

  // Refresh profile function
  const refreshProfile = async () => {
    if (!state.user) return;
    const updatedProfile = await fetchUserProfile(state.user.id);
    setState({ status: "authenticated", user: updatedProfile });
  };

  return (
    <AuthContext.Provider value={{ state, login, signup, logout, updateProfile, refreshProfile }}>
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