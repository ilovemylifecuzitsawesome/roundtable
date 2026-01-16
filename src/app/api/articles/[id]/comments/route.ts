import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { formatAlias, CommentWithAlias } from "@/types";

const commentSchema = z.object({
  content: z.string().min(1).max(500),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await db.comment.findMany({
      where: { articleId: params.id },
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

    // Get user votes for these comments
    const userIds = Array.from(new Set(comments.map((c) => c.userId)));
    const votes = await db.vote.findMany({
      where: {
        articleId: params.id,
        userId: { in: userIds },
      },
      select: {
        userId: true,
        voteType: true,
      },
    });

    const voteMap = Object.fromEntries(votes.map((v) => [v.userId, v.voteType]));

    const commentsWithAlias: CommentWithAlias[] = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      userAlias: formatAlias(comment.user.aliasType, comment.user.aliasYears),
      userVote: voteMap[comment.userId] || "NEUTRAL",
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has voted first
    const vote = await db.vote.findUnique({
      where: {
        userId_articleId: {
          userId: user.id,
          articleId: params.id,
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
        articleId: params.id,
      },
    });

    return NextResponse.json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid comment content" },
        { status: 400 }
      );
    }
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
