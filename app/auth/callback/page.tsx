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
        // Extract tokens from the URL hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        // Validate the parameters
        if (!accessToken || !refreshToken || type !== "signup") {
          throw new Error("Invalid or missing confirmation link parameters");
        }

        // Set the session with Supabase
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }

        setStatus("Confirmation successful! You will be redirected to home shortly.");
      } catch (err: any) {
        console.error("Callback error:", err.message);
        setError(err.message);
        setStatus("An error occurred during confirmation.");
      }
    };

    handleCallback();
  }, [router]);

  // Render error state if something goes wrong
  if (error) {
    return (
      <div className="container max-w-lg p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Confirmation Error</h2>
        <p className="mb-4">{error}</p>
        <Button onClick={() => router.push("/auth")}>Back to Login</Button>
      </div>
    );
  }

  // Default rendering during processing or success
  return <div className="container max-w-lg p-4 text-center">{status}</div>;
}