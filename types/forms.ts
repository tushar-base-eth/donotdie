import * as z from "zod";

export const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["Male", "Female", "Other"]),
  date_of_birth: z.date().nullable(), // Changed to z.date().nullable()
  unit_preference: z.enum(["metric", "imperial"]),
  weight_kg: z.number().positive("Weight must be greater than 0").nullable(),
  height_cm: z.number().positive("Height must be greater than 0").nullable(),
  body_fat_percentage: z.number().min(0).max(100).nullable().optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;