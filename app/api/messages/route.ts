import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/db"
import User from "@/lib/models/user.model"
import PrivateMessage from "@/lib/models/private-message.model"

// GET endpoint to retrieve conversations with friends
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const url = new URL(req.url)
    const friendId = url.searchParams.get("friendId")

    await connectDB()

    // Validate friend relationship
    if (friendId) {
      const user = await User.findById(userId)
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const isFriend = user.friends.some(friend => friend.toString() === friendId)
      if (!isFriend) {
        return NextResponse.json(
          { error: "You can only message your friends" },
          { status: 403 }
        )
      }

      // Get messages between current user and friend
      const messages = await PrivateMessage.find({
        $or: [
          { sender: userId, recipient: friendId },
          { sender: friendId, recipient: userId }
        ]
      }).sort({ createdAt: 1 })

      // Mark unread messages as read
      await PrivateMessage.updateMany(
        {
          sender: friendId,
          recipient: userId,
          read: false
        },
        { read: true }
      )

      return NextResponse.json({ messages })
    } else {
      // Get conversations summary
      const user = await User.findById(userId).populate("friends", "name email profileImage username")

      if (!user || !user.friends.length) {
        return NextResponse.json({ conversations: [] })
      }

      // For each friend, get the latest message and unread count
      const conversations = await Promise.all(
        user.friends.map(async (friend) => {
          // Get the latest message
          const latestMessage = await PrivateMessage.findOne({
            $or: [
              { sender: userId, recipient: friend._id },
              { sender: friend._id, recipient: userId }
            ]
          }).sort({ createdAt: -1 })

          // Count unread messages
          const unreadCount = await PrivateMessage.countDocuments({
            sender: friend._id,
            recipient: userId,
            read: false
          })

          return {
            friend,
            latestMessage,
            unreadCount
          }
        })
      )

      // Sort by latest message
      conversations.sort((a, b) => {
        const dateA = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0
        const dateB = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0
        return dateB - dateA
      })

      return NextResponse.json({ conversations })
    }
  } catch (error: any) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

// POST endpoint to send a message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { recipientId, content } = await req.json()

    if (!recipientId || !content || content.trim() === "") {
      return NextResponse.json(
        { error: "Recipient ID and message content are required" },
        { status: 400 }
      )
    }

    await connectDB()

    // Validate friend relationship
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isFriend = user.friends.some(friend => friend.toString() === recipientId)
    if (!isFriend) {
      return NextResponse.json(
        { error: "You can only message your friends" },
        { status: 403 }
      )
    }

    // Create the message
    const message = await PrivateMessage.create({
      sender: userId,
      recipient: recipientId,
      content,
      read: false
    })

    return NextResponse.json(
      {
        message: "Message sent successfully",
        data: message
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    )
  }
}
