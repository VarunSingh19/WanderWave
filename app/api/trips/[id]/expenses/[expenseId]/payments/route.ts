import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/db"
import Trip, { MemberStatus } from "@/lib/models/trip.model"
import Expense from "@/lib/models/expense.model"
import Transaction, { TransactionStatus, TransactionType } from "@/lib/models/transaction.model"
import razorpay from "@/lib/razorpay"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string; expenseId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const tripId = params.id
    const expenseId = params.expenseId
    const { amount } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })
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

    const expense = await Expense.findById(expenseId)

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    // Find user's share
    const userShareIndex = expense.shares.findIndex((share) => share.user.toString() === userId)

    if (userShareIndex === -1) {
      return NextResponse.json({ error: "You do not have a share in this expense" }, { status: 400 })
    }

    const userShare = expense.shares[userShareIndex]

    // Check if amount is valid
    const remainingAmount = userShare.amount - userShare.amountPaid

    if (amount > remainingAmount) {
      return NextResponse.json({ error: `You can only pay up to ${remainingAmount}` }, { status: 400 })
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `exp_${expenseId}_${userId}`,
    })

    // Create transaction record
    const transaction = await Transaction.create({
      user: userId,
      trip: tripId,
      expense: expenseId,
      type: TransactionType.PAYMENT,
      amount,
      status: TransactionStatus.PENDING,
      description: `Payment for ${expense.title}`,
      paymentId: order.id,
      metadata: {
        orderId: order.id,
        expenseShare: userShare._id,
      },
    })

    return NextResponse.json({
      message: "Payment initiated",
      order,
      transaction: transaction._id,
    })
  } catch (error: any) {
    console.error("Error initiating payment:", error)
    return NextResponse.json({ error: error.message || "Failed to initiate payment" }, { status: 500 })
  }
}

