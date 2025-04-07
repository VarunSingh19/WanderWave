import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/user.model";
import Transaction from "@/lib/models/transaction.model";
import {
  TransactionStatus,
  TransactionType,
} from "@/lib/models/transaction.model";

/**
 * API route for withdrawing money from wallet
 * POST /api/profile/wallet/withdraw
 */
export async function POST(req: NextRequest) {
  console.log("Wallet withdrawal endpoint called");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("Unauthorized wallet withdrawal attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Withdrawal request body:", JSON.stringify(body, null, 2));
    } catch (error) {
      console.error("Error parsing JSON body:", error);
      return NextResponse.json(
        {
          error: "Invalid request format",
          details: "Could not parse JSON body",
        },
        { status: 400 }
      );
    }

    const { amount, accountDetails } = body;

    // Validate amount
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        {
          error: "Invalid amount",
          details: "Amount must be a positive number",
        },
        { status: 400 }
      );
    }

    // Validate account details
    if (!accountDetails || !accountDetails.type) {
      return NextResponse.json(
        {
          error: "Invalid account details",
          details: "Account details with type are required",
        },
        { status: 400 }
      );
    }

    const amountToWithdraw = Number(amount);

    // Connect to database
    try {
      await connectDB();
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: "Could not connect to the database",
        },
        { status: 500 }
      );
    }

    // Find user and check balance
    let user;
    try {
      user = await User.findById(userId);

      if (!user) {
        console.log(`User not found: ${userId}`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Check if user has sufficient balance
      if (user.wallet.balance < amountToWithdraw) {
        return NextResponse.json(
          {
            error: "Insufficient balance",
            details: `Your current balance is ${user.wallet.balance}, but you requested to withdraw ${amountToWithdraw}`,
          },
          { status: 400 }
        );
      }
    } catch (findError) {
      console.error("Error finding user:", findError);
      return NextResponse.json(
        {
          error: "Database error",
          details: "Failed to find user",
        },
        { status: 500 }
      );
    }

    // Create a withdrawal transaction
    try {
      // Create withdrawal transaction
      const transaction = await Transaction.create({
        user: userId,
        type: TransactionType.WITHDRAWAL,
        amount: amountToWithdraw,
        status: TransactionStatus.PENDING,
        description: `Withdrawal to ${accountDetails.type}`,
        metadata: {
          accountDetails,
          requestedAt: new Date().toISOString(),
        },
      });

      console.log("Withdrawal transaction created:", transaction._id);

      // Update user's wallet balance - we deduct immediately but transaction is still pending
      user.wallet.balance -= amountToWithdraw;
      await user.save();

      console.log(
        `User wallet updated: deducted ${amountToWithdraw} from user ${userId}'s wallet`
      );

      // Return success response
      return NextResponse.json({
        success: true,
        message: "Withdrawal request submitted successfully",
        transactionId: transaction._id,
        status: TransactionStatus.PENDING,
        newBalance: user.wallet.balance,
      });
    } catch (error: any) {
      console.error("Error processing withdrawal:", error);

      return NextResponse.json(
        {
          error: "Withdrawal request failed",
          details: error.message || "Error processing withdrawal",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in wallet withdrawal endpoint:", error);
    return NextResponse.json(
      {
        error: "Withdrawal request failed",
        details: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
