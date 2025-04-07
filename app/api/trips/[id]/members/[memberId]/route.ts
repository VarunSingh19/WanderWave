import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/db"
import Trip, { MemberRole, MemberStatus } from "@/lib/models/trip.model"
import { authOptions } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const tripId = params.id
    const memberId = params.memberId
    const { action, role } = await req.json()

    if (!action && !role) {
      return NextResponse.json({ error: "Action or role is required" }, { status: 400 })
    }

    await connectDB()

    const trip = await Trip.findById(tripId)

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if user is author
    const isAuthor = trip.members.some(
      (member) => member.user.toString() === userId && member.role === MemberRole.AUTHOR,
    )

    // Find the member to update
    const memberIndex = trip.members.findIndex((member) => member.user.toString() === memberId)

    if (memberIndex === -1) {
      return NextResponse.json({ error: "Member not found in this trip" }, { status: 404 })
    }

    // Handle different actions
    if (action) {
      switch (action) {
        case "approve":
          // Only author can approve
          if (!isAuthor) {
            return NextResponse.json({ error: "Only the trip author can approve members" }, { status: 403 })
          }

          trip.members[memberIndex].status = MemberStatus.ACCEPTED
          break

        case "reject":
          // Only author can reject
          if (!isAuthor) {
            return NextResponse.json({ error: "Only the trip author can reject members" }, { status: 403 })
          }

          trip.members[memberIndex].status = MemberStatus.REJECTED
          break

        case "remove":
          // Only author can remove
          if (!isAuthor) {
            return NextResponse.json({ error: "Only the trip author can remove members" }, { status: 403 })
          }

          // Remove member
          trip.members.splice(memberIndex, 1)
          break

        case "accept":
          // Member accepting invitation
          if (memberId !== userId) {
            return NextResponse.json({ error: "You can only accept your own invitations" }, { status: 403 })
          }

          if (trip.members[memberIndex].status !== MemberStatus.INVITED) {
            return NextResponse.json({ error: "You do not have a pending invitation" }, { status: 400 })
          }

          trip.members[memberIndex].status = MemberStatus.ACCEPTED
          break

        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 })
      }
    }

    // Handle role change
    if (role) {
      // Only author can change roles
      if (!isAuthor) {
        return NextResponse.json({ error: "Only the trip author can change member roles" }, { status: 403 })
      }

      if (role === MemberRole.AUTHOR) {
        return NextResponse.json({ error: "Cannot set another member as author" }, { status: 400 })
      }

      trip.members[memberIndex].role = role
    }

    await trip.save()

    return NextResponse.json({
      message: "Member updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating member:", error)
    return NextResponse.json({ error: error.message || "Failed to update member" }, { status: 500 })
  }
}

