import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/db";
import User from "@/lib/models/user.model";
import Transaction from "@/lib/models/transaction.model";
import { authOptions } from "@/lib/auth";
import {
  TransactionStatus,
  TransactionType,
} from "@/lib/models/transaction.model";
import stripeClient from "@/lib/stripe";
import razorpayClient from "@/lib/razorpay";
import { RAZORPAY_CLIENT_KEY_ID } from "@/lib/razorpay";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    await connectDB();

    const user = await User.findById(userId).select("wallet");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get transactions
    const transactions = await Transaction.find({ user: userId })
      .populate("trip", "name")
      .populate("expense", "title")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      wallet: user.wallet,
      transactions,
    });
  } catch (error: any) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch wallet" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("Unauthorized wallet deposit attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse and validate request body
    let amount: number;
    let paymentMethod: "stripe" | "razorpay" = "stripe"; // Default to Stripe

    try {
      const body = await req.json();
      console.log("Request body:", body);

      amount = parseFloat(body.amount);

      // Check if payment method is specified
      if (
        body.paymentMethod &&
        ["stripe", "razorpay"].includes(body.paymentMethod)
      ) {
        paymentMethod = body.paymentMethod;
      }

      console.log(`Using payment method: ${paymentMethod}, amount: ${amount}`);

      if (isNaN(amount) || amount <= 0) {
        console.log("Invalid amount provided:", body.amount);
        return NextResponse.json(
          { error: "Valid amount is required" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Connect to database
    try {
      await connectDB();
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Fetch user
    let user;
    try {
      user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    } catch (userError) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "Failed to retrieve user account" },
        { status: 500 }
      );
    }

    // Process payment based on selected method
    if (paymentMethod === "stripe") {
      return await handleStripePayment(amount, userId, user);
    } else {
      return await handleRazorpayPayment(amount, userId, user);
    }
  } catch (error: any) {
    console.error("Unexpected error adding money to wallet:", error);
    return NextResponse.json(
      {
        error: "Failed to process wallet deposit request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle Stripe payment processing
async function handleStripePayment(amount: number, userId: string, user: any) {
  try {
    // Format amount for Stripe (in cents, as an integer)
    const amountInCents = Math.round(amount * 100);

    console.log(
      `Creating Stripe payment intent for amount: ${amount} (${amountInCents} cents)`
    );

    // Create a payment intent with Stripe
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountInCents,
      currency: "usd", // Use USD as the default currency
      metadata: {
        userId: userId,
        purpose: "wallet_deposit",
        timestamp: Date.now().toString(),
      },
      receipt_email: user.email || undefined,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log("Stripe payment intent created:", paymentIntent.id);

    // Create transaction record
    const transaction = await Transaction.create({
      user: userId,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.PENDING,
      description: "Add money to wallet",
      paymentId: paymentIntent.id,
      metadata: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        paymentMethod: "stripe",
      },
    });

    console.log("Transaction record created:", transaction._id);

    // Create response object
    const responseData = {
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction._id,
      amount: amount,
      publishableKey:
        process.env.STRIPE_PUBLISHABLE_KEY ||
        "pk_test_51QnhT1RuPopRx4Z1z5YzCAOTE7qy5XQNJ91AYzkdg0u6umFUDWRSJ8dZ8rUslAGN5Y9y8IkhA3vdPXq2vwG4hhiT0089ftCMIZ",
      paymentMethod: "stripe",
    };

    // Ensure all required fields are present
    console.log("Stripe response data:", JSON.stringify(responseData, null, 2));

    // Return success response for Stripe
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Stripe payment error:", error);
    return NextResponse.json(
      {
        error: "Payment gateway error. Please try again later.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle Razorpay payment processing
async function handleRazorpayPayment(
  amount: number,
  userId: string,
  user: any
) {
  try {
    // Format amount for Razorpay (in paise, as an integer)
    const amountInPaise = Math.round(amount * 100);

    console.log(
      `Creating Razorpay order for amount: ${amount} (${amountInPaise} paise)`
    );

    // Create order with Razorpay
    const orderOptions = {
      amount: amountInPaise,
      currency: "INR", // Razorpay primarily works with INR
      receipt: `wallet_deposit_${Date.now()}`,
      notes: {
        userId: userId,
        purpose: "wallet_deposit",
        email: user.email || "user@example.com",
      },
    };

    console.log(
      "Razorpay order options:",
      JSON.stringify(orderOptions, null, 2)
    );

    // Try to create order with Razorpay
    let order;
    try {
      order = await razorpayClient.orders.create(orderOptions);
      console.log("Razorpay order created:", order);
    } catch (razorpayError: any) {
      console.error("Razorpay order creation error:", razorpayError);
      return NextResponse.json(
        {
          error: "Failed to create payment order",
          details: razorpayError.message || "Razorpay service unavailable",
        },
        { status: 500 }
      );
    }

    if (!order || !order.id) {
      console.error("Invalid order response from Razorpay:", order);
      return NextResponse.json(
        {
          error: "Invalid response from payment gateway",
          details: "Missing order ID from Razorpay",
        },
        { status: 500 }
      );
    }

    // Create transaction record
    const transaction = await Transaction.create({
      user: userId,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.PENDING,
      description: "Add money to wallet",
      paymentId: order.id,
      metadata: {
        orderId: order.id,
        paymentMethod: "razorpay",
        amountInPaise,
        createdAt: new Date().toISOString(),
      },
    });

    console.log("Transaction record created:", transaction._id);

    // Create response object
    const responseData = {
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      transactionId: transaction._id,
      keyId: RAZORPAY_CLIENT_KEY_ID,
      paymentMethod: "razorpay",
      prefill: {
        name: user.name || "",
        email: user.email || "",
        contact: user.phone || "",
      },
    };

    // Log response data for debugging
    console.log(
      "Razorpay response data:",
      JSON.stringify(responseData, null, 2)
    );

    // Return success response for Razorpay
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Razorpay order error:", error);
    return NextResponse.json(
      {
        error: "Payment gateway error. Please try again later.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
