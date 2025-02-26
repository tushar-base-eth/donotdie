"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export default function AuthPage() {
  const { state, login, signup } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  useEffect(() => {
    if (state.status === 'authenticated') {
      if (state.user?.isProfileComplete) {
        router.replace('/');
      } else {
        router.replace('/settings');
      }
    }
  }, [state.status, state.user, router]);

  if (state.status === 'loading' || state.status === 'authenticated') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(values.email, values.password);
        // Redirect is handled in the login function
      } else {
        await signup(values.email, values.password, values.name);
        // Redirect is handled in the signup function
      }
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Email and Password fields */}
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
                            autoComplete={
                              isLogin ? "current-password" : "new-password"
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Signup-only field for name */}
                  {!isLogin && (
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
                  )}

                  {/* Form actions */}
                  <div className="space-y-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
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
                      {isLogin
                        ? "Create an account"
                        : "Already have an account?"}
                    </Button>
                  </div>

                  {/* Form error message */}
                  {form.formState.errors.root && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm font-medium text-destructive text-center"
                    >
                      {form.formState.errors.root.message}
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
