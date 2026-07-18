"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiError, apiFetch } from "../../lib/api";
import { disconnectSocket } from "../../lib/socket";

export type AuthUser = {
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
  availability: Array<{
    dayOfWeek: number;
    startMinute: number;
    endMinute: number;
    isActive: boolean;
  }>;
};

type AuthResponse = {
  success: true;
  data: {
    user: AuthUser;
    authenticated: boolean;
  };
};

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  refresh: (options?: { force?: boolean }) => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
  clear: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Module-level session cache so client navigations do not re-block on /auth/me. */
let memoryUser: AuthUser | null | undefined = undefined;
let memoryError: string | null = null;
let memoryFetchedAt = 0;
let memoryPromise: Promise<AuthUser | null> | null = null;

const SESSION_FRESH_MS = 45_000;

const initialStatus = (): AuthStatus => {
  if (memoryUser === undefined) {
    return "loading";
  }

  return memoryUser ? "authenticated" : "unauthenticated";
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() =>
    memoryUser === undefined ? null : memoryUser,
  );
  const [status, setStatus] = useState<AuthStatus>(initialStatus);
  const [error, setError] = useState<string | null>(memoryError);

  const setUser = useCallback((next: AuthUser | null) => {
    memoryUser = next;
    memoryFetchedAt = Date.now();
    memoryError = null;
    setUserState(next);
    setStatus(next ? "authenticated" : "unauthenticated");
    setError(null);
  }, []);

  const clear = useCallback(() => {
    memoryUser = null;
    memoryFetchedAt = Date.now();
    memoryError = null;
    memoryPromise = null;
    disconnectSocket();
    setUserState(null);
    setStatus("unauthenticated");
    setError(null);
  }, []);

  const refresh = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    const now = Date.now();

    if (
      !force &&
      memoryUser !== undefined &&
      now - memoryFetchedAt < SESSION_FRESH_MS
    ) {
      setUserState(memoryUser);
      setStatus(memoryUser ? "authenticated" : "unauthenticated");
      setError(memoryError);
      return memoryUser;
    }

    if (memoryPromise && !force) {
      return memoryPromise;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    // Keep previous user visible while revalidating so route changes stay snappy.
    if (memoryUser === undefined) {
      setStatus("loading");
    }

    memoryPromise = (async () => {
      try {
        const response = await apiFetch<AuthResponse>("/api/v1/auth/me", {
          signal: controller.signal,
        });
        const next = response.data.user;
        memoryUser = next;
        memoryFetchedAt = Date.now();
        memoryError = null;
        setUserState(next);
        setStatus("authenticated");
        setError(null);
        return next;
      } catch (loadError) {
        if (loadError instanceof ApiError && loadError.status === 401) {
          memoryUser = null;
          memoryFetchedAt = Date.now();
          memoryError = null;
          setUserState(null);
          setStatus("unauthenticated");
          setError(null);
          return null;
        }

        const message =
          loadError instanceof DOMException && loadError.name === "AbortError"
            ? "Session check timed out. Continue with Google to reload your account."
            : loadError instanceof Error
              ? loadError.message
              : "Unable to load your account.";

        // Preserve a previously authenticated user on transient failures.
        if (memoryUser) {
          memoryError = null;
          setUserState(memoryUser);
          setStatus("authenticated");
          setError(null);
          return memoryUser;
        }

        memoryUser = null;
        memoryFetchedAt = Date.now();
        memoryError = message;
        setUserState(null);
        setStatus("unauthenticated");
        setError(message);
        return null;
      } finally {
        window.clearTimeout(timeoutId);
        memoryPromise = null;
      }
    })();

    return memoryPromise;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      refresh,
      setUser,
      clear,
    }),
    [user, status, error, refresh, setUser, clear],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
