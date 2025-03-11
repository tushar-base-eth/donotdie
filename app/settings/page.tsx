"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  LogOut,
  AlertCircle,
  Sun,
  Moon,
  User,
  Ruler,
  Weight,
  Percent,
  Calendar,
} from "lucide-react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/lib/hooks/use-profile";
import { motion } from "framer-motion";
import { ProfileSkeleton } from "@/components/loading/profile-skeleton";
import { toast } from "@/components/ui/use-toast";
import {
  convertWeight,
  convertHeightToInches,
  convertInchesToCm,
} from "@/lib/utils";
import * as z from "zod";

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
  const { user } = state;
  const { updateProfile } = useProfile(user?.id || "");
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isNewProfile, setIsNewProfile] = useState(false);
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
      setIsNewProfile(user.name === "New User");
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
        {isNewProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="default" className="glass shadow-md rounded-2xl border-primary/20">
              <AlertCircle className="h-5 w-5 text-primary" />
              <AlertTitle className="font-medium">Profile Setup</AlertTitle>
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
          className="w-full mx-auto"
        >
          <Form {...form}>
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
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80">Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter your name"
                                className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Gender</FormLabel>
                              <Select
                                onValueChange={(value) =>
                                  field.onChange(
                                    value === "null" ? null : value as "male" | "female" | "other"
                                  )
                                }
                                value={field.value ?? "null"}
                                key={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
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
                              <FormLabel className="flex items-center text-foreground/80">
                                <Calendar className="h-4 w-4 mr-1 inline" />
                                Date of Birth
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={
                                    field.value ? field.value.toISOString().split("T")[0] : ""
                                  }
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? new Date(e.target.value) : null)
                                  }
                                  className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="unit_preference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80">Unit Preference</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              key={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5">
                                  <SelectValue placeholder="Select unit preference" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="metric">Metric (kg/cm)</SelectItem>
                                <SelectItem value="imperial">Imperial (lb/in)</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              This will affect how your measurements are displayed
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="weight_kg"
                          render={({ field }) => {
                            const unitPreference = form.watch("unit_preference");
                            const isImperial = unitPreference === "imperial";
                            const displayValue =
                              field.value && isImperial ? convertWeight(field.value, true) : field.value;
                            return (
                              <FormItem>
                                <FormLabel className="flex items-center text-foreground/80">
                                  <Weight className="h-4 w-4 mr-1 inline" />
                                  Weight ({isImperial ? "lbs" : "kg"})
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    value={displayValue ?? ""}
                                    onChange={(e) => {
                                      const inputValue = e.target.value ? Number(e.target.value) : null;
                                      const valueInKg = inputValue && isImperial ? inputValue / 2.20462 : inputValue;
                                      field.onChange(valueInKg);
                                    }}
                                    placeholder={`Enter weight`}
                                    className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5"
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
                            const displayValue =
                              field.value && isImperial ? convertHeightToInches(field.value) : field.value;
                            return (
                              <FormItem>
                                <FormLabel className="flex items-center text-foreground/80">
                                  <Ruler className="h-4 w-4 mr-1 inline" />
                                  Height ({isImperial ? "in" : "cm"})
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    value={displayValue ?? ""}
                                    onChange={(e) => {
                                      const inputValue = e.target.value ? Number(e.target.value) : null;
                                      const valueInCm = inputValue && isImperial ? convertInchesToCm(inputValue) : inputValue;
                                      field.onChange(valueInCm);
                                    }}
                                    placeholder={`Enter height`}
                                    className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="body_fat_percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center text-foreground/80">
                              <Percent className="h-4 w-4 mr-1 inline" />
                              Body Fat Percentage
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value ? Number(e.target.value) : null)
                                }
                                placeholder="Enter body fat percentage"
                                className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="sticky bottom-20 pt-4 pb-2 bg-background/80 backdrop-blur-md z-10">
                <Button
                  type="submit"
                  disabled={isSaving || !form.formState.isDirty}
                  className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200 shadow-md"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}