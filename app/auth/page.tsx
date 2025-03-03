"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { AlertCircle, CheckCircle2 } from "lucide-react"; // Import icons if using lucide-react
import { Alert, AlertDescription } from "@/components/ui/alert"; // Assuming you have these components

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  unitPreference: z.enum(["metric", "imperial"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginSchema = z.infer<typeof loginSchema>;
type SignupSchema = z.infer<typeof signupSchema>;
type FormSchema = LoginSchema & Partial<Omit<SignupSchema, 'email' | 'password'>>;

export default function AuthPage() {
  const { state, login, signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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
      confirmPassword: "",
      name: "",
      unitPreference: "metric",
    },
  });

  // Check if user is already authenticated or if there's an error in URL params
  useEffect(() => {
    if (state.status === "authenticated") {
      router.replace("/home");
      return;
    }
    
    const error = searchParams.get("error");
    if (error) {
      setMessage({ text: `Authentication failed: ${error}`, isError: true });
    }
    
    // Check for successful email confirmation
    const confirmed = searchParams.get("confirmed");
    if (confirmed === "true") {
      setMessage({ text: "Email confirmed successfully. You can now log in.", isError: false });
    }
  }, [state.status, router, searchParams]);

  // Show loading spinner while auth state is being determined
  if (state.status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect if already authenticated
  if (state.status === "authenticated") {
    return null;
  }

  const onSubmit = async (data: FormSchema) => {
    setIsLoading(true);
    setMessage(null);
    try {
      if (!isLogin) {
        // Sign up flow
        await signup(
          data.email, 
          data.password, 
          data.name!, 
          data.unitPreference!
        );
        setShowConfirmationMessage(true);
      } else {
        // Login flow
        await login(data.email, data.password);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      // Handle specific error cases
      if (error.message.includes("Email not confirmed")) {
        setShowResendConfirmation(true);
        setResendEmail(data.email);
      } else if (error.message.includes("already registered")) {
        setMessage({ 
          text: "This email is already registered. Please log in instead.", 
          isError: true 
        });
      } else {
        setMessage({ 
          text: error.message || "An error occurred during authentication", 
          isError: true 
        });
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
      
      setMessage({ 
        text: "Confirmation email resent. Please check your inbox.", 
        isError: false 
      });
    } catch (error: any) {
      setMessage({ 
        text: error.message || "Failed to resend confirmation email", 
        isError: true 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Email confirmation sent screen
  if (showConfirmationMessage) {
    return (
      <div className="container max-w-lg p-8 text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Check your email</h2>
        <p className="mb-4">We've sent a confirmation email to <span className="font-medium">{form.getValues("email")}</span>.</p>
        <p className="mb-6">Please click the link in that email to confirm your account. The link is valid for 24 hours.</p>
        <Button 
          onClick={() => { 
            setShowConfirmationMessage(false); 
            setIsLogin(true); 
            form.reset();
            setMessage(null); 
          }}
          className="w-full"
        >
          Back to Login
        </Button>
      </div>
    );
  }

  // Resend confirmation email screen
  if (showResendConfirmation) {
    return (
      <div className="container max-w-lg p-8 text-center">
        <div className="mb-6 flex justify-center">
          <AlertCircle className="h-12 w-12 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Email not confirmed</h2>
        <p className="mb-6">
          Your email address <span className="font-medium">{resendEmail}</span> needs to be confirmed before you can log in.
        </p>
        
        {message && (
          <Alert className={`mb-6 ${message.isError ? "bg-red-50" : "bg-green-50"}`}>
            <AlertDescription className={message.isError ? "text-red-600" : "text-green-600"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          <Button 
            onClick={handleResendConfirmation} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Sending..." : "Resend Confirmation Email"}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => { 
              setShowResendConfirmation(false); 
              setMessage(null); 
            }} 
            className="w-full"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  // Main login/signup form
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
              <CardTitle>{isLogin ? "Login" : "Create an Account"}</CardTitle>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert 
                  className={`mb-6 ${message.isError ? "bg-red-50" : "bg-green-50"}`}
                >
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
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
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
                  
                  <div className="space-y-3 pt-2">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : isLogin ? "Login" : "Create Account"}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        form.reset();
                        setMessage(null);
                      }}
                      disabled={isLoading}
                    >
                      {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}