import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Lazy imports to avoid build-time issues
    const { createClient } = await import("@/lib/supabase/server");
    const { db } = await import("@/lib/db");

    type VoteType = "APPROVE" | "DISAPPROVE" | "NEUTRAL";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const articles = await db.article.findMany({
      where: { isActive: true },
      orderBy: { publishedAt: "desc" },
      include: {
        comments: {
          select: { id: true },
        },
      },
    });

    // Get user's votes and comments separately if authenticated
    let userVotes: Record<string, string> = {};
    let userComments: Set<string> = new Set();

    if (userId) {
      const votes = await db.vote.findMany({
        where: { userId },
        select: { articleId: true, voteType: true },
      });
      userVotes = Object.fromEntries(
        votes.map((v) => [v.articleId, v.voteType])
      );

      const comments = await db.comment.findMany({
        where: { userId },
        select: { articleId: true },
      });
      userComments = new Set(comments.map((c) => c.articleId));
    }

    // Get vote counts for all articles
    const voteCounts = await db.vote.groupBy({
      by: ["articleId", "voteType"],
      _count: { id: true },
    });

    const voteCountMap: Record<
      string,
      { approve: number; disapprove: number; neutral: number }
    > = {};
    for (const vc of voteCounts) {
      if (!voteCountMap[vc.articleId]) {
        voteCountMap[vc.articleId] = { approve: 0, disapprove: 0, neutral: 0 };
      }
      if (vc.voteType === "APPROVE") {
        voteCountMap[vc.articleId].approve = vc._count.id;
      } else if (vc.voteType === "DISAPPROVE") {
        voteCountMap[vc.articleId].disapprove = vc._count.id;
      } else {
        voteCountMap[vc.articleId].neutral = vc._count.id;
      }
    }

    const articlesWithStats = articles.map((article) => {
      const counts = voteCountMap[article.id] || {
        approve: 0,
        disapprove: 0,
        neutral: 0,
      };
      return {
        id: article.id,
        title: article.title,
        whoShouldCare: article.whoShouldCare,
        summary: article.summary,
        impact: article.impact,
        sourceName: article.sourceName,
        sourceUrl: article.sourceUrl,
        category: article.category,
        region: article.region,
        publishedAt: article.publishedAt,
        stats: {
          approveCount: counts.approve,
          disapproveCount: counts.disapprove,
          neutralCount: counts.neutral,
          commentCount: article.comments.length,
        },
        userVote: (userVotes[article.id] as VoteType) || null,
        hasCommented: userComments.has(article.id),
      };
    });

    return NextResponse.json({ articles: articlesWithStats });
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
