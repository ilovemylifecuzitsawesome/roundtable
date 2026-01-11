"use client";

import { VoteType } from "@prisma/client";
import clsx from "clsx";

interface VoteButtonsProps {
  currentVote: VoteType | null;
  onVote: (voteType: VoteType) => void;
  isAuthenticated: boolean;
  isVoting: boolean;
  stats: {
    approveCount: number;
    disapproveCount: number;
    neutralCount: number;
  };
  showStats: boolean;
}

export function VoteButtons({
  currentVote,
  onVote,
  isAuthenticated,
  isVoting,
  stats,
  showStats,
}: VoteButtonsProps) {
  const total = stats.approveCount + stats.disapproveCount + stats.neutralCount;

  const getPercentage = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-2">
        <p className="text-sm text-civic-500">
          <a href="/auth/signin" className="text-civic-700 hover:underline font-medium">
            Sign in
          </a>{" "}
          to vote and join the discussion
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!currentVote && (
        <p className="text-sm text-civic-500 text-center">
          Vote to see community sentiment and unlock comments
        </p>
      )}

      <div className="flex gap-2">
        {/* Approve */}
        <button
          onClick={() => onVote("APPROVE")}
          disabled={isVoting || currentVote !== null}
          className={clsx(
            "vote-btn-approve",
            currentVote === "APPROVE" && "selected"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span>Approve</span>
            {showStats && (
              <span className="text-xs opacity-75">
                {getPercentage(stats.approveCount)}%
              </span>
            )}
          </span>
        </button>

        {/* Neutral */}
        <button
          onClick={() => onVote("NEUTRAL")}
          disabled={isVoting || currentVote !== null}
          className={clsx(
            "vote-btn-neutral",
            currentVote === "NEUTRAL" && "selected"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            <span>Neutral</span>
            {showStats && (
              <span className="text-xs opacity-75">
                {getPercentage(stats.neutralCount)}%
              </span>
            )}
          </span>
        </button>

        {/* Disapprove */}
        <button
          onClick={() => onVote("DISAPPROVE")}
          disabled={isVoting || currentVote !== null}
          className={clsx(
            "vote-btn-disapprove",
            currentVote === "DISAPPROVE" && "selected"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>Disapprove</span>
            {showStats && (
              <span className="text-xs opacity-75">
                {getPercentage(stats.disapproveCount)}%
              </span>
            )}
          </span>
        </button>
      </div>

      {showStats && total > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden bg-civic-100">
          <div
            className="bg-approve transition-all"
            style={{ width: `${getPercentage(stats.approveCount)}%` }}
          />
          <div
            className="bg-neutral transition-all"
            style={{ width: `${getPercentage(stats.neutralCount)}%` }}
          />
          <div
            className="bg-disapprove transition-all"
            style={{ width: `${getPercentage(stats.disapproveCount)}%` }}
          />
        </div>
      )}
    </div>
  );
}
