"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AliasType } from "@prisma/client";
import { ALIAS_LABELS } from "@/types";

const ALIAS_OPTIONS: { value: AliasType; label: string; description: string }[] = [
  {
    value: "PA_RESIDENT",
    label: "PA Resident",
    description: "Living in Pennsylvania",
  },
  {
    value: "COLLEGE_STUDENT",
    label: "College Student",
    description: "Studying in PA",
  },
  {
    value: "POLI_SCI_WORKER",
    label: "Political Science Worker",
    description: "Working in political science field",
  },
  {
    value: "GOVT_WORKER",
    label: "Government Worker",
    description: "Working in government",
  },
  {
    value: "JOURNALIST",
    label: "Journalist",
    description: "Working in journalism/media",
  },
  {
    value: "EDUCATOR",
    label: "Educator",
    description: "Working in education",
  },
  {
    value: "HEALTHCARE",
    label: "Healthcare Worker",
    description: "Working in healthcare",
  },
  {
    value: "OTHER",
    label: "Community Member",
    description: "Other background",
  },
];

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [aliasType, setAliasType] = useState<AliasType | "">("");
  const [aliasYears, setAliasYears] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
    if (session?.user) {
      setAliasType(session.user.aliasType || "");
      setAliasYears(session.user.aliasYears || 1);
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasType) return;

    setIsSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aliasType, aliasYears }),
      });

      if (res.ok) {
        await update();
        setMessage("Profile updated successfully!");
      } else {
        setMessage("Failed to update profile.");
      }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-civic-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-civic-900 mb-2">Your Profile</h1>
        <p className="text-civic-600 mb-6">
          Set up your anonymous alias. This is how others will see you in discussions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alias Type Selection */}
          <div>
            <label className="block text-sm font-medium text-civic-700 mb-3">
              Your background
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALIAS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAliasType(option.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    aliasType === option.value
                      ? "border-civic-600 bg-civic-50"
                      : "border-civic-200 hover:border-civic-300"
                  }`}
                >
                  <div className="font-medium text-civic-800">
                    {option.label}
                  </div>
                  <div className="text-sm text-civic-500">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Years */}
          {aliasType && aliasType !== "OTHER" && (
            <div>
              <label
                htmlFor="years"
                className="block text-sm font-medium text-civic-700 mb-1"
              >
                How many years?
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  id="years"
                  min="1"
                  max="50"
                  value={aliasYears}
                  onChange={(e) => setAliasYears(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-16 text-center font-medium text-civic-700">
                  {aliasYears} {aliasYears === 1 ? "year" : "years"}
                </span>
              </div>
            </div>
          )}

          {/* Preview */}
          {aliasType && (
            <div className="bg-civic-50 rounded-lg p-4">
              <div className="text-sm text-civic-500 mb-1">
                Your public alias:
              </div>
              <div className="font-medium text-civic-800 text-lg">
                {aliasType === "OTHER"
                  ? "Community member"
                  : `${aliasYears} yr ${ALIAS_LABELS[aliasType]}`}
              </div>
            </div>
          )}

          {message && (
            <p
              className={`text-sm p-3 rounded-lg ${
                message.includes("success")
                  ? "bg-approve/10 text-approve"
                  : "bg-disapprove/10 text-disapprove"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={!aliasType || isSaving}
            className="btn-primary w-full"
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
