import type { Server, Socket } from "socket.io";
import { verifyToken } from "../lib/tokens";

let io: Server | null = null;

const userRoom = (username: string) => `user:${username}`;
const fileRoom = (username: string, path: string) => `file:${username}:${path}`;

export function notifyTreeChanged(username: string, exceptSocketId?: string) {
  if (!io) return;
  const target = io.to(userRoom(username));
  (exceptSocketId ? target.except(exceptSocketId) : target).emit("tree:changed");
}

/**
 * Realtime collaboration hub. Every tab of a user joins `user:<name>`; the tab with a file
 * open also joins that file's room and relays Monaco change batches to the other members.
 */
export function registerCollaboration(server: Server) {
  io = server;

  server.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const payload = typeof token === "string" ? verifyToken(token, "session") : null;
    if (!payload) return next(new Error("unauthorized"));
    socket.data.username = payload.username;
    next();
  });

  server.on("connection", (socket: Socket) => {
    const username: string = socket.data.username;
    socket.join(userRoom(username));

    socket.on("file:open", ({ path }: { path: string }) => {
      for (const room of socket.rooms) {
        if (room.startsWith(`file:${username}:`)) socket.leave(room);
      }
      if (typeof path === "string" && path) socket.join(fileRoom(username, path));
    });

    socket.on("file:close", () => {
      for (const room of socket.rooms) {
        if (room.startsWith(`file:${username}:`)) socket.leave(room);
      }
    });

    socket.on("doc:changes", ({ path, changes }: { path: string; changes: unknown[] }) => {
      if (typeof path !== "string" || !Array.isArray(changes)) return;
      socket.to(fileRoom(username, path)).emit("doc:changes", { path, changes });
    });

    // Lets other tabs know the file was persisted so they can clear their dirty marker.
    socket.on("doc:saved", ({ path }: { path: string }) => {
      if (typeof path !== "string") return;
      socket.to(fileRoom(username, path)).emit("doc:saved", { path });
    });
  });
}
