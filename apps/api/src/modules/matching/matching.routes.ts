import { Router } from "express";

import { matchSearchSchema } from "@skillsync/shared";

import { sendOk } from "../../lib/http";

export const matchingRouter = Router();

matchingRouter.post("/search", (req, res, next) => {
  const parsed = matchSearchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_MATCH_SEARCH",
        details: parsed.error.flatten(),
      },
    });
  }

  return sendOk(res, {
    query: parsed.data,
    candidates: [],
    message: "Deterministic filtering and AI ranking will be implemented next.",
  });
});

