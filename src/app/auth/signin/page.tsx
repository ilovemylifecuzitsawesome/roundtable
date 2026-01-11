"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${redirectUrl}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-approve/20 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-approve"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-civic-900 mb-2">
              Check your email
            </h1>
            <p className="text-civic-600">
              We sent a magic link to <strong>{email}</strong>. Click the link
              to sign in.
            </p>
            <p className="text-sm text-civic-500 mt-4">
              Didn&apos;t receive it? Check your spam folder.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-civic-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">R</span>
            </div>
            <h1 className="text-2xl font-bold text-civic-900">
              Join the Roundtable
            </h1>
            <p className="text-civic-600 mt-2">
              Anonymous civic discourse for Pennsylvania
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-civic-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input"
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-sm text-disapprove bg-disapprove/10 rounded-lg p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="btn-primary w-full"
            >
              {isLoading ? "Sending..." : "Send magic link"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-civic-200">
            <p className="text-sm text-civic-500 text-center">
              We&apos;ll send you a magic link to sign in. No password needed.
              Your identity stays anonymous - only your chosen alias is shown.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
