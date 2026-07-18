"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiBaseUrl } from "../../lib/api";
import { AppShellSkeleton } from "../ui/page-skeletons";
import { useAuth, type AuthUser } from "./auth-provider";

type AuthGateProps = {
  children: (user: AuthUser) => ReactNode;
  mode: "dashboard" | "onboarding";
};

const signInUrl = `${apiBaseUrl}/api/v1/auth/google`;

export function AuthGate({ children, mode }: AuthGateProps) {
  const { user, status, error } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      return;
    }

    if (mode === "dashboard" && !user.isProfileComplete) {
      router.replace("/onboarding");
      return;
    }

    if (mode === "onboarding" && user.isProfileComplete && pathname === "/onboarding") {
      router.replace("/dashboard");
    }
  }, [user, mode, pathname, router]);

  // Instant paint from cached session on client navigations.
  if (status === "loading" && !user) {
    return (
      <AppShellSkeleton
        title="Opening your workspace"
        subtitle="Checking your session and loading this view."
      />
    );
  }

  if (status === "unauthenticated" || !user) {
    return (
      <div className="px-6 py-16">
        <div className="max-w-xl rounded-[24px] bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300">
            Sign in required
          </p>
          <h1 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-text">
            Continue with Google to open your workspace.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {error ?? "Your session is missing or expired, so we could not open this page yet."}
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

  if (mode === "dashboard" && !user.isProfileComplete) {
    return (
      <AppShellSkeleton
        title="Finishing setup"
        subtitle="Your profile still needs a few fields before the workspace opens."
      />
    );
  }

  if (mode === "onboarding" && user.isProfileComplete && pathname === "/onboarding") {
    return (
      <AppShellSkeleton
        title="Heading to dashboard"
        subtitle="Profile looks complete. Opening your practice workspace."
      />
    );
  }

  return <>{children(user)}</>;
}

export type { AuthUser };
