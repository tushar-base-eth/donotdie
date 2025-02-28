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
import { BottomNav } from "@/components/navigation/bottom-nav";
import { useAuth } from "@/contexts/auth-context";
import type { UserProfile } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";

const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["Male", "Female", "Other"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  unitPreference: z.enum(["metric", "imperial"]),
  weight: z.number().positive("Weight must be greater than 0"),
  height: z.number().positive("Height must be greater than 0"),
  bodyFat: z.number().min(0).max(100).optional(),
});

function SettingsPage() {
  const { state, logout, updateProfile } = useAuth();
  const { user } = state;
  const isLoading = state.status === 'loading';
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

  // Convert cm to feet and inches
  const cmToFeetInches = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };

  // Convert feet and inches to cm
  const feetInchesToCm = (feet: number, inches: number) => {
    return Math.round((feet * 12 + inches) * 2.54);
  };

  // Handle manual form submission
  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile(data as UserProfile);
      setIsNewProfile(false);
      if (data.name !== user.name) {
        // If name was changed, show success message
        console.log("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Remove auto-save effect
  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/auth");
    } else if (user) {
      // Check if this might be a new profile setup
      setIsNewProfile(!user.isProfileComplete);

      // Set initial form values from user profile
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

  if (isLoading) {
    return <div className="min-h-screen bg-background p-4">Loading...</div>;
  }

  return (
    <div className="pb-20">
      <PageHeader
        title="Settings"
        rightContent={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      <div className="p-4 space-y-6">
        {isNewProfile && (
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Setup</AlertTitle>
            <AlertDescription>
              Please complete your profile information to get the most out of
              the app.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
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
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input value={user?.email || ''} readOnly disabled />
                  </FormControl>
                </FormItem>
                {/* Gender field - temporarily hidden
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                */}
                {/* Date of Birth field - temporarily hidden
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                */}
                <FormField
                  control={form.control}
                  name="unitPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Preference</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue defaultValue={field.value}>
                              {field.value === 'metric' ? 'Metric (kg/cm)' : field.value === 'imperial' ? 'Imperial (lb/ft-in)' : 'Select units'}
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
                {/* Weight field - temporarily hidden
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Weight (
                        {form.watch("unitPreference") === "metric"
                          ? "kg"
                          : "lb"}
                        )
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => {
                            let value = Number.parseFloat(e.target.value);
                            // If imperial, convert to kg for storage
                            if (form.watch("unitPreference") === "imperial") {
                              value = value / 2.20462;
                            }
                            field.onChange(value);
                          }}
                          value={
                            form.watch("unitPreference") === "imperial"
                              ? Math.round(field.value * 2.20462 * 10) / 10
                              : field.value
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                */}
                {/* Height field - temporarily hidden
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Height (
                        {form.watch("unitPreference") === "metric"
                          ? "cm"
                          : "ft/in"}
                        )
                      </FormLabel>
                      <FormControl>
                        {form.watch("unitPreference") === "metric" ? (
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(Number.parseFloat(e.target.value));
                            }}
                          />
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="ft"
                              className="w-20"
                              value={feetPart}
                              onChange={(e) => {
                                const ft =
                                  Number.parseFloat(e.target.value) || 0;
                                setFeetPart(ft);
                                field.onChange(feetInchesToCm(ft, inchesPart));
                              }}
                            />
                            <Input
                              type="number"
                              placeholder="in"
                              className="w-20"
                              value={inchesPart}
                              onChange={(e) => {
                                const inches =
                                  Number.parseFloat(e.target.value) || 0;
                                setInchesPart(inches);
                                field.onChange(
                                  feetInchesToCm(feetPart, inches)
                                );
                              }}
                            />
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                */}
                {/* Body Fat field - temporarily hidden
                <FormField
                  control={form.control}
                  name="bodyFat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Fat %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number.parseFloat(e.target.value));
                          }}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                */}

                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? "Saving..."
                    : isNewProfile
                    ? "Complete Profile"
                    : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}
