import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/db"
import User from "@/lib/models/user.model"
import FriendRequest, { FriendRequestStatus } from "@/lib/models/friend-request.model"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const requestId = params.requestId
    const { action } = await req.json()

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action (accept or reject) is required" },
        { status: 400 }
      )
    }

    await connectDB()

    // Find the friend request
    const friendRequest = await FriendRequest.findById(requestId)

    if (!friendRequest) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      )
    }

    // Ensure the request is addressed to the current user
    if (friendRequest.recipient.toString() !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to respond to this request" },
        { status: 403 }
      )
    }

    if (friendRequest.status !== FriendRequestStatus.PENDING) {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      )
    }

    if (action === "accept") {
      // Update the request status
      friendRequest.status = FriendRequestStatus.ACCEPTED
      await friendRequest.save()

      // Add both users to each other's friends list
      await User.findByIdAndUpdate(
        friendRequest.sender,
        { $addToSet: { friends: friendRequest.recipient } }
      )

      await User.findByIdAndUpdate(
        friendRequest.recipient,
        { $addToSet: { friends: friendRequest.sender } }
      )

      return NextResponse.json({
        message: "Friend request accepted",
        status: FriendRequestStatus.ACCEPTED
      })
    } else {
      // Reject the request
      friendRequest.status = FriendRequestStatus.REJECTED
      await friendRequest.save()

      return NextResponse.json({
        message: "Friend request rejected",
        status: FriendRequestStatus.REJECTED
      })
    }
  } catch (error: any) {
    console.error("Error processing friend request:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process friend request" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const requestId = params.requestId

    await connectDB()

    // Find the friend request
    const friendRequest = await FriendRequest.findById(requestId)

    if (!friendRequest) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      )
    }

    // Ensure the request was sent by the current user
    if (friendRequest.sender.toString() !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to cancel this request" },
        { status: 403 }
      )
    }

    if (friendRequest.status !== FriendRequestStatus.PENDING) {
      return NextResponse.json(
        { error: "This request has already been processed and cannot be canceled" },
        { status: 400 }
      )
    }

    // Delete the request
    await FriendRequest.findByIdAndDelete(requestId)

    return NextResponse.json({
      message: "Friend request canceled successfully"
    })
  } catch (error: any) {
    console.error("Error canceling friend request:", error)
    return NextResponse.json(
      { error: error.message || "Failed to cancel friend request" },
      { status: 500 }
    )
  }
}
