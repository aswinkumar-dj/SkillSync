"use client";

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
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300">Next up</p>
              <h2 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-text">Discovery and match requests</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Once your profile is complete, we'll plug in filtered discovery, request sending, and match history without showing incomplete profiles.
              </p>
            </article>

            <article className="rounded-[24px] bg-[#140f0c] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300">Session model</p>
              <h2 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-text">Multiple sessions per match</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                A match is the relationship between two people. Inside that match, you can schedule many mock interview sessions over time instead of rematching every time.
              </p>
            </article>
          </section>
        </AppShell>
      )}
    </AuthGate>
  );
}