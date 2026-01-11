"use client";

import { useMemo, useState } from "react";

type CommentRow = {
  id: number;
  body: string;
  stance: "approve" | "disapprove" | "neutral";
  created_at: string;
  profiles?: { handle?: string } | null;
};

export function DebateComments({ comments }: { comments: CommentRow[] }) {
  const [filter, setFilter] = useState<"all" | "approve" | "disapprove" | "neutral">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return comments;
    return comments.filter((c) => c.stance === filter);
  }, [comments, filter]);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("approve")}>Approve-side</button>
        <button onClick={() => setFilter("disapprove")}>Disapprove-side</button>
        <button onClick={() => setFilter("neutral")}>Neutral</button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((c) => (
          <div key={c.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#666" }}>
              {c.profiles?.handle ?? "anon"} · {new Date(c.created_at).toLocaleString()} ·{" "}
              {c.stance}
            </div>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{c.body}</div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: "#666" }}>No comments yet.</div>}
      </div>
    </div>
  );
}
