"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { LogOut, Sun, Moon, AlertCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTheme } from "next-themes";
import { useAuth, UpdatableProfile } from "@/contexts/auth-context"; // Added UpdatableProfile import
import ProtectedRoute from "@/components/auth/protected-route";
import { motion } from "framer-motion";
import { ProfileSkeleton } from "@/components/loading/profile-skeleton";
import { toast } from "@/components/ui/use-toast";

// Define the schema for the settings form
const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["Male", "Female", "Other"]).nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  unit_preference: z.enum(["metric", "imperial"]),
  weight_kg: z.number().positive("Weight must be greater than 0").nullable().optional(),
  height_cm: z.number().positive("Height must be greater than 0").nullable().optional(),
  body_fat_percentage: z.number().min(0).max(100).nullable().optional(),
});

export default function Settings() {
  const { state, logout, updateProfile } = useAuth();
  const { user } = state; // Directly use user from AuthContext instead of SWR
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize the form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      gender: null,
      date_of_birth: "",
      unit_preference: "metric",
      weight_kg: null,
      height_cm: null,
      body_fat_percentage: null,
    },
  });

  // Sync form with user data from AuthContext whenever it changes
  useEffect(() => {
    if (user) {
      setIsNewProfile(user.name === "New User");
      form.reset({
        name: user.name || "",
        gender: user.gender,
        date_of_birth: user.dateOfBirth || "",
        unit_preference: user.unitPreference, // Matches UserProfile field name
        weight_kg: user.weight || null,
        height_cm: user.height || null,
        body_fat_percentage: user.bodyFat || null,
      });
    }
  }, [user, form]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Map form data to match UpdatableProfile interface
      const updates: Partial<UpdatableProfile> = {
        name: data.name,
        gender: data.gender,
        dateOfBirth: data.date_of_birth,
        unitPreference: data.unit_preference, // Use camelCase to match UserProfile
        weight: data.weight_kg,
        height: data.height_cm,
        bodyFat: data.body_fat_percentage,
      };
      // Update profile in database and AuthContext state
      await updateProfile(updates);
      toast({
        title: "Success",
        description: "Profile saved successfully.",
        variant: "default",
        duration: 1000,
      });
      // No need to manually reset form; useEffect will handle it when user updates
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading skeleton while auth state is loading or user is not available
  if (state.status === "loading" || !user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background pb-16">
          <ProfileSkeleton />
        </div>
      </ProtectedRoute>
    );
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-16">
        <PageHeader
          title="Settings"
          rightContent={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          }
        />

        <div className="p-4 space-y-6">
          {/* Show alert for new users */}
          {isNewProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="default" className="glass shadow-md rounded-3xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Profile Setup</AlertTitle>
                <AlertDescription>
                  Please complete your profile information to get started.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-0 glass shadow-md rounded-3xl">
              <CardContent className="p-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          value={user.email || ""}
                          readOnly
                          disabled
                          className="round ed-xl"
                        />
                      </FormControl>
                    </FormItem>
                    <FormField
                      control={form.control}
                      name="unit_preference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Preference</FormLabel>
                          <Select
                            key={field.value} // Add key to force re-render
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select unit preference" />
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
                    <Button
                      type="submit"
                      disabled={isSaving || !form.formState.isDirty}
                      className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}