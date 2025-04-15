import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/db";
import Trip, { MemberRole, MemberStatus } from "@/lib/models/trip.model";
import Expense, { PaymentStatus } from "@/lib/models/expense.model";
import { authOptions } from "@/lib/auth";

// GET endpoint to retrieve wallet details and voting status
export async function GET(
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

    // Check if user is a member with accepted status
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

    // Count the number of accepted members for voting threshold
    const acceptedMembers = trip.members.filter(
      (member) => member.status === MemberStatus.ACCEPTED
    );
    const totalMembers = acceptedMembers.length;
    const votingThreshold = Math.ceil(totalMembers / 2); // Majority vote (50% + 1)

    // Check if user has already approved the withdrawal
    const hasVoted = trip.wallet.withdrawalApprovals.some(
      (id) => id.toString() === userId
    );

    // Calculate pending payments from expenses
    const expenses = await Expense.find({ trip: tripId });

    // Calculate the actual wallet balance based on expense shares
    let calculatedBalance = 0;
    expenses.forEach((expense) => {
      expense.shares.forEach((share) => {
        calculatedBalance += share.amountPaid;
      });
    });

    // Return wallet details and voting status
    return NextResponse.json({
      walletDetails: {
        balance: calculatedBalance, // Use the calculated balance
        pendingWithdrawal: trip.wallet.pendingWithdrawal,
        approvals: trip.wallet.withdrawalApprovals.length,
        totalMembers,
        votingThreshold,
        hasVoted,
        isAuthor: trip.members.some(
          (member) =>
            member.user.toString() === userId &&
            member.role === MemberRole.AUTHOR
        ),
      },
    });
  } catch (error: any) {
    console.error("Error fetching wallet details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch wallet details" },
      { status: 500 }
    );
  }
}

// POST endpoint to initiate a withdrawal request (author only)
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
        { error: "Only the trip author can initiate a withdrawal" },
        { status: 403 }
      );
    }

    // Check if a withdrawal is already pending
    if (trip.wallet.pendingWithdrawal) {
      return NextResponse.json(
        { error: "A withdrawal request is already pending" },
        { status: 400 }
      );
    }

    // Calculate the wallet balance from all expenses
    const expenses = await Expense.find({ trip: tripId });
    let calculatedBalance = 0;
    expenses.forEach((expense) => {
      expense.shares.forEach((share) => {
        calculatedBalance += share.amountPaid;
      });
    });

    // Ensure there is a balance to withdraw
    if (calculatedBalance <= 0) {
      return NextResponse.json(
        { error: "No funds available for withdrawal" },
        { status: 400 }
      );
    }

    // Initiate withdrawal request and add author as first approval
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        $set: { "wallet.pendingWithdrawal": true },
        $push: { "wallet.withdrawalApprovals": userId },
      },
      { new: true }
    );

    return NextResponse.json({
      message: "Withdrawal request initiated",
      trip: updatedTrip,
    });
  } catch (error: any) {
    console.error("Error initiating withdrawal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate withdrawal" },
      { status: 500 }
    );
  }
}

// PUT endpoint to vote for withdrawal (members only)
export async function PUT(
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

    // Check if user is a member with accepted status
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

    // Check if a withdrawal is pending
    if (!trip.wallet.pendingWithdrawal) {
      return NextResponse.json(
        { error: "No pending withdrawal request" },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const hasVoted = trip.wallet.withdrawalApprovals.some(
      (id) => id.toString() === userId
    );

    if (hasVoted) {
      return NextResponse.json(
        { error: "You have already voted for this withdrawal" },
        { status: 400 }
      );
    }

    // Add user's approval
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        $push: { "wallet.withdrawalApprovals": userId },
      },
      { new: true }
    );

    // Check if we have enough approvals for the withdrawal
    const acceptedMembers = trip.members.filter(
      (member) => member.status === MemberStatus.ACCEPTED
    );
    const totalMembers = acceptedMembers.length;
    const votingThreshold = Math.ceil(totalMembers / 2); // Majority vote (50% + 1)

    let withdrawalStatus = "pending";

    // If enough approvals, process withdrawal (in a real app, this would transfer funds)
    if (updatedTrip!.wallet.withdrawalApprovals.length >= votingThreshold) {
      // Calculate the wallet balance from all expenses
      const expenses = await Expense.find({ trip: tripId });
      let withdrawalAmount = 0;
      expenses.forEach((expense) => {
        expense.shares.forEach((share) => {
          withdrawalAmount += share.amountPaid;
        });
      });

      // In a real app, here we would transfer the funds to the author's account
      // For now, just reset the wallet state
      await Trip.findByIdAndUpdate(tripId, {
        $set: {
          "wallet.pendingWithdrawal": false,
          "wallet.withdrawalApprovals": [],
          "wallet.balance": 0, // Reset balance after withdrawal
        },
      });

      withdrawalStatus = "approved";
    }

    return NextResponse.json({
      message: "Approval added successfully",
      status: withdrawalStatus,
      approvals: updatedTrip!.wallet.withdrawalApprovals.length,
      threshold: votingThreshold,
    });
  } catch (error: any) {
    console.error("Error adding approval:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add approval" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cancel a withdrawal request (author only)
export async function DELETE(
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
        { error: "Only the trip author can cancel a withdrawal request" },
        { status: 403 }
      );
    }

    // Check if a withdrawal is pending
    if (!trip.wallet.pendingWithdrawal) {
      return NextResponse.json(
        { error: "No pending withdrawal request to cancel" },
        { status: 400 }
      );
    }

    // Cancel the withdrawal request
    await Trip.findByIdAndUpdate(tripId, {
      $set: {
        "wallet.pendingWithdrawal": false,
        "wallet.withdrawalApprovals": [],
      },
    });

    return NextResponse.json({
      message: "Withdrawal request cancelled",
    });
  } catch (error: any) {
    console.error("Error cancelling withdrawal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel withdrawal request" },
      { status: 500 }
    );
  }
}
