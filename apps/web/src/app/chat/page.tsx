"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGate, type AuthUser } from "../../components/auth/auth-gate";
import { ListSkeleton } from "../../components/ui/page-skeletons";
import { apiFetch } from "../../lib/api";

type ChatRoomSummary = {
  id: string;
  matchId: string;
  matchStatus: string;
  createdAt: string;
  partner: {
    id: string;
    name: string;
    avatarUrl: string | null;
    targetRole: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
};

type RoomsResponse = {
  success: true;
  data: {
    rooms: ChatRoomSummary[];
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

function ChatListWorkspace({ user }: { user: AuthUser }) {
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch<RoomsResponse>("/api/v1/chat/rooms");
        setRooms(response.data.rooms);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load chats.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <AppShell
      user={user}
      title="Private chat"
      subtitle="Conversations unlock only after a match is accepted. No public feed, no group channels."
    >
      {error ? (
        <p className="rounded-[18px] bg-[#25120c] px-4 py-4 text-sm text-orange-100">{error}</p>
      ) : null}

      {loading ? <ListSkeleton rows={5} /> : null}

      {!loading && !error && rooms.length === 0 ? (
        <div className="rounded-[22px] bg-white/[0.035] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <p className="text-lg font-semibold tracking-[-0.04em] text-text">No private chats yet</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Accept a match request or wait for yours to be accepted. Chat rooms appear here once the
            private relationship exists.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/matches"
              className="rounded-[14px] bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-400"
            >
              View matches
            </Link>
            <Link
              href="/requests"
              className="rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-orange-100 hover:bg-white/[0.08]"
            >
              Open requests
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && rooms.length > 0 ? (
        <div className="grid gap-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/chat/${room.id}`}
              className="rounded-[22px] bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl transition hover:bg-white/[0.055]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {room.partner.avatarUrl ? (
                    <img
                      src={room.partner.avatarUrl}
                      alt=""
                      className="h-11 w-11 rounded-[15px] object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#28170c] text-sm font-semibold text-orange-200">
                      {initialsFor(room.partner.name)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-semibold tracking-[-0.03em] text-text">
                      {room.partner.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      {room.partner.targetRole ?? "Practice partner"}
                    </p>
                  </div>
                </div>
                {room.lastMessage ? (
                  <p className="shrink-0 text-xs text-muted">
                    {new Date(room.lastMessage.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                ) : null}
              </div>
              <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">
                {room.lastMessage?.content ?? "No messages yet. Say hello and set a practice goal."}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}

export default function ChatPage() {
  return <AuthGate mode="dashboard">{(user) => <ChatListWorkspace user={user} />}</AuthGate>;
}
