import { Router } from "express";

import { authRouter } from "./auth/auth.routes";
import { chatRouter } from "./chat/chat.routes";
import { matchRequestsRouter } from "./match-requests/match-requests.routes";
import { matchesRouter } from "./matches/matches.routes";
import { matchingRouter } from "./matching/matching.routes";
import { metaRouter } from "./meta/meta.routes";
import { notificationsRouter } from "./notifications/notifications.routes";
import { usersRouter } from "./users/users.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/meta", metaRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/matches", matchingRouter);
apiRouter.use("/matches", matchesRouter);
apiRouter.use("/match-requests", matchRequestsRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/notifications", notificationsRouter);
