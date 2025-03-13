"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserProfile } from "@/contexts/profile-context";
import * as Toast from "@radix-ui/react-toast";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function LoginContent() {
  const { state } = useUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationState, setConfirmationState] = useState<"none" | "resend">("none");
  const [resendEmail, setResendEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setMessage({ text: decodeURIComponent(error), isError: true });
      setToastOpen(true);
      router.replace("/auth/login");
    }
  }, [searchParams, router]);

  const onSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      window.location.href = '/home'; // Force reload to trigger middleware
    } catch (error: any) {
      if (error.message.includes("Email not confirmed")) {
        setConfirmationState("resend");
        setResendEmail(data.email);
      } else {
        setMessage({ text: error.message || "An unexpected error occurred", isError: true });
        setToastOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resendConfirmation = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend confirmation');
      }
      setMessage({ text: "Confirmation email resent. Please check your inbox.", isError: false });
      setToastOpen(true);
    } catch (error: any) {
      setMessage({ text: error.message || "Failed to resend confirmation email", isError: true });
      setToastOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (confirmationState === "resend") {
    return (
      <div className="container max-w-lg p-8 text-center space-y-6">
        <Card className="glass">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Confirmation Required</h2>
              <p className="text-muted-foreground">
                Please confirm your email address{" "}
                <span className="font-medium text-foreground">{resendEmail}</span>
              </p>
            </div>
            <div className="space-y-3 mt-4">
              <Button onClick={resendConfirmation} className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Resend Confirmation"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmationState("none")}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Toast.Provider swipeDirection="right">
      <div className="container max-w-lg p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="mt-8 glass">
            <CardHeader className="pb-4">
              <CardTitle>Welcome Back</CardTitle>
            </CardHeader>
            <CardContent>
              <LoginForm onSubmit={onSubmit} isLoading={isLoading} />
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/auth/signup")}
                disabled={isLoading}
                type="button"
              >
                Create New Account
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <GoogleSignInButton
          onClick={() => {
            setIsLoading(true);
            setMessage(null);
            window.location.href = '/api/auth/google';
          }}
          isLoading={isLoading}
        />
      </div>

      {message && (
        <Toast.Root
          className="glass rounded-md p-4 shadow-lg flex items-center gap-3 z-50 fixed bottom-4 right-4 max-w-xs"
          open={toastOpen}
          onOpenChange={setToastOpen}
          duration={3000}
        >
          <Toast.Description
            className={`${message.isError ? "text-destructive" : "text-green-500"} text-sm font-medium`}
          >
            {message.text}
          </Toast.Description>
          <Toast.Close asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors">×</button>
          </Toast.Close>
        </Toast.Root>
      )}
      <Toast.Viewport />
    </Toast.Provider>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}