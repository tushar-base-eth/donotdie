import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UpdateProfile } from "@/types/workouts";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ profile: null }, { status: 401 });
  }

  const userId = user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ profile: null }, { status: 404 });
  }
  return NextResponse.json(
    { profile },
    {
      // Wrapped profile in { profile: ... }
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    }
  );
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const updates: Partial<UpdateProfile> = await request.json();

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: updatedProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return NextResponse.json({ profile: updatedProfile });
}
