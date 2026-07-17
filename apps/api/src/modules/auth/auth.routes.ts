import { randomUUID } from "node:crypto";

import { Router } from "express";

import { env } from "../../config/env";
import {
  clearOAuthStateCookie,
  clearSessionCookie,
  setOAuthStateCookie,
  setSessionCookie,
} from "../../lib/cookies";
import { sendOk } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { getCookie } from "../../lib/request";
import { createSessionToken } from "../../lib/session";
import { requireAuth } from "../../middleware/auth";

const googleAuthBaseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleUserInfoUrl = "https://openidconnect.googleapis.com/v1/userinfo";

const createProfileInclude = () => ({
  skills: { include: { skill: true } },
  techStackItems: { include: { techStackItem: true } },
  interviewTopics: { include: { interviewTopic: true } },
  availabilitySlots: { orderBy: [{ dayOfWeek: "asc" as const }, { startMinute: "asc" as const }] },
});

type UserWithProfile = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  targetRole: string | null;
  preferredLanguage: string | null;
  timezone: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  isProfileComplete: boolean;
  isDiscoverable: boolean;
  skills: Array<{ skill: { name: string } }>;
  techStackItems: Array<{ techStackItem: { name: string } }>;
  interviewTopics: Array<{ interviewTopic: { name: string } }>;
  availabilitySlots: Array<{ dayOfWeek: number; startMinute: number; endMinute: number; isActive: boolean }>;
};

const serializeUser = (user: UserWithProfile) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  yearsOfExperience: user.yearsOfExperience,
  targetRole: user.targetRole,
  preferredLanguage: user.preferredLanguage,
  timezone: user.timezone,
  githubUrl: user.githubUrl,
  linkedinUrl: user.linkedinUrl,
  isProfileComplete: user.isProfileComplete,
  isDiscoverable: user.isDiscoverable,
  skills: user.skills.map((item) => item.skill.name),
  techStack: user.techStackItems.map((item) => item.techStackItem.name),
  interviewTopics: user.interviewTopics.map((item) => item.interviewTopic.name),
  availability: user.availabilitySlots,
});

export const authRouter = Router();

authRouter.get("/google", (_req, res) => {
  const state = randomUUID();
  setOAuthStateCookie(res, state);

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  res.redirect(`${googleAuthBaseUrl}?${params.toString()}`);
});

authRouter.get("/google/callback", async (req, res, next) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const savedState = getCookie(req, `${env.SESSION_COOKIE_NAME}_oauth_state`);

    if (!code || !state || !savedState || state !== savedState) {
      clearOAuthStateCookie(res);
      return res.redirect(`${env.NEXT_PUBLIC_APP_URL}/?error=oauth_state`);
    }

    const tokenResponse = await fetch(googleTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      clearOAuthStateCookie(res);
      return res.redirect(`${env.NEXT_PUBLIC_APP_URL}/?error=oauth_token_exchange`);
    }

    const tokenPayload = (await tokenResponse.json()) as { access_token?: string };

    if (!tokenPayload.access_token) {
      clearOAuthStateCookie(res);
      return res.redirect(`${env.NEXT_PUBLIC_APP_URL}/?error=oauth_missing_access_token`);
    }

    const userInfoResponse = await fetch(googleUserInfoUrl, {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    });

    if (!userInfoResponse.ok) {
      clearOAuthStateCookie(res);
      return res.redirect(`${env.NEXT_PUBLIC_APP_URL}/?error=oauth_userinfo`);
    }

    const googleUser = (await userInfoResponse.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!googleUser.sub || !googleUser.email || !googleUser.name) {
      clearOAuthStateCookie(res);
      return res.redirect(`${env.NEXT_PUBLIC_APP_URL}/?error=oauth_profile`);
    }

    const user = (await prisma.user.upsert({
      where: { email: googleUser.email },
      update: {
        googleId: googleUser.sub,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        lastActiveAt: new Date(),
      },
      create: {
        googleId: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        lastActiveAt: new Date(),
      },
      include: createProfileInclude(),
    })) as unknown as UserWithProfile;

    const sessionToken = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    clearOAuthStateCookie(res);
    setSessionCookie(res, sessionToken);

    const destination = user.isProfileComplete ? "/dashboard" : "/onboarding";
    return res.redirect(`${env.NEXT_PUBLIC_APP_URL}${destination}`);
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = (await prisma.user.findUniqueOrThrow({
      where: { id: req.authUser!.id },
      include: createProfileInclude(),
    })) as unknown as UserWithProfile;

    return sendOk(res, {
      user: serializeUser(user),
      authenticated: true,
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  sendOk(res, { authenticated: false });
});

