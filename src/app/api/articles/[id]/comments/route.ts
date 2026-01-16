import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Lazy import to avoid build-time issues
    const { db } = await import("@/lib/db");
    const { formatAlias } = await import("@/types");

    type VoteType = "APPROVE" | "DISAPPROVE" | "NEUTRAL";

    const comments = await db.comment.findMany({
      where: { articleId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            aliasType: true,
            aliasYears: true,
          },
        },
      },
    });

    const userIds = Array.from(new Set(comments.map((c) => c.userId)));
    const votes = await db.vote.findMany({
      where: {
        articleId: id,
        userId: { in: userIds },
      },
      select: {
        userId: true,
        voteType: true,
      },
    });

    const voteMap = Object.fromEntries(votes.map((v) => [v.userId, v.voteType]));

    const commentsWithAlias = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      userAlias: formatAlias(comment.user.aliasType, comment.user.aliasYears),
      userVote: (voteMap[comment.userId] || "NEUTRAL") as VoteType,
    }));

    return NextResponse.json({ comments: commentsWithAlias });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Lazy imports
    const { createClient } = await import("@/lib/supabase/server");
    const { db } = await import("@/lib/db");
    const { z } = await import("zod");

    const commentSchema = z.object({
      content: z.string().min(1).max(500),
    });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vote = await db.vote.findUnique({
      where: {
        userId_articleId: {
          userId: user.id,
          articleId: id,
        },
      },
    });

    if (!vote) {
      return NextResponse.json(
        { error: "Must vote before commenting" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { content } = commentSchema.parse(body);

    const comment = await db.comment.create({
      data: {
        content,
        userId: user.id,
        articleId: id,
      },
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
