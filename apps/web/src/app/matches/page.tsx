"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGate, type AuthUser } from "../../components/auth/auth-gate";
import { ContentCardsSkeleton } from "../../components/ui/page-skeletons";
import { apiFetch } from "../../lib/api";

type MatchSummary = {
  id: string;
  status: string;
  createdAt: string;
  chatRoomId: string | null;
  partner: {
    id: string;
    name: string;
    avatarUrl: string | null;
    targetRole: string | null;
    preferredLanguage: string | null;
    yearsOfExperience: number | null;
  };
  request: {
    message: string | null;
    requestedRole: string | null;
  };
};

type MatchesResponse = {
  success: true;
  data: {
    matches: MatchSummary[];
  };
};

const initialsFor = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

function MatchesWorkspace({ user }: { user: AuthUser }) {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch<MatchesResponse>("/api/v1/matches");
        setMatches(response.data.matches);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load matches.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <AppShell
      user={user}
      title="Your matches"
      subtitle="Accepted practice relationships. Each match is private and can hold many future sessions."
    >
      {error ? (
        <p className="rounded-[18px] bg-[#25120c] px-4 py-4 text-sm text-orange-100">{error}</p>
      ) : null}

      {loading ? <ContentCardsSkeleton count={4} /> : null}

      {!loading && !error && matches.length === 0 ? (
        <div className="rounded-[22px] bg-white/[0.035] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <p className="text-lg font-semibold tracking-[-0.04em] text-text">No private matches yet</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Find a partner in Discover, send a request, and open the match here once it is accepted.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/discover"
              className="rounded-[14px] bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-400"
            >
              Find partners
            </Link>
            <Link
              href="/requests"
              className="rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-orange-100 hover:bg-white/[0.08]"
            >
              View requests
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && matches.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {matches.map((match) => (
            <article
              key={match.id}
              className="rounded-[22px] bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {match.partner.avatarUrl ? (
                    <img
                      src={match.partner.avatarUrl}
                      alt=""
                      className="h-11 w-11 rounded-[15px] object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#28170c] text-sm font-semibold text-orange-200">
                      {initialsFor(match.partner.name)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-semibold tracking-[-0.03em] text-text">
                      {match.partner.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      {match.partner.targetRole ?? "Interview practice partner"}
                    </p>
                  </div>
                </div>
                <span className="rounded-[12px] bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-100">
                  {match.status.toLowerCase()}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted">
                {match.request.message || "No practice note was included with the original request."}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/matches/${match.id}`}
                  className="interactive-button inline-flex rounded-[14px] bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-400"
                >
                  Open match
                </Link>
                {match.chatRoomId ? (
                  <Link
                    href={`/chat/${match.chatRoomId}`}
                    className="inline-flex rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-orange-100 hover:bg-white/[0.08]"
                  >
                    Open chat
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}

export default function MatchesPage() {
  return <AuthGate mode="dashboard">{(user) => <MatchesWorkspace user={user} />}</AuthGate>;
}
