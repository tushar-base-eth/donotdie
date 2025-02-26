import * as z from "zod";

export const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["Male", "Female", "Other"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  unitPreference: z.enum(["metric", "imperial"]),
  weight: z.number().positive("Weight must be greater than 0"),
  height: z.number().positive("Height must be greater than 0"),
  bodyFat: z.number().min(0).max(100).optional(),
  themePreference: z.enum(["light", "dark"]).optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>; 