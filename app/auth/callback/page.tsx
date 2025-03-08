"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Suspense } from "react";

function CallbackContent() {
  const { state } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    console.log("Callback - Auth State:", {
      status: state.status,
      user: state.user,
      error,
      errorDescription,
    });

    if (error) {
      console.log("Callback - OAuth Error Detected:", { error, errorDescription });
      window.location.href = `/auth/login?error=${encodeURIComponent(errorDescription || "Authentication failed")}`;
    } else if (state.status === "authenticated") {
      console.log("Callback - User Authenticated, Redirecting to /home");
      window.location.href = "/home";
    } else if (state.status === "unauthenticated") {
      console.log("Callback - User Not Authenticated After OAuth, Redirecting to /auth/login");
      window.location.href = "/auth/login?error=Authentication%20failed%20-%20no%20session";
    }
  }, [state.status, state.user, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p>Verifying your authentication... Please wait.</p>
        <div className="mt-4 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

export default function Callback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p>Verifying your authentication... Please wait.</p>
            <div className="mt-4 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}