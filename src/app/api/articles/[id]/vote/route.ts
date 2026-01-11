import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const voteSchema = z.object({
  voteType: z.enum(["APPROVE", "DISAPPROVE", "NEUTRAL"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { voteType } = voteSchema.parse(body);

    // Check if article exists
    const article = await db.article.findUnique({
      where: { id: params.id },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Check if user already voted
    const existingVote = await db.vote.findUnique({
      where: {
        userId_articleId: {
          userId: session.user.id,
          articleId: params.id,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "Already voted on this article" },
        { status: 400 }
      );
    }

    // Create vote
    const vote = await db.vote.create({
      data: {
        voteType,
        userId: session.user.id,
        articleId: params.id,
      },
    });

    return NextResponse.json({ vote });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }
    console.error("Failed to create vote:", error);
    return NextResponse.json(
      { error: "Failed to create vote" },
      { status: 500 }
    );
  }
}
