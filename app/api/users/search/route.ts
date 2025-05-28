import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/user.model";
import FriendRequest, {
  FriendRequestStatus,
} from "@/lib/models/friend-request.model";

// GET endpoint to search for users
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    await connectDB();

    // Get current user to check existing friends
    const currentUser = await User.findById(userId).select("friends");
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get existing friend requests to exclude them from search
    const existingRequests = await FriendRequest.find({
      $or: [
        { sender: userId, status: FriendRequestStatus.PENDING },
        { recipient: userId, status: FriendRequestStatus.PENDING },
      ],
    }).select("sender recipient");

    const excludedUserIds = new Set([
      userId, // Exclude self
      ...currentUser.friends.map((id: any) => id.toString()), // Exclude existing friends
      ...existingRequests.flatMap((req: any) => [
        req.sender.toString(),
        req.recipient.toString(),
      ]),
    ]);

    let searchConditions = {
      _id: { $nin: Array.from(excludedUserIds) },
    };

    // If query is provided, add search conditions
    if (query.trim()) {
      searchConditions = {
        ...searchConditions,
        $or: [
          { name: { $regex: query, $options: "i" } },
          { username: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      } as any;
    }

    // Search for users
    const users = await User.find(searchConditions)
      .select("name email username profileImage")
      .limit(20) // Limit results for performance
      .sort({ name: 1 });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search users" },
      { status: 500 }
    );
  }
}
