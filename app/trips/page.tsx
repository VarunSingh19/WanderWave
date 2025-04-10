"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, calculateDaysLeft, calculateTripDuration } from "./utils"
import { PlusCircle, Users, Calendar, Tag, MapPin, ChevronRight, Clock, Search, Filter, SlidersHorizontal } from 'lucide-react'

// Import Apple styles
import "./trip.css"

interface Trip {
  _id: string
  name: string
  description: string
  startDate: string
  endDate: string
  category: string
  isPublic: boolean
  thumbnail?: string
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
  const [searchQuery, setSearchQuery] = useState("")

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

  // Filter trips based on search query
  const filteredUpcomingTrips = upcomingTrips.filter(trip =>
    trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPastTrips = pastTrips.filter(trip =>
    trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === "loading" || loading) {
    return (
      <div className="apple-container">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="flex mb-6">
            <Skeleton className="h-10 w-32 mr-2" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[280px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="apple-container">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold">My Trips</h1>
          <Link href="/trips/new">
            <button className="apple-button flex items-center">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Trip
            </button>
          </Link>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="apple-search-container">
            <Search className="apple-search-icon" />
            <input
              type="text"
              placeholder="Search trips by name, description or category"
              className="apple-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="apple-search-clear"
                onClick={() => setSearchQuery("")}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="apple-tabs mb-8">
          <button
            className={`apple-tab ${activeTab === "upcoming" ? "apple-tab-active" : ""}`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`apple-tab ${activeTab === "past" ? "apple-tab-active" : ""}`}
            onClick={() => setActiveTab("past")}
          >
            Past
          </button>
        </div>

        {/* Upcoming Trips */}
        {activeTab === "upcoming" && (
          <>
            {filteredUpcomingTrips.length === 0 ? (
              <div className="apple-empty-state">
                <div className="apple-empty-state-icon">
                  <Calendar className="w-12 h-12 text-[var(--apple-blue)]" />
                </div>
                <h3 className="apple-empty-state-title">No upcoming trips</h3>
                <p className="apple-empty-state-description">
                  {searchQuery
                    ? "No trips match your search criteria. Try a different search term."
                    : "You don't have any upcoming trips. Create a new trip to get started."}
                </p>
                {!searchQuery && (
                  <Link href="/trips/new">
                    <button className="apple-button mt-4">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Trip
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUpcomingTrips.map((trip) => (
                  <Link key={trip._id} href={`/trips/${trip._id}`} className="block h-full">
                    <div className="apple-trip-card h-full">
                      <div className="apple-trip-card-image">
                        <img
                          src={
                            trip.thumbnail ||
                            `https://source.unsplash.com/random/600x400/?${encodeURIComponent(trip.category || "travel")}`
                          }
                          alt={trip.name}
                        />
                        <div className="apple-trip-card-category">
                          <Tag className="w-3 h-3 mr-1" />
                          <span className="capitalize">{trip.category}</span>
                        </div>
                      </div>
                      <div className="apple-trip-card-content">
                        <h3 className="apple-trip-card-title">{trip.name}</h3>
                        <p className="apple-trip-card-description line-clamp-2">{trip.description}</p>

                        <div className="apple-trip-card-info">
                          <div className="apple-trip-card-info-item">
                            <Calendar className="w-4 h-4 text-[var(--apple-blue)]" />
                            <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                          </div>
                          <div className="apple-trip-card-info-item">
                            <Users className="w-4 h-4 text-[var(--apple-purple)]" />
                            <span>{trip.members.length} members</span>
                          </div>
                        </div>

                        <div className="apple-trip-card-footer">
                          <div className="apple-trip-days-left">
                            {calculateDaysLeft(trip.startDate, trip.endDate) === 0
                              ? <span className="apple-badge apple-badge-green">Today</span>
                              : <span className="apple-badge apple-badge-blue">
                                {calculateDaysLeft(trip.startDate, trip.endDate)} days left
                              </span>
                            }
                          </div>
                          <div className="apple-trip-duration">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{calculateTripDuration(trip.startDate, trip.endDate)} days</span>
                          </div>
                        </div>
                      </div>
                      <div className="apple-trip-card-arrow">
                        <ChevronRight className="w-5 h-5 text-[var(--apple-gray)]" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Past Trips */}
        {activeTab === "past" && (
          <>
            {filteredPastTrips.length === 0 ? (
              <div className="apple-empty-state">
                <div className="apple-empty-state-icon">
                  <Clock className="w-12 h-12 text-[var(--apple-gray)]" />
                </div>
                <h3 className="apple-empty-state-title">No past trips</h3>
                <p className="apple-empty-state-description">
                  {searchQuery
                    ? "No past trips match your search criteria. Try a different search term."
                    : "You don't have any past trips yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPastTrips.map((trip) => (
                  <Link key={trip._id} href={`/trips/${trip._id}`} className="block h-full">
                    <div className="apple-trip-card h-full apple-trip-card-past">
                      <div className="apple-trip-card-image">
                        <img
                          src={
                            trip.thumbnail ||
                            `https://source.unsplash.com/random/600x400/?${encodeURIComponent(trip.category || "travel")}`
                          }
                          alt={trip.name}
                          className="grayscale-[30%]"
                        />
                        <div className="apple-trip-card-category">
                          <Tag className="w-3 h-3 mr-1" />
                          <span className="capitalize">{trip.category}</span>
                        </div>
                      </div>
                      <div className="apple-trip-card-content">
                        <h3 className="apple-trip-card-title">{trip.name}</h3>
                        <p className="apple-trip-card-description line-clamp-2">{trip.description}</p>

                        <div className="apple-trip-card-info">
                          <div className="apple-trip-card-info-item">
                            <Calendar className="w-4 h-4 text-[var(--apple-gray)]" />
                            <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                          </div>
                          <div className="apple-trip-card-info-item">
                            <Users className="w-4 h-4 text-[var(--apple-gray)]" />
                            <span>{trip.members.length} members</span>
                          </div>
                        </div>

                        <div className="apple-trip-card-footer">
                          <div className="apple-trip-days-left">
                            <span className="apple-badge apple-badge-gray">Completed</span>
                          </div>
                          <div className="apple-trip-duration">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{calculateTripDuration(trip.startDate, trip.endDate)} days</span>
                          </div>
                        </div>
                      </div>
                      <div className="apple-trip-card-arrow">
                        <ChevronRight className="w-5 h-5 text-[var(--apple-gray)]" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
