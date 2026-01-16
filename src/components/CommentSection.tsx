"use client";

import { useState, useEffect } from "react";
import { CommentWithAlias, VOTE_LABELS, VoteType } from "@/types";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

interface CommentSectionProps {
  articleId: string;
  onComment: (articleId: string, content: string) => Promise<void>;
  hasVoted: boolean;
  isAuthenticated: boolean;
}

export function CommentSection({
  articleId,
  onComment,
  hasVoted,
  isAuthenticated,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithAlias[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onComment(articleId, newComment.trim());
      setNewComment("");
      await fetchComments();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVoteBadgeClass = (vote: VoteType) => {
    switch (vote) {
      case "APPROVE":
        return "bg-approve/20 text-approve";
      case "DISAPPROVE":
        return "bg-disapprove/20 text-disapprove";
      default:
        return "bg-neutral/20 text-neutral";
    }
  };

  return (
    <div className="border-t border-civic-100 bg-civic-50/50">
      {/* Comment Form */}
      <div className="px-6 py-4 border-b border-civic-100">
        {!isAuthenticated ? (
          <p className="text-sm text-civic-500 text-center">
            <a href="/auth/signin" className="text-civic-700 hover:underline font-medium">
              Sign in
            </a>{" "}
            to join the discussion
          </p>
        ) : !hasVoted ? (
          <p className="text-sm text-civic-500 text-center py-2">
            Vote on this article to unlock commenting
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your perspective..."
              className="input flex-1 text-sm"
              disabled={isSubmitting}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="btn-primary text-sm"
            >
              {isSubmitting ? "..." : "Post"}
            </button>
          </form>
        )}
      </div>

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="px-6 py-8 text-center text-civic-400">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="px-6 py-8 text-center text-civic-400">
            No comments yet. Be the first to share your perspective.
          </div>
        ) : (
          <div className="divide-y divide-civic-100">
            {comments.map((comment) => (
              <div key={comment.id} className="px-6 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-civic-700">
                    {comment.userAlias}
                  </span>
                  <span
                    className={clsx(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      getVoteBadgeClass(comment.userVote)
                    )}
                  >
                    {VOTE_LABELS[comment.userVote]}
                  </span>
                  <span className="text-xs text-civic-400">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-civic-700">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
