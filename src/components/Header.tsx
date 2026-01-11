"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { formatAlias } from "@/types";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-civic-200">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-civic-800 flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-semibold text-civic-800">Roundtable PA</span>
        </Link>

        <nav className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="h-8 w-24 bg-civic-100 rounded animate-pulse" />
          ) : session ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="text-sm text-civic-600 hover:text-civic-800"
              >
                {formatAlias(session.user.aliasType, session.user.aliasYears)}
              </Link>
              <button
                onClick={() => signOut()}
                className="btn-ghost text-sm text-civic-500 hover:text-civic-700"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/auth/signin" className="btn-primary text-sm">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
