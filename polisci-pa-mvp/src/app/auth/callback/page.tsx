"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    // If we got an OAuth "code", exchange it via the server route
    if (code) {
      // preserve the current origin; no :3000 issues
      window.location.href = `/auth/exchange?code=${encodeURIComponent(code)}`;
      return;
    }

    // Otherwise, handle hash-token magic links client-side
    const supabase = supabaseBrowser();
    supabase.auth.getSession().finally(() => {
      router.replace("/onboarding");
    });
  }, [router, searchParams]);

  return <p>Signing you in…</p>;
}
