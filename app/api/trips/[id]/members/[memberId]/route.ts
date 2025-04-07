import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/db";
import Trip, { MemberRole, MemberStatus } from "@/lib/models/trip.model";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const tripId = params.id;
    const memberId = params.memberId;
    const { role, status } = await req.json();

    await connectDB();

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if current user is authorized to update members
    const userMember = trip.members.find(
      (member) =>
        member.user.toString() === userId &&
        member.status === MemberStatus.ACCEPTED
    );

    if (!userMember || userMember.role !== MemberRole.AUTHOR) {
      return NextResponse.json(
        { error: "Only the trip author can update members" },
        { status: 403 }
      );
    }

    // Find the member to update
    const memberToUpdate = trip.members.find(
      (member) => member.user.toString() === memberId
    );

    if (!memberToUpdate) {
      return NextResponse.json(
        { error: "Member not found in this trip" },
        { status: 404 }
      );
    }

    // Update the member
    if (role) {
      memberToUpdate.role = role;
    }

    if (status) {
      // For handling join requests or changing status
      memberToUpdate.status = status;
    }

    await trip.save();

    return NextResponse.json({
      message: "Member updated successfully",
      member: memberToUpdate,
    });
  } catch (error: any) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const tripId = params.id;
    const memberId = params.memberId;

    await connectDB();

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if current user is authorized to remove members
    const userMember = trip.members.find(
      (member) =>
        member.user.toString() === userId &&
        member.status === MemberStatus.ACCEPTED
    );

    if (!userMember || userMember.role !== MemberRole.AUTHOR) {
      // Only author can remove members
      return NextResponse.json(
        { error: "Only the trip author can remove members" },
        { status: 403 }
      );
    }

    // Can't remove the author
    const memberToRemove = trip.members.find(
      (member) => member.user.toString() === memberId
    );

    if (!memberToRemove) {
      return NextResponse.json(
        { error: "Member not found in this trip" },
        { status: 404 }
      );
    }

    if (memberToRemove.role === MemberRole.AUTHOR) {
      return NextResponse.json(
        { error: "Cannot remove the trip author" },
        { status: 400 }
      );
    }

    // Remove the member
    trip.members = trip.members.filter(
      (member) => member.user.toString() !== memberId
    );

    await trip.save();

    return NextResponse.json({
      message: "Member removed successfully",
    });
  } catch (error: any) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove member" },
      { status: 500 }
    );
  }
}
