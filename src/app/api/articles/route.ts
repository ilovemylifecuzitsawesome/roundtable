import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Lazy imports to avoid build-time issues
    const { createClient } = await import("@/lib/supabase/server");
    const { db } = await import("@/lib/db");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    // Fetch policies with their latest event
    const policies = await db.policy.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      include: {
        events: {
          orderBy: { eventDate: "desc" },
          take: 1,
        },
      },
    });

    // Map policies to article format for frontend compatibility
    const articles = policies.map((policy) => {
      const latestEvent = policy.events[0];

      // Determine "who should care" based on domain
      const domainAudience: Record<string, string> = {
        transit: "Commuters and transit riders",
        education: "Students, parents, and educators",
        housing: "Renters and homeowners",
        budget: "PA taxpayers",
        elections: "PA voters",
        health: "Healthcare users",
        environment: "Environmental advocates",
        general: "PA residents",
      };

      return {
        id: policy.id,
        title: policy.title,
        whoShouldCare: domainAudience[policy.domain] || "PA residents",
        summary: latestEvent?.aiSummary || policy.description,
        impact: policy.nextMilestone || latestEvent?.changeSummary || "Monitoring for updates",
        sourceName: policy.sourceName,
        sourceUrl: policy.sourceUrl,
        category: policy.domain.charAt(0).toUpperCase() + policy.domain.slice(1),
        region: policy.state,
        publishedAt: policy.updatedAt,
        stats: {
          approveCount: 0,
          disapproveCount: 0,
          neutralCount: 0,
          commentCount: 0,
        },
        userVote: null,
        hasCommented: false,
        // New policy-specific fields
        status: policy.status,
        shortTitle: policy.shortTitle,
        changeSummary: latestEvent?.changeSummary,
      };
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
