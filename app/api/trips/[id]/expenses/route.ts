import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/db"
import Trip, { MemberStatus } from "@/lib/models/trip.model"
import Expense, { PaymentStatus } from "@/lib/models/expense.model"
import { calculateEqualShares } from "@/lib/utils"
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

    const expenses = await Expense.find({ trip: tripId })
      .populate("addedBy", "name email profileImage")
      .populate("shares.user", "name email profileImage")
      .sort({ date: -1 })

    return NextResponse.json({ expenses })
  } catch (error: any) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch expenses" }, { status: 500 })
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
    const { title, description, amount, date } = await req.json()

    if (!title || !amount) {
      return NextResponse.json({ error: "Title and amount are required" }, { status: 400 })
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

    // Get all accepted members
    const acceptedMembers = trip.members.filter((member) => member.status === MemberStatus.ACCEPTED)

    // Calculate equal shares
    const shareAmount = calculateEqualShares(amount, acceptedMembers.length)

    // Create shares for each member
    const shares = acceptedMembers.map((member) => ({
      user: member.user,
      amount: shareAmount,
      amountPaid: 0,
      status: PaymentStatus.PENDING,
    }))

    // Create expense
    const expense = await Expense.create({
      trip: tripId,
      title,
      description,
      amount,
      date: date || new Date(),
      addedBy: userId,
      shares,
    })

    // Update trip with new expense
    await Trip.findByIdAndUpdate(tripId, {
      $push: { expenses: expense._id },
    })

    return NextResponse.json(
      {
        message: "Expense added successfully",
        expense,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error adding expense:", error)
    return NextResponse.json({ error: error.message || "Failed to add expense" }, { status: 500 })
  }
}

