"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { userProfileSchema } from "@skillsync/shared";

import { AppShell } from "../../components/app-shell/app-shell";
import { AuthGate, type AuthUser } from "../../components/auth/auth-gate";
import { useAuth } from "../../components/auth/auth-provider";
import { ApiError, apiFetch } from "../../lib/api";

type SaveProfileResponse = {
  success: true;
  data: {
    profile: AuthUser;
    message: string;
  };
};

type ProfileField =
  | "name"
  | "bio"
  | "yearsOfExperience"
  | "targetRole"
  | "preferredLanguage"
  | "timezone"
  | "githubUrl"
  | "linkedinUrl"
  | "techStack"
  | "skills"
  | "interviewTopics"
  | "availability";

type FieldErrors = Partial<Record<ProfileField, string>>;

const defaultAvailability = [
  { dayOfWeek: 1, startMinute: 1140, endMinute: 1260, isActive: true },
  { dayOfWeek: 3, startMinute: 1140, endMinute: 1260, isActive: true },
  { dayOfWeek: 5, startMinute: 1140, endMinute: 1260, isActive: true },
];

const fieldLabels: Record<ProfileField, string> = {
  name: "Name",
  bio: "Short bio",
  yearsOfExperience: "Years of experience",
  targetRole: "Target role",
  preferredLanguage: "Preferred language",
  timezone: "Timezone",
  githubUrl: "GitHub URL",
  linkedinUrl: "LinkedIn URL",
  techStack: "Tech stack",
  skills: "Skills",
  interviewTopics: "Interview topics",
  availability: "Availability",
};

function OnboardingForm({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    name: user.name ?? "",
    bio: user.bio ?? "",
    yearsOfExperience: user.yearsOfExperience?.toString() ?? "",
    targetRole: user.targetRole ?? "",
    preferredLanguage: user.preferredLanguage ?? "English",
    timezone: user.timezone ?? "Asia/Calcutta",
    githubUrl: user.githubUrl ?? "",
    linkedinUrl: user.linkedinUrl ?? "",
    techStack: user.techStack.join(", "),
    skills: user.skills.join(", "),
    interviewTopics: user.interviewTopics.join(", "),
    isDiscoverable: user.isDiscoverable,
  });

  const availability = useMemo(
    () => (user.availability.length ? user.availability : defaultAvailability),
    [user.availability],
  );

  const updateField = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const toOptionalString = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  };

  const buildPayload = () => {
    const yearsOfExperience = form.yearsOfExperience.trim() === "" ? undefined : Number(form.yearsOfExperience);

    return {
      name: form.name.trim(),
      bio: toOptionalString(form.bio),
      yearsOfExperience,
      targetRole: toOptionalString(form.targetRole),
      preferredLanguage: toOptionalString(form.preferredLanguage),
      timezone: toOptionalString(form.timezone),
      githubUrl: toOptionalString(form.githubUrl),
      linkedinUrl: toOptionalString(form.linkedinUrl),
      techStack: form.techStack.split(",").map((item) => item.trim()).filter(Boolean),
      skills: form.skills.split(",").map((item) => item.trim()).filter(Boolean),
      interviewTopics: form.interviewTopics.split(",").map((item) => item.trim()).filter(Boolean),
      availability,
      isDiscoverable: form.isDiscoverable,
    };
  };

  const mapValidationErrors = (payload: unknown): FieldErrors => {
    if (!payload || typeof payload !== "object") {
      return {};
    }

    const maybeError = payload as {
      error?: {
        details?: {
          fieldErrors?: Record<string, string[] | undefined>;
        };
      };
    };

    const serverFieldErrors = maybeError.error?.details?.fieldErrors ?? {};
    const nextErrors: FieldErrors = {};

    for (const [field, messages] of Object.entries(serverFieldErrors)) {
      if (messages && messages.length > 0) {
        nextErrors[field as ProfileField] = messages[0];
      }
    }

    return nextErrors;
  };

  const validateForm = () => {
    const payload = buildPayload();
    const parsed = userProfileSchema.safeParse(payload);

    if (parsed.success) {
      setFieldErrors({});
      return payload;
    }

    const flattened = parsed.error.flatten().fieldErrors;
    const nextErrors: FieldErrors = {};

    for (const [field, messages] of Object.entries(flattened)) {
      if (messages && messages.length > 0) {
        nextErrors[field as ProfileField] = messages[0];
      }
    }

    setFieldErrors(nextErrors);
    setError("Please correct the highlighted fields and try again.");
    return null;
  };

  const getInputClassName = (field: ProfileField) =>
    `w-full rounded-[16px] bg-black/20 px-4 py-3 text-sm text-text outline-none ring-1 ${fieldErrors[field] ? "ring-orange-400/70" : "ring-white/5"} focus:ring-orange-500/40`;

  const renderFieldError = (field: ProfileField) =>
    fieldErrors[field] ? <p className="text-xs text-orange-300">{fieldErrors[field]}</p> : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const payload = validateForm();

    if (!payload) {
      setIsSaving(false);
      return;
    }

    try {
      const response = await apiFetch<SaveProfileResponse>("/api/v1/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setFieldErrors({});
      setSuccess(response.data.message);
      setUser(response.data.profile);

      if (response.data.profile.isProfileComplete) {
        router.replace("/dashboard");
      }
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        const nextErrors = mapValidationErrors(submitError.payload);
        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
        }
      }

      setError(submitError instanceof Error ? submitError.message : "Unable to save your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell
      user={user}
      title="Complete your profile"
      subtitle="This profile decides whether you appear in matching. Incomplete profiles stay out of discovery and won't appear in match history."
    >
      <form onSubmit={handleSubmit} className="space-y-5 rounded-[24px] bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-muted">
            <span>{fieldLabels.name}</span>
            <input value={form.name} onChange={(event) => updateField("name", event.target.value)} className={getInputClassName("name")} />
            {renderFieldError("name")}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>{fieldLabels.targetRole}</span>
            <input value={form.targetRole} onChange={(event) => updateField("targetRole", event.target.value)} className={getInputClassName("targetRole")} />
            {renderFieldError("targetRole")}
          </label>
          <label className="space-y-2 text-sm text-muted lg:col-span-2">
            <span>{fieldLabels.bio}</span>
            <textarea value={form.bio} onChange={(event) => updateField("bio", event.target.value)} rows={4} className={getInputClassName("bio")} />
            {renderFieldError("bio")}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>{fieldLabels.yearsOfExperience}</span>
            <input value={form.yearsOfExperience} onChange={(event) => updateField("yearsOfExperience", event.target.value)} type="number" min={0} max={50} className={getInputClassName("yearsOfExperience")} />
            {renderFieldError("yearsOfExperience")}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>{fieldLabels.preferredLanguage}</span>
            <input value={form.preferredLanguage} onChange={(event) => updateField("preferredLanguage", event.target.value)} className={getInputClassName("preferredLanguage")} />
            {renderFieldError("preferredLanguage")}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>{fieldLabels.timezone}</span>
            <input value={form.timezone} onChange={(event) => updateField("timezone", event.target.value)} className={getInputClassName("timezone")} />
            {renderFieldError("timezone")}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>{fieldLabels.githubUrl}</span>
            <input value={form.githubUrl} onChange={(event) => updateField("githubUrl", event.target.value)} className={getInputClassName("githubUrl")} />
            {renderFieldError("githubUrl")}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>{fieldLabels.linkedinUrl}</span>
            <input value={form.linkedinUrl} onChange={(event) => updateField("linkedinUrl", event.target.value)} className={getInputClassName("linkedinUrl")} />
            {renderFieldError("linkedinUrl")}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>{fieldLabels.techStack}</span>
            <input value={form.techStack} onChange={(event) => updateField("techStack", event.target.value)} placeholder="React, Node.js, PostgreSQL" className={getInputClassName("techStack")} />
            {renderFieldError("techStack")}
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>{fieldLabels.skills}</span>
            <input value={form.skills} onChange={(event) => updateField("skills", event.target.value)} placeholder="DSA, System Design, Behavioral" className={getInputClassName("skills")} />
            {renderFieldError("skills")}
          </label>
          <label className="space-y-2 text-sm text-muted lg:col-span-2">
            <span>{fieldLabels.interviewTopics}</span>
            <input value={form.interviewTopics} onChange={(event) => updateField("interviewTopics", event.target.value)} placeholder="Concurrency, React internals, SQL" className={getInputClassName("interviewTopics")} />
            {renderFieldError("interviewTopics")}
          </label>
        </div>

        <div className="rounded-[18px] bg-[#140f0c] px-4 py-4 text-sm text-muted">
          Prime-time availability is currently seeded as Monday, Wednesday, and Friday evenings. We can make this fully editable in the next pass.
        </div>
        {renderFieldError("availability")}

        <label className="flex items-center justify-between gap-4 rounded-[18px] bg-black/20 px-4 py-4 text-sm text-text">
          <span>Appear in discovery once my profile is complete</span>
          <input type="checkbox" checked={form.isDiscoverable} onChange={(event) => updateField("isDiscoverable", event.target.checked)} className="h-4 w-4 accent-orange-500" />
        </label>

        {error ? <p className="text-sm text-orange-200">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

        <button type="submit" disabled={isSaving} className="interactive-button rounded-[16px] bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70">
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </AppShell>
  );
}

export default function OnboardingPage() {
  return <AuthGate mode="onboarding">{(user) => <OnboardingForm user={user} />}</AuthGate>;
}
