"use client";

import { useState } from "react";
import { ArticleWithStats, VoteType } from "@/types";
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

  return (
    <article className="card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {article.category && (
            <span className="badge-category">
              {article.category}
            </span>
          )}
          {article.region && (
            <span className="badge-region">
              {article.region}
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {formatDistanceToNow(new Date(article.publishedAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 leading-snug mb-4">
          {article.title}
        </h2>

        {/* Who Should Care */}
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-1 h-full bg-civic-500 rounded-full self-stretch" />
          <div>
            <span className="text-[10px] font-bold text-civic-600 uppercase tracking-wider">
              Who should care
            </span>
            <p className="text-sm text-gray-700 mt-0.5">{article.whoShouldCare}</p>
          </div>
        </div>

        {/* Summary */}
        <p className="text-gray-600 leading-relaxed mb-4">{article.summary}</p>

        {/* Impact */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            Impact
          </span>
          <p className="text-sm text-amber-900 font-medium mt-1">
            {article.impact}
          </p>
        </div>

        {/* Source */}
        {article.sourceName && (
          <p className="text-xs text-gray-400 mt-4">
            Source: <span className="text-gray-500">{article.sourceName}</span>
          </p>
        )}
      </div>

      {/* Voting Section */}
      <div className="px-6 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          What do you think?
        </p>
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
      <div className="border-t border-gray-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>
              {article.stats.commentCount}{" "}
              {article.stats.commentCount === 1 ? "comment" : "comments"}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
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
