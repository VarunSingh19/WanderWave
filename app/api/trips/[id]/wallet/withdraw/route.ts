import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/db"
import Trip, { MemberRole, MemberStatus } from "@/lib/models/trip.model"
import Transaction, { TransactionStatus, TransactionType } from "@/lib/models/transaction.model"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const tripId = params.id
    const { amount } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })
    }

    await connectDB()

    const trip = await Trip.findById(tripId)

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if user is the author
    const isAuthor = trip.members.some(
      (member) =>
        member.user.toString() === userId &&
        member.role === MemberRole.AUTHOR &&
        member.status === MemberStatus.ACCEPTED,
    )

    if (!isAuthor) {
      return NextResponse.json({ error: "Only the trip author can withdraw funds" }, { status: 403 })
    }

    // Check if there's already a pending withdrawal
    if (trip.wallet.pendingWithdrawal) {
      return NextResponse.json({ error: "There is already a pending withdrawal" }, { status: 400 })
    }

    // Check if there are sufficient funds
    if (trip.wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient funds in trip wallet" }, { status: 400 })
    }

    // Start withdrawal process
    trip.wallet.pendingWithdrawal = true
    trip.wallet.withdrawalApprovals = [userId] // Author automatically approves
    await trip.save()

    // Create transaction record
    const transaction = await Transaction.create({
      user: userId,
      trip: tripId,
      type: TransactionType.WITHDRAWAL,
      amount,
      status: TransactionStatus.PENDING,
      description: `Withdrawal from trip wallet`,
      metadata: {
        tripWalletBalance: trip.wallet.balance,
      },
    })

    return NextResponse.json({
      message: "Withdrawal initiated, waiting for member approvals",
      transaction: transaction._id,
    })
  } catch (error: any) {
    console.error("Error initiating withdrawal:", error)
    return NextResponse.json({ error: error.message || "Failed to initiate withdrawal" }, { status: 500 })
  }
}

