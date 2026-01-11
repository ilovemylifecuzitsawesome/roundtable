import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import { VoteButtons } from "@/components/VoteButtons";
import { CommentComposer } from "@/components/CommentComposer";
import { DebateComments } from "@/components/DebateComments";

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const postId = Number(params.id);

  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("id,title,summary,practical,url,published_at,created_at")
    .eq("id", postId)
    .single();

  if (postErr || !post) {
    return (
      <main style={{ padding: 24 }}>
        <p>Post not found.</p>
        <Link href="/feed">Back</Link>
      </main>
    );
  }

  // Load comments + profile handles (simple join pattern)
  const { data: comments } = await supabase
    .from("comments")
    .select("id,body,stance,created_at,user_id,profiles(handle)")
    .eq("post_id", postId)
    .eq("hidden", false)
    .order("created_at", { ascending: true });

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <Link href="/feed">← Back</Link>

      <h1 style={{ marginTop: 10 }}>{post.title}</h1>

      <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
        {post.published_at
          ? new Date(post.published_at).toLocaleString()
          : new Date(post.created_at).toLocaleString()}
        {" · "}
        <a href={post.url} target="_blank" rel="noreferrer">
          Source
        </a>
      </div>

      {post.summary && (
        <>
          <h3 style={{ marginTop: 18 }}>Summary</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{post.summary}</p>
        </>
      )}

      {post.practical && (
        <>
          <h3 style={{ marginTop: 18 }}>Practical</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{post.practical}</p>
        </>
      )}

      <VoteButtons postId={postId} />

      <hr style={{ margin: "24px 0" }} />

      <h2>Discuss</h2>
      <CommentComposer postId={postId} />

      <DebateComments comments={(comments || []) as any} />
    </main>
  );
}
