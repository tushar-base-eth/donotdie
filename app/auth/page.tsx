"use client"; // Next.js client component (needed for hooks and browser APIs)

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Project components
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabaseClient";

// Validation schema with improved error messages
const authSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().optional(),
    name: z.string().optional(),
    unitPreference: z.enum(["metric", "imperial"]).optional(),
  })
  .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: "Passwords do not match", // More natural language
    path: ["confirmPassword"],
  });

type AuthSchema = z.infer<typeof authSchema>;

export default function Auth() {
  const { state, login, signup } = useAuth();
  const router = useRouter();
  // State management with clearer initial values
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
      unitPreference: "metric"
    },
  });

  // Authentication redirect effect
  useEffect(() => {
    if (state.status === "authenticated") router.replace("/home");
  }, [state.status, router]);

  // Unified submit handler
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

  // Error handling with status tracking
  const handleError = (error: any, email: string) => {
    if (error.message.includes("Email not confirmed")) {
      setConfirmationState("resend");
      setResendEmail(email);
    } else {
      setMessage({
        text: error.message.includes("already registered")
          ? "This email is already registered. Please log in."
          : error.message || "An unexpected error occurred", // More user-friendly
        isError: true,
      });
    }
  };

  // Resend confirmation flow
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

  // Loading state with consistent spacing
  if (state.status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Confirmation success screen
  if (confirmationState === "sent") {
    return (
      <div className="container max-w-lg p-8 text-center space-y-6"> {/* Consistent spacing */}
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Check Your Email</h2>
          <p className="text-muted-foreground">
            We've sent a confirmation link to <span className="font-medium text-foreground">{form.getValues("email")}</span>.
            The link will expire in 24 hours.
          </p>
        </div>
        <Button
          onClick={() => {
            setConfirmationState("none");
            setIsLogin(true);
          }}
          className="w-full"
        >
          Return to Login
        </Button>
      </div>
    );
  }

  // Resend confirmation screen
  if (confirmationState === "resend") {
    return (
      <div className="container max-w-lg p-8 text-center space-y-6">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Confirmation Required</h2>
          <p className="text-muted-foreground">
            Please confirm your email address <span className="font-medium text-foreground">{resendEmail}</span>
          </p>
        </div>

        {message && (
          <Alert variant={message.isError ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button 
            onClick={resendConfirmation} 
            className="w-full"
            disabled={isLoading}
          >
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
      </div>
    );
  }

  // Main auth form with animation
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
          <Card className="mt-8">
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
                  {/* Email Field */}
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

                  {/* Password Field */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            autoComplete="current-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conditional Signup Fields */}
                  {!isLogin && (
                    <>
                      {/* Confirm Password */}
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                autoComplete="new-password"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Full Name */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Doe" 
                                autoComplete="name"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Unit Preference */}
                      <FormField
                        control={form.control}
                        name="unitPreference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Measurement System</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
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

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    aria-label={isLogin ? "Sign in" : "Create account"}
                  >
                    {isLoading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
                  </Button>

                  {/* Toggle Button */}
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
    </div>
  );
}