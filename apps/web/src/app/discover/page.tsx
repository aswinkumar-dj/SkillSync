"use client";

import { type FormEvent, useEffect, useState } from "react";
import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGate, type AuthUser } from "../../components/auth/auth-gate";
import { ApiError, apiFetch } from "../../lib/api";

type Candidate = { id: string; name: string; avatarUrl: string | null; targetRole: string | null; preferredLanguage: string | null; yearsOfExperience: number | null; skills?: string[]; interviewTopics?: string[]; matchScore?: number; matchReasons?: string[] };
type MetaResponse = { success: true; data: Record<string, string[]> };
type SearchResponse = { success: true; data: { candidates: Candidate[] } };
type FilterKey = "skills" | "interviewTopics";

const initialsFor = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

function DiscoverWorkspace({ user }: { user: AuthUser }) {
  const [prompt, setPrompt] = useState(`Find developers to practice ${user.interviewTopics.join(", ") || "technical"} interviews with.`);
  const [targetRole, setTargetRole] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [minYearsOfExperience, setMinYearsOfExperience] = useState("");
  const [maxYearsOfExperience, setMaxYearsOfExperience] = useState("");
  const [skills, setSkills] = useState(user.skills.slice(0, 4));
  const [interviewTopics, setInterviewTopics] = useState(user.interviewTopics.slice(0, 4));
  const [meta, setMeta] = useState({ roles: [] as string[], languages: [] as string[], skills: [] as string[], interviewTopics: [] as string[] });
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestedCandidateIds, setRequestedCandidateIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [roles, languages, loadedSkills, topics] = await Promise.all([
          apiFetch<MetaResponse>("/api/v1/meta/roles"), apiFetch<MetaResponse>("/api/v1/meta/languages"),
          apiFetch<MetaResponse>("/api/v1/meta/skills"), apiFetch<MetaResponse>("/api/v1/meta/interview-topics"),
        ]);
        setMeta({ roles: roles.data.roles ?? [], languages: languages.data.languages ?? [], skills: loadedSkills.data.skills ?? [], interviewTopics: topics.data.interviewTopics ?? [] });
      } catch {}
    };
    void loadMeta();
  }, []);

  const toggle = (field: FilterKey, value: string) => {
    const setter = field === "skills" ? setSkills : setInterviewTopics;
    setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSearching(true);
    setError(null);
    try {
      const response = await apiFetch<SearchResponse>("/api/v1/matches/search", {
        method: "POST",
        body: JSON.stringify({ prompt: prompt.trim(), targetRole: targetRole || undefined, preferredLanguage: preferredLanguage || undefined, minYearsOfExperience: minYearsOfExperience === "" ? undefined : Number(minYearsOfExperience), maxYearsOfExperience: maxYearsOfExperience === "" ? undefined : Number(maxYearsOfExperience), skills, interviewTopics }),
      });
      setCandidates(response.data.candidates.map((candidate) => ({ ...candidate, skills: candidate.skills ?? [], interviewTopics: candidate.interviewTopics ?? [], matchReasons: candidate.matchReasons ?? [], matchScore: candidate.matchScore ?? 0 })));
    } catch (searchError) {
      if (searchError instanceof ApiError && searchError.status === 403) { window.location.href = "/onboarding"; return; }
      setError(searchError instanceof Error ? searchError.message : "Unable to search for partners.");
    } finally {
      setIsSearching(false);
    }
  };

  const sendRequest = async () => {
    if (!selectedCandidate) return;
    setIsSending(true);
    setRequestError(null);
    try {
      await apiFetch("/api/v1/match-requests", {
        method: "POST",
        body: JSON.stringify({ receiverId: selectedCandidate.id, message: requestMessage.trim() || undefined, requestedRole: targetRole || selectedCandidate.targetRole || undefined, requestedTopics: interviewTopics }),
      });
      setRequestedCandidateIds((current) => [...current, selectedCandidate.id]);
      setSelectedCandidate(null);
      setRequestMessage("");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to send request.");
    } finally {
      setIsSending(false);
    }
  };

  const inputClass = "mt-2 w-full rounded-[14px] bg-black/20 px-3.5 py-2.5 text-sm text-text outline-none ring-1 ring-white/5 focus:ring-orange-500/50";
  const chips = (field: FilterKey, values: string[], selected: string[]) => values.slice(0, 12).map((value) => <button key={value} type="button" aria-pressed={selected.includes(value)} onClick={() => toggle(field, value)} className={`rounded-[11px] px-3 py-2 text-xs transition ${selected.includes(value) ? "bg-orange-500 text-white" : "bg-white/[0.045] text-muted hover:bg-white/[0.08] hover:text-text"}`}>{value}</button>);

  return (
    <AppShell user={user} title="Find a practice partner" subtitle="Search returns complete, discoverable profiles. Send a private request when there is a useful overlap.">
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form onSubmit={search} className="rounded-[22px] bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-300">Search preferences</p>
          <p className="mt-2 text-sm leading-6 text-muted">Use your profile as a starting point, then tune this practice round.</p>
          <label className="mt-5 block text-sm text-muted">What do you want to practice?<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} className={inputClass} /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-muted">Target role<select value={targetRole} onChange={(event) => setTargetRole(event.target.value)} className={inputClass}><option value="">Any role</option>{meta.roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
            <label className="text-sm text-muted">Language<select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} className={inputClass}><option value="">Any language</option>{meta.languages.map((language) => <option key={language} value={language}>{language}</option>)}</select></label>
            <label className="text-sm text-muted">Min. experience<input value={minYearsOfExperience} onChange={(event) => setMinYearsOfExperience(event.target.value)} type="number" min="0" max="50" placeholder="Any" className={inputClass} /></label>
            <label className="text-sm text-muted">Max. experience<input value={maxYearsOfExperience} onChange={(event) => setMaxYearsOfExperience(event.target.value)} type="number" min="0" max="50" placeholder="Any" className={inputClass} /></label>
          </div>
          {meta.skills.length ? <fieldset className="mt-5"><legend className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Skills</legend><div className="mt-3 flex flex-wrap gap-2">{chips("skills", meta.skills, skills)}</div></fieldset> : null}
          {meta.interviewTopics.length ? <fieldset className="mt-5"><legend className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Interview topics</legend><div className="mt-3 flex flex-wrap gap-2">{chips("interviewTopics", meta.interviewTopics, interviewTopics)}</div></fieldset> : null}
          <button type="submit" disabled={isSearching || prompt.trim().length < 5} className="interactive-button mt-6 w-full rounded-[14px] bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60">{isSearching ? "Finding partners..." : "Find partners"}</button>
        </form>
        <section aria-live="polite">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-300">Partner pool</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-text">{candidates === null ? "Start with your preferences" : `${candidates.length} potential partners`}</h1></div><a href="/requests" className="rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-orange-100 transition hover:bg-white/[0.08]">View requests</a></div>
          {error ? <p className="mt-6 rounded-[18px] bg-[#25120c] px-4 py-4 text-sm text-orange-100">{error}</p> : null}
          {candidates === null ? <div className="mt-6 rounded-[22px] bg-white/[0.035] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"><p className="text-lg font-semibold tracking-[-0.04em] text-text">Your profile is ready to guide the first search.</p><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Choose a focus, then search people who are discoverable and aligned with your role, language, skills, and topics.</p></div> : candidates.length === 0 ? <div className="mt-6 rounded-[22px] bg-white/[0.035] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"><p className="text-lg font-semibold tracking-[-0.04em] text-text">No partners fit these filters yet.</p><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Try removing a role, language, or experience restriction.</p></div> : <div className="mt-6 grid gap-4 2xl:grid-cols-2">{candidates.map((candidate) => <article key={candidate.id} className="rounded-[22px] bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3">{candidate.avatarUrl ? <img src={candidate.avatarUrl} alt="" className="h-11 w-11 rounded-[15px] object-cover" /> : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#28170c] text-sm font-semibold text-orange-200">{initialsFor(candidate.name)}</div>}<div><h2 className="text-base font-semibold tracking-[-0.03em] text-text">{candidate.name}</h2><p className="mt-1 text-xs text-muted">{candidate.targetRole ?? "Interview practice partner"}</p></div></div><div className="rounded-[14px] bg-[#1c130d] px-3 py-2 text-right"><p className="text-[10px] uppercase tracking-[0.14em] text-orange-300">Match</p><p className="mt-0.5 text-sm font-semibold text-orange-100">{candidate.matchScore} pts</p></div></div><div className="mt-5 rounded-[16px] bg-black/20 px-4 py-3"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Why they surfaced</p><div className="mt-2 flex flex-wrap gap-2">{(candidate.matchReasons ?? []).length ? (candidate.matchReasons ?? []).map((reason) => <span key={reason} className="rounded-[10px] bg-white/[0.045] px-2.5 py-1 text-xs text-orange-100">{reason}</span>) : <span className="text-xs text-muted">Fits your selected filters and is open to discovery.</span>}</div></div><div className="mt-4 flex flex-wrap gap-2">{(candidate.skills ?? []).slice(0, 4).map((skill) => <span key={skill} className="rounded-[10px] bg-white/[0.035] px-2.5 py-1 text-xs text-muted">{skill}</span>)}</div><button type="button" disabled={requestedCandidateIds.includes(candidate.id)} onClick={() => { setSelectedCandidate(candidate); setRequestError(null); }} className="interactive-button mt-5 w-full rounded-[14px] bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-white/[0.045] disabled:text-muted">{requestedCandidateIds.includes(candidate.id) ? "Request sent" : "Send request"}</button></article>)}</div>}
        </section>
      </div>
      {selectedCandidate ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"><div className="w-full max-w-lg rounded-[22px] bg-[#0f0d0b] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.5)] ring-1 ring-white/8"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-300">Match request</p><h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-text">Invite {selectedCandidate.name}</h2><p className="mt-2 text-sm leading-6 text-muted">Add a short practice goal so the request has context. They can accept or decline before any private match is created.</p><textarea value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} rows={4} maxLength={500} placeholder="Example: Want to practice React system design and trade interviewer/candidate roles." className={inputClass} />{requestError ? <p className="mt-3 text-sm text-orange-200">{requestError}</p> : null}<div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setSelectedCandidate(null)} className="rounded-[14px] bg-white/[0.05] px-4 py-3 text-sm font-medium text-muted hover:text-text">Cancel</button><button type="button" onClick={() => void sendRequest()} disabled={isSending} className="interactive-button rounded-[14px] bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-60">{isSending ? "Sending..." : "Send request"}</button></div></div></div> : null}
    </AppShell>
  );
}

export default function DiscoverPage() { return <AuthGate mode="dashboard">{(user) => <DiscoverWorkspace user={user} />}</AuthGate>; }


