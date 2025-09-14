import type { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { NextApiRequest } from "next";
import type { NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const initSocket = (
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server);

    // Authenticate using cookies from the socket handshake
    io.use(async (socket, next) => {
      try {
        const user = await getToken({
          // Use the cookies already present on the initial socket request
          req: { headers: socket.request.headers } as any,
        });

        if (!user || !user.id) {
          return next(new Error("Authentication error"));
        }

        socket.data.user = { id: user.id, name: (user as any).name };
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });

    io.on("connection", (socket) => {
      const user = socket.data.user as
        | { id: string; name?: string }
        | undefined;
      console.log("Socket connected:", socket.id, "user:", user?.id);

      // Join a personal room for direct emits
      if (user?.id) {
        socket.join(`user:${user.id}`);
      }

      // --- Trip chat (existing) ---
      socket.on("join-trip", (tripId) => {
        socket.join(`trip:${tripId}`);
        console.log(`Socket ${socket.id} joined trip:${tripId}`);
      });

      socket.on("leave-trip", (tripId) => {
        socket.leave(`trip:${tripId}`);
        console.log(`Socket ${socket.id} left trip:${tripId}`);
      });

      socket.on("send-message", async (data) => {
        const { tripId, content } = data;
        const authUser = socket.data.user as { id: string } | undefined;

        if (!authUser || !tripId || !content) {
          return;
        }

        try {
          // Save message to database (implementation in route handler)

          // Broadcast to all members in the trip
          io.to(`trip:${tripId}`).emit("new-message", {
            tripId,
            content,
            sender: authUser.id,
            createdAt: new Date(),
          });
        } catch (error) {
          console.error("Error sending message:", error);
        }
      });

      // --- 1:1 and Group Call Signaling ---
      const emitToUser = (userId: string, event: string, payload: any) => {
        io.to(`user:${userId}`).emit(event, payload);
      };

      // Start a call and invite participants
      // payload: { roomId: string; participants: string[]; media: "audio" | "video" }
      socket.on(
        "call:initiate",
        (payload: {
          roomId: string;
          participants: string[];
          media: "audio" | "video";
        }) => {
          const authUser = socket.data.user as { id: string } | undefined;
          if (!authUser) return;

          const { roomId, participants, media } = payload || ({} as any);
          if (
            !roomId ||
            !Array.isArray(participants) ||
            participants.length === 0
          )
            return;

          // Caller joins the call room immediately
          socket.join(`call:${roomId}`);

          // Notify invitees
          participants.forEach((pid) => {
            emitToUser(pid, "call:incoming", {
              roomId,
              from: authUser.id,
              media,
              participants,
            });
          });
        }
      );

      // Join an existing call room
      // payload: { roomId: string }
      socket.on("call:join", ({ roomId }: { roomId: string }) => {
        const authUser = socket.data.user as { id: string } | undefined;
        if (!authUser || !roomId) return;
        socket.join(`call:${roomId}`);
        socket
          .to(`call:${roomId}`)
          .emit("call:user-joined", { userId: authUser.id });
      });

      // Leave a call room
      socket.on("call:leave", ({ roomId }: { roomId: string }) => {
        const authUser = socket.data.user as { id: string } | undefined;
        if (!authUser || !roomId) return;
        socket.leave(`call:${roomId}`);
        socket
          .to(`call:${roomId}`)
          .emit("call:user-left", { userId: authUser.id });
      });

      // End call for everyone in the room (only by caller/host ideally; keep open for now)
      socket.on("call:end", ({ roomId }: { roomId: string }) => {
        if (!roomId) return;
        io.to(`call:${roomId}`).emit("call:ended", { roomId });
      });

      // WebRTC signaling (targeted per user)
      // offer/answer/candidates are routed to a specific userId
      socket.on(
        "webrtc:offer",
        (payload: { roomId: string; toUserId: string; sdp: any }) => {
          const authUser = socket.data.user as { id: string } | undefined;
          if (!authUser) return;
          const { roomId, toUserId, sdp } = payload || ({} as any);
          if (!roomId || !toUserId || !sdp) return;
          emitToUser(toUserId, "webrtc:offer", {
            roomId,
            fromUserId: authUser.id,
            sdp,
          });
        }
      );

      socket.on(
        "webrtc:answer",
        (payload: { roomId: string; toUserId: string; sdp: any }) => {
          const authUser = socket.data.user as { id: string } | undefined;
          if (!authUser) return;
          const { roomId, toUserId, sdp } = payload || ({} as any);
          if (!roomId || !toUserId || !sdp) return;
          emitToUser(toUserId, "webrtc:answer", {
            roomId,
            fromUserId: authUser.id,
            sdp,
          });
        }
      );

      socket.on(
        "webrtc:ice",
        (payload: { roomId: string; toUserId: string; candidate: any }) => {
          const authUser = socket.data.user as { id: string } | undefined;
          if (!authUser) return;
          const { roomId, toUserId, candidate } = payload || ({} as any);
          if (!roomId || !toUserId || !candidate) return;
          emitToUser(toUserId, "webrtc:ice", {
            roomId,
            fromUserId: authUser.id,
            candidate,
          });
        }
      );

      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  }

  return res.socket.server.io;
};
