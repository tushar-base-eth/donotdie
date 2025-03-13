import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/workouts";

interface UserProfile extends Profile {
  email: string;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const userId = session.user.id;
  const email = session.user.email ?? "";

  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        name: "New User",
        gender: null,
        date_of_birth: "2000-01-01",
        weight_kg: null,
        height_cm: null,
        body_fat_percentage: null,
        unit_preference: "metric",
        theme_preference: "light",
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ user: null, error: insertError.message }, { status: 500 });
    }
    profile = newProfile;
  }

  const userProfile: UserProfile = {
    id: userId,
    email,
    name: profile.name,
    gender: profile.gender as "male" | "female" | "other" | null,
    date_of_birth: profile.date_of_birth,
    weight_kg: profile.weight_kg,
    height_cm: profile.height_cm,
    body_fat_percentage: profile.body_fat_percentage,
    unit_preference: profile.unit_preference as "metric" | "imperial",
    theme_preference: profile.theme_preference as "light" | "dark",
    total_volume: profile.total_volume,
    total_workouts: profile.total_workouts,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };

  return NextResponse.json({ user: userProfile });
}