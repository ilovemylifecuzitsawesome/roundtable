"use client";

import { useState } from "react";

export function CommentComposer({ postId }: { postId: number }) {
  const [body, setBody] = useState("");
  const [stance, setStance] = useState<"neutral" | "approve" | "disapprove">("neutral");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(null);
    if (!body.trim()) return;

    setLoading(true);
    const res = await fetch("/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, body, stance }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErr(data?.error || "Failed to comment");
      return;
    }

    // MVP: reload page to show new comment
    location.reload();
  }

  return (
    <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
      <select value={stance} onChange={(e) => setStance(e.target.value as any)}>
        <option value="neutral">Neutral</option>
        <option value="approve">Approve-side</option>
        <option value="disapprove">Disapprove-side</option>
      </select>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a comment…"
        rows={4}
      />

      {err && <div style={{ color: "red" }}>{err}</div>}

      <button onClick={submit} disabled={loading}>
        {loading ? "Posting..." : "Post comment"}
      </button>
    </div>
  );
}
