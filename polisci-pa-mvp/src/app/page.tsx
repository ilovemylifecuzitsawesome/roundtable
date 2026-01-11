"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

    async function sendLink() {
    setErr(null);

    const supabase = supabaseBrowser();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-muted-foreground">
        Magic link login. Your account stays anonymous in-app.
      </p>

      <input
        type="email"
        className="w-full border rounded px-3 py-2"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="w-full border rounded px-3 py-2" onClick={sendLink}>
        Send magic link
      </button>

      {sent && <p className="text-sm">Check your email for the sign-in link.</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}


