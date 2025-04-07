import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/db"
import Trip, { MemberStatus } from "@/lib/models/trip.model"
import Transaction from "@/lib/models/transaction.model"
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
      (member) => member.user.toString() === userId && member.status === MemberStatus.ACCEPTED
    )

    if (!isMember) {
      return NextResponse.json({ error: "You are not a member of this trip" }, { status: 403 })
    }

    // Fetch transactions related to this trip
    const transactions = await Transaction.find({ trip: tripId })
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 })

    return NextResponse.json({ transactions })
  } catch (error: any) {
    console.error("Error fetching wallet transactions:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch wallet transactions" },
      { status: 500 }
    )
  }
}
