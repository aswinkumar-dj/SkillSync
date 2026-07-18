"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGate, type AuthUser } from "../../components/auth/auth-gate";
import { ListSkeleton } from "../../components/ui/page-skeletons";
import { apiFetch } from "../../lib/api";
import { getSocket } from "../../lib/socket";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  success: true;
  data: {
    notifications: NotificationItem[];
  };
};

const hrefForNotification = (notification: NotificationItem): Route => {
  const data = notification.data ?? {};

  if (typeof data.roomId === "string") {
    return `/chat/${data.roomId}` as Route;
  }

  if (typeof data.matchId === "string") {
    return `/matches/${data.matchId}` as Route;
  }

  if (notification.type === "MATCH_REQUEST_RECEIVED") {
    return "/requests";
  }

  if (notification.type === "MATCH_REQUEST_ACCEPTED") {
    return "/matches";
  }

  return "/notifications";
};

function NotificationsWorkspace({ user }: { user: AuthUser }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const response = await apiFetch<NotificationsResponse>("/api/v1/notifications?limit=50");
      setNotifications(response.data.notifications);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return;
    }

    const onNotification = (payload: NotificationItem) => {
      setNotifications((current) => {
        if (current.some((item) => item.id === payload.id)) {
          return current;
        }

        return [payload, ...current];
      });
    };

    socket.on("notification:new", onNotification);

    return () => {
      socket.off("notification:new", onNotification);
    };
  }, []);

  const markOneRead = async (id: string) => {
    try {
      await apiFetch(`/api/v1/notifications/${id}/read`, { method: "POST" });
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to mark as read.");
    }
  };

  const markAllRead = async () => {
    setBusy(true);
    try {
      await apiFetch("/api/v1/notifications/read-all", { method: "POST" });
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to mark all as read.");
    } finally {
      setBusy(false);
    }
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <AppShell
      user={user}
      title="Notifications"
      subtitle="Private in-app alerts for match requests, accepts, and chat messages. No public activity feed."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {unreadCount > 0 ? `${unreadCount} unread` : "You are all caught up."}
        </p>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={busy || unreadCount === 0}
          className="rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-orange-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Updating..." : "Mark all read"}
        </button>
      </div>

      {error ? (
        <p className="rounded-[18px] bg-[#25120c] px-4 py-4 text-sm text-orange-100">{error}</p>
      ) : null}

      {loading ? <ListSkeleton rows={6} /> : null}

      {!loading && notifications.length === 0 ? (
        <div className="rounded-[22px] bg-white/[0.035] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <p className="text-lg font-semibold tracking-[-0.04em] text-text">No notifications yet</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            When someone sends a request, accepts yours, or messages you after a match, it shows up
            here.
          </p>
        </div>
      ) : null}

      {!loading && notifications.length > 0 ? (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-[22px] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl ${
                notification.isRead ? "bg-white/[0.03]" : "bg-white/[0.05]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                    {notification.type.replaceAll("_", " ").toLowerCase()}
                  </p>
                  <h2 className="mt-2 text-base font-semibold tracking-[-0.03em] text-text">
                    {notification.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{notification.body}</p>
                  <p className="mt-3 text-xs text-muted">
                    {new Date(notification.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!notification.isRead ? (
                  <span className="rounded-[10px] bg-orange-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-100">
                    Unread
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={hrefForNotification(notification)}
                  onClick={() => {
                    if (!notification.isRead) {
                      void markOneRead(notification.id);
                    }
                  }}
                  className="rounded-[14px] bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
                >
                  Open
                </Link>
                {!notification.isRead ? (
                  <button
                    type="button"
                    onClick={() => void markOneRead(notification.id)}
                    className="rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-orange-100 transition hover:bg-white/[0.08]"
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}

export default function NotificationsPage() {
  return <AuthGate mode="dashboard">{(user) => <NotificationsWorkspace user={user} />}</AuthGate>;
}
