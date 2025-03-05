"use client";

export default function Callback() {
  const message = "Verifying your email... Please wait while we confirm your account.";

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p>{message}</p>
        <div className="mt-4 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}