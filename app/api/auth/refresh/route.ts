import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  if (getUserError || !user) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data.session) {
    return NextResponse.json({ error: "Failed to refresh session" }, { status: 500 });
  }

  return NextResponse.json({ session: { user: data.session.user } });
}