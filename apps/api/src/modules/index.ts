import { Router } from "express";

import { authRouter } from "./auth/auth.routes";
import { matchingRouter } from "./matching/matching.routes";
import { usersRouter } from "./users/users.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/matches", matchingRouter);

