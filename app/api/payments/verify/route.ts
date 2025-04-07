import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import crypto from "crypto"
import connectDB from "@/lib/db"
import Transaction, { TransactionStatus } from "@/lib/models/transaction.model"
import Expense, { PaymentStatus } from "@/lib/models/expense.model"
import Trip from "@/lib/models/trip.model"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, transaction_id } = await req.json()

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !transaction_id) {
      return NextResponse.json({ error: "Missing payment verification details" }, { status: 400 })
    }

    await connectDB()

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update(body).digest("hex")

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    // Get transaction
    const transaction = await Transaction.findById(transaction_id)

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (transaction.user.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized transaction" }, { status: 403 })
    }

    // Update transaction
    transaction.status = TransactionStatus.COMPLETED
    transaction.paymentId = razorpay_payment_id
    await transaction.save()

    // Update expense share
    const expense = await Expense.findById(transaction.expense)

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    const userShareIndex = expense.shares.findIndex((share) => share.user.toString() === userId)

    if (userShareIndex === -1) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 })
    }

    // Update share amount paid
    expense.shares[userShareIndex].amountPaid += transaction.amount

    // Update share status
    if (expense.shares[userShareIndex].amountPaid >= expense.shares[userShareIndex].amount) {
      expense.shares[userShareIndex].status = PaymentStatus.COMPLETED
    } else {
      expense.shares[userShareIndex].status = PaymentStatus.PARTIAL
    }

    await expense.save()

    // Check if all shares are paid
    const allPaid = expense.shares.every((share) => share.status === PaymentStatus.COMPLETED)

    if (allPaid) {
      // Add to trip wallet
      const trip = await Trip.findById(transaction.trip)

      if (trip) {
        trip.wallet.balance += expense.amount
        await trip.save()
      }
    }

    return NextResponse.json({
      message: "Payment verified successfully",
      transaction: {
        id: transaction._id,
        status: transaction.status,
      },
    })
  } catch (error: any) {
    console.error("Error verifying payment:", error)
    return NextResponse.json({ error: error.message || "Failed to verify payment" }, { status: 500 })
  }
}

