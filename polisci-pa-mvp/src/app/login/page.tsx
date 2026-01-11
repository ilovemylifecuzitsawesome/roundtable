"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    setError(null);
    setLoading(true);

    const supabase = supabaseBrowser();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Sign in</h1>

      <p style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
        We’ll send you a magic link. No password needed.
      </p>

      {!sent ? (
        <>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              marginTop: 16,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          />

          <button
            onClick={sendMagicLink}
            disabled={loading || !email}
            style={{
              width: "100%",
              padding: 10,
              marginTop: 16,
              borderRadius: 4,
              border: "1px solid #000",
              background: loading ? "#eee" : "#000",
              color: "#fff",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Sending…" : "Send magic link"}
          </button>
        </>
      ) : (
        <p style={{ marginTop: 16 }}>
          Check your email for the sign-in link ✉️
        </p>
      )}

      {error && (
        <p style={{ color: "red", marginTop: 12 }}>{error}</p>
      )}
    </main>
  );
}