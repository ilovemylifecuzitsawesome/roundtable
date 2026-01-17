import Groq from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface PolicySummary {
  isPolicyRelevant: boolean;
  title: string; // Clear policy title (not article headline)
  shortTitle: string; // 5-7 word version for cards
  description: string; // 1-2 sentence neutral summary
  domain:
    | "transit"
    | "education"
    | "housing"
    | "budget"
    | "elections"
    | "health"
    | "environment"
    | "general";
  status:
    | "INTRODUCED"
    | "COMMITTEE"
    | "HEARING_SCHEDULED"
    | "VOTE_SCHEDULED"
    | "PASSED"
    | "FAILED"
    | "SIGNED"
    | "ENACTED"
    | "IMPLEMENTED";
  changeSummary: string; // One line: what happened
  aiSummary: string; // 2-3 sentence readable explanation
  nextMilestone: string | null; // What happens next, if known
}

/**
 * Summarize a news article using Groq API (Llama)
 * Returns null if article is not PA policy-relevant
 */
export async function summarizeWithClaude(
  articleTitle: string,
  articleContent: string,
  sourceName: string
): Promise<PolicySummary | null> {
  const prompt = `You are a nonpartisan civic policy analyst. Your job is to determine if this Pennsylvania news article is about POLICY (legislation, government action, civic decisions) and if so, extract key information.

ARTICLE SOURCE: ${sourceName}
ARTICLE TITLE: ${articleTitle}

ARTICLE CONTENT:
${articleContent.slice(0, 4000)}

---

FIRST: Determine if this article is about PA POLICY. Policy articles are about:
- Legislation, bills, laws being proposed or passed
- Government decisions, funding, programs
- Elections, voting, civic processes
- Public transit, education, housing POLICY changes
- Official government announcements

NOT policy (set isPolicyRelevant to false):
- Sports, entertainment, arts, music
- Individual crimes (unless about crime POLICY)
- Weather, natural events
- Human interest stories, profiles
- National news not specific to PA policy
- Restaurant/business openings
- Event announcements

If NOT policy relevant, respond: {"isPolicyRelevant": false}

If IS policy relevant, respond with this JSON:

{
  "isPolicyRelevant": true,
  "title": "Clear policy name - e.g., 'SEPTA Regional Funding Act' or 'Philadelphia School Budget Proposal' (NOT the news headline)",
  "shortTitle": "5-7 words - e.g., 'SEPTA Funding Act'",
  "description": "1-2 sentences: What is this policy about? Write for someone who knows nothing about it.",
  "domain": "One of: transit, education, housing, budget, elections, health, environment, general",
  "status": "One of: INTRODUCED, COMMITTEE, HEARING_SCHEDULED, VOTE_SCHEDULED, PASSED, FAILED, SIGNED, ENACTED, IMPLEMENTED",
  "changeSummary": "One sentence: What just happened? e.g., 'Governor signed the bill into law' or 'Committee approved the measure'",
  "aiSummary": "2-3 sentences explaining this in plain English. What happened? Why does it matter to regular people? Give readers a sense of 'now I understand.'",
  "nextMilestone": "What happens next? e.g., 'Implementation begins July 2025' or null if unknown"
}

IMPORTANT:
- The "title" must be a POLICY NAME, not a news headline. Think "Clean Energy Investment Act" not "Governor announces new energy plan"
- Be factual and neutral - no political spin
- The aiSummary should make someone feel informed and empowered, not anxious

Respond with ONLY valid JSON, no other text or explanation.`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // Fast and free tier friendly
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.1, // Low temperature for consistent output
    });

    const text = response.choices[0]?.message?.content || "";

    // Parse JSON response - handle potential markdown code blocks
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const parsed = JSON.parse(jsonText) as PolicySummary;

    if (!parsed.isPolicyRelevant) {
      console.log(`⏭️  Skipping non-policy article: ${articleTitle}`);
      return null;
    }

    console.log(`✅ Summarized: ${parsed.shortTitle} (${parsed.status})`);
    return parsed;
  } catch (error) {
    console.error("❌ Groq summarization failed:", error);
    return null;
  }
}

/**
 * Check if we have a valid Groq API key
 */
export function hasAnthropicKey(): boolean {
  return !!process.env.GROQ_API_KEY;
}
