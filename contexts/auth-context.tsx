"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  gender: "Male" | "Female" | "Other" | null; // Updated to match schema
  dateOfBirth: string | null;
  weight: number | null;
  height: number | null;
  bodyFat?: number | null;
  unitPreference: "metric" | "imperial" | null;
  isProfileComplete?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (user: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setSupabaseUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile && !profile.isProfileComplete) {
            router.push("/settings");
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setSupabaseUser(null);
        setIsAuthenticated(false);
        setUserProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSupabaseUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile && !profile.isProfileComplete) {
          router.push("/settings");
        }
      } else {
        setUserProfile(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchUserProfile = async (
    userId: string
  ): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "email, name, gender, date_of_birth, weight_kg, height_cm, body_fat_percentage, unit_preference"
        )
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.warn("No profile found for user.");
          return null;
        }
        console.error("Unexpected error fetching profile:", error);
        throw error;
      }

      const isProfileComplete = !!(
        data.name &&
        data.gender &&
        data.date_of_birth &&
        data.weight_kg &&
        data.height_cm &&
        data.unit_preference
      );

      const profile: UserProfile = {
        id: userId,
        email: data.email,
        name: data.name || null,
        gender: data.gender as "Male" | "Female" | "Other" | null,
        dateOfBirth: data.date_of_birth || null,
        weight: data.weight_kg || null,
        height: data.height_cm || null,
        bodyFat: data.body_fat_percentage || null,
        unitPreference: data.unit_preference as "metric" | "imperial" | null,
        isProfileComplete,
      };

      setUserProfile(profile);
      return profile;
    } catch (error: any) {
      console.error("Fetch profile error:", error.message);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSupabaseUser(data.user);
      setIsAuthenticated(true);
      const profile = await fetchUserProfile(data.user.id);
      if (profile && !profile.isProfileComplete) {
        router.push("/settings");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("No user data returned from signup");

      // Insert user profile with schema-compliant default values
      const { data: insertData, error: insertError } = await supabase
        .from("users")
        .insert({
          id: data.user.id,
          email,
          name: name || "New User",
          gender: "Other", // Matches schema CHECK constraint
          date_of_birth: "2000-01-01", // Matches DATE type
          weight_kg: 70,
          height_cm: 170,
          unit_preference: "metric", // Matches schema default
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Profile insert failed:", insertError.message);
        throw new Error(insertError.message);
      }
      console.log("Profile created:", insertData);

      // Set user state with inserted data
      const profile: UserProfile = {
        id: data.user.id,
        email,
        name: name || "New User",
        gender: "Other",
        dateOfBirth: "2000-01-01",
        weight: 70,
        height: 170,
        unitPreference: "metric",
        isProfileComplete: false,
      };

      setSupabaseUser(data.user);
      setIsAuthenticated(true);
      setUserProfile(profile);

      router.push("/settings");
    } catch (error: any) {
      console.error("Signup error:", error.message);
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSupabaseUser(null);
      setIsAuthenticated(false);
      setUserProfile(null);

      router.push("/auth");
    } catch (error: any) {
      console.error("Logout error:", error.message);
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updatedUser: Partial<UserProfile>) => {
    if (!supabaseUser || !userProfile) return;

    try {
      const mergedProfile = { ...userProfile, ...updatedUser };

      // Normalize gender to match schema CHECK constraint ('Male', 'Female', 'Other')
      const formattedGender = mergedProfile.gender
        ? ((mergedProfile.gender.charAt(0).toUpperCase() +
            mergedProfile.gender.slice(1).toLowerCase()) as
            | "Male"
            | "Female"
            | "Other")
        : "Other"; // Default to 'Other' if null

      const allowedGenders: ("Male" | "Female" | "Other")[] = [
        "Male",
        "Female",
        "Other",
      ];
      if (!allowedGenders.includes(formattedGender)) {
        throw new Error(
          "Invalid gender value; must be 'Male', 'Female', or 'Other'"
        );
      }

      const { error } = await supabase
        .from("users")
        .update({
          name: mergedProfile.name,
          gender: formattedGender,
          date_of_birth: mergedProfile.dateOfBirth,
          weight_kg: mergedProfile.weight,
          height_cm: mergedProfile.height,
          body_fat_percentage: mergedProfile.bodyFat,
          unit_preference: mergedProfile.unitPreference,
          updated_at: new Date().toISOString(),
        })
        .eq("id", supabaseUser.id);

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

      setUserProfile(updatedProfile);
    } catch (error: any) {
      console.error("Update profile error:", error.message);
      throw new Error(error.message);
    }
  };

  const state: AuthState = {
    isAuthenticated,
    user: userProfile,
    isLoading,
  };

  return (
    <AuthContext.Provider
      value={{ state, login, signup, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
