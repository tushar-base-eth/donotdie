"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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
        <Card className="glass shadow-lg rounded-xl">
          <CardContent className="pt-8 space-y-6">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">Email Confirmation Required</h2>
              <p className="text-muted-foreground text-sm">
                Please confirm your email address{" "}
                <span className="font-medium text-foreground">{resendEmail}</span>
              </p>
            </div>
            <div className="space-y-4">
              <Button
                onClick={resendConfirmation}
                className="w-full rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Resend Confirmation"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmationState("none")}
                className="w-full rounded-lg px-4 py-2 border border-input hover:bg-secondary transition-all duration-300"
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
      <div className="container max-w-lg p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Card className="mt-8 glass shadow-lg rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold text-foreground">Welcome Back</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <LoginForm onSubmit={onSubmit} isLoading={isLoading} />
              <Button
                variant="outline"
                className="w-full rounded-lg px-4 py-2 border border-input hover:bg-secondary transition-all duration-300"
                onClick={() => router.push("/auth/signup")}
                disabled={isLoading}
                type="button"
              >
                Create New Account
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted/50"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-3 text-muted-foreground font-medium">Or</span>
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
          className="glass shadow-lg rounded-lg p-4 flex items-center gap-3 z-50 fixed bottom-6 right-6 max-w-sm border border-border/40"
          open={toastOpen}
          onOpenChange={setToastOpen}
          duration={3000}
        >
          {message.isError ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          <Toast.Description
            className={`${message.isError ? "text-destructive" : "text-green-500"} text-sm font-medium`}
          >
            {message.text}
          </Toast.Description>
          <Toast.Close asChild>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 p-1"
              aria-label="Close toast"
            >
              ×
            </button>
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
        <div className="flex justify-center items-center min-h-screen bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}