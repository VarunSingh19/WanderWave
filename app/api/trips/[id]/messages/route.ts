import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/db"
import Trip, { MemberStatus } from "@/lib/models/trip.model"
import Message from "@/lib/models/message.model"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const tripId = params.id

    await connectDB()

    const trip = await Trip.findById(tripId)

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if user is a member of the trip
    const isMember = trip.members.some(
      (member) => member.user.toString() === userId && member.status === MemberStatus.ACCEPTED,
    )

    if (!isMember) {
      return NextResponse.json({ error: "You are not a member of this trip" }, { status: 403 })
    }

    const messages = await Message.find({ trip: tripId })
      .populate("sender", "name email profileImage")
      .sort({ createdAt: 1 })

    // Mark messages as read
    await Message.updateMany({ trip: tripId, readBy: { $ne: userId } }, { $push: { readBy: userId } })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const tripId = params.id
    const { content } = await req.json()

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    await connectDB()

    const trip = await Trip.findById(tripId)

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if user is a member of the trip
    const isMember = trip.members.some(
      (member) => member.user.toString() === userId && member.status === MemberStatus.ACCEPTED,
    )

    if (!isMember) {
      return NextResponse.json({ error: "You are not a member of this trip" }, { status: 403 })
    }

    const message = await Message.create({
      trip: tripId,
      sender: userId,
      content,
      readBy: [userId], // Sender has read the message
    })

    const populatedMessage = await Message.findById(message._id).populate("sender", "name email profileImage")

    return NextResponse.json(
      {
        message: "Message sent successfully",
        data: populatedMessage,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 })
  }
}

