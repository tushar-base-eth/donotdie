"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "unauthenticated") {
      router.push("/auth");
    }
  }, [state.status, router]);

  if (state.status === "loading") {
    return <div>Loading...</div>;
  }

  return state.status === "authenticated" ? children : null;
}