// File: app/api/trips/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/db";
import Trip, { MemberRole, MemberStatus } from "@/lib/models/trip.model";
import { authOptions } from "@/lib/auth";

export async function GET(
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

    const trip = await Trip.findById(tripId)
      .populate("members.user", "name email profileImage")
      .populate({
        path: "expenses",
        populate: {
          path: "addedBy",
          select: "name email profileImage",
        },
      });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if user has access to this trip
    const isMember = trip.members.some(
      (member: any) =>
        member.user._id.toString() === userId &&
        member.status === MemberStatus.ACCEPTED
    );

    const isPublic = trip.isPublic;

    if (!isMember && !isPublic) {
      return NextResponse.json(
        { error: "You do not have access to this trip" },
        { status: 403 }
      );
    }

    return NextResponse.json({ trip });
  } catch (error: any) {
    console.error("Error fetching trip:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch trip" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const tripId = params.id;
    const updateData = await req.json();

    await connectDB();

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if user is author or co-leader
    const userMember = trip.members.find(
      (member: any) =>
        member.user.toString() === userId &&
        member.status === MemberStatus.ACCEPTED
    );

    if (
      !userMember ||
      (userMember.role !== MemberRole.AUTHOR &&
        userMember.role !== MemberRole.CO_LEADER)
    ) {
      return NextResponse.json(
        { error: "You do not have permission to update this trip" },
        { status: 403 }
      );
    }

    // Update trip
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      message: "Trip updated successfully",
      trip: updatedTrip,
    });
  } catch (error: any) {
    console.error("Error updating trip:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update trip" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if user is author
    const isAuthor = trip.members.some(
      (member: any) =>
        member.user.toString() === userId && member.role === MemberRole.AUTHOR
    );

    if (!isAuthor) {
      return NextResponse.json(
        { error: "Only the trip author can delete this trip" },
        { status: 403 }
      );
    }

    // Delete trip
    await Trip.findByIdAndDelete(tripId);

    return NextResponse.json({
      message: "Trip deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting trip:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete trip" },
      { status: 500 }
    );
  }
}
