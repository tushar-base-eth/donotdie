import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UpdateProfile } from "@/types/workouts";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ profile: null }, { status: 401 });
  }

  const userId = session.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ profile: null }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
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