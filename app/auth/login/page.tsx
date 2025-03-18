"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Fingerprint, Mail, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/browser";
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  isIOSSafari,
  createRegistrationOptions,
  createAuthenticationOptions,
  arrayBufferToBase64,
} from "@/lib/webauthn";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [supportsBiometric, setSupportsBiometric] = useState(false);
  const [isFaceIDSupported, setIsFaceIDSupported] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Check for biometric support and stored credential on mount
  useEffect(() => {
    const checkBiometricSupport = async () => {
      if (isWebAuthnSupported()) {
        try {
          const isPlatformAvailable = await isPlatformAuthenticatorAvailable();
          setSupportsBiometric(isPlatformAvailable);
          if (isPlatformAvailable && isIOSSafari()) {
            setIsFaceIDSupported(true);
          }
          const storedCredentialId = localStorage.getItem("biometricCredentialId");
          if (storedCredentialId) {
            setIsRegistered(true);
            setCredentialId(storedCredentialId);
          }
        } catch {
          setSupportsBiometric(false);
          setIsFaceIDSupported(false);
        }
      }
    };
    checkBiometricSupport();
  }, []);

  // Register a new biometric credential
  const registerBiometric = async () => {
    if (!isWebAuthnSupported()) {
      setLoginError("Biometric authentication is not supported in this browser.");
      return;
    }
    setIsLoading(true);
    setLoginError("");
    try {
      const options = createRegistrationOptions(email || "user@example.com");
      if (isIOSSafari()) {
        options.authenticatorSelection = {
          authenticatorAttachment: "platform",
          userVerification: "required",
          requireResidentKey: false,
        };
      }
      const credential = (await navigator.credentials.create({
        publicKey: options,
      })) as PublicKeyCredential;
      if (!credential) {
        throw new Error("Failed to create credential.");
      }
      const credentialIdBase64 = arrayBufferToBase64(credential.rawId as ArrayBuffer);
      localStorage.setItem("biometricCredentialId", credentialIdBase64);
      setCredentialId(credentialIdBase64);
      setIsRegistered(true);
      toast({
        title: "Biometric Setup Complete!",
        description: "You can now sign in with Face ID or fingerprint.",
      });
      await authenticateWithBiometric();
    } catch (error: any) {
      console.error("Registration error:", error);
      setLoginError(error.message || "Failed to set up biometrics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Authenticate with an existing biometric credential
  const authenticateWithBiometric = async () => {
    if (!isWebAuthnSupported()) {
      setLoginError("Biometric authentication is not supported in this browser.");
      return;
    }
    setIsLoading(true);
    setLoginError("");
    try {
      const options = createAuthenticationOptions();
      if (credentialId) {
        options.allowCredentials = [
          {
            id: new Uint8Array(Array.from(atob(credentialId), (c) => c.charCodeAt(0))),
            type: "public-key",
            transports: ["internal"],
          },
        ];
      }
      const credential = (await navigator.credentials.get({
        publicKey: options,
      })) as PublicKeyCredential;
      if (!credential) {
        throw new Error("Authentication failed.");
      }
      // No Supabase call needed; redirect directly after successful biometric auth
      router.push("/home");
    } catch (error: any) {
      console.error("Authentication error:", error);
      setLoginError(error.message || "Biometric authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle biometric button click
  const handleBiometric = async () => {
    if (isRegistered) {
      await authenticateWithBiometric();
    } else {
      await registerBiometric();
    }
  };

  // Handle magic link sign-in with Supabase
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setLoginError("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    setLoginError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast({
        title: "Magic Link Sent!",
        description: "Check your email for the login link.",
      });
    } catch (error: any) {
      console.error("Magic link error:", error);
      setLoginError(error.message || "Failed to send magic link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google sign-in with Supabase
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setLoginError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      setLoginError(error.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Animated background pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute -top-[40%] left-[20%] h-[80%] w-[60%] rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"
          style={{ animation: "float 8s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-[30%] right-[10%] h-[60%] w-[50%] rounded-full bg-accent/5 blur-3xl dark:bg-accent/10"
          style={{ animation: "float 10s ease-in-out infinite reverse" }}
        />
      </div>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-block rounded-full bg-primary/10 p-2 dark:bg-primary/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary dark:text-primary-foreground"
              >
                <path d="M18.9 8.6A8 8 0 0 0 4.3 15" />
                <path d="M5.1 15.4A8 8 0 0 0 19.7 9" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.9 4.9 1.4 1.4" />
                <path d="m17.7 17.7 1.4 1.4" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.3 17.7-1.4 1.4" />
                <path d="m19.1 4.9-1.4 1.4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl">
              Welcome to <span className="gradient-text">Zero</span>
            </h1>
            <p className="text-sm text-muted-foreground">Sign in to track your fitness journey</p>
          </div>

          {/* Login error message */}
          {loginError && (
            <Alert variant="destructive">
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}

          {/* Authentication Methods */}
          <Tabs defaultValue="google" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="google">Google</TabsTrigger>
              {supportsBiometric ? (
                <TabsTrigger value="biometric">{isFaceIDSupported ? "Face ID" : "Biometric"}</TabsTrigger>
              ) : (
                <TabsTrigger value="magic">Magic Link</TabsTrigger>
              )}
            </TabsList>

            {/* Google Sign-In Tab */}
            <TabsContent value="google">
              <Card className="glass card-highlight">
                <CardContent className="pt-4 pb-6">
                  <div className="flex flex-col items-center justify-center gap-4 py-6">
                    <div className="rounded-full bg-background p-4 shadow-sm">
                      <svg
                        className="h-8 w-8"
                        aria-hidden="true"
                        focusable="false"
                        data-prefix="fab"
                        data-icon="google"
                        role="img"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 488 512"
                      >
                        <path
                          fill="currentColor"
                          d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                        />
                      </svg>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">Continue with your Google account</p>
                    <Button
                      variant="outline"
                      className="w-full glass-hover ios-active"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign in with Google"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Biometric Tab */}
            {supportsBiometric && (
              <TabsContent value="biometric">
                <Card className="glass card-highlight">
                  <CardContent className="pt-4 pb-6">
                    <div className="flex flex-col items-center justify-center gap-4 py-6">
                      <div className="rounded-full bg-primary/10 p-6 dark:bg-primary/20 animate-pulse">
                        {isFaceIDSupported ? (
                          <Scan className="h-12 w-12 text-primary" aria-hidden="true" />
                        ) : (
                          <Fingerprint className="h-12 w-12 text-primary" aria-hidden="true" />
                        )}
                      </div>
                      <p className="text-center text-sm text-muted-foreground">
                        {isFaceIDSupported
                          ? isRegistered
                            ? "Use Face ID to sign in securely"
                            : "Set up Face ID for secure sign in"
                          : isRegistered
                            ? "Use your biometrics to sign in securely"
                            : "Set up biometric authentication"}
                      </p>
                      <Button
                        onClick={handleBiometric}
                        disabled={isLoading}
                        className="w-full btn-glow ios-active"
                      >
                        {isLoading
                          ? isRegistered
                            ? "Authenticating..."
                            : "Setting up..."
                          : isRegistered
                            ? "Authenticate Now"
                            : "Set Up Now"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Magic Link Tab */}
            {!supportsBiometric && (
              <TabsContent value="magic">
                <Card className="glass card-highlight">
                  <CardContent className="pt-4">
                    <form onSubmit={handleMagicLink}>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                          />
                        </div>
                        <Button type="submit" disabled={isLoading || !email}>
                          {isLoading ? "Sending..." : "Send Magic Link"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Sign-up Link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">New to Zero? </span>
            <Link href="/auth/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}