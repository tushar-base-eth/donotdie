"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setLoginError("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    setLoginError("");
    try {
      const response = await fetch("/api/auth/magiclink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send magic link");
      }
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

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-block rounded-full bg-primary/10 p-2">
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
                className="h-6 w-6 text-primary"
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
            <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl text-foreground">
              Welcome to <span className="text-primary">ZeroNow</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Things change when you start from zero
            </p>
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
            <TabsList className="grid w-full grid-cols-2 bg-muted text-muted-foreground">
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="magic">Magic Link</TabsTrigger>
            </TabsList>

            {/* Google Sign-In Tab */}
            <TabsContent value="google">
              <Card className="border border-border">
                <CardContent className="pt-4 pb-6">
                  <div className="flex flex-col items-center justify-center gap-4 py-6">
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
                    <p className="text-center text-sm text-muted-foreground">
                      Continue with your Google account
                    </p>
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleGoogleSignIn}
                    >
                      Sign in with Google
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Magic Link Tab */}
            <TabsContent value="magic">
              <Card className="border border-border">
                <CardContent className="pt-4">
                  <form onSubmit={handleMagicLink}>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="text-foreground">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          autoComplete="email"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isLoading || !email}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {isLoading ? "Sending..." : "Send Magic Link"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}