"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let initializing = false;

async function ensureServerInitialized() {
  // Hit the API route to ensure the server attaches Socket.IO
  try {
    await fetch("/api/socket-io");
  } catch (e) {
    // ignore; server may already be initialized
  }
}

export async function getSocket(): Promise<Socket> {
  if (socket) return socket;
  if (initializing) {
    // wait until existing init finishes
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getSocket();
  }

  initializing = true;
  await ensureServerInitialized();

  socket = io({
    // default path /socket.io
    withCredentials: true,
    transports: ["websocket"],
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connect_error:", err);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  initializing = false;
  return socket;
}
