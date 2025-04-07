import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/db"
import User from "@/lib/models/user.model"
import Transaction from "@/lib/models/transaction.model"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    await connectDB()

    const user = await User.findById(userId).select("wallet")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get transactions
    const transactions = await Transaction.find({ user: userId })
      .populate("trip", "name")
      .populate("expense", "title")
      .sort({ createdAt: -1 })

    return NextResponse.json({
      wallet: user.wallet,
      transactions,
    })
  } catch (error: any) {
    console.error("Error fetching wallet:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch wallet" }, { status: 500 })
  }
}

