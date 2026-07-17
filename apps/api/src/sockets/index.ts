import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

export const createSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.emit("presence:update", {
      userId: null,
      status: "connected",
    });

    socket.on("chat:join", (payload) => {
      if (typeof payload?.roomId === "string") {
        socket.join(`chat:${payload.roomId}`);
      }
    });

    socket.on("session:join", (payload) => {
      if (typeof payload?.sessionId === "string") {
        socket.join(`session:${payload.sessionId}`);
      }
    });
  });

  return io;
};

