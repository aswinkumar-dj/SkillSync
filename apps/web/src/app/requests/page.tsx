"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGate, type AuthUser } from "../../components/auth/auth-gate";
import { apiFetch } from "../../lib/api";

type RequestUser = { id: string; name: string; email: string; avatarUrl: string | null; targetRole: string | null; preferredLanguage: string | null; yearsOfExperience: number | null };
type MatchRequest = { id: string; message: string | null; requestedRole: string | null; requestedTopics: string[]; status: string; createdAt: string; respondedAt: string | null; sender: RequestUser; receiver: RequestUser; match: { id: string; status: string } | null };
type RequestsResponse = { success: true; data: { requests: MatchRequest[] } };

const statusClass = (status: string) => status === "PENDING" ? "bg-orange-500/15 text-orange-100" : status === "ACCEPTED" ? "bg-emerald-500/15 text-emerald-100" : "bg-white/[0.05] text-muted";

function RequestCard({ request, direction, onAction }: { request: MatchRequest; direction: "incoming" | "outgoing"; onAction: (id: string, action: "accept" | "decline" | "cancel") => void }) {
  const person = direction === "incoming" ? request.sender : request.receiver;
  const pending = request.status === "PENDING";

  return <article className="rounded-[22px] bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300">{direction === "incoming" ? "From" : "To"}</p>
        <h2 className="mt-2 text-lg font-semibold tracking-[-0.04em] text-text">{person.name}</h2>
        <p className="mt-1 text-sm text-muted">{person.targetRole ?? "Interview practice partner"}</p>
      </div>
      <span className={`rounded-[12px] px-3 py-2 text-xs font-semibold ${statusClass(request.status)}`}>{request.status.toLowerCase()}</span>
    </div>
    {request.message ? <p className="mt-4 rounded-[16px] bg-black/20 px-4 py-3 text-sm leading-6 text-muted">{request.message}</p> : <p className="mt-4 text-sm text-muted">No note included.</p>}
    <div className="mt-4 flex flex-wrap gap-2">{request.requestedRole ? <span className="rounded-[10px] bg-white/[0.04] px-2.5 py-1 text-xs text-orange-100">{request.requestedRole}</span> : null}{request.requestedTopics.map((topic) => <span key={topic} className="rounded-[10px] bg-white/[0.04] px-2.5 py-1 text-xs text-muted">{topic}</span>)}</div>
    {request.match ? <p className="mt-4 text-sm text-emerald-100">Private match created. Match detail is the next workflow surface.</p> : null}
    {pending ? <div className="mt-5 flex flex-wrap gap-3">{direction === "incoming" ? <><button type="button" onClick={() => onAction(request.id, "accept")} className="interactive-button rounded-[14px] bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-400">Accept</button><button type="button" onClick={() => onAction(request.id, "decline")} className="rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-muted hover:text-text">Decline</button></> : <button type="button" onClick={() => onAction(request.id, "cancel")} className="rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-muted hover:text-text">Cancel request</button>}</div> : null}
  </article>;
}

function RequestsWorkspace({ user }: { user: AuthUser }) {
  const [incoming, setIncoming] = useState<MatchRequest[]>([]);
  const [outgoing, setOutgoing] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const [incomingResponse, outgoingResponse] = await Promise.all([
      apiFetch<RequestsResponse>("/api/v1/match-requests/incoming"),
      apiFetch<RequestsResponse>("/api/v1/match-requests/outgoing"),
    ]);
    setIncoming(incomingResponse.data.requests);
    setOutgoing(outgoingResponse.data.requests);
  };

  useEffect(() => {
    load().catch((error) => setError(error instanceof Error ? error.message : "Unable to load requests.")).finally(() => setLoading(false));
  }, []);

  const act = async (id: string, action: "accept" | "decline" | "cancel") => {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/api/v1/match-requests/${id}/${action}`, { method: "POST" });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update request.");
    } finally {
      setBusyId(null);
    }
  };

  return <AppShell user={user} title="Match requests" subtitle="Review incoming and outgoing practice invitations before a private match is created.">
    {error ? <p className="rounded-[18px] bg-[#25120c] px-4 py-4 text-sm text-orange-100">{error}</p> : null}
    {busyId ? <p className="text-sm text-muted">Updating request...</p> : null}
    {loading ? <p className="text-sm text-muted">Loading requests...</p> : <div className="grid gap-6 xl:grid-cols-2">
      <section><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-300">Incoming</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-text">{incoming.length} received</h1></div></div><div className="grid gap-4">{incoming.length ? incoming.map((request) => <RequestCard key={request.id} request={request} direction="incoming" onAction={act} />) : <EmptyState copy="No one has requested a practice match yet." />}</div></section>
      <section><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-300">Outgoing</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-text">{outgoing.length} sent</h1></div><a href="/discover" className="rounded-[14px] bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-400">Find partners</a></div><div className="grid gap-4">{outgoing.length ? outgoing.map((request) => <RequestCard key={request.id} request={request} direction="outgoing" onAction={act} />) : <EmptyState copy="Send a request from Discover when someone looks aligned." />}</div></section>
    </div>}
  </AppShell>;
}

function EmptyState({ copy }: { copy: string }) { return <div className="rounded-[22px] bg-white/[0.035] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"><p className="text-sm leading-6 text-muted">{copy}</p></div>; }

export default function RequestsPage() { return <AuthGate mode="dashboard">{(user) => <RequestsWorkspace user={user} />}</AuthGate>; }
