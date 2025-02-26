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

interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: UserProfile | null;
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
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null
  });
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setState({ status: 'unauthenticated', user: null });
          return;
        }

        const profile = await fetchUserProfile(session.user.id);
        setState({ 
          status: 'authenticated', 
          user: profile 
        });

      } catch (error) {
        console.error("Auth error:", error);
        setState({ status: 'unauthenticated', user: null });
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setState({ status: 'unauthenticated', user: null });
          return;
        }

        const profile = await fetchUserProfile(session.user.id);
        setState({ 
          status: 'authenticated', 
          user: profile 
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const isProfileCompleteCheck = (profile: {
    name?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    weight_kg?: number | null;
    height_cm?: number | null;
    unit_preference?: string | null;
  }) => {
    const requiredFields = [
      'name',
      'gender',
      'date_of_birth',
      'weight_kg',
      'height_cm',
      'unit_preference'
    ];
    
    return requiredFields.every(field => 
      profile[field as keyof typeof profile] != null
    ) && (profile.gender === 'Male' || profile.gender === 'Female' || profile.gender === 'Other');
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

      const profile: UserProfile = {
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

      setState({ status: 'authenticated', user: profile });
      return profile;
    } catch (error: any) {
      console.error("Fetch profile error:", error.message);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const profile = await fetchUserProfile(data.user.id);
      if (profile && !profile.isProfileComplete) {
        router.push("/settings");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
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

      setState({ status: 'authenticated', user: profile });

      router.push("/settings");
    } catch (error: any) {
      console.error("Signup error:", error.message);
      throw new Error(error.message);
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
