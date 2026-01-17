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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lazy imports
    const { db } = await import("@/lib/db");
    const { fetchRSSFeed, PA_NEWS_FEEDS } = await import("@/lib/ml/fetcher");
    const { summarizeWithClaude, hasAnthropicKey } = await import(
      "@/lib/claude-summarizer"
    );

    // Check for API key
    if (!hasAnthropicKey()) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const results = {
      feedsInitialized: 0,
      articlesFetched: 0,
      articlesNew: 0,
      policiesCreated: 0,
      eventsAdded: 0,
      articlesRejected: 0,
      errors: [] as string[],
    };

    // Step 1: Initialize feed sources
    console.log("📡 Initializing feed sources...");
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

    // Step 2: Fetch new articles from RSS feeds
    console.log("📰 Fetching articles from RSS feeds...");
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

    // Step 3: Process pending articles with Claude
    console.log("🤖 Processing articles with Claude...");
    const pendingArticles = await db.rawArticle.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 10, // Process in batches to manage API costs
    });

    for (const raw of pendingArticles) {
      try {
        // Call Claude for smart summarization
        const summary = await summarizeWithClaude(
          raw.sourceTitle,
          raw.sourceContent || "",
          raw.sourceName
        );

        if (!summary) {
          // Not policy-relevant, mark as rejected
          await db.rawArticle.update({
            where: { id: raw.id },
            data: { status: "REJECTED", processedAt: new Date() },
          });
          results.articlesRejected++;
          continue;
        }

        // Check if policy already exists (by similar shortTitle)
        let policy = await db.policy.findFirst({
          where: {
            OR: [
              { shortTitle: summary.shortTitle },
              { title: summary.title },
            ],
          },
        });

        if (policy) {
          // Add event to existing policy
          await db.policyEvent.create({
            data: {
              policyId: policy.id,
              eventType: summary.status,
              eventDate: raw.publishedAt || new Date(),
              changeSummary: summary.changeSummary,
              aiSummary: summary.aiSummary,
              sources: JSON.stringify([
                { title: raw.sourceName, url: raw.sourceUrl },
              ]),
            },
          });

          // Update policy status if changed
          if (policy.status !== summary.status) {
            await db.policy.update({
              where: { id: policy.id },
              data: {
                status: summary.status,
                nextMilestone: summary.nextMilestone,
                updatedAt: new Date(),
              },
            });
          }

          results.eventsAdded++;
        } else {
          // Create new policy with initial event
          policy = await db.policy.create({
            data: {
              title: summary.title,
              shortTitle: summary.shortTitle,
              description: summary.description,
              domain: summary.domain,
              status: summary.status,
              nextMilestone: summary.nextMilestone,
              sourceUrl: raw.sourceUrl,
              sourceName: raw.sourceName,
              events: {
                create: {
                  eventType: summary.status,
                  eventDate: raw.publishedAt || new Date(),
                  changeSummary: summary.changeSummary,
                  aiSummary: summary.aiSummary,
                  sources: JSON.stringify([
                    { title: raw.sourceName, url: raw.sourceUrl },
                  ]),
                },
              },
            },
          });

          results.policiesCreated++;
        }

        // Mark raw article as processed
        await db.rawArticle.update({
          where: { id: raw.id },
          data: {
            status: "PROCESSED",
            processedAt: new Date(),
            policyId: policy.id,
          },
        });

        // Small delay to be nice to the API
        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        console.error(`❌ Failed to process: ${raw.sourceTitle}`, error);
        await db.rawArticle.update({
          where: { id: raw.id },
          data: {
            status: "ERROR",
            errorMessage: String(error),
            processedAt: new Date(),
          },
        });
        results.errors.push(`Process ${raw.id}: ${String(error)}`);
      }
    }

    console.log("✅ Ingestion complete:", results);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("❌ Ingestion failed:", error);
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

    const [feedCount, rawPending, rawProcessed, rawRejected, policyCount, eventCount] =
      await Promise.all([
        db.feedSource.count(),
        db.rawArticle.count({ where: { status: "PENDING" } }),
        db.rawArticle.count({ where: { status: "PROCESSED" } }),
        db.rawArticle.count({ where: { status: "REJECTED" } }),
        db.policy.count(),
        db.policyEvent.count(),
      ]);

    return NextResponse.json({
      status: "ready",
      stats: {
        feedSources: feedCount,
        rawArticles: {
          pending: rawPending,
          processed: rawProcessed,
          rejected: rawRejected,
        },
        policies: policyCount,
        policyEvents: eventCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get status", message: String(error) },
      { status: 500 }
    );
  }
}
