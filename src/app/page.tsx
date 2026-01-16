"use client";

import { useAuth } from "@/app/providers";
import { useState, useEffect, useCallback } from "react";
import { ArticleWithStats, VoteType } from "@/types";
import { ArticleCard } from "@/components/ArticleCard";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const { user, profile, isLoading: authLoading } = useAuth();
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

    // Set up real-time subscription for new articles
    const supabase = createClient();
    const channel = supabase
      .channel("articles")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Article" },
        () => {
          // Refresh when new article is added
          fetchArticles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchArticles]);

  const handleVote = async (articleId: string, voteType: VoteType) => {
    const res = await fetch(`/api/articles/${articleId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voteType }),
    });

    if (res.ok) {
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

  const regions = [
    "all",
    ...Array.from(new Set(articles.map((a) => a.region).filter(Boolean))),
  ];

  const filteredArticles =
    filter === "all"
      ? articles
      : articles.filter((a) => a.region === filter);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Section for non-authenticated users */}
      {!authLoading && !user && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-civic-600 via-civic-700 to-civic-900 text-white p-8 sm:p-12 mb-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live PA News Feed
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
              Your voice in Pennsylvania politics
            </h1>
            <p className="text-civic-100 text-lg mb-8 max-w-lg leading-relaxed">
              Join thousands of Pennsylvanians discussing local issues anonymously.
              Vote on what matters, share your perspective.
            </p>
            <a
              href="/auth/signin"
              className="inline-flex items-center gap-2 bg-white text-civic-700 font-semibold px-6 py-3 rounded-xl hover:bg-civic-50 transition-colors shadow-lg"
            >
              Get Started
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Onboarding prompt for users without alias */}
      {user && !profile?.aliasType && (
        <div className="card p-6 mb-8 border-2 border-civic-200 bg-gradient-to-r from-civic-50 to-white">
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-civic-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-civic-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 mb-1">
                  Complete your profile
                </h2>
                <p className="text-sm text-gray-600">
                  Choose your anonymous alias to join discussions. Your email stays private.
                </p>
              </div>
            </div>
            <a href="/profile" className="btn-primary shrink-0">
              Set up profile
            </a>
          </div>
        </div>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Latest News</h2>
        <span className="text-sm text-gray-500">{articles.length} articles</span>
      </div>

      {/* Filter Bar */}
      {regions.length > 1 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setFilter(region as string)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                filter === region
                  ? "bg-civic-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {region === "all" ? "All Regions" : region}
            </button>
          ))}
        </div>
      )}

      {/* Articles Feed */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 rounded-lg w-20" />
                <div className="h-6 bg-gray-200 rounded-lg w-24" />
              </div>
              <div className="h-7 bg-gray-200 rounded-lg w-3/4 mb-4" />
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
              </div>
              <div className="h-20 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No articles yet</h3>
          <p className="text-gray-500">Check back soon for the latest PA news.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onVote={handleVote}
              onComment={handleComment}
              isAuthenticated={!!user}
            />
          ))}
        </div>
      )}
    </div>
  );
}
