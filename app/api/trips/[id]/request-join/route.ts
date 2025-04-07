import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/db";
import Trip, { MemberRole, MemberStatus } from "@/lib/models/trip.model";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

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
    const tripId = params.id;

    await connectDB();

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if the trip is public
    if (!trip.isPublic) {
      return NextResponse.json(
        { error: "This trip is not open for join requests" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = trip.members.find(
      (member) => member.user.toString() === userId
    );

    if (existingMember) {
      // Update status to requested if it was previously rejected
      if (existingMember.status === MemberStatus.REJECTED) {
        existingMember.status = MemberStatus.REQUESTED;
        await trip.save();

        return NextResponse.json({
          message: "Request sent successfully",
        });
      }

      return NextResponse.json(
        {
          error: `You are already a ${existingMember.status} member of this trip`,
          status: existingMember.status,
        },
        { status: 400 }
      );
    }

    // Add user as a member with requested status
    trip.members.push({
      user: new mongoose.Types.ObjectId(userId),
      role: MemberRole.PARTICIPANT,
      status: MemberStatus.REQUESTED,
      addedBy: new mongoose.Types.ObjectId(userId), // Self-requested
    });

    await trip.save();

    return NextResponse.json({
      message: "Request sent successfully",
    });
  } catch (error: any) {
    console.error("Error requesting to join trip:", error);
    return NextResponse.json(
      { error: error.message || "Failed to request to join trip" },
      { status: 500 }
    );
  }
}
