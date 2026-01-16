"use client";

import { VoteType } from "@/types";
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
      <div className="text-center py-3 px-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600">
          <a href="/auth/signin" className="text-civic-600 hover:text-civic-700 font-semibold">
            Sign in
          </a>{" "}
          to vote and join the discussion
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!currentVote && (
        <p className="text-xs text-gray-500 text-center">
          Vote to see community sentiment and unlock comments
        </p>
      )}

      <div className="flex gap-3">
        {/* Approve */}
        <button
          onClick={() => onVote("APPROVE")}
          disabled={isVoting || currentVote !== null}
          className={clsx(
            "vote-btn-approve",
            currentVote === "APPROVE" && "selected"
          )}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span>Approve</span>
          {showStats && (
            <span className="text-xs font-bold">
              {getPercentage(stats.approveCount)}%
            </span>
          )}
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
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Neutral</span>
          {showStats && (
            <span className="text-xs font-bold">
              {getPercentage(stats.neutralCount)}%
            </span>
          )}
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
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
          <span>Disapprove</span>
          {showStats && (
            <span className="text-xs font-bold">
              {getPercentage(stats.disapproveCount)}%
            </span>
          )}
        </button>
      </div>

      {showStats && total > 0 && (
        <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
          <div
            className="bg-approve transition-all duration-500"
            style={{ width: `${getPercentage(stats.approveCount)}%` }}
          />
          <div
            className="bg-neutral transition-all duration-500"
            style={{ width: `${getPercentage(stats.neutralCount)}%` }}
          />
          <div
            className="bg-disapprove transition-all duration-500"
            style={{ width: `${getPercentage(stats.disapproveCount)}%` }}
          />
        </div>
      )}

      {showStats && total > 0 && (
        <p className="text-xs text-center text-gray-400">
          {total} {total === 1 ? "vote" : "votes"} total
        </p>
      )}
    </div>
  );
}
