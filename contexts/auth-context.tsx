"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Profile } from "@/types/workouts";

interface UserProfile extends Profile {
  email: string;
}

interface AuthState {
  user: UserProfile | null;
}

interface AuthContextType {
  state: AuthState;
  updateUser: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null });

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const { user } = await res.json();
        setState({ user });
      } else {
        setState({ user: null });
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setState({ user: null });
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const updateUser = (updates: Partial<UserProfile>) => {
    if (state.user) {
      setState((prev) => ({
        ...prev,
        user: { ...prev.user!, ...updates },
      }));
    }
  };

  return (
    <AuthContext.Provider value={{ state, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};