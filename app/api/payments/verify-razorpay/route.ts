import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/user.model";
import Transaction from "@/lib/models/transaction.model";
import { TransactionStatus } from "@/lib/models/transaction.model";
import razorpayClient from "@/lib/razorpay";
import crypto from "crypto";

// Razorpay webhook verification
export async function POST(req: NextRequest) {
  console.log("Razorpay verification endpoint called");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("Unauthorized Razorpay verification attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Razorpay verification body:", JSON.stringify(body, null, 2));
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

    const { paymentId, orderId, signature, transaction_id } = body;

    // Validate required fields
    if (!paymentId || !orderId || !signature || !transaction_id) {
      console.log("Missing required fields for Razorpay verification", body);
      return NextResponse.json(
        {
          error: "Missing required parameters",
          details:
            "paymentId, orderId, signature, and transaction_id are required",
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

    // Get secret key from environment or use fallback
    const secretKey =
      process.env.RAZORPAY_KEY_SECRET || "KJfN1SqGBozf5fRGCylIRwe7";
    console.log(
      "Using Razorpay secret key ending with:",
      secretKey.substring(secretKey.length - 4)
    );

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    console.log("Generated signature:", generatedSignature);
    console.log("Received signature:", signature);

    // Check if signatures match
    if (generatedSignature !== signature) {
      console.log("Razorpay signature verification failed");

      // Update transaction status to failed
      transaction.status = TransactionStatus.FAILED;
      transaction.metadata = {
        ...transaction.metadata,
        paymentId,
        verificationError: "Signature mismatch",
      };
      await transaction.save();

      return NextResponse.json(
        {
          error: "Payment verification failed",
          details: "Invalid signature",
        },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    try {
      console.log(
        "Fetching payment details from Razorpay for payment ID:",
        paymentId
      );
      const paymentDetails = await razorpayClient.payments.fetch(paymentId);
      console.log(
        "Razorpay payment details:",
        JSON.stringify(paymentDetails, null, 2)
      );

      // Verify payment status
      if (paymentDetails.status !== "captured") {
        console.log(
          `Payment not captured: ${paymentId}, status: ${paymentDetails.status}`
        );

        // Update transaction status
        transaction.status = TransactionStatus.FAILED;
        transaction.metadata = {
          ...transaction.metadata,
          paymentId,
          razorpayStatus: paymentDetails.status,
        };
        await transaction.save();

        return NextResponse.json(
          {
            error: "Payment not completed",
            details: `Payment status is ${paymentDetails.status}`,
          },
          { status: 400 }
        );
      }

      // Verify payment amount
      const paymentAmount = paymentDetails.amount / 100; // Convert from paise to rupees
      if (paymentAmount !== transaction.amount) {
        console.log(
          `Payment amount mismatch: expected ${transaction.amount}, got ${paymentAmount}`
        );

        transaction.status = TransactionStatus.FAILED;
        transaction.metadata = {
          ...transaction.metadata,
          paymentId,
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
        paymentId,
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
      console.error("Error verifying payment with Razorpay:", error);

      // Update transaction to failed
      transaction.status = TransactionStatus.FAILED;
      transaction.metadata = {
        ...transaction.metadata,
        paymentId,
        verificationError: error.message || "Error fetching payment details",
      };
      await transaction.save();

      return NextResponse.json(
        {
          error: "Payment verification failed",
          details:
            error.message || "Error fetching payment details from Razorpay",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in Razorpay verification endpoint:", error);
    return NextResponse.json(
      {
        error: "Payment verification failed",
        details: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
