// File: app/trips/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatCurrency, calculateTripDuration } from "@/lib/utils";
import { Calendar, Users, Tag, Wallet, MoreVertical, Edit, Trash2, UserCheck, UserMinus } from "lucide-react";
import TripMembers from "@/components/trip-members";
import TripExpenses from "@/components/trip-expenses";
import TripChat from "@/components/trip-chat";

interface Member {
  user: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  role: string;
  status: string;
  addedBy: string; // Add this field to match the definition in trip-members.tsx
}

interface Trip {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  category: string;
  isPublic: boolean;
  thumbnail: string;
  minMembers: number;
  members: Member[]; // This will now be compatible with the TripMembers component
  expenses: any[];
  wallet: {
    balance: number;
    pendingWithdrawal: boolean;
    withdrawalApprovals: string[];
  };
}

export default function TripDetailsPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Member[]>([]);
  const [processingRequestIds, setProcessingRequestIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchTrip();
    }
  }, [status, router, id]);

  useEffect(() => {
    // Extract pending join requests when trip data is loaded
    if (trip) {
      const requests = trip.members.filter(member => member.status === "requested");
      setPendingRequests(requests);
    }
  }, [trip]);

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${id}`);
      const data = await response.json();

      if (response.ok) {
        // Populate shares.user with member information for each expense
        if (data.trip && data.trip.expenses) {
          data.trip.expenses.forEach((expense: { shares: { user: any }[] }) => {
            if (expense.shares) {
              expense.shares.forEach((share) => {
                // If share.user is just an ID or is undefined
                if (!share.user || typeof share.user === 'string' || !share.user.name) {
                  // Find the member with matching ID from the trip members
                  const member = data.trip.members.find((m: Member) =>
                    m.user._id === (typeof share.user === 'string' ? share.user : share.user?._id)
                  );
                  // If found, replace with the full user object
                  if (member) {
                    share.user = member.user;
                  }
                }
              });
            }
          });
        }
        setTrip(data.trip);
      } else {
        if (data.error === "You do not have access to this trip") {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this trip. You must be an accepted member.",
            variant: "destructive",
          });
        }
        router.push("/trips");
      }
    } catch (error) {
      console.error("Error fetching trip:", error);
      router.push("/trips");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTrip = () => {
    router.push(`/trips/${id}/edit`);
  };

  const handleDeleteTrip = async () => {
    if (!trip) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/trips/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Trip Deleted",
          description: "Trip has been successfully deleted",
        });
        router.push("/trips");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete trip");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleRequestAction = async (memberId: string, action: "approve" | "reject") => {
    setProcessingRequestIds(prev => ({ ...prev, [memberId]: true }));

    try {
      const response = await fetch(`/api/trips/${id}/members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: action === "approve" ? "accepted" : "rejected"
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} member request`);
      }

      // Update the local state to reflect the change
      setTrip(prevTrip => {
        if (!prevTrip) return null;

        const updatedMembers = prevTrip.members.map(member => {
          if (member.user._id === memberId) {
            return {
              ...member,
              status: action === "approve" ? "accepted" : "rejected"
            };
          }
          return member;
        });

        return {
          ...prevTrip,
          members: updatedMembers
        };
      });

      // Update the pending requests list
      setPendingRequests(prev => prev.filter(req => req.user._id !== memberId));

      toast({
        title: `Request ${action === "approve" ? "Approved" : "Rejected"}`,
        description: `Member request has been ${action === "approve" ? "approved" : "rejected"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingRequestIds(prev => ({ ...prev, [memberId]: false }));
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="mb-6">
          <Skeleton className="w-1/3 h-10 mb-2" />
          <Skeleton className="w-1/2 h-6" />
        </div>

        <Skeleton className="w-full h-[200px] mb-6" />

        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="p-8 text-center bg-white rounded-lg shadow">
          <h3 className="mb-2 text-xl font-semibold">Trip not found</h3>
          <p className="mb-4 text-gray-600">
            The trip you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/trips")}>Back to Trips</Button>
        </div>
      </div>
    );
  }

  const isAuthor = trip.members.some(
    (member) =>
      member.user._id === session?.user.id && member.role === "author"
  );

  const isAcceptedMember = trip.members.some(
    (member) =>
      member.user._id === session?.user.id && member.status === "accepted"
  );

  if (!isAcceptedMember) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="p-8 text-center bg-white rounded-lg shadow">
          <h3 className="mb-2 text-xl font-semibold">Access Restricted</h3>
          <p className="mb-4 text-gray-600">
            You need to be an accepted member to view this trip's details.
          </p>
          <Button onClick={() => router.push("/trips")}>Back to Trips</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{trip.name}</h1>

          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Trip Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleEditTrip}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Trip
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Trip
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="relative h-64 mb-6 overflow-hidden rounded-xl">
          <Image
            src={trip.thumbnail || "/images/placeholder.jpg"}
            alt={trip.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="outline" className="capitalize bg-white/20 text-white mb-2">
                  {trip.category.replace("_", " ")}
                </Badge>
                <p className="text-white/80">{trip.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAuthor && pendingRequests.length > 0 && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Join Requests ({pendingRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map(request => (
                <div key={request.user._id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Avatar className="w-10 h-10 mr-3">
                      <AvatarImage src={request.user.profileImage} alt={request.user.name} />
                      <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.user.name}</p>
                      <p className="text-sm text-gray-500">{request.user.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-500 text-green-700 hover:bg-green-50"
                      onClick={() => handleRequestAction(request.user._id, "approve")}
                      disabled={processingRequestIds[request.user._id]}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-700 hover:bg-red-50"
                      onClick={() => handleRequestAction(request.user._id, "reject")}
                      disabled={processingRequestIds[request.user._id]}
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Trip Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                <span>
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600 ml-7">
                {calculateTripDuration(trip.startDate, trip.endDate)} day trip
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary" />
              <span>
                {trip.members.filter(m => m.status === "accepted").length} members
                {trip.minMembers > 0 &&
                  <span className="text-sm text-gray-500"> (min: {trip.minMembers})</span>
                }
              </span>
              <div className="flex ml-auto -space-x-2">
                {trip.members
                  .filter(m => m.status === "accepted")
                  .slice(0, 3)
                  .map((member) => (
                    <Avatar
                      key={member.user._id}
                      className="border-2 border-white w-7 h-7"
                    >
                      <AvatarImage
                        src={member.user.profileImage}
                        alt={member.user.name}
                      />
                      <AvatarFallback>
                        {member.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                {trip.members.filter(m => m.status === "accepted").length > 3 && (
                  <div className="flex items-center justify-center w-7 h-7 text-xs font-medium text-white bg-primary rounded-full border-2 border-white">
                    +{trip.members.filter(m => m.status === "accepted").length - 3}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Trip Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Wallet className="w-5 h-5 mr-2 text-primary" />
              <span>{formatCurrency(trip.wallet.balance)}</span>
              {isAuthor && trip.wallet.balance > 0 && (
                <Button variant="outline" size="sm" className="ml-auto">
                  Withdraw
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trip Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-1 font-medium">Description</h3>
                    <p className="text-gray-600">{trip.description}</p>
                  </div>
                  <div>
                    <h3 className="mb-1 font-medium">Category</h3>
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-primary" />
                      <span className="capitalize">
                        {trip.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 font-medium">Visibility</h3>
                    <div className="flex items-center">
                      <span>{trip.isPublic ? "Public" : "Private"}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 font-medium">Minimum Members</h3>
                    <div className="flex items-center">
                      <span>{trip.minMembers} members required</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {trip.expenses.length === 0 ? (
                  <p className="text-gray-600">No recent activity</p>
                ) : (
                  <div className="space-y-4">
                    {trip.expenses.slice(0, 5).map((expense) => (
                      <div
                        key={expense._id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <p className="text-sm text-gray-600">
                            Added by {expense.addedBy.name} on{" "}
                            {formatDate(expense.date)}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <TripMembers
            tripId={id as string}
            members={trip.members}
            isAuthor={isAuthor}
            onUpdate={fetchTrip}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <TripExpenses
            tripId={id as string}
            expenses={trip.expenses}
            members={trip.members}
            onUpdate={fetchTrip}
          />
        </TabsContent>

        <TabsContent value="chat">
          <TripChat tripId={id as string} />
        </TabsContent>
      </Tabs>

      {/* Delete Trip Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trip</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this trip? This action cannot be undone.
              All trip data, expenses, and messages will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTrip} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
