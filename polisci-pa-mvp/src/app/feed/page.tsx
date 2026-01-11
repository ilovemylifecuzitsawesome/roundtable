import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import FeedClient from "./FeedClient";

export default async function FeedPage() {
  const supabase = await supabaseServer();

  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      id,title,summary,practical,url,published_at,created_at,
      post_vote_counts(approves, disapproves)
    `)
    .eq("hidden", false)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Feed</h1>
        <p style={{ color: "red" }}>Error: {error.message}</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1>PA Policy Feed</h1>
        <Link href="/login">Account</Link>
      </div>

      <FeedClient initialPosts={(posts ?? []) as any} />
    </main>
  );
}

