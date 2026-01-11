"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { ArticleWithStats } from "@/types";
import { VoteType } from "@prisma/client";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleFeed } from "@/components/ArticleFeed";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [articles, setArticles] = useState<ArticleWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleVote = async (articleId: string, voteType: VoteType) => {
    const res = await fetch(`/api/articles/${articleId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voteType }),
    });

    if (res.ok) {
      // Refresh articles to get updated stats
      await fetchArticles();
    }
  };

  const handleComment = async (articleId: string, content: string) => {
    const res = await fetch(`/api/articles/${articleId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      throw new Error("Failed to post comment");
    }
  };

  // Get unique regions for filtering
  const regions = [
    "all",
    ...new Set(articles.map((a) => a.region).filter(Boolean)),
  ];

  const filteredArticles =
    filter === "all"
      ? articles
      : articles.filter((a) => a.region === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Hero Section for non-authenticated users */}
      {status !== "loading" && !session && (
        <div className="card p-8 mb-8 text-center bg-gradient-to-br from-civic-800 to-civic-900 text-white">
          <h1 className="text-3xl font-bold mb-3">
            Civic Discourse for Pennsylvania
          </h1>
          <p className="text-civic-200 mb-6 max-w-xl mx-auto">
            Join the Roundtable to discuss PA politics anonymously. Vote on
            issues, share your perspective, and see where your community stands.
          </p>
          <a href="/auth/signin" className="btn bg-white text-civic-800 hover:bg-civic-100">
            Join the discussion
          </a>
        </div>
      )}

      {/* Onboarding prompt for users without alias */}
      {session && !session.user.aliasType && (
        <div className="card p-6 mb-6 border-2 border-civic-300 bg-civic-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-civic-800 mb-1">
                Set up your anonymous alias
              </h2>
              <p className="text-sm text-civic-600">
                Choose how you want to be identified in discussions. Your email
                stays private.
              </p>
            </div>
            <a href="/profile" className="btn-primary shrink-0">
              Set up
            </a>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <span className="text-sm text-civic-500 shrink-0">Filter:</span>
        {regions.map((region) => (
          <button
            key={region}
            onClick={() => setFilter(region as string)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors shrink-0 ${
              filter === region
                ? "bg-civic-800 text-white"
                : "bg-civic-100 text-civic-600 hover:bg-civic-200"
            }`}
          >
            {region === "all" ? "All PA" : region}
          </button>
        ))}
      </div>

      {/* Articles Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-civic-200 rounded w-24 mb-4" />
              <div className="h-6 bg-civic-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-civic-200 rounded w-full mb-2" />
              <div className="h-4 bg-civic-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-civic-500">No articles found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onVote={handleVote}
              onComment={handleComment}
              isAuthenticated={!!session}
            />
          ))}
        </div>
      )}
    </div>
  );
}
