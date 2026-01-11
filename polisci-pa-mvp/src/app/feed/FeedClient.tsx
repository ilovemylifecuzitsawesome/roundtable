"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PostRow = {
  id: number;
  title: string;
  summary: string | null;
  practical: string | null;
  url: string;
  published_at: string | null;
  created_at: string;
  post_vote_counts?: { approves: number | null; disapproves: number | null } | null;
};

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function snippet(text: string | null, max = 220) {
  if (!text) return "";
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

export default function FeedClient({ initialPosts }: { initialPosts: PostRow[] }) {
  const [q, setQ] = useState("");
  const [showPractical, setShowPractical] = useState(true);

  // If you later add topics array, you can wire this up easily.
  // For now, keep it simple (search-only).
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return initialPosts;
    return initialPosts.filter((p) => {
      const hay = `${p.title} ${p.summary ?? ""} ${p.practical ?? ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [initialPosts, q]);

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search PA policy news…"
          style={{ flex: 1, minWidth: 220, padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
        />

        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14 }}>
          <input
            type="checkbox"
            checked={showPractical}
            onChange={(e) => setShowPractical(e.target.checked)}
          />
          Show practical
        </label>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((p) => {
          const counts = p.post_vote_counts ?? null;
          const approves = counts?.approves ?? 0;
          const disapproves = counts?.disapproves ?? 0;

          const stamp = p.published_at ?? p.created_at;

          return (
            <article
              key={p.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 14,
                padding: 14,
                background: "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <Link
                  href={`/post/${p.id}`}
                  style={{ fontSize: 18, fontWeight: 650, textDecoration: "none" }}
                >
                  {p.title}
                </Link>

                <div style={{ fontSize: 12, color: "#666", textAlign: "right", whiteSpace: "nowrap" }}>
                  {timeLabel(stamp)}
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                <a href={p.url} target="_blank" rel="noreferrer">
                  Source
                </a>
                {" · "}
                <span>Approve: {approves}</span>
                {" · "}
                <span>Disapprove: {disapproves}</span>
              </div>

              {p.summary && (
                <p style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
                  {snippet(p.summary, 260)}
                </p>
              )}

              {showPractical && p.practical && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid #eee",
                    background: "#fafafa",
                    fontSize: 14,
                  }}
                >
                  <strong>Practical:</strong> {snippet(p.practical, 240)}
                </div>
              )}

              <div style={{ marginTop: 10 }}>
                <Link href={`/post/${p.id}`}>Open →</Link>
              </div>
            </article>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ color: "#666" }}>
            No results. Try a different search.
          </div>
        )}
      </div>
    </div>
  );
}
