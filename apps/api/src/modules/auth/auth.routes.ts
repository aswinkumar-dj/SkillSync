import { Router } from "express";

import { sendOk } from "../../lib/http";

export const authRouter = Router();

authRouter.get("/me", (_req, res) => {
  sendOk(res, {
    user: null,
    authenticated: false,
    message: "Authentication flow will be implemented in the next slice.",
  });
});

