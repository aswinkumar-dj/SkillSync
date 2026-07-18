"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGate, type AuthUser } from "../../../components/auth/auth-gate";
import { DetailSkeleton } from "../../../components/ui/page-skeletons";
import { apiFetch } from "../../../lib/api";

type MatchPartner = {
  id: string;
  name: string;
  avatarUrl: string | null;
  targetRole: string | null;
  preferredLanguage: string | null;
  yearsOfExperience: number | null;
  bio: string | null;
  timezone: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  skills: string[];
  techStack: string[];
  interviewTopics: string[];
};

type MatchDetail = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  chatRoomId: string | null;
  partner: MatchPartner;
  request: {
    id: string;
    message: string | null;
    requestedRole: string | null;
    requestedTopics: string[];
    createdAt: string;
    respondedAt: string | null;
  };
};

type MatchResponse = {
  success: true;
  data: {
    match: MatchDetail;
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

function ChipList({ label, values }: { label: string; values: string[] }) {
  if (!values.length) {
    return null;
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="rounded-[10px] bg-white/[0.045] px-2.5 py-1 text-xs text-orange-100">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function MatchDetailWorkspace({ user }: { user: AuthUser }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const matchId = params?.id;
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) {
      setError("Match not found.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const response = await apiFetch<MatchResponse>(`/api/v1/matches/${matchId}`);
        setMatch(response.data.match);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load match.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [matchId]);

  const openChat = async () => {
    if (!matchId || openingChat) {
      return;
    }

    setOpeningChat(true);
    setError(null);

    try {
      if (match?.chatRoomId) {
        router.push(`/chat/${match.chatRoomId}`);
        return;
      }

      const response = await apiFetch<{
        success: true;
        data: { room: { id: string } };
      }>(`/api/v1/chat/rooms/match/${matchId}`);

      router.push(`/chat/${response.data.room.id}`);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Unable to open chat.");
      setOpeningChat(false);
    }
  };

  return (
    <AppShell
      user={user}
      title="Private match"
      subtitle="This relationship is private to the two of you. Open chat anytime; scheduling and interview rooms come next."
    >
      {loading ? <DetailSkeleton /> : null}
      {error ? (
        <div className="rounded-[22px] bg-[#25120c] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <p className="text-sm text-orange-100">{error}</p>
          <Link
            href="/requests"
            className="mt-4 inline-flex rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-orange-100 transition hover:bg-white/[0.08]"
          >
            Back to requests
          </Link>
        </div>
      ) : null}

      {match ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <section className="rounded-[22px] bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {match.partner.avatarUrl ? (
                  <img
                    src={match.partner.avatarUrl}
                    alt=""
                    className="h-14 w-14 rounded-[18px] object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#28170c] text-base font-semibold text-orange-200">
                    {initialsFor(match.partner.name)}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-300">
                    Practice partner
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-text">
                    {match.partner.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted">
                    {match.partner.targetRole ?? "Interview practice partner"}
                    {match.partner.yearsOfExperience != null
                      ? ` · ${match.partner.yearsOfExperience}y exp`
                      : ""}
                  </p>
                </div>
              </div>
              <span className="rounded-[12px] bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-100">
                {match.status.toLowerCase()}
              </span>
            </div>

            {match.partner.bio ? (
              <p className="mt-6 rounded-[16px] bg-black/20 px-4 py-4 text-sm leading-6 text-muted">
                {match.partner.bio}
              </p>
            ) : null}

            <div className="mt-6 grid gap-5">
              <ChipList label="Skills" values={match.partner.skills} />
              <ChipList label="Tech stack" values={match.partner.techStack} />
              <ChipList label="Interview topics" values={match.partner.interviewTopics} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[16px] bg-black/20 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Language
                </p>
                <p className="mt-2 text-sm text-text">
                  {match.partner.preferredLanguage ?? "Not set"}
                </p>
              </div>
              <div className="rounded-[16px] bg-black/20 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Timezone
                </p>
                <p className="mt-2 text-sm text-text">{match.partner.timezone ?? "Not set"}</p>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <article className="rounded-[22px] bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-300">
                Origin request
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">
                {match.request.message || "No practice note was included with the request."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {match.request.requestedRole ? (
                  <span className="rounded-[10px] bg-white/[0.045] px-2.5 py-1 text-xs text-orange-100">
                    {match.request.requestedRole}
                  </span>
                ) : null}
                {match.request.requestedTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-[10px] bg-white/[0.045] px-2.5 py-1 text-xs text-muted"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted">
                Matched{" "}
                {new Date(match.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </article>

            <article className="rounded-[22px] bg-[#140f0c] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-300">
                Private tools
              </p>
              <h2 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-text">
                Chat is unlocked for this match
              </h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
                <li>Private chat between matched partners</li>
                <li>Session scheduling (next)</li>
                <li>In-app interview room (later)</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void openChat()}
                  disabled={openingChat}
                  className="rounded-[14px] bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {openingChat ? "Opening chat..." : "Open private chat"}
                </button>
                <Link
                  href="/requests"
                  className="rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-orange-100 transition hover:bg-white/[0.08]"
                >
                  Back to requests
                </Link>
              </div>
            </article>

            {(match.partner.githubUrl || match.partner.linkedinUrl) && (
              <article className="rounded-[22px] bg-white/[0.035] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-300">
                  Links
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  {match.partner.githubUrl ? (
                    <a
                      href={match.partner.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-orange-100 transition hover:text-orange-50"
                    >
                      GitHub
                    </a>
                  ) : null}
                  {match.partner.linkedinUrl ? (
                    <a
                      href={match.partner.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-orange-100 transition hover:text-orange-50"
                    >
                      LinkedIn
                    </a>
                  ) : null}
                </div>
              </article>
            )}
          </aside>
        </div>
      ) : null}
    </AppShell>
  );
}

export default function MatchDetailPage() {
  return <AuthGate mode="dashboard">{(user) => <MatchDetailWorkspace user={user} />}</AuthGate>;
}
