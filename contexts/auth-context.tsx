/**
 * Authentication Context Provider for the DoNotDie web application
 * 
 * This context handles all authentication-related functionality including:
 * - User authentication state management
 * - Login/Signup/Logout operations
 * - User profile management
 * - Session persistence
 * 
 * The auth flow is designed to be simple and user-friendly:
 * 1. Users can sign up with email, password, and name
 * 2. Other profile fields are optional with sensible defaults
 * 3. Users can access all features immediately after signup
 * 4. Profile can be completed/updated at any time via settings
 */

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

// User profile interface matching database schema
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;  // matches date_of_birth DATE type
  weight: number;       // matches weight_kg FLOAT
  height: number;       // matches height_cm FLOAT
  bodyFat?: number | null;
  unitPreference: "metric" | "imperial" | null;
  themePreference?: "light" | "dark" | null;
  totalVolume?: number | null;
  totalWorkouts?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isProfileComplete?: boolean;  // computed field
}

// Auth state interface for tracking authentication status
interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: UserProfile | null;
}

// Auth context interface defining available methods
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (user: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null
  });
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          if (mounted) {
            setState({ status: 'unauthenticated', user: null });
          }
          return;
        }

        const profile = await fetchUserProfile(session.user.id);
        if (mounted) {
          setState({ 
            status: 'authenticated', 
            user: profile 
          });
        }
      } catch (error) {
        console.error("Auth error:", error);
        if (mounted) {
          setState({ status: 'unauthenticated', user: null });
        }
      }
    };

    fetchSession();

    let timeoutId: NodeJS.Timeout;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Clear any pending state updates
        clearTimeout(timeoutId);
        
        // Debounce the state update
        timeoutId = setTimeout(async () => {
          if (!mounted) return;

          if (!session?.user) {
            setState({ status: 'unauthenticated', user: null });
            return;
          }

          const profile = await fetchUserProfile(session.user.id);
          if (mounted) {
            setState({ 
              status: 'authenticated', 
              user: profile 
            });
          }
        }, 100); // Small delay to prevent rapid state updates
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Check if user has minimum required profile fields
  const isProfileCompleteCheck = (profile: any): boolean => {
    if (!profile) return false;
    
    // Only require essential fields that are set during signup
    return !!(
      profile.email &&
      profile.name
    );
  };

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.warn("No profile found for user.");
          return null;
        }
        throw error;
      }

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
        isProfileComplete: isProfileCompleteCheck(data)
      };
    } catch (error: any) {
      console.error("Fetch profile error:", error.message);
      return null;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<void> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user?.id) throw new Error('No user ID returned from signup');

      const defaultProfile = {
        id: authData.user.id,
        email,
        name,
        gender: 'Other',
        date_of_birth: '2000-01-01',
        weight_kg: 70,
        height_cm: 170,
        unit_preference: 'metric',
        theme_preference: 'light',
      };

      const { error: profileError } = await supabase
        .from('users')
        .insert(defaultProfile);

      if (profileError) {
        await supabase.auth.signOut();
        throw profileError;
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({ status: 'unauthenticated', user: null });

      router.push("/auth");
    } catch (error: any) {
      console.error("Logout error:", error.message);
      throw new Error(error.message);
    }
  };

  const updateProfile = async (updatedUser: Partial<UserProfile>) => {
    if (!state.user) return;

    try {
      const mergedProfile = { ...state.user, ...updatedUser };

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

      setState({ status: 'authenticated', user: updatedProfile });
    } catch (error: any) {
      console.error("Update profile error:", error.message);
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{ state, login, signup, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for accessing auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Global profile completion check
export function isProfileCompleteCheck(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !!(profile.email && profile.name);
}
