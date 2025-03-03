"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "unauthenticated") {
      router.replace("/auth");
    }
  }, [state.status, router]);

  if (state.status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (state.status === "unauthenticated") {
    return null; // Redirect happens in useEffect
  }

  return <>{children}</>;
}