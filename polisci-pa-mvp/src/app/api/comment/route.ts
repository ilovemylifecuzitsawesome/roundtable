import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { postId, body, stance } = await req.json();

  if (!postId || !body || typeof body !== "string") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const allowed = new Set(["approve", "disapprove", "neutral"]);
  const stanceSafe = allowed.has(stance) ? stance : "neutral";

  const supabase = await supabaseServer();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    stance: stanceSafe,
    body: body.slice(0, 2000),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
