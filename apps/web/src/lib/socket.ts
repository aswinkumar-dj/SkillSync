"use client";

import { io, type Socket } from "socket.io-client";

import { apiBaseUrl } from "./api";

let socket: Socket | null = null;

export const getSocket = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!socket) {
    socket = io(apiBaseUrl, {
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
