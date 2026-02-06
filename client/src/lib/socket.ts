import { io, Socket } from "socket.io-client";
import type { ClientEvents, ServerEvents } from "../types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

export const socket: Socket<ServerEvents, ClientEvents> = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

export function connectSocket(): void {
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket(): void {
  if (socket.connected) {
    socket.disconnect();
  }
}
