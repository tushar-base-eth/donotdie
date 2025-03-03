// pages/auth/callback.tsx
"use client";

// Import necessary hooks from React and Next.js
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Callback component for handling email confirmation.
 * Displays a loading message while Supabase verifies the email confirmation link.
 * The auth context handles session creation and redirection automatically.
 */
export default function Callback() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying your email...");

  // Use effect to set a user-friendly status message on mount
  useEffect(() => {
    setStatus("Verifying your email... Please wait while we confirm your account.");
  }, []);

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        {/* Title for the confirmation page */}
        <h2 className="text-2xl font-bold text-center">Email Confirmation</h2>
        <div className="space-y-2">
          {/* Display the status message */}
          <p className="text-center">{status}</p>
          {/* Loading spinner */}
          <div className="flex justify-center mt-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    </div>
  );
}