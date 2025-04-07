// Debug file to test wallet API response

export async function testWalletAPI() {
  try {
    console.log("Testing Stripe payment initialization");

    // Make API request for Stripe
    const stripeResponse = await fetch("/api/profile/wallet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 100,
        paymentMethod: "stripe",
      }),
    });

    console.log("Stripe API Status:", stripeResponse.status);

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error("Stripe API Error:", errorText);
      return {
        success: false,
        error: `Failed to initialize Stripe payment: ${stripeResponse.status} ${stripeResponse.statusText}`,
      };
    }

    console.log(
      "Stripe API Response Headers:",
      Object.fromEntries(stripeResponse.headers.entries())
    );

    const stripeData = await stripeResponse.json();
    console.log("Stripe Payment Data:", stripeData);

    return {
      success: true,
      stripe: stripeData,
    };
  } catch (error: any) {
    console.error("Test error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

export async function testRazorpayAPI() {
  try {
    console.log("Testing Razorpay payment initialization");

    // Make API request for Razorpay
    const razorpayResponse = await fetch("/api/profile/wallet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 100,
        paymentMethod: "razorpay",
      }),
    });

    console.log("Razorpay API Status:", razorpayResponse.status);

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error("Razorpay API Error:", errorText);
      return {
        success: false,
        error: `Failed to initialize Razorpay payment: ${razorpayResponse.status} ${razorpayResponse.statusText}`,
      };
    }

    console.log(
      "Razorpay API Response Headers:",
      Object.fromEntries(razorpayResponse.headers.entries())
    );

    const razorpayData = await razorpayResponse.json();
    console.log("Razorpay Payment Data:", razorpayData);

    return {
      success: true,
      razorpay: razorpayData,
    };
  } catch (error: any) {
    console.error("Test error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}
