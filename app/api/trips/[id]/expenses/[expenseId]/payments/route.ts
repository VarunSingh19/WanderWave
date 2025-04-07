import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/db";
import Trip, { MemberStatus } from "@/lib/models/trip.model";
import Expense, { PaymentStatus } from "@/lib/models/expense.model";
import Transaction, {
  TransactionStatus,
  TransactionType,
} from "@/lib/models/transaction.model";
import User from "@/lib/models/user.model";
import { authOptions } from "@/lib/auth";
import razorpay from "@/lib/razorpay";
import { calculateDaysLeft } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const tripId = params.id;
    const expenseId = params.expenseId;
    const { amount, paymentMethod } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if user is a member of the trip
    const isMember = trip.members.some(
      (member) =>
        member.user.toString() === userId &&
        member.status === MemberStatus.ACCEPTED
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this trip" },
        { status: 403 }
      );
    }

    // Check if the trip is at least 2 days away
    const daysLeft = calculateDaysLeft(trip.startDate, trip.endDate);
    if (daysLeft < 2) {
      return NextResponse.json(
        {
          error:
            "Payments must be completed at least 2 days before the trip starts",
        },
        { status: 400 }
      );
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Find user's share
    const userShareIndex = expense.shares.findIndex(
      (share) => share.user.toString() === userId
    );

    if (userShareIndex === -1) {
      return NextResponse.json(
        { error: "Your share not found in this expense" },
        { status: 404 }
      );
    }

    const userShare = expense.shares[userShareIndex];

    // Check if the amount is not more than what's remaining to be paid
    const remainingAmount = userShare.amount - userShare.amountPaid;
    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: "Amount exceeds your remaining share" },
        { status: 400 }
      );
    }

    // Create a payment transaction based on payment method
    if (paymentMethod === "wallet") {
      // Pay using wallet balance
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.wallet.balance < amount) {
        return NextResponse.json(
          { error: "Insufficient wallet balance" },
          { status: 400 }
        );
      }

      // Deduct from wallet
      user.wallet.balance -= amount;
      await user.save();

      // Create transaction
      const transaction = await Transaction.create({
        user: userId,
        trip: tripId,
        expense: expenseId,
        type: TransactionType.PAYMENT,
        amount,
        status: TransactionStatus.COMPLETED,
        description: `Payment for expense: ${expense.title}`,
      });

      // Update expense share
      expense.shares[userShareIndex].amountPaid += amount;

      // Update share status
      if (
        expense.shares[userShareIndex].amountPaid >=
        expense.shares[userShareIndex].amount
      ) {
        expense.shares[userShareIndex].status = PaymentStatus.COMPLETED;
      } else {
        expense.shares[userShareIndex].status = PaymentStatus.PARTIAL;
      }

      await expense.save();

      // Check if all shares are paid
      const allPaid = expense.shares.every(
        (share) => share.status === PaymentStatus.COMPLETED
      );

      if (allPaid) {
        // Add to trip wallet
        trip.wallet.balance += expense.amount;
        await trip.save();
      }

      return NextResponse.json({
        message: "Payment successful",
        remainingAmount:
          expense.shares[userShareIndex].amount -
          expense.shares[userShareIndex].amountPaid,
        transaction: transaction._id,
      });
    } else {
      // Create Razorpay order for online payment
      const order = await razorpay.orders.create({
        amount: amount * 100, // Razorpay expects amount in paisa
        currency: "INR",
        receipt: `exp-${expenseId}-${userId}-${Date.now()}`,
      });

      // Create pending transaction
      const transaction = await Transaction.create({
        user: userId,
        trip: tripId,
        expense: expenseId,
        type: TransactionType.PAYMENT,
        amount,
        status: TransactionStatus.PENDING,
        description: `Payment for expense: ${expense.title}`,
        paymentId: order.id,
      });

      return NextResponse.json({
        orderId: order.id,
        transactionId: transaction._id,
        amount: amount,
        currency: "INR",
      });
    }
  } catch (error: any) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment" },
      { status: 500 }
    );
  }
}
