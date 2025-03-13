import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { origin } = new URL(request.url); // Extract the origin (e.g., http://localhost:3000 or https://zero-now.vercel.app)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback`, // Dynamically set redirectTo based on the current environment
    },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(data.url);
}