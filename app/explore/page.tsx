"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, calculateDaysLeft } from "@/lib/utils"
import { Search, Calendar, Users, Tag, Globe, LogIn, UserPlus, Check, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Trip {
  _id: string
  name: string
  description: string
  startDate: string
  endDate: string
  category: string
  isPublic: boolean
  thumbnail: string
  minMembers: number
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

export default function ExplorePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [requestingTrips, setRequestingTrips] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchPublicTrips()
  }, [])

  const fetchPublicTrips = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/trips?public=true")

      if (!response.ok) {
        throw new Error("Failed to fetch public trips")
      }

      const data = await response.json()
      setTrips(data.trips)
    } catch (error) {
      console.error("Error fetching public trips:", error)
      setError("Failed to load trips. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleTripClick = (tripId: string) => {
    if (status === "unauthenticated") {
      // If user is not logged in, redirect to login page
      router.push("/login")
    } else {
      // If user is logged in, check if they are a member with accepted status
      const trip = trips.find(t => t._id === tripId)
      if (trip) {
        const isMember = trip.members.some(
          member =>
            member.user._id === session?.user.id &&
            member.status === "accepted"
        )

        if (isMember) {
          // If user is an accepted member, navigate to trip page
          router.push(`/trips/${tripId}`)
        } else {
          // If not a member, show a toast notification
          toast({
            title: "Access Restricted",
            description: "You need to be an accepted member to view this trip",
            variant: "default",
          })
        }
      }
    }
  }

  const requestToJoin = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation() // Prevent navigating to the trip page

    if (status !== "authenticated") {
      router.push("/login")
      return
    }

    try {
      setRequestingTrips(prev => ({ ...prev, [tripId]: true }))

      const response = await fetch(`/api/trips/${tripId}/request-join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to request to join trip")
      }

      toast({
        title: "Request Sent",
        description: "Your request to join this trip has been sent to the trip owner",
        variant: "default",
      })

      // Update local trips data to reflect request status
      setTrips(prevTrips =>
        prevTrips.map(trip => {
          if (trip._id === tripId) {
            // Add the current user as a member with "requested" status
            const updatedMembers = [...trip.members]
            const existingMemberIndex = updatedMembers.findIndex(
              m => m.user._id === session?.user.id
            )

            if (existingMemberIndex >= 0) {
              updatedMembers[existingMemberIndex].status = "requested"
            } else {
              updatedMembers.push({
                user: {
                  _id: session!.user.id,
                  name: session!.user.name || "",
                  email: session!.user.email || "",
                  profileImage: session!.user.image ?? undefined
                },
                role: "participant",
                status: "requested"
              })
            }

            return {
              ...trip,
              members: updatedMembers
            }
          }
          return trip
        })
      )
    } catch (error: any) {
      toast({
        title: "Failed to request",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setRequestingTrips(prev => ({ ...prev, [tripId]: false }))
    }
  }

  const getMemberStatus = (trip: Trip) => {
    if (!session?.user.id) return null

    const member = trip.members.find(m => m.user._id === session.user.id)
    return member ? member.status : null
  }

  const filteredTrips = trips.filter(
    (trip) =>
      trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Explore Trips</h1>
        </div>

        <div className="mb-6">
          <Skeleton className="w-full h-10" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Explore Trips</h1>
        {status === "unauthenticated" && (
          <Button onClick={() => router.push("/login")}>
            <LogIn className="w-4 h-4 mr-2" />
            Login
          </Button>
        )}
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search trips by name, description, or category..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md">
          <p>{error}</p>
          <Button variant="outline" className="mt-2" onClick={fetchPublicTrips}>
            Try Again
          </Button>
        </div>
      )}

      {filteredTrips.length === 0 && !error ? (
        <div className="p-8 text-center bg-white rounded-lg shadow">
          <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-xl font-semibold">No public trips found</h3>
          <p className="mb-4 text-gray-600">
            {searchTerm
              ? `No trips match your search for "${searchTerm}"`
              : "There are no public trips available at the moment."}
          </p>
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map((trip) => {
            const memberStatus = getMemberStatus(trip)
            const isAcceptedMember = memberStatus === "accepted"
            const hasRequestedToJoin = memberStatus === "requested"
            const isPending = memberStatus === "pending" || memberStatus === "invited"

            return (
              <Card
                key={trip._id}
                className="h-full overflow-hidden transition-shadow hover:shadow-md flex flex-col"
              >
                <div
                  className="relative h-48 cursor-pointer"
                  onClick={() => isAcceptedMember && handleTripClick(trip._id)}
                >
                  <Image
                    src={trip.thumbnail || "/images/placeholder.jpg"}
                    alt={trip.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white">{trip.name}</h3>
                    <p className="text-sm text-white/80 line-clamp-1">{trip.description}</p>
                  </div>
                </div>

                <CardContent className="flex-grow py-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>
                        {trip.members.filter(m => m.status === "accepted").length} members
                        {trip.minMembers > 0 &&
                          ` (min: ${trip.minMembers})`
                        }
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag className="w-4 h-4 mr-2" />
                      <Badge variant="outline" className="capitalize">
                        {trip.category.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {trip.members
                          .filter(member => member.status === "accepted")
                          .slice(0, 3)
                          .map((member) => (
                            <Avatar key={member.user._id} className="border-2 border-white w-7 h-7">
                              <AvatarImage src={member.user.profileImage} alt={member.user.name} />
                              <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ))}
                      </div>

                      {status === "authenticated" && !isAcceptedMember && !isPending && (
                        <div>
                          {hasRequestedToJoin ? (
                            <Badge variant="outline" className="bg-gray-100">
                              <Clock className="w-3 h-3 mr-1" />
                              Request Pending
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => requestToJoin(e, trip._id)}
                              disabled={requestingTrips[trip._id]}
                            >
                              {requestingTrips[trip._id] ? (
                                "Requesting..."
                              ) : (
                                <>
                                  <UserPlus className="w-3 h-3 mr-1" />
                                  Request to Join
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}

                      {isPending && (
                        <Badge variant="outline" className="bg-yellow-100">
                          <Clock className="w-3 h-3 mr-1" />
                          Invitation Pending
                        </Badge>
                      )}

                      {isAcceptedMember && (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Member
                        </Badge>
                      )}
                    </div>

                    {isAcceptedMember && (
                      <Button
                        className="w-full mt-3"
                        size="sm"
                        onClick={() => handleTripClick(trip._id)}
                      >
                        View Trip Details
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
