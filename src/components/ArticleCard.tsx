"use client";

import { useState } from "react";
import { VoteType } from "@prisma/client";
import { ArticleWithStats } from "@/types";
import { VoteButtons } from "./VoteButtons";
import { CommentSection } from "./CommentSection";
import { formatDistanceToNow } from "date-fns";

interface ArticleCardProps {
  article: ArticleWithStats;
  onVote: (articleId: string, voteType: VoteType) => Promise<void>;
  onComment: (articleId: string, content: string) => Promise<void>;
  isAuthenticated: boolean;
}

export function ArticleCard({
  article,
  onVote,
  onComment,
  isAuthenticated,
}: ArticleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentVote, setCurrentVote] = useState<VoteType | null>(
    article.userVote || null
  );
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteType: VoteType) => {
    if (!isAuthenticated || isVoting) return;
    setIsVoting(true);
    try {
      await onVote(article.id, voteType);
      setCurrentVote(voteType);
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes =
    article.stats.approveCount +
    article.stats.disapproveCount +
    article.stats.neutralCount;

  return (
    <article className="card overflow-hidden">
      {/* Header with category and region */}
      <div className="px-6 pt-5 pb-3 flex items-center gap-2 text-sm">
        {article.category && (
          <span className="px-2 py-0.5 bg-civic-100 text-civic-600 rounded-full text-xs font-medium">
            {article.category}
          </span>
        )}
        {article.region && (
          <span className="text-civic-400">{article.region}</span>
        )}
        <span className="text-civic-300">·</span>
        <span className="text-civic-400">
          {formatDistanceToNow(new Date(article.publishedAt), {
            addSuffix: true,
          })}
        </span>
      </div>

      {/* Title */}
      <div className="px-6 pb-3">
        <h2 className="text-xl font-semibold text-civic-900 leading-tight">
          {article.title}
        </h2>
      </div>

      {/* Who Should Care */}
      <div className="px-6 pb-3">
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-civic-500 uppercase tracking-wide shrink-0">
            Who should care
          </span>
          <span className="text-sm text-civic-700">{article.whoShouldCare}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 pb-3">
        <p className="text-civic-700 leading-relaxed">{article.summary}</p>
      </div>

      {/* Impact */}
      <div className="px-6 pb-4">
        <div className="flex items-start gap-2 bg-civic-50 rounded-lg p-3">
          <span className="text-xs font-medium text-civic-500 uppercase tracking-wide shrink-0">
            Impact
          </span>
          <span className="text-sm text-civic-800 font-medium">
            {article.impact}
          </span>
        </div>
      </div>

      {/* Source */}
      {article.sourceName && (
        <div className="px-6 pb-4">
          <span className="text-xs text-civic-400">
            Source: {article.sourceName}
          </span>
        </div>
      )}

      {/* Voting Section */}
      <div className="px-6 pb-4 border-t border-civic-100 pt-4">
        <VoteButtons
          currentVote={currentVote}
          onVote={handleVote}
          isAuthenticated={isAuthenticated}
          isVoting={isVoting}
          stats={article.stats}
          showStats={currentVote !== null}
        />
      </div>

      {/* Comment Toggle */}
      <div className="border-t border-civic-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm text-civic-600 hover:bg-civic-50 transition-colors"
        >
          <span>
            {article.stats.commentCount}{" "}
            {article.stats.commentCount === 1 ? "comment" : "comments"}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Comments Section */}
      {isExpanded && (
        <CommentSection
          articleId={article.id}
          onComment={onComment}
          hasVoted={currentVote !== null}
          isAuthenticated={isAuthenticated}
        />
      )}
    </article>
  );
}
