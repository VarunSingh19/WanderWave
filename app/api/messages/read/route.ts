import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import PrivateMessage from "@/lib/models/private-message.model";

// POST endpoint to mark messages as read
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { friendId } = await req.json();

    if (!friendId) {
      return NextResponse.json(
        { error: "Friend ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Mark all unread messages from this friend as read
    const result = await PrivateMessage.updateMany(
      {
        sender: friendId,
        recipient: userId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    return NextResponse.json({
      message: "Messages marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
