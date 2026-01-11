import { AliasType, VoteType } from "@prisma/client";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      aliasType?: AliasType | null;
      aliasYears?: number | null;
    };
  }
}

// API response types
export interface ArticleWithStats {
  id: string;
  title: string;
  whoShouldCare: string;
  summary: string;
  impact: string;
  sourceName: string | null;
  sourceUrl: string | null;
  category: string | null;
  region: string | null;
  publishedAt: Date;
  stats: {
    approveCount: number;
    disapproveCount: number;
    neutralCount: number;
    commentCount: number;
  };
  userVote?: VoteType | null;
  hasCommented?: boolean;
}

export interface CommentWithAlias {
  id: string;
  content: string;
  createdAt: Date;
  userAlias: string; // Formatted alias like "5 yr PA resident"
  userVote: VoteType;
}

// Alias display helpers
export const ALIAS_LABELS: Record<AliasType, string> = {
  PA_RESIDENT: "PA resident",
  COLLEGE_STUDENT: "college student",
  POLI_SCI_WORKER: "poli sci worker",
  GOVT_WORKER: "govt worker",
  JOURNALIST: "journalist",
  EDUCATOR: "educator",
  HEALTHCARE: "healthcare worker",
  OTHER: "community member",
};

export function formatAlias(
  type: AliasType | null | undefined,
  years: number | null | undefined
): string {
  if (!type) return "Anonymous";
  const label = ALIAS_LABELS[type] || "community member";
  if (years && years > 0) {
    return `${years} yr ${label}`;
  }
  return label;
}

export const VOTE_LABELS: Record<VoteType, string> = {
  APPROVE: "Approve",
  DISAPPROVE: "Disapprove",
  NEUTRAL: "Neutral",
};
