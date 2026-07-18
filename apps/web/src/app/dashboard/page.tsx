"use client";

import Link from "next/link";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGate } from "../../components/auth/auth-gate";
import { ProfileStatusCard } from "../../components/dashboard/profile-status-card";

export default function DashboardPage() {
  return (
    <AuthGate mode="dashboard">
      {(user) => (
        <AppShell
          user={user}
          title="Your practice dashboard"
          subtitle="This is the first signed-in layer: profile readiness, visibility, and the base we'll use for partner discovery, requests, sessions, and notes."
        >
          <ProfileStatusCard user={user} />

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-[24px] bg-white/[0.035] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300">
                Ready now
              </p>
              <h2 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-text">
                Discover, request, match
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Search complete profiles, send a private practice request, and accept to form one
                match relationship without public social noise.
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
            </article>

            <article className="rounded-[24px] bg-[#140f0c] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300">
                Next up
              </p>
              <h2 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-text">
                Chat, scheduling, interview room
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                After a match exists, the next slices unlock private chat, multi-session
                scheduling, and the in-app interview room. A match is the relationship; sessions
                live inside it.
              </p>
              <Link
                href="/matches"
                className="mt-5 inline-flex rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-orange-100 hover:bg-white/[0.08]"
              >
                Open matches
              </Link>
            </article>
          </section>
        </AppShell>
      )}
    </AuthGate>
  );
}
