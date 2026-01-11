"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

function randomHandle() {
  return `anon-${Math.random().toString(36).slice(2, 8)}`;
}

export default function OnboardingPage() {
  const router = useRouter();

  const [eduYears, setEduYears] = useState("");
  const [poliYears, setPoliYears] = useState("");
  const [paYears, setPaYears] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const supabase = supabaseBrowser();

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function submit() {
    setError(null);

    // Require at least one field
    if (!eduYears && !poliYears && !paYears) {
      setError("Please fill at least one field.");
      return;
    }

    setLoading(true);

    const supabase = supabaseBrowser();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    // Upsert avoids duplicate insert errors if user refreshes
    const { error: upsertErr } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        handle: randomHandle(),
        edu_years: eduYears ? Number(eduYears) : null,
        poli_years: poliYears ? Number(poliYears) : null,
        pa_years: paYears ? Number(paYears) : null,
      },
      { onConflict: "user_id" }
    );

    if (upsertErr) {
      setError(upsertErr.message);
      setLoading(false);
      return;
    }

    router.push("/feed");
  }

  if (checkingAuth) {
    return <p style={{ padding: 16 }}>Checking session…</p>;
  }

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Background context (anonymous)</h1>
      <p style={{ fontSize: 14, color: "#666" }}>
        Choose <strong>at least one</strong>. Self-reported and anonymous.
      </p>

      <div style={{ marginTop: 20 }}>
        <label>Years in higher education</label>
        <input
          type="number"
          min={0}
          value={eduYears}
          onChange={(e) => setEduYears(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Years in political science / policy</label>
        <input
          type="number"
          min={0}
          value={poliYears}
          onChange={(e) => setPoliYears(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Years living in Pennsylvania</label>
        <input
          type="number"
          min={0}
          value={paYears}
          onChange={(e) => setPaYears(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

      <button
        onClick={submit}
        disabled={loading}
        style={{ marginTop: 20, width: "100%" }}
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </main>
  );
}