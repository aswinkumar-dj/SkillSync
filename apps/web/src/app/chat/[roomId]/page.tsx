"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "../../../components/app-shell/app-shell";
import { AuthGate, type AuthUser } from "../../../components/auth/auth-gate";
import { ChatRoomSkeleton } from "../../../components/ui/page-skeletons";
import { apiFetch } from "../../../lib/api";
import { getSocket } from "../../../lib/socket";

type ChatPartner = {
  id: string;
  name: string;
  avatarUrl: string | null;
  targetRole: string | null;
};

type ChatRoom = {
  id: string;
  matchId: string;
  matchStatus: string;
  partner: ChatPartner;
};

type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  type: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
};

type RoomResponse = {
  success: true;
  data: {
    room: ChatRoom;
  };
};

type MessagesResponse = {
  success: true;
  data: {
    messages: ChatMessage[];
    hasMore: boolean;
  };
};

type SendMessageResponse = {
  success: true;
  data: {
    message: ChatMessage;
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

function ConversationWorkspace({ user }: { user: AuthUser }) {
  const params = useParams<{ roomId: string }>();
  const roomId = params?.roomId;
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "connected" | "offline">(
    "connecting",
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const seenIds = useRef(new Set<string>());

  const partnerName = room?.partner.name ?? "Partner";

  const appendMessage = (message: ChatMessage) => {
    if (seenIds.current.has(message.id)) {
      return;
    }

    seenIds.current.add(message.id);
    setMessages((current) => [...current, message]);
  };

  useEffect(() => {
    if (!roomId) {
      setLoadError("Chat room not found.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [roomResponse, messagesResponse] = await Promise.all([
          apiFetch<RoomResponse>(`/api/v1/chat/rooms/${roomId}`),
          apiFetch<MessagesResponse>(`/api/v1/chat/rooms/${roomId}/messages?limit=50`),
        ]);

        setRoom(roomResponse.data.room);
        messagesResponse.data.messages.forEach((message) => seenIds.current.add(message.id));
        setMessages(messagesResponse.data.messages);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Unable to load conversation.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || loading || loadError) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      setLiveStatus("offline");
      return;
    }

    const onConnect = () => {
      setLiveStatus("connected");
      socket.emit("chat:join", { roomId });
    };

    const onDisconnect = () => {
      setLiveStatus("offline");
    };

    const onMessage = (payload: ChatMessage) => {
      if (payload.roomId !== roomId) {
        return;
      }

      appendMessage(payload);
    };

    if (socket.connected) {
      onConnect();
    } else {
      setLiveStatus("connecting");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("chat:message", onMessage);

    return () => {
      socket.emit("chat:leave", { roomId });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat:message", onMessage);
    };
  }, [roomId, loading, loadError]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();

    if (!roomId || !draft.trim() || sending) {
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      const response = await apiFetch<SendMessageResponse>(`/api/v1/chat/rooms/${roomId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: draft.trim() }),
      });

      appendMessage(response.data.message);
      setDraft("");
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const liveLabel = useMemo(() => {
    if (liveStatus === "connected") {
      return "Live";
    }

    if (liveStatus === "connecting") {
      return "Connecting";
    }

    return "Offline";
  }, [liveStatus]);

  return (
    <AppShell
      user={user}
      title={room ? `Chat with ${partnerName}` : "Private chat"}
      subtitle="Match-scoped messages only. History loads from the server; new messages arrive live when connected."
    >
      {loading ? <ChatRoomSkeleton /> : null}

      {loadError && !room ? (
        <div className="rounded-[22px] bg-[#25120c] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <p className="text-sm text-orange-100">{loadError}</p>
          <Link
            href="/chat"
            className="mt-4 inline-flex rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-orange-100 transition hover:bg-white/[0.08]"
          >
            Back to chats
          </Link>
        </div>
      ) : null}

      {room ? (
        <div className="flex min-h-[70vh] flex-col rounded-[22px] bg-white/[0.04] shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
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
                <h1 className="text-base font-semibold tracking-[-0.03em] text-text">
                  {room.partner.name}
                </h1>
                <p className="mt-1 text-xs text-muted">
                  {room.partner.targetRole ?? "Practice partner"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-[12px] px-3 py-2 text-xs font-semibold ${
                  liveStatus === "connected"
                    ? "bg-emerald-500/15 text-emerald-100"
                    : "bg-white/[0.05] text-muted"
                }`}
              >
                {liveLabel}
              </span>
              <Link
                href={`/matches/${room.matchId}`}
                className="rounded-[12px] bg-white/[0.05] px-3 py-2 text-xs font-medium text-orange-100 transition hover:bg-white/[0.08]"
              >
                Match detail
              </Link>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
            {messages.length === 0 ? (
              <div className="rounded-[16px] bg-black/20 px-4 py-4 text-sm text-muted">
                No messages yet. Share availability or a practice goal to get started.
              </div>
            ) : null}

            {messages.map((message) => {
              const mine = message.senderId === user.id;

              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[min(100%,32rem)] rounded-[16px] px-4 py-3 text-sm leading-6 ${
                      mine
                        ? "bg-orange-500 text-white"
                        : "bg-black/25 text-text"
                    }`}
                  >
                    {!mine ? (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-200/80">
                        {message.sender?.name ?? partnerName}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`mt-2 text-[10px] ${mine ? "text-orange-50/80" : "text-muted"}`}>
                      {new Date(message.createdAt).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={(event) => void handleSend(event)} className="border-t border-white/5 p-4">
            {sendError ? <p className="mb-3 text-sm text-orange-100">{sendError}</p> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={2}
                maxLength={4000}
                placeholder={`Message ${partnerName}...`}
                className="min-h-[52px] flex-1 resize-none rounded-[14px] bg-black/25 px-4 py-3 text-sm text-text outline-none ring-1 ring-white/5 placeholder:text-muted focus:ring-orange-500/40"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="interactive-button rounded-[14px] bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}

export default function ChatRoomPage() {
  return <AuthGate mode="dashboard">{(user) => <ConversationWorkspace user={user} />}</AuthGate>;
}
