"use client";

import { type ReactNode, useEffect, useState } from "react";

import { apiBaseUrl, apiFetch, ApiError } from "../../lib/api";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  yearsOfExperience?: number | null;
  targetRole?: string | null;
  preferredLanguage?: string | null;
  timezone?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  isProfileComplete: boolean;
  isDiscoverable: boolean;
  skills: string[];
  techStack: string[];
  interviewTopics: string[];
  availability: Array<{ dayOfWeek: number; startMinute: number; endMinute: number; isActive: boolean }>;
};

type AuthResponse = {
  success: true;
  data: {
    user: AuthUser;
    authenticated: boolean;
  };
};

type AuthGateProps = {
  children: (user: AuthUser) => ReactNode;
  mode: "dashboard" | "onboarding";
};

type AuthGateState = {
  loading: boolean;
  user: AuthUser | null;
  error: string | null;
  requiresAuth: boolean;
};

const signInUrl = `${apiBaseUrl}/api/v1/auth/google`;

export function AuthGate({ children, mode }: AuthGateProps) {
  const [state, setState] = useState<AuthGateState>({
    loading: true,
    user: null,
    error: null,
    requiresAuth: false,
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    const redirectTo = (path: string) => {
      window.location.href = path;
    };

    const load = async () => {
      try {
        const response = await apiFetch<AuthResponse>("/api/v1/auth/me", {
          signal: controller.signal,
        });

        if (cancelled) {
          return;
        }

        const user = response.data.user;

        if (mode === "dashboard" && !user.isProfileComplete) {
          redirectTo("/onboarding");
          return;
        }

        if (mode === "onboarding" && user.isProfileComplete && window.location.pathname === "/onboarding") {
          redirectTo("/dashboard");
          return;
        }

        setState({ loading: false, user, error: null, requiresAuth: false });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          setState({ loading: false, user: null, error: null, requiresAuth: true });
          return;
        }

        const message =
          error instanceof DOMException && error.name === "AbortError"
            ? "Session check timed out. Continue with Google to reload your account."
            : error instanceof Error
              ? error.message
              : "Unable to load your account.";

        setState({
          loading: false,
          user: null,
          error: message,
          requiresAuth: true,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    void load();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [mode]);

  if (state.loading) {
    return <div className="px-6 py-16 text-sm text-muted">Loading your workspace...</div>;
  }

  if (state.requiresAuth) {
    return (
      <div className="px-6 py-16">
        <div className="max-w-xl rounded-[24px] bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300">Sign in required</p>
          <h1 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-text">Continue with Google to open your workspace.</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {state.error ?? "Your session is missing or expired, so we could not open this page yet."}
          </p>
          <a
            href={signInUrl}
            className="interactive-button mt-6 inline-flex rounded-[16px] bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
          >
            Continue with Google
          </a>
        </div>
      </div>
    );
  }

  if (state.error || !state.user) {
    return <div className="px-6 py-16 text-sm text-orange-200">{state.error ?? "Unable to load your account."}</div>;
  }

  return <>{children(state.user)}</>;
}

export type { AuthUser };
