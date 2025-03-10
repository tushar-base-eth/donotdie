"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LogOut, AlertCircle, Sun, Moon } from "lucide-react";
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
import { useProfile } from "@/lib/hooks/use-profile";
import { motion } from "framer-motion";
import { ProfileSkeleton } from "@/components/loading/profile-skeleton";
import { toast } from "@/components/ui/use-toast";
import { convertWeight, convertHeightToInches, convertInchesToCm } from "@/lib/utils";
import * as z from "zod";

// Define the settings schema (assumed from types/forms.ts)
const settingsSchema = z.object({
  name: z.string().min(1).max(50),
  gender: z.enum(["male", "female", "other"]).nullable(),
  date_of_birth: z.date().nullable(),
  unit_preference: z.enum(["metric", "imperial"]),
  weight_kg: z.number().min(20).max(500).nullable(),
  height_cm: z.number().min(50).max(250).nullable(),
  body_fat_percentage: z.number().min(2).max(60).nullable(),
});

export default function Settings() {
  const { state, logout } = useAuth();
  const { user } = state; // Moved up to be declared before useProfile
  const { updateProfile } = useProfile(user?.id || "");
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      gender: null,
      date_of_birth: null,
      unit_preference: "metric",
      weight_kg: null,
      height_cm: null,
      body_fat_percentage: null,
    },
  });

  useEffect(() => {
    if (user) {
      setIsNewProfile(user.name === "New User");
      form.reset({
        name: user.name || "", // Ensure name is always a string
        gender: user.gender,
        date_of_birth: user.date_of_birth ? new Date(user.date_of_birth) : null, // Convert string to Date for UI
        unit_preference: user.unit_preference || "metric", // Fallback to "metric" if undefined
        weight_kg: user.weight_kg,
        height_cm: user.height_cm,
        body_fat_percentage: user.body_fat_percentage,
      });
      setTheme(user.theme_preference);
    }
  }, [user, form, setTheme]);

  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const updates = {
        name: data.name,
        gender: data.gender,
        date_of_birth: data.date_of_birth ? data.date_of_birth.toISOString().split("T")[0] : null,
        unit_preference: data.unit_preference,
        weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        body_fat_percentage: data.body_fat_percentage,
      };
      await updateProfile(updates);
      toast({
        title: "Success",
        description: "Profile saved successfully.",
        variant: "default",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (state.status === "loading" || !user) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <ProfileSkeleton />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader
        title="Settings"
        rightContent={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newTheme = theme === "dark" ? "light" : "dark";
                setTheme(newTheme);
                updateProfile({ theme_preference: newTheme });
              }}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
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
          className="max-w-md mx-auto"
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
                          <Input
                            {...field}
                            placeholder="Enter your name"
                            className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "null" ? null : value as "male" | "female" | "other")
                          }
                          value={field.value ?? "null"}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="null">Not specified</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? field.value.toISOString().split("T")[0] : ""}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit_preference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Preference</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          key={field.value} // Added to force re-render on value change
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring">
                              <SelectValue placeholder="Select unit preference" />
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
                  <FormField
                    control={form.control}
                    name="weight_kg"
                    render={({ field }) => {
                      const unitPreference = form.watch("unit_preference");
                      const isImperial = unitPreference === "imperial";
                      const displayValue = field.value && isImperial ? convertWeight(field.value, true) : field.value;
                      return (
                        <FormItem>
                          <FormLabel>Weight ({isImperial ? "lbs" : "kg"})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              value={displayValue ?? ""}
                              onChange={(e) => {
                                const inputValue = e.target.value ? Number(e.target.value) : null;
                                const valueInKg = inputValue && isImperial ? inputValue / 2.20462 : inputValue;
                                field.onChange(valueInKg);
                              }}
                              placeholder={`Enter weight in ${isImperial ? "lbs" : "kg"}`}
                              className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="height_cm"
                    render={({ field }) => {
                      const unitPreference = form.watch("unit_preference");
                      const isImperial = unitPreference === "imperial";
                      const displayValue = field.value && isImperial ? convertHeightToInches(field.value) : field.value;
                      return (
                        <FormItem>
                          <FormLabel>Height ({isImperial ? "in" : "cm"})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              value={displayValue ?? ""}
                              onChange={(e) => {
                                const inputValue = e.target.value ? Number(e.target.value) : null;
                                const valueInCm = inputValue && isImperial ? convertInchesToCm(inputValue) : inputValue;
                                field.onChange(valueInCm);
                              }}
                              placeholder={`Enter height in ${isImperial ? "inches" : "cm"}`}
                              className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="body_fat_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Fat Percentage (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            placeholder="Enter body fat percentage"
                            className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isSaving || !form.formState.isDirty}
                    className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
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
  );
}