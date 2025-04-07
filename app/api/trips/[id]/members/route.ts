import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/db"
import Trip, { MemberRole, MemberStatus } from "@/lib/models/trip.model"
import User from "@/lib/models/user.model"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const tripId = params.id
    const { memberId, username } = await req.json()

    if (!memberId && !username) {
      return NextResponse.json({ error: "Member ID or username is required" }, { status: 400 })
    }

    await connectDB()

    const trip = await Trip.findById(tripId)

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if user is a member of the trip
    const userMember = trip.members.find(
      (member) => member.user.toString() === userId && member.status === MemberStatus.ACCEPTED,
    )

    if (!userMember) {
      return NextResponse.json({ error: "You are not a member of this trip" }, { status: 403 })
    }

    // Find user to add
    let userToAdd

    if (memberId) {
      userToAdd = await User.findById(memberId)
    } else if (username) {
      userToAdd = await User.findOne({
        $or: [{ email: username }, { name: username }],
      })
    }

    if (!userToAdd) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is already a member
    const isAlreadyMember = trip.members.some((member) => member.user.toString() === userToAdd._id.toString())

    if (isAlreadyMember) {
      return NextResponse.json({ error: "User is already a member of this trip" }, { status: 400 })
    }

    // Add member with appropriate status
    // If added by author, status is INVITED
    // If added by participant, status is PENDING (needs author approval)
    const newMemberStatus = userMember.role === MemberRole.AUTHOR ? MemberStatus.INVITED : MemberStatus.PENDING

    const newMember = {
      user: userToAdd._id,
      role: MemberRole.PARTICIPANT,
      status: newMemberStatus,
      addedBy: userId,
    }

    await Trip.findByIdAndUpdate(tripId, {
      $push: { members: newMember },
    })

    return NextResponse.json({
      message: "Member added successfully",
      status: newMemberStatus,
    })
  } catch (error: any) {
    console.error("Error adding member:", error)
    return NextResponse.json({ error: error.message || "Failed to add member" }, { status: 500 })
  }
}

