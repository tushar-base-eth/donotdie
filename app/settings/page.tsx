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
import ProtectedRoute from "@/components/auth/protected-route";
import { motion } from "framer-motion";

// Form validation schema
const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  dateOfBirth: z.string().optional(),
  unitPreference: z.enum(["metric", "imperial"]),
  weight: z.number().positive("Weight must be greater than 0").optional(),
  height: z.number().positive("Height must be greater than 0").optional(),
  bodyFat: z.number().min(0).max(100).optional(),
});

export default function SettingsPage() {
  const { state, logout, updateProfile } = useAuth();
  const { user } = state;
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || "",
      gender: user?.gender || undefined,
      dateOfBirth: user?.dateOfBirth || "",
      unitPreference: user?.unitPreference || "metric",
      weight: user?.weight || undefined,
      height: user?.height || undefined,
      bodyFat: user?.bodyFat || undefined,
    },
  });

  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile(data);
      form.reset(data);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      setIsNewProfile(user.name === "New User");
      form.reset({
        name: user.name,
        gender: user.gender || undefined,
        dateOfBirth: user.dateOfBirth || "",
        unitPreference: user.unitPreference,
        weight: user.weight || undefined,
        height: user.height || undefined,
        bodyFat: user.bodyFat || undefined,
      });
    }
  }, [user, form]);

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
                      name="unitPreference"
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