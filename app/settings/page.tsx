"use client";

import { useEffect, useState } from "react";
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
import { useAuth } from "@/contexts/auth-context";
import type { UserProfile } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/auth/protected-route"; 
import { motion } from "framer-motion";

// Schema for form validation
const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  dateOfBirth: z.string().optional(),
  unitPreference: z.enum(["metric", "imperial"]),
  weight: z.number().positive("Weight must be greater than 0").optional(),
  height: z.number().positive("Height must be greater than 0").optional(),
  bodyFat: z.number().min(0).max(100).optional(),
});

function SettingsPage() {
  const { state, logout, updateProfile } = useAuth();
  const { user } = state;
  const isLoading = state.status === "loading";
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [feetPart, setFeetPart] = useState(0);
  const [inchesPart, setInchesPart] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || "",
      gender: (user?.gender as "Male" | "Female" | "Other") || "Male",
      dateOfBirth: user?.dateOfBirth || "",
      unitPreference: user?.unitPreference || "metric",
      weight: user?.weight || 70,
      height: user?.height || 170,
      bodyFat: user?.bodyFat || 0,
    },
  });

  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile(data as UserProfile);
      form.reset(data); // Reset form state to mark it as unchanged
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/auth");
    } else if (user) {
      setIsNewProfile(!user.isProfileComplete);

      const height = user.height || 170;
      const { feet, inches } = cmToFeetInches(height);
      setFeetPart(feet);
      setInchesPart(inches);

      const resetValues = {
        name: user.name || "New User",
        gender: (user.gender as "Male" | "Female" | "Other") || "Other",
        dateOfBirth: user.dateOfBirth || "",
        unitPreference: user.unitPreference || "metric",
        weight: user.weight || 70,
        height: user.height || 170,
        bodyFat: user.bodyFat || 0,
      };

      form.reset(resetValues);
    }
  }, [user, isLoading, form, router]);

  const handleLogout = () => {
    logout();
  };

  const cmToFeetInches = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background pb-16">Loading...</div>;
  }

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
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
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
                  Please complete your profile information to get the most out of the app.
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
                        <Input value={user?.email || ""} readOnly disabled className="rounded-xl" />
                      </FormControl>
                    </FormItem>
                    <FormField
                      control={form.control}
                      name="unitPreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Preference</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue>
                                  {field.value === "metric"
                                    ? "Metric (kg/cm)"
                                    : field.value === "imperial"
                                    ? "Imperial (lb/ft-in)"
                                    : "Select units"}
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
                    <div className="flex justify-left">
                      <Button
                        type="submit"
                        disabled={isSaving || !form.formState.isDirty}
                        className="rounded-xl"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                    </div>
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

export default SettingsPage;