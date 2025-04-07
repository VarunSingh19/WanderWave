import Razorpay from "razorpay";

const RAZORPAY_KEY_ID = "rzp_test_hylrDzoeoSNVKm";
const RAZORPAY_KEY_SECRET = "KJfN1SqGBozf5fRGCylIRwe7";

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID!,
  key_secret: RAZORPAY_KEY_SECRET!,
});

export default razorpay;
