import { Router } from "express";

import { sendOk } from "../../lib/http";

export const usersRouter = Router();

usersRouter.get("/me", (_req, res) => {
  sendOk(res, {
    profile: null,
    message: "User profile endpoints are scaffolded and ready for implementation.",
  });
});

