import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/db"
import Trip, { MemberStatus } from "@/lib/models/trip.model"
import Transaction, { TransactionStatus, TransactionType } from "@/lib/models/transaction.model"
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

    await connectDB()

    const trip = await Trip.findById(tripId)

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if user is a member
    const isMember = trip.members.some(
      (member) => member.user.toString() === userId && member.status === MemberStatus.ACCEPTED,
    )

    if (!isMember) {
      return NextResponse.json({ error: "You are not a member of this trip" }, { status: 403 })
    }

    // Check if there's a pending withdrawal
    if (!trip.wallet.pendingWithdrawal) {
      return NextResponse.json({ error: "No pending withdrawal to approve" }, { status: 400 })
    }

    // Check if user has already approved
    if (trip.wallet.withdrawalApprovals.includes(userId)) {
      return NextResponse.json({ error: "You have already approved this withdrawal" }, { status: 400 })
    }

    // Add approval
    trip.wallet.withdrawalApprovals.push(userId)

    // Check if all members have approved
    const acceptedMembers = trip.members.filter((member) => member.status === MemberStatus.ACCEPTED)

    const allApproved = acceptedMembers.every((member) => trip.wallet.withdrawalApprovals.includes(member.user))

    if (allApproved) {
      // Find the pending transaction
      const transaction = await Transaction.findOne({
        trip: tripId,
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PENDING,
      })

      if (transaction) {
        // Complete the withdrawal
        transaction.status = TransactionStatus.COMPLETED
        await transaction.save()

        // Update trip wallet
        trip.wallet.balance -= transaction.amount
        trip.wallet.pendingWithdrawal = false
        trip.wallet.withdrawalApprovals = []

        // Update author's wallet
        const author = trip.members.find((member) => member.role === "author")

        if (author) {
          const authorUser = await User.findById(author.user)

          if (authorUser) {
            authorUser.wallet.balance += transaction.amount
            await authorUser.save()

            // Create deposit transaction for author
            await Transaction.create({
              user: author.user,
              trip: tripId,
              type: TransactionType.DEPOSIT,
              amount: transaction.amount,
              status: TransactionStatus.COMPLETED,
              description: `Deposit from trip wallet`,
              metadata: {
                withdrawalTransactionId: transaction._id,
              },
            })
          }
        }
      }
    }

    await trip.save()

    return NextResponse.json({
      message: "Withdrawal approved",
      allApproved,
    })
  } catch (error: any) {
    console.error("Error approving withdrawal:", error)
    return NextResponse.json({ error: error.message || "Failed to approve withdrawal" }, { status: 500 })
  }
}

