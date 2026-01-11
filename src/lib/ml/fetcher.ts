import Parser from "rss-parser";
import * as cheerio from "cheerio";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "RoundtablePA/1.0 (News Aggregator)",
  },
});

export interface FetchedArticle {
  sourceUrl: string;
  sourceName: string;
  sourceTitle: string;
  sourceContent: string;
  publishedAt: Date | null;
}

export async function fetchRSSFeed(
  feedUrl: string,
  sourceName: string
): Promise<FetchedArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    const articles: FetchedArticle[] = [];

    for (const item of feed.items.slice(0, 10)) {
      // Limit to 10 per fetch
      if (!item.link) continue;

      // Extract content from description or content field
      let content = item.contentSnippet || item.content || item.summary || "";

      // Clean HTML if present
      if (content.includes("<")) {
        const $ = cheerio.load(content);
        content = $.text().trim();
      }

      articles.push({
        sourceUrl: item.link,
        sourceName,
        sourceTitle: item.title || "Untitled",
        sourceContent: content,
        publishedAt: item.pubDate ? new Date(item.pubDate) : null,
      });
    }

    return articles;
  } catch (error) {
    console.error(`Failed to fetch RSS feed ${feedUrl}:`, error);
    return [];
  }
}

export async function fetchArticleContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "RoundtablePA/1.0 (News Aggregator)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $("script, style, nav, footer, header, aside, .ad, .advertisement").remove();

    // Try to find article content
    let content = "";

    // Common article selectors
    const selectors = [
      "article",
      '[role="main"]',
      ".article-body",
      ".story-body",
      ".post-content",
      ".entry-content",
      "main",
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 200) break;
      }
    }

    // Fallback to paragraphs
    if (content.length < 200) {
      content = $("p")
        .map((_, el) => $(el).text())
        .get()
        .join(" ")
        .trim();
    }

    // Clean up whitespace
    content = content.replace(/\s+/g, " ").trim();

    return content.slice(0, 10000); // Limit content length
  } catch (error) {
    console.error(`Failed to fetch article content from ${url}:`, error);
    return null;
  }
}

// PA News RSS Feeds
export const PA_NEWS_FEEDS = [
  {
    name: "Philadelphia Inquirer",
    url: "https://www.inquirer.com/arcio/rss/category/news/",
    region: "Philadelphia",
  },
  {
    name: "Pittsburgh Post-Gazette",
    url: "https://www.post-gazette.com/rss/local",
    region: "Pittsburgh",
  },
  {
    name: "PennLive",
    url: "https://www.pennlive.com/arc/outboundfeeds/rss/?outputType=xml",
    region: "Statewide",
  },
  {
    name: "WHYY",
    url: "https://whyy.org/feed/",
    region: "Philadelphia",
  },
  {
    name: "WESA Pittsburgh",
    url: "https://www.wesa.fm/rss.xml",
    region: "Pittsburgh",
  },
  {
    name: "Spotlight PA",
    url: "https://www.spotlightpa.org/news/feed/",
    region: "Statewide",
  },
];
