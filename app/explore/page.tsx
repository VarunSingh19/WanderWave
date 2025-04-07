"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, calculateDaysLeft } from "@/lib/utils"
import { Search, Calendar, Users, Tag, Globe } from "lucide-react"

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

export default function ExplorePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPublicTrips()
  }, [])

  const fetchPublicTrips = async () => {
    try {
      const response = await fetch("/api/trips?public=true")
      const data = await response.json()

      if (response.ok) {
        setTrips(data.trips)
      }
    } catch (error) {
      console.error("Error fetching public trips:", error)
    } finally {
      setLoading(false)
    }
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

      {filteredTrips.length === 0 ? (
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
          {filteredTrips.map((trip) => (
            <Link key={trip._id} href={`/trips/${trip._id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{trip.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{trip.description}</CardDescription>
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
                        {trip.category.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full">
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {trip.members.slice(0, 3).map((member) => (
                          <Avatar key={member.user._id} className="border-2 border-white w-7 h-7">
                            <AvatarImage src={member.user.profileImage} alt={member.user.name} />
                            <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <div className="ml-auto text-sm font-medium">
                        {calculateDaysLeft(trip.startDate) > 0
                          ? `${calculateDaysLeft(trip.startDate)} days left`
                          : "Trip ended"}
                      </div>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

