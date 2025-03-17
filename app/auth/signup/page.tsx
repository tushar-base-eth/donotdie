"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserProfile } from "@/contexts/profile-context";
import { Suspense } from "react";

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    unitPreference: z.enum(["metric", "imperial"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupSchema = z.infer<typeof signupSchema>;

function SignupContent() {
  const { state } = useUserProfile();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationState, setConfirmationState] = useState<"none" | "sent">("none");

  const form = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      unitPreference: "metric",
    },
  });

  const onSubmit = async (data: SignupSchema) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          unitPreference: data.unitPreference,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed');
      }
      setConfirmationState("sent");
    } catch (error: any) {
      console.error("Signup error:", error.message);
      form.setError("email", { message: error.message || "Signup failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (confirmationState === "sent") {
    return (
      <div className="container max-w-lg p-8 text-center space-y-8">
        <Card className="glass shadow-lg rounded-xl">
          <CardContent className="pt-8 space-y-6">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">Check Your Email</h2>
              <p className="text-muted-foreground text-sm">
                We’ve sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{form.getValues("email")}</span>. The link will expire in 24 hours.
              </p>
            </div>
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <Card className="mt-8 glass shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold text-foreground">Create Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your email"
                          type="email"
                          autoComplete="email"
                          className="rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
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
                      <FormLabel className="text-foreground/80">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Enter your password"
                          className="rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Confirm your password"
                          className="rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                          {...field}
                        />
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
                      <FormLabel className="text-foreground/80">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          autoComplete="name"
                          className="rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                          {...field}
                        />
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
                      <FormLabel className="text-foreground/80">Measurement System</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300">
                            <SelectValue placeholder="Select measurement system" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                          <SelectItem value="imperial">Imperial (lb, in)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Create Account"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-lg px-4 py-2 border border-input hover:bg-secondary transition-all duration-300"
                  onClick={() => router.push("/auth/login")}
                  disabled={isLoading}
                  type="button"
                >
                  Already Have an Account?
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function Signup() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}