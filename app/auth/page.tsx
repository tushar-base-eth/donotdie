"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabaseClient";

const authSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().optional(),
    name: z.string().optional(),
    unitPreference: z.enum(["metric", "imperial"]).optional(),
  })
  .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AuthSchema = z.infer<typeof authSchema>;

export default function Auth() {
  const { state, login, signup, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationState, setConfirmationState] = useState<"none" | "sent" | "resend">("none");
  const [resendEmail, setResendEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const form = useForm<AuthSchema>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      unitPreference: "metric",
    },
  });

  useEffect(() => {
    if (state.status === "authenticated") router.replace("/home");
  }, [state.status, router]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setMessage({ text: decodeURIComponent(error), isError: true });
      // Clear the error from the URL
      router.replace("/auth", undefined, { shallow: true });
    }
  }, [searchParams, router]);

  const onSubmit = async (data: AuthSchema) => {
    setIsLoading(true);
    setMessage(null);
    try {
      if (isLogin) {
        await login(data.email, data.password);
      } else {
        await signup(data.email, data.password, data.name || "", data.unitPreference || "metric");
        setConfirmationState("sent");
      }
    } catch (error: any) {
      handleError(error, data.email);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: any, email: string) => {
    if (error.message.includes("Email not confirmed")) {
      setConfirmationState("resend");
      setResendEmail(email);
    } else {
      setMessage({
        text: error.message.includes("already registered")
          ? "This email is already registered. Please log in."
          : error.message || "An unexpected error occurred",
        isError: true,
      });
    }
  };

  const resendConfirmation = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: resendEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setMessage({ text: "Confirmation email resent. Please check your inbox.", isError: false });
    } catch (error: any) {
      setMessage({ text: error.message || "Failed to resend confirmation email", isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (state.status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (confirmationState === "sent") {
    return (
      <div className="container max-w-lg p-8 text-center space-y-6">
        <Card className="glass">
          <CardContent className="pt-6">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Check Your Email</h2>
              <p className="text-muted-foreground">
                We've sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{form.getValues("email")}</span>. The link will expire in 24
                hours.
              </p>
            </div>
            <Button
              onClick={() => {
                setConfirmationState("none");
                setIsLogin(true);
              }}
              className="w-full mt-4"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            {message && (
              <Alert variant={message.isError ? "destructive" : "default"} className="mt-4">
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-3 mt-4">
              <Button onClick={resendConfirmation} className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Resend Confirmation"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmationState("none");
                  setIsLogin(true);
                }}
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
    <div className="container max-w-lg p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={isLogin ? "login" : "signup"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="mt-8 glass">
            <CardHeader className="pb-4">
              <CardTitle>{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert variant={message.isError ? "destructive" : "default"} className="mb-6">
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="email@example.com"
                            type="email"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {!isLogin && (
                    <>
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" autoComplete="new-password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" autoComplete="name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="unitPreference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Measurement System</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select system" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                                <SelectItem value="imperial">Imperial (lb, in)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    aria-label={isLogin ? "Sign in" : "Create account"}
                  >
                    {isLoading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      form.reset();
                      setMessage(null);
                    }}
                    disabled={isLoading}
                    type="button"
                    aria-label={isLogin ? "Switch to sign up" : "Switch to sign in"}
                  >
                    {isLogin ? "Create New Account" : "Already Have an Account?"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={async () => {
          setIsLoading(true);
          setMessage(null);
          try {
            await signInWithGoogle();
          } catch (error: any) {
            setMessage({ text: error.message || "Failed to sign in with Google", isError: true });
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isLoading}
        type="button"
        aria-label="Sign in with Google"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.30-4.53 6.16-4.53z"
            fill="#EA4335"
          />
          <path d="M1 1h22v22H1z" fill="none" />
        </svg>
        Sign in with Google
      </Button>
    </div>
  );
}