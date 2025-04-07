import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/user.model";
import Transaction from "@/lib/models/transaction.model";
import { TransactionStatus } from "@/lib/models/transaction.model";
import stripeClient from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("Unauthorized Stripe verification attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse request body
    const body = await req.json();
    const { paymentIntentId, transaction_id } = body;

    // Validate required fields
    if (!paymentIntentId || !transaction_id) {
      console.log("Missing required fields for Stripe verification", body);
      return NextResponse.json(
        {
          error: "Missing required parameters",
          details: "paymentIntentId and transaction_id are required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Find transaction
    const transaction = await Transaction.findById(transaction_id);
    if (!transaction) {
      console.log(`Transaction not found: ${transaction_id}`);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify that this transaction belongs to current user
    if (transaction.user.toString() !== userId) {
      console.log(
        `Transaction ${transaction_id} belongs to ${transaction.user}, not current user ${userId}`
      );
      return NextResponse.json(
        { error: "Unauthorized access to transaction" },
        { status: 403 }
      );
    }

    // Fetch payment intent from Stripe
    try {
      const paymentIntent = await stripeClient.paymentIntents.retrieve(
        paymentIntentId
      );

      // Verify payment status
      if (paymentIntent.status !== "succeeded") {
        console.log(
          `Payment not succeeded: ${paymentIntentId}, status: ${paymentIntent.status}`
        );

        // Update transaction status
        transaction.status = TransactionStatus.FAILED;
        transaction.metadata = {
          ...transaction.metadata,
          paymentIntentId,
          stripeStatus: paymentIntent.status,
        };
        await transaction.save();

        return NextResponse.json(
          {
            error: "Payment not completed",
            details: `Payment status is ${paymentIntent.status}`,
          },
          { status: 400 }
        );
      }

      // Verify payment amount
      const paymentAmount = paymentIntent.amount / 100; // Convert from cents to dollars
      if (paymentAmount !== transaction.amount) {
        console.log(
          `Payment amount mismatch: expected ${transaction.amount}, got ${paymentAmount}`
        );

        transaction.status = TransactionStatus.FAILED;
        transaction.metadata = {
          ...transaction.metadata,
          paymentIntentId,
          amountExpected: transaction.amount,
          amountReceived: paymentAmount,
        };
        await transaction.save();

        return NextResponse.json(
          {
            error: "Payment amount mismatch",
            details: `Expected ${transaction.amount}, received ${paymentAmount}`,
          },
          { status: 400 }
        );
      }

      // Update transaction to completed
      transaction.status = TransactionStatus.COMPLETED;
      transaction.metadata = {
        ...transaction.metadata,
        paymentIntentId,
        verifiedAt: new Date().toISOString(),
      };
      await transaction.save();

      // Update user's wallet balance
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Add amount to wallet
      user.wallet.balance += transaction.amount;
      await user.save();

      console.log(
        `Payment verified and wallet updated: added ${transaction.amount} to user ${userId}'s wallet`
      );

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        transaction: transaction._id,
        balance: user.wallet.balance,
      });
    } catch (error: any) {
      console.error("Error verifying payment with Stripe:", error);

      // Update transaction to failed
      transaction.status = TransactionStatus.FAILED;
      transaction.metadata = {
        ...transaction.metadata,
        paymentIntentId,
        verificationError: error.message || "Error fetching payment details",
      };
      await transaction.save();

      return NextResponse.json(
        {
          error: "Payment verification failed",
          details:
            error.message || "Error fetching payment details from Stripe",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in Stripe verification endpoint:", error);
    return NextResponse.json(
      {
        error: "Payment verification failed",
        details: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
