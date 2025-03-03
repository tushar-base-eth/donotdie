"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Updated import
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  unitPreference: z.enum(["metric", "imperial"]),
});

type LoginSchema = z.infer<typeof loginSchema>;
type SignupSchema = z.infer<typeof signupSchema>;
type FormSchema = LoginSchema & Partial<SignupSchema>;

export default function AuthPage() {
  const { state, login, signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); // Added to get query params
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const form = useForm<FormSchema>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema) as any,
    defaultValues: {
      email: "",
      password: "",
      name: "",
      unitPreference: "metric",
    },
  });

  useEffect(() => {
    if (state.status === "authenticated") {
      router.replace("/");
    }
    const error = searchParams.get("error"); // Check for error param
    if (error) {
      setMessage({ text: `Authentication failed: ${error}`, isError: true });
    }
  }, [state.status, router, searchParams]);

  if (state.status === "loading" || state.status === "authenticated") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const onSubmit = async (data: FormSchema) => {
    setIsLoading(true);
    setMessage(null);
    try {
      if (!isLogin) {
        await signup(data.email, data.password, data.name!, data.unitPreference!);
        setShowConfirmationMessage(true);
      } else {
        await login(data.email, data.password);
      }
    } catch (error: any) {
      if (error.message.includes("Email not confirmed")) {
        setShowResendConfirmation(true);
        setResendEmail(data.email);
      } else {
        setMessage({ text: error.message || "An error occurred", isError: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: resendEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setMessage({ text: "Confirmation email resent. Please check your email.", isError: false });
    } catch (error: any) {
      setMessage({ text: error.message || "Failed to resend confirmation email", isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (showConfirmationMessage) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Check your email</h2>
        <p className="mb-4">We've sent a confirmation email to {form.getValues("email")}.</p>
        <p className="mb-4">Please click the link in that email to confirm your account.</p>
        <Button onClick={() => { setShowConfirmationMessage(false); setIsLogin(true); setMessage(null); }}>
          Back to Login
        </Button>
      </div>
    );
  }

  if (showResendConfirmation) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Email not confirmed</h2>
        <p className="mb-4">Please confirm your email before logging in.</p>
        {message && (
          <p className={`mb-4 ${message.isError ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </p>
        )}
        <Button onClick={handleResendConfirmation} disabled={isLoading}>
          {isLoading ? "Sending..." : "Resend Confirmation Email"}
        </Button>
        <Button variant="outline" onClick={() => { setShowResendConfirmation(false); setMessage(null); }} className="mt-2">
          Back to Login
        </Button>
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
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>{isLogin ? "Login" : "Sign Up"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
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
                          <Input
                            type="password"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {!isLogin && (
                    <>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                                <SelectItem value="imperial">Imperial (lb/ft-in)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  <div className="space-y-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        form.reset();
                      }}
                      disabled={isLoading}
                    >
                      {isLogin ? "Create an account" : "Already have an account?"}
                    </Button>
                  </div>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-sm font-medium text-center ${message.isError ? "text-destructive" : "text-green-600"}`}
                    >
                      {message.text}
                    </motion.div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}