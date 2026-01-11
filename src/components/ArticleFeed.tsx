"use client";

import { ArticleWithStats } from "@/types";
import { VoteType } from "@prisma/client";
import { ArticleCard } from "./ArticleCard";

interface ArticleFeedProps {
  articles: ArticleWithStats[];
  onVote: (articleId: string, voteType: VoteType) => Promise<void>;
  onComment: (articleId: string, content: string) => Promise<void>;
  isAuthenticated: boolean;
}

export function ArticleFeed({
  articles,
  onVote,
  onComment,
  isAuthenticated,
}: ArticleFeedProps) {
  if (articles.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-civic-500">No articles found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onVote={onVote}
          onComment={onComment}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
}
