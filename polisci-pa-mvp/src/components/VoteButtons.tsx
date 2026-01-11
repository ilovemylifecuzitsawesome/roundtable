"use client";

import { useState } from "react";

export function VoteButtons({ postId }: { postId: number }) {
  const [loading, setLoading] = useState<null | 1 | -1>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function vote(value: 1 | -1) {
    setLoading(value);
    setMsg(null);
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, value }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) setMsg(data?.error || "Vote failed");
    else setMsg("Saved");
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
      <button onClick={() => vote(1)} disabled={loading !== null}>
        {loading === 1 ? "Saving..." : "Approve"}
      </button>
      <button onClick={() => vote(-1)} disabled={loading !== null}>
        {loading === -1 ? "Saving..." : "Disapprove"}
      </button>
      {msg && <span style={{ fontSize: 12, color: "#666" }}>{msg}</span>}
    </div>
  );
}
