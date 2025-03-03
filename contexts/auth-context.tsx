"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Define UserProfile based on profiles table
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  gender: "Male" | "Female" | "Other" | null;
  dateOfBirth: string | null;
  weight: number | null;
  height: number | null;
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
  signup: (
    email: string,
    password: string,
    name: string,
    unitPreference: "metric" | "imperial"
  ) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session?.user) {
        setState({ status: "unauthenticated", user: null });
        return;
      }

      const profile = await fetchUserProfile(session.user.id);
      if (profile) {
        setState({ status: "authenticated", user: profile });
      } else {
        setState({ status: "unauthenticated", user: null });
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      if (!mounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          setState({ status: "authenticated", user: profile });
          router.replace("/home"); // Redirect to home after sign-in
        }
      } else if (event === "SIGNED_OUT") {
        setState({ status: "unauthenticated", user: null });
        router.replace("/auth"); // Redirect to auth page after sign-out
      } else {
        setState({ status: "unauthenticated", user: null });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Fetch user profile with type assertions
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Fetch profile error:", error.message);
      return null;
    }
    if (!data) {
      console.log("No profile found for user:", userId);
      return null;
    }
    return {
      id: userId,
      email: (await supabase.auth.getUser()).data.user?.email || "",
      name: data.name,
      gender: data.gender as "Male" | "Female" | "Other" | null,
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
      isProfileComplete: !!data.name,
    };
  };

  const login = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const profile = await fetchUserProfile(data.user.id);
    if (!profile) throw new Error("Profile not found.");
    setState({ status: "authenticated", user: profile });
    router.replace("/home"); // Redirect to home after login
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    unitPreference: "metric" | "imperial"
  ): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, unit_preference: unitPreference },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    // Profile is auto-created by the trigger using user_metadata
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setState({ status: "unauthenticated", user: null });
    router.push("/auth"); // Redirect to auth page
  };

  const updateProfile = async (updatedProfile: Partial<UserProfile>) => {
    if (!state.user) return;

    const { error } = await supabase
      .from("profiles")
      .update(updatedProfile)
      .eq("id", state.user.id);

    if (error) throw error;

    const refreshedProfile = await fetchUserProfile(state.user.id);
    if (refreshedProfile) {
      setState({ status: "authenticated", user: refreshedProfile });
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