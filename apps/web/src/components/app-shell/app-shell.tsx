"use client";

import { type ReactNode, useState } from "react";

import { apiBaseUrl } from "../../lib/api";
import type { AuthUser } from "../auth/auth-gate";

type AppShellProps = {
  user: AuthUser;
  title: string;
  subtitle: string;
  children: ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/discover", label: "Discover" },
  { href: "/requests", label: "Requests" },
  { href: "/onboarding", label: "Profile" },
];

export function AppShell({ user, title, subtitle, children }: AppShellProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">
        <header className="grid gap-5 border-b border-white/5 pb-6 lg:grid-cols-[220px_1fr_auto] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-300">SkillSync</p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-text">{title}</p>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted">{subtitle}</p>
          <div className="flex items-center gap-3 justify-self-start lg:justify-self-end">
            <div className="rounded-[18px] bg-white/[0.04] px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <p className="text-sm font-medium text-text">{user.name}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="interactive-button rounded-[16px] bg-[#18120d] px-4 py-3 text-sm font-medium text-orange-200 transition hover:bg-[#22170f]"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Leaving..." : "Log out"}
            </button>
          </div>
        </header>

        <div className="grid flex-1 gap-6 py-6 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-[22px] bg-white/[0.035] p-3 shadow-[0_24px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block rounded-[14px] px-4 py-3 text-sm text-muted transition hover:bg-white/[0.04] hover:text-text"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
