// File: app/trips/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Calendar, Users, Tag, Wallet } from "lucide-react";
import TripMembers from "@/components/trip-members";
import TripExpenses from "@/components/trip-expenses";
import TripChat from "@/components/trip-chat";

interface Trip {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  category: string;
  isPublic: boolean;
  members: {
    user: {
      _id: string;
      name: string;
      email: string;
      profileImage?: string;
    };
    role: string;
    status: string;
  }[];
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
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchTrip();
    }
  }, [status, router, id]);

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${id}`);
      const data = await response.json();

      if (response.ok) {
        setTrip(data.trip);
      } else {
        router.push("/trips");
      }
    } catch (error) {
      console.error("Error fetching trip:", error);
      router.push("/trips");
    } finally {
      setLoading(false);
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

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{trip.name}</h1>
          <Badge variant="outline" className="capitalize">
            {trip.category.replace("_", " ")}
          </Badge>
        </div>
        <p className="mt-2 text-gray-600">{trip.description}</p>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Trip Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" />
              <span>
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </span>
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
              <span>{trip.members.length} members</span>
              <div className="flex ml-auto -space-x-2">
                {trip.members.slice(0, 3).map((member) => (
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
                {trip.members.length > 3 && (
                  <div className="flex items-center justify-center w-7 h-7 text-xs font-medium text-white bg-primary rounded-full border-2 border-white">
                    +{trip.members.length - 3}
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
            tripId={id}
            members={trip.members}
            isAuthor={isAuthor}
            onUpdate={fetchTrip}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <TripExpenses
            tripId={id}
            expenses={trip.expenses}
            members={trip.members}
            onUpdate={fetchTrip}
          />
        </TabsContent>

        <TabsContent value="chat">
          <TripChat tripId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
