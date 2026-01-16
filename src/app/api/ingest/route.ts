import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Simple auth token for protecting the endpoint
const INGEST_SECRET = process.env.INGEST_SECRET || "dev-secret";

export async function POST(req: NextRequest) {
  try {
    // Verify authorization
    const authHeader = req.headers.get("authorization");
    const providedToken = authHeader?.replace("Bearer ", "");

    if (providedToken !== INGEST_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Lazy imports
    const { db } = await import("@/lib/db");
    const { fetchRSSFeed, fetchArticleContent, PA_NEWS_FEEDS } = await import("@/lib/ml/fetcher");
    const { calculateRelevanceScore, detectRegion, detectCategory, summarizeArticle } = await import("@/lib/ml/summarizer");

    const RELEVANCE_THRESHOLD = 0.3;
    const results = {
      feedsInitialized: 0,
      articlesFetched: 0,
      articlesNew: 0,
      articlesApproved: 0,
      articlesRejected: 0,
      articlesSummarized: 0,
      errors: [] as string[],
    };

    // Step 1: Initialize feed sources
    console.log("Initializing feed sources...");
    for (const feed of PA_NEWS_FEEDS) {
      await db.feedSource.upsert({
        where: { url: feed.url },
        update: { name: feed.name, region: feed.region },
        create: {
          name: feed.name,
          url: feed.url,
          region: feed.region,
          isActive: true,
        },
      });
      results.feedsInitialized++;
    }

    // Step 2: Fetch new articles
    console.log("Fetching articles from RSS feeds...");
    const feeds = await db.feedSource.findMany({
      where: { isActive: true },
    });

    for (const feed of feeds) {
      try {
        const articles = await fetchRSSFeed(feed.url, feed.name);
        results.articlesFetched += articles.length;

        for (const article of articles) {
          const existing = await db.rawArticle.findUnique({
            where: { sourceUrl: article.sourceUrl },
          });

          if (!existing) {
            await db.rawArticle.create({
              data: {
                sourceUrl: article.sourceUrl,
                sourceName: article.sourceName,
                sourceTitle: article.sourceTitle,
                sourceContent: article.sourceContent,
                publishedAt: article.publishedAt,
                status: "PENDING",
              },
            });
            results.articlesNew++;
          }
        }

        await db.feedSource.update({
          where: { id: feed.id },
          data: { lastFetchedAt: new Date() },
        });
      } catch (error) {
        results.errors.push(`Feed ${feed.name}: ${String(error)}`);
      }
    }

    // Step 3: Score and filter articles
    console.log("Scoring articles for relevance...");
    const pendingArticles = await db.rawArticle.findMany({
      where: { status: "PENDING" },
      take: 20,
    });

    for (const article of pendingArticles) {
      try {
        let content = article.sourceContent || "";

        // Try to fetch full content if too short
        if (content.length < 500) {
          const fullContent = await fetchArticleContent(article.sourceUrl);
          if (fullContent) {
            content = fullContent;
            await db.rawArticle.update({
              where: { id: article.id },
              data: { sourceContent: content },
            });
          }
        }

        const score = calculateRelevanceScore(article.sourceTitle, content);

        if (score >= RELEVANCE_THRESHOLD) {
          await db.rawArticle.update({
            where: { id: article.id },
            data: {
              status: "APPROVED",
              relevanceScore: score,
              processedAt: new Date(),
            },
          });
          results.articlesApproved++;
        } else {
          await db.rawArticle.update({
            where: { id: article.id },
            data: {
              status: "REJECTED",
              relevanceScore: score,
              processedAt: new Date(),
            },
          });
          results.articlesRejected++;
        }
      } catch (error) {
        await db.rawArticle.update({
          where: { id: article.id },
          data: {
            status: "ERROR",
            errorMessage: String(error),
            processedAt: new Date(),
          },
        });
        results.errors.push(`Score ${article.id}: ${String(error)}`);
      }
    }

    // Step 4: Summarize approved articles
    console.log("Summarizing approved articles...");
    const approvedArticles = await db.rawArticle.findMany({
      where: { status: "APPROVED" },
      take: 5,
    });

    for (const article of approvedArticles) {
      try {
        const content = article.sourceContent || "";
        const region = detectRegion(article.sourceTitle, content);
        const category = detectCategory(article.sourceTitle, content);

        const summary = await summarizeArticle(
          article.sourceTitle,
          content,
          region
        );

        const newArticle = await db.article.create({
          data: {
            title: summary.title,
            whoShouldCare: summary.whoShouldCare,
            summary: summary.summary,
            impact: summary.impact,
            sourceUrl: article.sourceUrl,
            sourceName: article.sourceName,
            category,
            region,
            publishedAt: article.publishedAt || new Date(),
            isActive: true,
          },
        });

        await db.rawArticle.update({
          where: { id: article.id },
          data: {
            status: "SUMMARIZED",
            articleId: newArticle.id,
          },
        });

        results.articlesSummarized++;
      } catch (error) {
        await db.rawArticle.update({
          where: { id: article.id },
          data: {
            status: "ERROR",
            errorMessage: String(error),
          },
        });
        results.errors.push(`Summarize ${article.id}: ${String(error)}`);
      }
    }

    console.log("Ingestion complete:", results);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Ingestion failed:", error);
    return NextResponse.json(
      { error: "Ingestion failed", message: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to check status
export async function GET() {
  try {
    const { db } = await import("@/lib/db");

    const [
      feedCount,
      rawArticleCount,
      pendingCount,
      approvedCount,
      articleCount,
    ] = await Promise.all([
      db.feedSource.count(),
      db.rawArticle.count(),
      db.rawArticle.count({ where: { status: "PENDING" } }),
      db.rawArticle.count({ where: { status: "APPROVED" } }),
      db.article.count(),
    ]);

    return NextResponse.json({
      status: "ready",
      stats: {
        feedSources: feedCount,
        rawArticles: rawArticleCount,
        pendingArticles: pendingCount,
        approvedArticles: approvedCount,
        processedArticles: articleCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get status", message: String(error) },
      { status: 500 }
    );
  }
}
