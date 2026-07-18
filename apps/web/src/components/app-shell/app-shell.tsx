"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { apiBaseUrl, apiFetch } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { useAuth, type AuthUser } from "../auth/auth-provider";

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
  { href: "/matches", label: "Matches" },
  { href: "/chat", label: "Chat" },
  { href: "/notifications", label: "Notifications", badgeKey: "notifications" as const },
  { href: "/onboarding", label: "Profile" },
] as const;

type UnreadCountResponse = {
  success: true;
  data: {
    unreadCount: number;
  };
};

const isActivePath = (pathname: string, href: string) => {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export function AppShell({ user, title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const { clear } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadUnread = async () => {
      try {
        const response = await apiFetch<UnreadCountResponse>("/api/v1/notifications/unread-count");
        if (!cancelled) {
          setUnreadCount(response.data.unreadCount);
        }
      } catch {
        // Badge is optional; keep shell usable if the endpoint is unavailable.
      }
    };

    void loadUnread();

    const socket = getSocket();
    if (!socket) {
      return () => {
        cancelled = true;
      };
    }

    const onNotification = () => {
      setUnreadCount((current) => current + 1);
    };

    socket.on("notification:new", onNotification);

    return () => {
      cancelled = true;
      socket.off("notification:new", onNotification);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      clear();
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-300">
              SkillSync
            </p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-text">{title}</p>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted">{subtitle}</p>
          <div className="flex items-center gap-3 justify-self-start lg:justify-self-end">
            <Link
              href="/notifications"
              className="relative rounded-[16px] bg-white/[0.04] px-4 py-3 text-sm font-medium text-orange-100 transition hover:bg-white/[0.07]"
            >
              Alerts
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
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
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    className={`flex items-center justify-between rounded-[14px] px-4 py-3 text-sm transition ${
                      active
                        ? "bg-orange-500/15 text-orange-100"
                        : "text-muted hover:bg-white/[0.04] hover:text-text"
                    }`}
                  >
                    <span>{item.label}</span>
                    {"badgeKey" in item &&
                    item.badgeKey === "notifications" &&
                    unreadCount > 0 ? (
                      <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
