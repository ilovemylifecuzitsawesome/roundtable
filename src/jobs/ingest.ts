import { db } from "../lib/db";
import {
  fetchRSSFeed,
  fetchArticleContent,
  PA_NEWS_FEEDS,
} from "../lib/ml/fetcher";
import {
  calculateRelevanceScore,
  detectRegion,
  detectCategory,
  summarizeArticle,
} from "../lib/ml/summarizer";

const RELEVANCE_THRESHOLD = 0.3; // Minimum score to process

async function initializeFeedSources() {
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
  }

  console.log(`Initialized ${PA_NEWS_FEEDS.length} feed sources.`);
}

async function fetchNewArticles() {
  console.log("Fetching new articles from RSS feeds...");

  const feeds = await db.feedSource.findMany({
    where: { isActive: true },
  });

  let totalFetched = 0;
  let totalNew = 0;

  for (const feed of feeds) {
    console.log(`Fetching from ${feed.name}...`);

    const articles = await fetchRSSFeed(feed.url, feed.name);
    totalFetched += articles.length;

    for (const article of articles) {
      // Check if we already have this article
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
        totalNew++;
      }
    }

    // Update last fetched time
    await db.feedSource.update({
      where: { id: feed.id },
      data: { lastFetchedAt: new Date() },
    });
  }

  console.log(`Fetched ${totalFetched} articles, ${totalNew} new.`);
  return totalNew;
}

async function scoreAndFilterArticles() {
  console.log("Scoring articles for relevance...");

  const pendingArticles = await db.rawArticle.findMany({
    where: { status: "PENDING" },
    take: 20, // Process in batches
  });

  let approved = 0;
  let rejected = 0;

  for (const article of pendingArticles) {
    // Mark as processing
    await db.rawArticle.update({
      where: { id: article.id },
      data: { status: "PROCESSING" },
    });

    try {
      // If content is short, try to fetch full content
      let content = article.sourceContent || "";
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

      // Calculate relevance score
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
        approved++;
        console.log(`Approved: "${article.sourceTitle}" (score: ${score})`);
      } else {
        await db.rawArticle.update({
          where: { id: article.id },
          data: {
            status: "REJECTED",
            relevanceScore: score,
            processedAt: new Date(),
          },
        });
        rejected++;
        console.log(`Rejected: "${article.sourceTitle}" (score: ${score})`);
      }
    } catch (error) {
      console.error(`Error processing article ${article.id}:`, error);
      await db.rawArticle.update({
        where: { id: article.id },
        data: {
          status: "ERROR",
          errorMessage: String(error),
          processedAt: new Date(),
        },
      });
    }
  }

  console.log(`Scored ${pendingArticles.length} articles: ${approved} approved, ${rejected} rejected.`);
  return approved;
}

async function summarizeApprovedArticles() {
  console.log("Summarizing approved articles...");

  const approvedArticles = await db.rawArticle.findMany({
    where: { status: "APPROVED" },
    take: 5, // Process fewer at a time due to ML overhead
  });

  let summarized = 0;

  for (const article of approvedArticles) {
    try {
      console.log(`Summarizing: "${article.sourceTitle}"...`);

      const content = article.sourceContent || "";
      const region = detectRegion(article.sourceTitle, content);
      const category = detectCategory(article.sourceTitle, content);

      // Generate summary using ML
      const summary = await summarizeArticle(
        article.sourceTitle,
        content,
        region
      );

      // Create the processed article
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

      // Update raw article status
      await db.rawArticle.update({
        where: { id: article.id },
        data: {
          status: "SUMMARIZED",
          articleId: newArticle.id,
        },
      });

      summarized++;
      console.log(`Created article: "${newArticle.title}"`);
    } catch (error) {
      console.error(`Error summarizing article ${article.id}:`, error);
      await db.rawArticle.update({
        where: { id: article.id },
        data: {
          status: "ERROR",
          errorMessage: String(error),
        },
      });
    }
  }

  console.log(`Summarized ${summarized} articles.`);
  return summarized;
}

async function runIngestionCycle() {
  console.log("\n=== Starting ingestion cycle ===\n");
  const startTime = Date.now();

  try {
    // Step 1: Fetch new articles
    await fetchNewArticles();

    // Step 2: Score and filter
    await scoreAndFilterArticles();

    // Step 3: Summarize approved articles
    await summarizeApprovedArticles();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n=== Ingestion cycle complete (${duration}s) ===\n`);
  } catch (error) {
    console.error("Ingestion cycle failed:", error);
  }
}

async function main() {
  console.log("Starting Roundtable PA article ingestion...\n");

  // Initialize feed sources
  await initializeFeedSources();

  // Run initial ingestion
  await runIngestionCycle();

  // Check for continuous mode
  if (process.argv.includes("--watch")) {
    console.log("Running in watch mode. Press Ctrl+C to stop.\n");

    // Run every 5 minutes
    setInterval(runIngestionCycle, 5 * 60 * 1000);
  } else {
    console.log("Single run complete. Use --watch for continuous mode.");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
