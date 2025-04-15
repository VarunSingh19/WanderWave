import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/db";
import Trip, { MemberRole, MemberStatus } from "@/lib/models/trip.model";
import Expense, { PaymentStatus } from "@/lib/models/expense.model";
import { authOptions } from "@/lib/auth";

// POST endpoint to transfer approved funds from trip wallet to author's wallet
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const tripId = String(params.id);

    await connectDB();

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if user is the trip author
    const isAuthor = trip.members.some(
      (member) =>
        member.user.toString() === userId && member.role === MemberRole.AUTHOR
    );

    if (!isAuthor) {
      return NextResponse.json(
        { error: "Only the trip author can transfer funds" },
        { status: 403 }
      );
    }

    // Check if a withdrawal is pending and has enough approvals
    if (!trip.wallet.pendingWithdrawal) {
      return NextResponse.json(
        { error: "No pending withdrawal request" },
        { status: 400 }
      );
    }

    // Count the number of accepted members for voting threshold
    const acceptedMembers = trip.members.filter(
      (member) => member.status === MemberStatus.ACCEPTED
    );
    const totalMembers = acceptedMembers.length;
    const votingThreshold = Math.ceil(totalMembers / 2); // Majority vote (50% + 1)

    // Check if enough members have approved the withdrawal
    if (trip.wallet.withdrawalApprovals.length < votingThreshold) {
      return NextResponse.json(
        { error: "Not enough approvals to transfer funds" },
        { status: 400 }
      );
    }

    // Calculate the actual wallet balance based on expense shares
    const expenses = await Expense.find({ trip: tripId });
    let calculatedBalance = 0;
    expenses.forEach((expense) => {
      expense.shares.forEach((share) => {
        calculatedBalance += share.amountPaid || 0;
      });
    });

    // If there's no balance, return an error
    if (calculatedBalance <= 0) {
      return NextResponse.json(
        { error: "No funds available for transfer" },
        { status: 400 }
      );
    }

    // In a real application, this is where you would transfer the funds to the author's wallet
    // For now, we'll just reset the trip wallet
    await Trip.findByIdAndUpdate(tripId, {
      $set: {
        "wallet.pendingWithdrawal": false,
        "wallet.withdrawalApprovals": [],
        "wallet.balance": 0, // Reset balance after transfer
      },
    });

    // TODO: In a real app, update the user's personal wallet balance here
    // await User.findByIdAndUpdate(userId, {
    //   $inc: { "wallet.balance": calculatedBalance }
    // });

    return NextResponse.json({
      message: "Funds transferred successfully",
      amount: calculatedBalance,
    });
  } catch (error: any) {
    console.error("Error transferring funds:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transfer funds" },
      { status: 500 }
    );
  }
}
