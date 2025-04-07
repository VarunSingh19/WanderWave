import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/db"
import User from "@/lib/models/user.model"
import FriendRequest, { FriendRequestStatus } from "@/lib/models/friend-request.model"

// GET endpoint to retrieve friends and friend requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    await connectDB()

    // Get user's friends
    const user = await User.findById(userId).populate("friends", "name email profileImage username")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get pending friend requests (sent by user)
    const sentRequests = await FriendRequest.find({
      sender: userId,
      status: FriendRequestStatus.PENDING
    }).populate("recipient", "name email profileImage username")

    // Get pending friend requests (received by user)
    const receivedRequests = await FriendRequest.find({
      recipient: userId,
      status: FriendRequestStatus.PENDING
    }).populate("sender", "name email profileImage username")

    return NextResponse.json({
      friends: user.friends,
      sentRequests,
      receivedRequests
    })
  } catch (error: any) {
    console.error("Error fetching friends:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch friends" },
      { status: 500 }
    )
  }
}

// POST endpoint to send a friend request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { recipientIdentifier } = await req.json()

    if (!recipientIdentifier) {
      return NextResponse.json(
        { error: "Username or email is required" },
        { status: 400 }
      )
    }

    await connectDB()

    // Find recipient by email or username
    const recipient = await User.findOne({
      $or: [
        { email: recipientIdentifier.toLowerCase() },
        { username: recipientIdentifier.toLowerCase() }
      ]
    })

    if (!recipient) {
      return NextResponse.json(
        { error: "User not found with the provided username or email" },
        { status: 404 }
      )
    }

    // Check if trying to add self
    if (recipient._id.toString() === userId) {
      return NextResponse.json(
        { error: "You cannot send a friend request to yourself" },
        { status: 400 }
      )
    }

    // Check if already friends
    const user = await User.findById(userId)
    if (user?.friends.includes(recipient._id)) {
      return NextResponse.json(
        { error: "You are already friends with this user" },
        { status: 400 }
      )
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: userId, recipient: recipient._id },
        { sender: recipient._id, recipient: userId }
      ]
    })

    if (existingRequest) {
      if (existingRequest.status === FriendRequestStatus.PENDING) {
        return NextResponse.json(
          { error: "A friend request already exists between you and this user" },
          { status: 400 }
        )
      } else if (existingRequest.status === FriendRequestStatus.REJECTED) {
        // If previously rejected, update to pending
        existingRequest.status = FriendRequestStatus.PENDING
        existingRequest.sender = userId
        existingRequest.recipient = recipient._id
        await existingRequest.save()

        return NextResponse.json({
          message: "Friend request sent successfully",
          request: existingRequest
        })
      }
    }

    // Create a new friend request
    const friendRequest = await FriendRequest.create({
      sender: userId,
      recipient: recipient._id,
      status: FriendRequestStatus.PENDING
    })

    return NextResponse.json(
      {
        message: "Friend request sent successfully",
        request: friendRequest
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error sending friend request:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send friend request" },
      { status: 500 }
    )
  }
}
