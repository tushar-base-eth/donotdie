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
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });
  const router = useRouter();

  // Fetch user profile with type assertions
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      // First, get the user email
      const userResponse = await supabase.auth.getUser();
      const email = userResponse.data.user?.email || "";
      
      // Then fetch the profile
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
        
        // Try to create a profile if it doesn't exist
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData?.user) {
          const metadata = userData.user.user_metadata || {};
          
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              name: metadata.name || "New User",
              unit_preference: metadata.unit_preference || "metric"
            })
            .select("*")
            .single();
            
          if (insertError) {
            console.error("Profile creation error in fetchUserProfile:", insertError);
            return null;
          }
          
          if (newProfile) {
            return {
              id: userId,
              email: email,
              name: newProfile.name,
              gender: newProfile.gender as "Male" | "Female" | "Other" | null,
              dateOfBirth: newProfile.date_of_birth,
              weight: newProfile.weight_kg,
              height: newProfile.height_cm,
              bodyFat: newProfile.body_fat_percentage,
              unitPreference: newProfile.unit_preference as "metric" | "imperial" | null,
              themePreference: newProfile.theme_preference as "light" | "dark" | null,
              totalVolume: newProfile.total_volume,
              totalWorkouts: newProfile.total_workouts,
              createdAt: newProfile.created_at,
              updatedAt: newProfile.updated_at,
              isProfileComplete: !!newProfile.name && 
                (newProfile.gender !== null) && 
                (newProfile.date_of_birth !== null) && 
                (newProfile.weight_kg !== null) && 
                (newProfile.height_cm !== null),
            };
          }
        }
        
        return null;
      }
      
      return {
        id: userId,
        email: email,
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
        isProfileComplete: !!data.name && 
          (data.gender !== null) && 
          (data.date_of_birth !== null) && 
          (data.weight_kg !== null) && 
          (data.height_cm !== null),
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
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
    } catch (error) {
      console.error("Error refreshing user:", error);
      setState({ status: "unauthenticated", user: null });
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      try {
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
      } catch (error) {
        console.error("Session fetch error:", error);
        if (mounted) {
          setState({ status: "unauthenticated", user: null });
        }
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
      } else if (event === "USER_UPDATED" && session?.user) {
        // Handle user update events
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          setState({ status: "authenticated", user: profile });
        }
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Token refreshed, update user state
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          setState({ status: "authenticated", user: profile });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const profile = await fetchUserProfile(data.user.id);
      if (!profile) throw new Error("Profile not found.");
      
      setState({ status: "authenticated", user: profile });
      router.replace("/home"); // Redirect to home after login
    } catch (error: any) {
      // Handle specific error cases
      if (error.message.includes("Email not confirmed")) {
        throw new Error("Email not confirmed. Please check your inbox and confirm your email.");
      } else if (error.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password. Please try again.");
      } else {
        throw error; // Re-throw other errors
      }
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    unitPreference: "metric" | "imperial"
  ): Promise<void> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name, 
            unit_preference: unitPreference 
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      // Profile is auto-created by the trigger using user_metadata
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setState({ status: "unauthenticated", user: null });
      router.push("/auth"); // Redirect to auth page
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const updateProfile = async (updatedProfile: Partial<UserProfile>): Promise<void> => {
    if (!state.user) return;

    try {
      // Convert client-side profile properties to database column names
      const dbProfile: Record<string, any> = {};
      
      if (updatedProfile.name !== undefined) dbProfile.name = updatedProfile.name;
      if (updatedProfile.gender !== undefined) dbProfile.gender = updatedProfile.gender;
      if (updatedProfile.dateOfBirth !== undefined) dbProfile.date_of_birth = updatedProfile.dateOfBirth;
      if (updatedProfile.weight !== undefined) dbProfile.weight_kg = updatedProfile.weight;
      if (updatedProfile.height !== undefined) dbProfile.height_cm = updatedProfile.height;
      if (updatedProfile.bodyFat !== undefined) dbProfile.body_fat_percentage = updatedProfile.bodyFat;
      if (updatedProfile.unitPreference !== undefined) dbProfile.unit_preference = updatedProfile.unitPreference;
      if (updatedProfile.themePreference !== undefined) dbProfile.theme_preference = updatedProfile.themePreference;
      
      // Add updated timestamp
      dbProfile.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("profiles")
        .update(dbProfile)
        .eq("id", state.user.id);

      if (error) throw error;

      const refreshedProfile = await fetchUserProfile(state.user.id);
      if (refreshedProfile) {
        setState({ status: "authenticated", user: refreshedProfile });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      state, 
      login, 
      signup, 
      logout, 
      updateProfile, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}