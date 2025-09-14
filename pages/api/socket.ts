import type { NextApiRequest, NextApiResponse } from "next";
import { initSocket, type NextApiResponseWithSocket } from "@/lib/socket";
import connectDB from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse & NextApiResponseWithSocket
) {
  try {
    await connectDB();
    initSocket(req, res as NextApiResponseWithSocket);
    res.status(200).send("Socket initialized");
  } catch (error) {
    console.error("Socket initialization error:", error);
    res.status(500).send("Socket initialization failed");
  }
}
