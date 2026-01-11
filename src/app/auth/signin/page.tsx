"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        setError("Failed to send magic link. Please try again.");
      } else {
        window.location.href = "/auth/verify";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
