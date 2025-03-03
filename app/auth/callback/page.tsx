"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function Callback() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing confirmation...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current URL
        const url = window.location.href;
        setStatus("Verifying email confirmation...");

        // Exchange code for session
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(url);

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error(`Authentication failed: ${sessionError.message}`);
        }

        if (!data.session || !data.user) {
          throw new Error("Failed to establish session");
        }

        setStatus("Email confirmed! Creating profile...");
        
        // Check if profile exists
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile check error:", profileError);
        }

        // If profile doesn't exist, create one
        if (!profileData) {
          const metadata = data.user.user_metadata || {};
          
          // Create a profile using the user's metadata
          const { error: createError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              name: metadata.name || "New User",
              unit_preference: metadata.unit_preference || "metric",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createError) {
            console.error("Profile creation error:", createError);
            // If error is because profile already exists (from trigger), continue
            if (!createError.message.includes("duplicate key")) {
              throw new Error(`Failed to create profile: ${createError.message}`);
            }
          }
        }

        setStatus("Success! Redirecting to home...");
        
        // Add a delay to show the success message
        setTimeout(() => {
          router.push("/home");
        }, 1500);
      } catch (err: any) {
        console.error("Callback error:", err);
        setError(err.message || "An unknown error occurred");
        setStatus("Authentication failed");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-center">Email Confirmation</h2>
        
        {error ? (
          <>
            <div className="p-4 text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-400">
              <p>{error}</p>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => router.push("/auth")}>
                Back to Login
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-center">{status}</p>
              {status.includes("Redirecting") || status.includes("Processing") || status.includes("Verifying") ? (
                <div className="flex justify-center mt-4">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}