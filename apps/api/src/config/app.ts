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

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong on the server.",
      },
    });
  });

  return app;
};
