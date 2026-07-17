import type { Response } from "express";

import { env } from "../config/env";

const sharedCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
};

export const setSessionCookie = (res: Response, token: string) => {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    ...sharedCookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 14,
  });
};

export const clearSessionCookie = (res: Response) => {
  res.clearCookie(env.SESSION_COOKIE_NAME, sharedCookieOptions);
};

export const setOAuthStateCookie = (res: Response, state: string) => {
  res.cookie(`${env.SESSION_COOKIE_NAME}_oauth_state`, state, {
    ...sharedCookieOptions,
    maxAge: 1000 * 60 * 10,
  });
};

export const clearOAuthStateCookie = (res: Response) => {
  res.clearCookie(`${env.SESSION_COOKIE_NAME}_oauth_state`, sharedCookieOptions);
};
