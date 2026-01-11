import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { postId, value } = await req.json();

  if (!postId || (value !== 1 && value !== -1)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase.from("votes").upsert(
    { user_id: user.id, post_id: postId, value },
    { onConflict: "user_id,post_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
