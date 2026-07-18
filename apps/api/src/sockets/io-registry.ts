import type { Server } from "socket.io";

let io: Server | null = null;

export const registerIo = (server: Server) => {
  io = server;
};

export const getIo = () => io;

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  io?.to(`user:${userId}`).emit(event, payload);
};

export const emitToChatRoom = (roomId: string, event: string, payload: unknown) => {
  io?.to(`chat:${roomId}`).emit(event, payload);
};
