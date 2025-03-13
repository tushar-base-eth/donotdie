"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { LogOut, AlertCircle, Sun, Moon, User, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/lib/hooks/use-profile";
import { motion } from "framer-motion";
import { ProfileSkeleton } from "@/components/loading/profile-skeleton";
import { toast } from "@/components/ui/use-toast";
import * as z from "zod";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { MeasurementsSettings } from "@/components/settings/MeasurementsSettings";

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
  const { state } = useAuth(); // Removed logout from destructuring
  const { user } = state;
  const { updateProfile } = useProfile(user?.id || "");
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

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
      form.reset({
        name: user.name || "",
        gender: user.gender,
        date_of_birth: user.date_of_birth ? new Date(user.date_of_birth) : null,
        unit_preference: user.unit_preference || "metric",
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
        date_of_birth: data.date_of_birth
          ? data.date_of_birth.toISOString().split("T")[0]
          : null,
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

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Logout failed");
      }
      router.push("/auth/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (state.status === "loading" || !user) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background pb-16 ${theme === "dark" ? "dark" : ""}`}>
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 backdrop-blur-lg rounded-b-3xl">
        <h1 className="text-lg font-semibold">Settings</h1>
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
            className="rounded-full hover:bg-secondary"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Log out"
            className="rounded-full hover:bg-secondary"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="w-full mx-auto"
        >
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs
                defaultValue="profile"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 mb-6 glass rounded-xl p-1">
                  <TabsTrigger
                    value="profile"
                    className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="measurements"
                    className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Ruler className="h-4 w-4 mr-2" />
                    Measurements
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6 mt-0">
                  <Card className="border glass shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                      <CardTitle className="flex items-center text-xl">
                        <User className="h-5 w-5 mr-2 text-primary" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <ProfileSettings />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="measurements" className="space-y-6 mt-0">
                  <Card className="border glass shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                      <CardTitle className="flex items-center text-xl">
                        <Ruler className="h-5 w-5 mr-2 text-primary" />
                        Body Measurements
                      </CardTitle>
                      <CardDescription>Track your physical measurements</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <MeasurementsSettings />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </FormProvider>
        </motion.div>
      </div>
    </div>
  );
}