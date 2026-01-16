"use client";

import { useAuth } from "@/app/providers";
import Link from "next/link";
import { formatAlias } from "@/types";

export function Header() {
  const { user, profile, isLoading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-civic-500 to-civic-700 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg text-gray-900">Roundtable</span>
            <span className="font-bold text-lg text-civic-600 ml-1">PA</span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-10 w-28 bg-gray-100 rounded-xl animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-civic-100 to-civic-200 flex items-center justify-center">
                  <span className="text-civic-700 text-xs font-bold">
                    {profile?.aliasType?.charAt(0) || "U"}
                  </span>
                </div>
                <span className="hidden sm:block">
                  {formatAlias(profile?.aliasType, profile?.aliasYears)}
                </span>
              </Link>
              <button
                onClick={() => signOut()}
                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/auth/signin" className="btn-primary">
              Get Started
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
