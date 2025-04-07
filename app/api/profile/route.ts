import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/db"
import User from "@/lib/models/user.model"
import { uploadImage } from "@/lib/cloudinary"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    await connectDB()

    const user = await User.findById(userId).select("-password")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { phone, address, bio, profileImage } = await req.json()

    await connectDB()

    const user = await User.findById(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update fields if provided
    if (phone !== undefined) user.phone = phone
    if (address !== undefined) user.address = address
    if (bio !== undefined) user.bio = bio

    // Upload profile image if provided
    if (profileImage) {
      const imageUrl = await uploadImage(profileImage)
      user.profileImage = imageUrl
    }

    await user.save()

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        profileImage: user.profileImage,
      },
    })
  } catch (error: any) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 })
  }
}

