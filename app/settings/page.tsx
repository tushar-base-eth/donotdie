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
import { ProtectedRoute } from "@/components/auth/protected-route";
import { motion } from "framer-motion";
import { debounce } from "lodash"; // Install lodash if not already present

// Define the schema for validation
const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  unitPreference: z.enum(["metric", "imperial"]),
});

function SettingsPage() {
  const { state, logout, updateProfile } = useAuth();
  const { user } = state;
  const isLoading = state.status === "loading";
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isNewProfile, setIsNewProfile] = useState(false);

  // Initialize the form with default values from the user profile
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || "",
      unitPreference: user?.unitPreference || "metric",
    },
  });

  // Debounce the save function to avoid excessive API calls
  const debounceSave = debounce(async (data: Partial<UserProfile>) => {
    try {
      await updateProfile(data); // Save to backend
    } catch (error) {
      console.error("Error saving profile:", error); // Silent error handling
    }
  }, 500); // 500ms delay

  // Handle changes to fields and trigger save
  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    form.setValue(field, value); // Update form state
    debounceSave({ [field]: value }); // Trigger debounced save
  };

  // Sync form with user data and handle routing
  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/auth"); // Redirect if not authenticated
    } else if (user) {
      setIsNewProfile(!user.isProfileComplete);
      form.reset({
        name: user.name || "New User",
        unitPreference: user.unitPreference || "metric",
      });
    }
  }, [user, isLoading, form, router]);

  const handleLogout = () => {
    logout(); // Logout function from auth context
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
                  <form className="space-y-6">
                    {/* Name Field */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => handleFieldChange("name", e.target.value)}
                              className="rounded-xl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email Field (Read-Only) */}
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

                    {/* Unit Preference Dropdown */}
                    <FormField
                      control={form.control}
                      name="unitPreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Preference</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              handleFieldChange("unitPreference", value)
                            }
                            value={field.value}
                          >
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