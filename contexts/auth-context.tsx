"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const { user } = await res.json();
        setState({ status: "authenticated", user });
      } else {
        setState({ status: "unauthenticated", user: null });
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setState({ status: "unauthenticated", user: null });
    }
  };

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        await fetchSession(); // Update state after refresh
      } else {
        setState({ status: "unauthenticated", user: null });
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      setState({ status: "unauthenticated", user: null });
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const refreshProfile = async () => {
    await fetchSession();
  };

  // Optional: Refresh session periodically or on 401
  useEffect(() => {
    const handleAuthCheck = async () => {
      if (state.status === "authenticated") {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          await refreshSession();
        }
      }
    };
    const interval = setInterval(handleAuthCheck, 15 * 60 * 1000); // Check every 15 minutes
    return () => clearInterval(interval);
  }, [state.status]);

  return (
    <AuthContext.Provider value={{ state, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};