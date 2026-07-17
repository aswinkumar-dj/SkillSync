import cors from "cors";
import express from "express";
import helmet from "helmet";

import { apiRouter } from "../modules";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "skillsync-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/v1", apiRouter);

  return app;
};

