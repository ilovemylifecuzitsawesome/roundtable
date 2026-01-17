import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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
 * Summarize a news article using Claude API
 * Returns null if article is not PA policy-relevant
 *
 * Cost: ~$0.001 per article (using Haiku)
 */
export async function summarizeWithClaude(
  articleTitle: string,
  articleContent: string,
  sourceName: string
): Promise<PolicySummary | null> {
  const prompt = `You are a nonpartisan civic policy analyst helping Pennsylvania residents stay informed. Analyze this PA news article and extract structured policy information.

Your goal is to make policy news:
- CONCISE: Get to the point quickly
- ACCESSIBLE: Use plain language, not jargon
- EMOTIONALLY REWARDING: Give readers a sense of "I learned something important" without anxiety or overwhelm
- ACTIONABLE: Help them understand what this means for them

ARTICLE SOURCE: ${sourceName}
ARTICLE TITLE: ${articleTitle}

ARTICLE CONTENT:
${articleContent.slice(0, 4000)}

---

Respond in JSON format with these fields:

{
  "isPolicyRelevant": boolean,  // Is this about PA state/local policy, legislation, or government action? (Not just general news, sports, crime, weather)
  "title": string,              // Clear policy title, e.g., "SEPTA Funding Increase Bill" (NOT the article headline)
  "shortTitle": string,         // 5-7 word version, e.g., "SEPTA Funding Bill"
  "description": string,        // 1-2 neutral sentences explaining what this policy is about
  "domain": string,             // One of: transit, education, housing, budget, elections, health, environment, general
  "status": string,             // One of: INTRODUCED, COMMITTEE, HEARING_SCHEDULED, VOTE_SCHEDULED, PASSED, FAILED, SIGNED, ENACTED, IMPLEMENTED
  "changeSummary": string,      // One sentence: what just happened, e.g., "Bill advanced to Transportation Committee"
  "aiSummary": string,          // 2-3 sentences in plain language explaining this update. Make readers feel informed, not overwhelmed. End with why it matters.
  "nextMilestone": string|null  // What's expected next, e.g., "Committee hearing expected in February" or null if unknown
}

Guidelines:
- Be nonpartisan and factual - no political spin
- Write for busy people who want to feel informed in 30 seconds
- If this isn't about PA policy (e.g., sports, individual crime, weather, national news), set isPolicyRelevant to false
- The title should describe the POLICY, not be a news headline
- Keep language calm and clear - avoid "breaking", "shocking", "controversial"
- The aiSummary should give readers a sense of completion: "Now I understand what's happening"

Respond ONLY with valid JSON, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // Fast and cheap (~$0.001/article)
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response
    const parsed = JSON.parse(text) as PolicySummary;

    if (!parsed.isPolicyRelevant) {
      console.log(`⏭️  Skipping non-policy article: ${articleTitle}`);
      return null;
    }

    console.log(`✅ Summarized: ${parsed.shortTitle} (${parsed.status})`);
    return parsed;
  } catch (error) {
    console.error("❌ Claude summarization failed:", error);
    return null;
  }
}

/**
 * Check if we have a valid Anthropic API key
 */
export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
