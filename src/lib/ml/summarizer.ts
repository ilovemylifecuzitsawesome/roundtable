import { pipeline, Pipeline } from "@xenova/transformers";

// Singleton pattern for model loading
let summarizer: Pipeline | null = null;
let classifier: Pipeline | null = null;

// PA-related keywords for relevance scoring
const PA_KEYWORDS = [
  "pennsylvania",
  "pa",
  "philadelphia",
  "pittsburgh",
  "harrisburg",
  "allentown",
  "erie",
  "scranton",
  "reading",
  "bethlehem",
  "lancaster",
  "state college",
  "septa",
  "penndot",
  "peco",
  "upmc",
  "penn state",
  "temple",
  "drexel",
  "villanova",
  "governor",
  "legislature",
  "harrisburg",
  "commonwealth",
];

const POLITICAL_KEYWORDS = [
  "election",
  "vote",
  "ballot",
  "campaign",
  "democrat",
  "republican",
  "legislation",
  "bill",
  "law",
  "policy",
  "senator",
  "representative",
  "congress",
  "mayor",
  "council",
  "budget",
  "tax",
  "school",
  "education",
  "healthcare",
  "infrastructure",
  "environment",
  "police",
  "crime",
  "housing",
  "transit",
  "jobs",
  "economy",
];

export async function getSummarizer(): Promise<Pipeline> {
  if (!summarizer) {
    console.log("Loading summarization model...");
    summarizer = await pipeline(
      "summarization",
      "Xenova/distilbart-cnn-6-6",
      { quantized: true }
    );
    console.log("Summarization model loaded.");
  }
  return summarizer;
}

export async function getClassifier(): Promise<Pipeline> {
  if (!classifier) {
    console.log("Loading classification model...");
    classifier = await pipeline(
      "zero-shot-classification",
      "Xenova/mobilebert-uncased-mnli",
      { quantized: true }
    );
    console.log("Classification model loaded.");
  }
  return classifier;
}

export function calculateRelevanceScore(
  title: string,
  content: string
): number {
  const text = `${title} ${content}`.toLowerCase();

  // Count PA keyword matches
  let paScore = 0;
  for (const keyword of PA_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      paScore += 1;
    }
  }

  // Count political keyword matches
  let politicalScore = 0;
  for (const keyword of POLITICAL_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      politicalScore += 1;
    }
  }

  // Normalize scores (max 1.0)
  const normalizedPa = Math.min(paScore / 3, 1); // Need at least 3 PA keywords for max
  const normalizedPolitical = Math.min(politicalScore / 5, 1); // Need 5 political keywords

  // Combined score: PA relevance is more important
  const score = normalizedPa * 0.6 + normalizedPolitical * 0.4;

  return Math.round(score * 100) / 100;
}

export function detectRegion(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();

  if (text.includes("philadelphia") || text.includes("septa")) {
    return "Philadelphia";
  }
  if (text.includes("pittsburgh") || text.includes("allegheny")) {
    return "Pittsburgh";
  }
  if (text.includes("harrisburg") || text.includes("capitol")) {
    return "Harrisburg";
  }
  if (
    text.includes("allentown") ||
    text.includes("lehigh") ||
    text.includes("bethlehem")
  ) {
    return "Lehigh Valley";
  }
  if (text.includes("erie")) {
    return "Erie";
  }
  if (text.includes("scranton") || text.includes("wilkes-barre")) {
    return "Northeast PA";
  }

  return "Statewide";
}

export function detectCategory(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();

  const categories: Record<string, string[]> = {
    Elections: ["election", "vote", "ballot", "campaign", "candidate", "poll"],
    Education: ["school", "education", "student", "teacher", "university", "college"],
    Healthcare: ["health", "hospital", "medical", "doctor", "patient", "insurance"],
    Transportation: ["transit", "septa", "road", "highway", "traffic", "penndot"],
    Environment: ["environment", "climate", "pollution", "energy", "water", "air"],
    Economy: ["job", "employment", "business", "economy", "tax", "budget"],
    Crime: ["crime", "police", "safety", "arrest", "violence", "shooting"],
    Housing: ["housing", "rent", "apartment", "home", "affordable", "property"],
  };

  let maxScore = 0;
  let bestCategory = "Politics";

  for (const [category, keywords] of Object.entries(categories)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

export interface SummarizedArticle {
  title: string;
  whoShouldCare: string;
  summary: string;
  impact: string;
}

export async function summarizeArticle(
  originalTitle: string,
  content: string,
  region: string
): Promise<SummarizedArticle> {
  const model = await getSummarizer();

  // Truncate content to fit model limits (roughly 1024 tokens)
  const truncatedContent = content.slice(0, 3000);

  // Generate summary
  const summaryResult = await model(truncatedContent, {
    max_length: 80,
    min_length: 30,
    do_sample: false,
  });

  const summary = (summaryResult as any)[0]?.summary_text || truncatedContent.slice(0, 200);

  // Generate a concise title if original is too long
  const title = originalTitle.length > 80
    ? originalTitle.slice(0, 77) + "..."
    : originalTitle;

  // Determine who should care based on region and content
  const category = detectCategory(originalTitle, content);
  const whoShouldCare = generateWhoShouldCare(region, category, content);

  // Generate impact statement
  const impact = generateImpact(category, content);

  return {
    title,
    whoShouldCare,
    summary,
    impact,
  };
}

function generateWhoShouldCare(
  region: string,
  category: string,
  content: string
): string {
  const text = content.toLowerCase();

  // Specific audience detection
  if (text.includes("parent") || text.includes("student")) {
    return `${region} parents and students`;
  }
  if (text.includes("commuter") || text.includes("transit")) {
    return `${region} commuters`;
  }
  if (text.includes("homeowner") || text.includes("property")) {
    return `${region} homeowners`;
  }
  if (text.includes("business") || text.includes("employer")) {
    return `${region} business owners`;
  }
  if (text.includes("senior") || text.includes("elderly")) {
    return `${region} seniors`;
  }

  // Default based on category
  const audienceMap: Record<string, string> = {
    Elections: `${region} voters`,
    Education: `${region} families, educators`,
    Healthcare: `${region} residents, patients`,
    Transportation: `${region} commuters`,
    Environment: `${region} residents`,
    Economy: `${region} workers, businesses`,
    Crime: `${region} residents`,
    Housing: `${region} renters, homeowners`,
    Politics: `${region} residents`,
  };

  return audienceMap[category] || `${region} residents`;
}

function generateImpact(category: string, content: string): string {
  const text = content.toLowerCase();

  // Look for numbers and specifics
  const moneyMatch = text.match(/\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion))?/);
  const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);

  if (moneyMatch) {
    return `May affect funding of ${moneyMatch[0]} in related programs.`;
  }
  if (percentMatch) {
    return `Could result in ${percentMatch[0]}% change in affected areas.`;
  }

  // Default impact statements by category
  const impactMap: Record<string, string> = {
    Elections: "Could influence upcoming election outcomes.",
    Education: "May affect local schools and students.",
    Healthcare: "Could impact healthcare access and costs.",
    Transportation: "May affect commute times and transit access.",
    Environment: "Could impact local environmental quality.",
    Economy: "May affect local jobs and economic growth.",
    Crime: "Could impact community safety measures.",
    Housing: "May affect housing availability and costs.",
    Politics: "Could influence local policy decisions.",
  };

  return impactMap[category] || "May affect local communities.";
}
