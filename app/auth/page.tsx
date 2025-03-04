"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Unified schema for both login and signup
const authSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().optional(),
    name: z.string().optional(),
    unitPreference: z.enum(["metric", "imperial"]).optional(),
  })
  .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type AuthSchema = z.infer<typeof authSchema>;

export default function AuthPage() {
  const { state, login, signup } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationState, setConfirmationState] = useState<"none" | "sent" | "resend">("none");
  const [resendEmail, setResendEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const form = useForm<AuthSchema>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", name: "", unitPreference: "metric" },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (state.status === "authenticated") router.replace("/home");
  }, [state.status, router]);

  // Handle form submission
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

  // Centralized error handling
  const handleError = (error: any, email: string) => {
    if (error.message.includes("Email not confirmed")) {
      setConfirmationState("resend");
      setResendEmail(email);
    } else {
      setMessage({
        text: error.message.includes("already registered")
          ? "This email is already registered. Please log in."
          : error.message || "An error occurred",
        isError: true,
      });
    }
  };

  // Resend confirmation email
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
      setMessage({ text: "Confirmation email resent. Check your inbox.", isError: false });
    } catch (error: any) {
      setMessage({ text: error.message || "Failed to resend email", isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (state.status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Confirmation sent screen
  if (confirmationState === "sent") {
    return (
      <div className="container max-w-lg p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-6 mx-auto" />
        <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
        <p className="mb-6">
          We’ve sent a confirmation email to <span className="font-medium">{form.getValues("email")}</span>.
          Click the link to confirm your account (valid for 24 hours).
        </p>
        <Button
          onClick={() => {
            setConfirmationState("none");
            setIsLogin(true);
          }}
          className="w-full hover-lift"
        >
          Back to Login
        </Button>
      </div>
    );
  }

  // Resend confirmation screen
  if (confirmationState === "resend") {
    return (
      <div className="container max-w-lg p-8 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-6 mx-auto" />
        <h2 className="text-2xl font-bold mb-4">Email Not Confirmed</h2>
        <p className="mb-6">
          Your email <span className="font-medium">{resendEmail}</span> needs confirmation.
        </p>
        {message && (
          <Alert className={`mb-6 ${message.isError ? "bg-red-50" : "bg-green-50"}`}>
            <AlertDescription className={message.isError ? "text-red-600" : "text-green-600"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-3">
          <Button onClick={resendConfirmation} className="w-full hover-lift" disabled={isLoading}>
            {isLoading ? "Sending..." : "Resend Confirmation Email"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmationState("none");
              setIsLogin(true);
            }}
            className="w-full hover-lift"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  // Main auth form
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
            <CardHeader>
              <CardTitle>{isLogin ? "Login" : "Create an Account"}</CardTitle>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert className={`mb-6 ${message.isError ? "bg-red-50" : "bg-green-50"}`}>
                  <AlertDescription className={message.isError ? "text-red-600" : "text-green-600"}>
                    {message.text}
                  </AlertDescription>
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
                          <Input placeholder="email@example.com" type="email" {...field} />
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
                          <Input type="password" {...field} />
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
                              <Input type="password" {...field} />
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
                              <Input placeholder="John Doe" {...field} />
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
                            <FormLabel>Unit Preference</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select units" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="metric">Metric (kg/cm)</SelectItem>
                                <SelectItem value="imperial">Imperial (lb/in)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  <Button type="submit" className="w-full hover-lift" disabled={isLoading}>
                    {isLoading ? "Processing..." : isLogin ? "Login" : "Create Account"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full hover-lift"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      form.reset();
                      setMessage(null);
                    }}
                    disabled={isLoading}
                  >
                    {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}