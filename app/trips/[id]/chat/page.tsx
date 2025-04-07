"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import TripChat from "@/components/trip-chat"
import { ArrowLeft } from "lucide-react"

interface Trip {
  _id: string
  name: string
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

export default function TripChatPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const tripId = params.id as string

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }

    if (status === "authenticated") {
      fetchTrip()
    }
  }, [status, router, tripId])

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`)
      const data = await response.json()

      if (response.ok) {
        setTrip(data.trip)
      } else {
        router.push("/trips")
      }
    } catch (error) {
      console.error("Error fetching trip:", error)
      router.push("/trips")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="mb-6">
          <Skeleton className="w-1/3 h-10 mb-2" />
          <Skeleton className="w-1/2 h-6" />
        </div>

        <Skeleton className="w-full h-[600px]" />
      </div>
    )
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
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/trips/${tripId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trip
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{trip.name} - Chat</h1>
        <p className="mt-2 text-gray-600">Communicate with your trip members in real-time</p>
      </div>

      <TripChat tripId={tripId} />
    </div>
  )
}

