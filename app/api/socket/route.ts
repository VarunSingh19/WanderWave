import type { NextRequest } from "next/server"
import { initSocket, type NextApiResponseWithSocket } from "@/lib/socket"
import connectDB from "@/lib/db"

export async function GET(req: NextRequest, res: NextApiResponseWithSocket) {
  try {
    await connectDB()
    const io = initSocket(req as any, res)

    return new Response("Socket initialized", { status: 200 })
  } catch (error) {
    console.error("Socket initialization error:", error)
    return new Response("Socket initialization failed", { status: 500 })
  }
}

