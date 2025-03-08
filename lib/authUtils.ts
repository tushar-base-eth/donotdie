import { supabase } from "./supabaseClient";

/**
 * Fetches profile data for a user.
 * @param userId - The ID of the user.
 * @returns A promise resolving to the profile data.
 */
export async function fetchProfileData(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("total_volume, total_workouts, name, gender, date_of_birth, unit_preference, weight_kg, height_cm, body_fat_percentage")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}