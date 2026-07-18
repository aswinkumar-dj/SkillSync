import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { verifySessionToken } from "../lib/session";
import { registerIo } from "./io-registry";

type AuthedSocketData = {
  userId: string;
  name: string;
};

const membershipWhere = (userId: string) => ({
  OR: [{ userAId: userId }, { userBId: userId }],
});

const parseCookieHeader = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

export const createSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    },
  });

  registerIo(io);

  io.use(async (socket, next) => {
    try {
      const token =
        parseCookieHeader(socket.handshake.headers.cookie, env.SESSION_COOKIE_NAME) ??
        (typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token : null);

      if (!token) {
        return next(new Error("UNAUTHORIZED"));
      }

      const session = verifySessionToken(token);

      if (!session) {
        return next(new Error("INVALID_SESSION"));
      }

      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, name: true, status: true },
      });

      if (!user || user.status !== "ACTIVE") {
        return next(new Error("USER_UNAVAILABLE"));
      }

      (socket.data as AuthedSocketData).userId = user.id;
      (socket.data as AuthedSocketData).name = user.name;
      return next();
    } catch (error) {
      return next(error instanceof Error ? error : new Error("SOCKET_AUTH_FAILED"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket.data as AuthedSocketData).userId;

    void socket.join(`user:${userId}`);

    socket.emit("presence:update", {
      userId,
      status: "connected",
    });

    socket.on("chat:join", async (payload, ack?: (result: unknown) => void) => {
      try {
        const roomId = typeof payload?.roomId === "string" ? payload.roomId : null;

        if (!roomId) {
          ack?.({ ok: false, error: "ROOM_ID_REQUIRED" });
          return;
        }

        const room = await prisma.chatRoom.findFirst({
          where: {
            id: roomId,
            match: {
              status: "ACTIVE",
              ...membershipWhere(userId),
            },
          },
          select: { id: true },
        });

        if (!room) {
          ack?.({ ok: false, error: "ROOM_NOT_FOUND" });
          return;
        }

        await socket.join(`chat:${room.id}`);
        ack?.({ ok: true, roomId: room.id });
      } catch {
        ack?.({ ok: false, error: "JOIN_FAILED" });
      }
    });

    socket.on("chat:leave", async (payload) => {
      if (typeof payload?.roomId === "string") {
        await socket.leave(`chat:${payload.roomId}`);
      }
    });

    socket.on("session:join", (payload) => {
      if (typeof payload?.sessionId === "string") {
        void socket.join(`session:${payload.sessionId}`);
      }
    });
  });

  return io;
};
