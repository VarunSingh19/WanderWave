"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, calculateDaysLeft, calculateTripDuration } from "@/lib/utils"
import { PlusCircle, Users, Calendar, Tag } from "lucide-react"

interface Trip {
  _id: string
  name: string
  description: string
  startDate: string
  endDate: string
  category: string
  isPublic: boolean
  members: {
    user: {
      _id: string
      name: string
      email: string
      profileImage?: string
    }
    role: string
    status: string
  }[]
}

export default function TripsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }

    if (status === "authenticated") {
      fetchTrips()
    }
  }, [status, router])

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/trips")
      const data = await response.json()

      if (response.ok) {
        setTrips(data.trips)
      } else {
        console.error("Failed to fetch trips:", data.error)
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
    } finally {
      setLoading(false)
    }
  }

  const upcomingTrips = trips.filter((trip) => calculateDaysLeft(trip.startDate, trip.endDate) >= 0)
  const pastTrips = trips.filter((trip) => calculateDaysLeft(trip.startDate, trip.endDate) < 0)

  if (status === "loading" || loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Trips</h1>
          <Skeleton className="w-32 h-10" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Trips</h1>
        <Link href="/trips/new">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            New Trip
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingTrips.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg shadow">
              <h3 className="mb-2 text-xl font-semibold">No upcoming trips</h3>
              <p className="mb-4 text-gray-600">
                You don't have any upcoming trips. Create a new trip to get started.
              </p>
              <Link href="/trips/new">
                <Button>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Trip
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingTrips.map((trip) => (
                <Link key={trip._id} href={`/trips/${trip._id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <CardTitle>{trip.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {trip.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{trip.members.length} members</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Tag className="w-4 h-4 mr-2" />
                          <Badge variant="outline" className="capitalize">
                            {trip.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="w-full">
                        <div className="text-sm font-medium text-right">
                          {calculateDaysLeft(trip.startDate, trip.endDate) === 0
                            ? 'Today'
                            : `${calculateDaysLeft(trip.startDate, trip.endDate)} days left (${calculateTripDuration(trip.startDate, trip.endDate)} day trip)`}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastTrips.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg shadow">
              <h3 className="mb-2 text-xl font-semibold">No past trips</h3>
              <p className="text-gray-600">
                You don't have any past trips.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastTrips.map((trip) => (
                <Link key={trip._id} href={`/trips/${trip._id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <CardTitle>{trip.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {trip.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{trip.members.length} members</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Tag className="w-4 h-4 mr-2" />
                          <Badge variant="outline" className="capitalize">
                            {trip.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="w-full">
                        <div className="text-sm font-medium text-right">
                          Completed
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
