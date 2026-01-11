import Parser from "rss-parser";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

/**
 * ENV (set locally or via GitHub Actions secrets)
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// ✅ Start with 1–2 feeds. Add more once stable.
// Replace/add feeds you trust for PA.
const FEEDS = [
  // Example: WITF (public-service journalism)
  "https://www.witf.org/feed/feed",

  // Add official PA sources you want here (RSS if available):
  // "https://example.com/pa-house/rss",
  // "https://example.com/pa-senate/rss",
  // "https://example.com/pa-governor/rss",
];

// --- Helpers ----------------------------------------------------

async function fetchWithTimeout(url, ms = 15000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    return res;
  } finally {
    clearTimeout(t);
  }
}

function normalizeWhitespace(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

// Cheap CPU-friendly "extractive-ish" summary
function extractiveSummary(text, maxSentences = 4) {
  const clean = normalizeWhitespace(text);
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 320);

  if (sentences.length <= maxSentences) return sentences.join(" ");

  const stop = new Set([
    "the","a","an","and","or","to","of","in","on","for","with","that","this","is","are","was","were","be","as","by","at","from","it","its","will","would","can","could","should"
  ]);

  const freq = new Map();
  for (const s of sentences) {
    for (const w of s.toLowerCase().match(/[a-z']{2,}/g) || []) {
      if (stop.has(w)) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }

  const scored = sentences.map((s, i) => {
    let score = 0;
    for (const w of s.toLowerCase().match(/[a-z']{2,}/g) || []) {
      score += freq.get(w) || 0;
    }
    score += Math.max(0, 12 - i); // bias toward early sentences
    return { s, i, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, maxSentences).sort((a, b) => a.i - b.i);
  return top.map((x) => x.s).join(" ");
}

async function extractReadable(url) {
  const res = await fetchWithTimeout(url, 20000);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);

  const html = await res.text();
  const dom = new JSDOM(html, { url });

  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const title = normalizeWhitespace(article?.title || dom.window.document.title || "");
  const text = normalizeWhitespace(article?.textContent || "");

  return { title, text };
}

async function upsertPost(post) {
  // Uses Supabase REST upsert (fast, no client lib needed)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?on_conflict=url`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(post),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Supabase upsert failed: ${res.status} ${t}`);
  }
}

// --- Main -------------------------------------------------------

async function ingestFeed(feedUrl) {
  const parser = new Parser();
  const feed = await parser.parseURL(feedUrl);

  const items = (feed.items || []).slice(0, 12);

  for (const item of items) {
    const url = item.link;
    if (!url) continue;

    try {
      const { title, text } = await extractReadable(url);

      // Skip if extraction didn’t get meaningful content
      if (!text || text.length < 500) continue;

      const summary = extractiveSummary(text, 4);

      const post = {
        state: "PA", // MVP: PA only
        title: (title || item.title || "Untitled").slice(0, 240),
        url,
        published_at: item.isoDate || item.pubDate || null,
        raw_text: text.slice(0, 20000),
        summary: summary.slice(0, 1200),
        practical: null, // you can fill later (LLM or rules)
        topics: [],      // fill later
        source_name: (feed.title || "Feed").slice(0, 120),
        hidden: false,
      };

      await upsertPost(post);
      console.log("Upserted:", post.title);
    } catch (e) {
      console.log("Skip item (error):", url, String(e?.message || e));
    }
  }
}

async function main() {
  console.log("Starting ingestion…");
  console.log("Feeds:", FEEDS);

  for (const f of FEEDS) {
    try {
      console.log("Ingesting:", f);
      await ingestFeed(f);
    } catch (e) {
      console.error("Feed failed:", f, String(e?.message || e));
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
