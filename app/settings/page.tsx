"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import useSWR from "swr";
import { useSWRConfig } from "swr";
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
import { useAuth } from "@/contexts/auth-context";
import { fetchProfileData } from "@/lib/supabaseUtils";
import ProtectedRoute from "@/components/auth/protected-route";
import { motion } from "framer-motion";
import { ProfileSkeleton } from "@/components/loading/profile-skeleton";

// Adjusted schema to match profile fields and make optional fields nullable
const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["Male", "Female", "Other"]).nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  unit_preference: z.enum(["metric", "imperial"]),
  weight_kg: z.number().positive("Weight must be greater than 0").nullable().optional(),
  height_cm: z.number().positive("Height must be greater than 0").nullable().optional(),
  body_fat_percentage: z.number().min(0).max(100).nullable().optional(),
});

export default function SettingsPage() {
  const { state, logout, updateProfile } = useAuth();
  const { user } = state;
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { mutate } = useSWRConfig();

  // Fetch profile data with SWR, with null check for user
  const { data: profileData, error: profileError } = useSWR(
    user ? ["profile", user.id] : null,
    () => user ? fetchProfileData(user.id) : null
  );

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

  // Populate form when profileData is available, ensuring unit_preference is correctly typed
  useEffect(() => {
    if (profileData) {
      setIsNewProfile(profileData.name === "New User");
      form.reset({
        name: profileData.name || "",
        gender: profileData.gender as "Male" | "Female" | "Other" | null,
        date_of_birth: profileData.date_of_birth || "",
        unit_preference: profileData.unit_preference as "metric" | "imperial", // Explicitly cast to match schema
        weight_kg: profileData.weight_kg || null,
        height_cm: profileData.height_cm || null,
        body_fat_percentage: profileData.body_fat_percentage || null,
      });
    }
  }, [profileData, form]);

  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile(data);
      // Update SWR cache optimistically with submitted data
      mutate(user ? ["profile", user.id] : null, data, false);
      form.reset(data);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle errors with null check for user
  if (profileError) {
    return (
      <div className="p-4">
        Failed to load profile data.{" "}
        <button onClick={() => user && mutate(["profile", user.id])} className="text-blue-500 underline">
          Retry
        </button>
      </div>
    );
  }

  // Show skeleton while loading
  if (!profileData) {
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
          {isNewProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="default" className="glass shadow-md">
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
            <Card className="border-0 glass shadow-md">
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
                          value={user?.email || ""}
                          readOnly
                          disabled
                          className="rounded-xl"
                        />
                      </FormControl>
                    </FormItem>
                    <FormField
                      control={form.control}
                      name="unit_preference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Preference</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue>
                                  {field.value === "metric" ? "Metric (kg/cm)" : "Imperial (lb/ft-in)"}
                                </SelectValue>
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
                      className="rounded-xl"
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