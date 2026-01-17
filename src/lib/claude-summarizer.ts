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
