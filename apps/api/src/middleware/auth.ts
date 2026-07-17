import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { getCookie } from "../lib/request";
import { verifySessionToken } from "../lib/session";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getCookie(req, env.SESSION_COOKIE_NAME);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Sign in is required." },
      });
    }

    const session = verifySessionToken(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_SESSION", message: "Your session is no longer valid." },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({
        success: false,
        error: { code: "USER_UNAVAILABLE", message: "Your account is unavailable." },
      });
    }

    req.authUser = { id: user.id, email: user.email, name: user.name };
    return next();
  } catch (error) {
    return next(error);
  }
};
