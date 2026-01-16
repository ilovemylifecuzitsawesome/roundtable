import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create or update user profile in our database
      await db.user.upsert({
        where: { id: data.user.id },
        update: { email: data.user.email! },
        create: {
          id: data.user.id,
          email: data.user.email!,
        },
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to sign in page on error
  return NextResponse.redirect(`${origin}/auth/signin?error=auth`);
}
