"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

// User profile interface matching database schema
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  weight: number;
  height: number;
  bodyFat?: number | null;
  unitPreference: "metric" | "imperial" | null;
  themePreference?: "light" | "dark" | null;
  totalVolume?: number | null;
  totalWorkouts?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isProfileComplete?: boolean;
}

interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: UserProfile | null;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, unitPreference: "metric" | "imperial") => Promise<void>;
  logout: () => void;
  updateProfile: (user: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });
  const router = useRouter();

  // Handle initial session and auth state changes
  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (mounted) setState({ status: "unauthenticated", user: null });
          return;
        }
        const profile = await fetchUserProfile(session.user.id);
        if (mounted) setState({ status: "authenticated", user: profile });
      } catch (error) {
        console.error("Auth error:", error);
        if (mounted) setState({ status: "unauthenticated", user: null });
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setState({ status: "unauthenticated", user: null });
        return;
      }
      const profile = await fetchUserProfile(session.user.id);
      setState({ status: "authenticated", user: profile });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile from Supabase
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle(); // Prevents 406 error when no row exists

      if (error) {
        if (error.code === "PGRST116") return null; // No row found
        throw error;
      }

      if (!data) return null;

      return {
        id: userId,
        email: data.email,
        name: data.name,
        gender: data.gender as "Male" | "Female" | "Other",
        dateOfBirth: data.date_of_birth,
        weight: data.weight_kg,
        height: data.height_cm,
        bodyFat: data.body_fat_percentage,
        unitPreference: data.unit_preference as "metric" | "imperial" | null,
        themePreference: data.theme_preference as "light" | "dark" | null,
        totalVolume: data.total_volume,
        totalWorkouts: data.total_workouts,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isProfileComplete: !!data.name && !!data.email,
      };
    } catch (error: any) {
      console.error("Fetch profile error:", error.message);
      return null;
    }
  };

  // Login function with profile creation and unique email handling
  const login = async (email: string, password: string): Promise<void> => {
    try {
      // Authenticate the user
      const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = session.user.id;
      let profile = await fetchUserProfile(userId);

      if (!profile) {
        const pendingProfile = JSON.parse(localStorage.getItem("pendingProfile") || "{}");
        const { name, unitPreference } = pendingProfile;

        // Attempt to insert a new profile
        const defaultProfile = {
          id: userId,
          email,
          name: name || "User",
          gender: "Other",
          date_of_birth: "2000-01-01",
          weight_kg: 70,
          height_cm: 170,
          theme_preference: "light",
          unit_preference: unitPreference || "metric",
        };

        const { error } = await supabase.from("users").insert(defaultProfile);
        if (error) {
          if (error.code === "23505") { // Unique constraint violation (duplicate email)
            // Fetch the existing profile for this email
            const { data: existingProfile, error: profileError } = await supabase
              .from("users")
              .select("*")
              .eq("email", email)
              .single();

            if (profileError) throw profileError;

            profile = existingProfile;
            localStorage.removeItem("pendingProfile"); // Clean up, even if reusing profile
          } else {
            throw error; // Other errors (e.g., network issues)
          }
        } else {
          // Profile was successfully inserted, fetch it
          profile = await fetchUserProfile(userId);
          localStorage.removeItem("pendingProfile");
        }
      }

      setState({ status: "authenticated", user: profile });
    } catch (error: any) {
      if (error.code === "23505") {
        alert("This email is already registered. Please log in or use a different email.");
      } else {
        alert("An error occurred during sign-up. Please try again.");
      }
      throw new Error(error.message);
    }
  };

  // Signup function to store pending profile data
  const signup = async (email: string, password: string, name: string, unitPreference: "metric" | "imperial"): Promise<void> => {
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      localStorage.setItem("pendingProfile", JSON.stringify({ name, unitPreference }));
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({ status: "unauthenticated", user: null });
      router.push("/auth");
    } catch (error: any) {
      console.error("Logout error:", error.message);
      throw new Error(error.message);
    }
  };

  // Update profile function with improved error handling
  const updateProfile = async (updatedUser: Partial<UserProfile>) => {
    if (!state.user) return;

    try {
      const mergedProfile = { ...state.user, ...updatedUser };

      const formattedGender = mergedProfile.gender
        ? ((mergedProfile.gender.charAt(0).toUpperCase() + mergedProfile.gender.slice(1).toLowerCase()) as "Male" | "Female" | "Other")
        : "Other";

      const updateData = {
        name: mergedProfile.name,
        gender: formattedGender,
        date_of_birth: mergedProfile.dateOfBirth,
        weight_kg: mergedProfile.weight,
        height_cm: mergedProfile.height,
        body_fat_percentage: mergedProfile.bodyFat,
        unit_preference: mergedProfile.unitPreference,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", state.user.id);

      if (error) throw error;

      const isProfileComplete = !!(
        mergedProfile.name &&
        formattedGender &&
        mergedProfile.dateOfBirth &&
        mergedProfile.weight &&
        mergedProfile.height &&
        mergedProfile.unitPreference
      );

      const updatedProfile: UserProfile = {
        ...mergedProfile,
        gender: formattedGender,
        isProfileComplete,
      };

      setState({ status: "authenticated", user: updatedProfile });
    } catch (error: any) {
      console.error("Update profile error:", error.message);
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ state, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}