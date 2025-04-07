import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/db";
import Trip, { MemberRole, MemberStatus } from "@/lib/models/trip.model";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const isPublic = searchParams.get("public") === "true";

    await connectDB();

    if (isPublic) {
      // Get public trips - no authentication needed
      const publicTrips = await Trip.find({ isPublic: true })
        .populate("members.user", "name email profileImage")
        .sort({ createdAt: -1 });

      return NextResponse.json({ trips: publicTrips });
    } else {
      // For user's trips, authentication is required
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const userId = session.user.id;

      // Get user's trips
      const userTrips = await Trip.find({
        "members.user": userId,
        "members.status": MemberStatus.ACCEPTED,
      })
        .populate("members.user", "name email profileImage")
        .sort({ createdAt: -1 });

      return NextResponse.json({ trips: userTrips });
    }
  } catch (error: any) {
    console.error("Error fetching trips:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch trips" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const {
      name,
      description,
      startDate,
      endDate,
      category,
      isPublic,
      members,
      thumbnail,
      minMembers,
    } = await req.json();

    if (!name || !description || !startDate || !endDate || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate minMembers
    const validMinMembers = minMembers ? parseInt(minMembers) : 2;
    if (isNaN(validMinMembers) || validMinMembers < 1 || validMinMembers > 20) {
      return NextResponse.json(
        { error: "Minimum members must be between 1 and 20" },
        { status: 400 }
      );
    }

    await connectDB();

    // Create trip with author as first member
    const trip = await Trip.create({
      name,
      description,
      startDate,
      endDate,
      category,
      isPublic: isPublic || false,
      thumbnail: thumbnail || "/images/placeholder.jpg", // Use provided thumbnail or default
      minMembers: validMinMembers,
      members: [
        {
          user: userId,
          role: MemberRole.AUTHOR,
          status: MemberStatus.ACCEPTED,
          addedBy: userId,
        },
      ],
    });

    // Add additional members if provided
    if (members && members.length > 0) {
      const memberPromises = members.map(async (memberId: string) => {
        return {
          user: memberId,
          role: MemberRole.PARTICIPANT,
          status: MemberStatus.INVITED,
          addedBy: userId,
        };
      });

      const newMembers = await Promise.all(memberPromises);

      await Trip.findByIdAndUpdate(trip._id, {
        $push: { members: { $each: newMembers } },
      });
    }

    return NextResponse.json(
      {
        message: "Trip created successfully",
        trip: {
          id: trip._id,
          name: trip.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating trip:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create trip" },
      { status: 500 }
    );
  }
}
