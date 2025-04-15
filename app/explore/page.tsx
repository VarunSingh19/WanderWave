// "use client"

// import { useEffect, useState } from "react"
// import Link from "next/link"
// import Image from "next/image"
// import { useRouter } from "next/navigation"
// import { useSession } from "next-auth/react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { formatDate, calculateDaysLeft } from "@/lib/utils"
// import { Search, Calendar, Users, Tag, Globe, LogIn, UserPlus, Check, Clock } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"

// interface Trip {
//   _id: string
//   name: string
//   description: string
//   startDate: string
//   endDate: string
//   category: string
//   isPublic: boolean
//   thumbnail: string
//   minMembers: number
//   members: {
//     user: {
//       _id: string
//       name: string
//       email: string
//       profileImage?: string
//     }
//     role: string
//     status: string
//   }[]
// }

// export default function ExplorePage() {
//   const { data: session, status } = useSession()
//   const router = useRouter()
//   const { toast } = useToast()
//   const [trips, setTrips] = useState<Trip[]>([])
//   const [loading, setLoading] = useState(true)
//   const [searchTerm, setSearchTerm] = useState("")
//   const [error, setError] = useState<string | null>(null)
//   const [requestingTrips, setRequestingTrips] = useState<Record<string, boolean>>({})

//   useEffect(() => {
//     fetchPublicTrips()
//   }, [])

//   const fetchPublicTrips = async () => {
//     try {
//       setLoading(true)
//       setError(null)
//       const response = await fetch("/api/trips?public=true")

//       if (!response.ok) {
//         throw new Error("Failed to fetch public trips")
//       }

//       const data = await response.json()
//       setTrips(data.trips)
//     } catch (error) {
//       console.error("Error fetching public trips:", error)
//       setError("Failed to load trips. Please try again later.")
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleTripClick = (tripId: string) => {
//     if (status === "unauthenticated") {
//       // If user is not logged in, redirect to login page
//       router.push("/login")
//     } else {
//       // If user is logged in, check if they are a member with accepted status
//       const trip = trips.find(t => t._id === tripId)
//       if (trip) {
//         const isMember = trip.members.some(
//           member =>
//             member.user._id === session?.user.id &&
//             member.status === "accepted"
//         )

//         if (isMember) {
//           // If user is an accepted member, navigate to trip page
//           router.push(`/trips/${tripId}`)
//         } else {
//           // If not a member, show a toast notification
//           toast({
//             title: "Access Restricted",
//             description: "You need to be an accepted member to view this trip",
//             variant: "default",
//           })
//         }
//       }
//     }
//   }

//   const requestToJoin = async (e: React.MouseEvent, tripId: string) => {
//     e.stopPropagation() // Prevent navigating to the trip page

//     if (status !== "authenticated") {
//       router.push("/login")
//       return
//     }

//     try {
//       setRequestingTrips(prev => ({ ...prev, [tripId]: true }))

//       const response = await fetch(`/api/trips/${tripId}/request-join`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       })

//       const data = await response.json()

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to request to join trip")
//       }

//       toast({
//         title: "Request Sent",
//         description: "Your request to join this trip has been sent to the trip owner",
//         variant: "default",
//       })

//       // Update local trips data to reflect request status
//       setTrips(prevTrips =>
//         prevTrips.map(trip => {
//           if (trip._id === tripId) {
//             // Add the current user as a member with "requested" status
//             const updatedMembers = [...trip.members]
//             const existingMemberIndex = updatedMembers.findIndex(
//               m => m.user._id === session?.user.id
//             )

//             if (existingMemberIndex >= 0) {
//               updatedMembers[existingMemberIndex].status = "requested"
//             } else {
//               updatedMembers.push({
//                 user: {
//                   _id: session!.user.id,
//                   name: session!.user.name || "",
//                   email: session!.user.email || "",
//                   profileImage: session!.user.image ?? undefined
//                 },
//                 role: "participant",
//                 status: "requested"
//               })
//             }

//             return {
//               ...trip,
//               members: updatedMembers
//             }
//           }
//           return trip
//         })
//       )
//     } catch (error: any) {
//       toast({
//         title: "Failed to request",
//         description: error.message,
//         variant: "destructive",
//       })
//     } finally {
//       setRequestingTrips(prev => ({ ...prev, [tripId]: false }))
//     }
//   }

//   const getMemberStatus = (trip: Trip) => {
//     if (!session?.user.id) return null

//     const member = trip.members.find(m => m.user._id === session.user.id)
//     return member ? member.status : null
//   }

//   const filteredTrips = trips.filter(
//     (trip) =>
//       trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       trip.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       trip.category.toLowerCase().includes(searchTerm.toLowerCase()),
//   )

//   if (loading) {
//     return (
//       <div className="container px-4 py-8 mx-auto">
//         <div className="flex items-center justify-between mb-6">
//           <h1 className="text-3xl font-bold">Explore Trips</h1>
//         </div>

//         <div className="mb-6">
//           <Skeleton className="w-full h-10" />
//         </div>

//         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//           {[1, 2, 3, 4, 5, 6].map((i) => (
//             <Skeleton key={i} className="h-64" />
//           ))}
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="container px-4 py-8 mx-auto">
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-3xl font-bold">Explore Trips</h1>
//         {status === "unauthenticated" && (
//           <Button onClick={() => router.push("/login")}>
//             <LogIn className="w-4 h-4 mr-2" />
//             Login
//           </Button>
//         )}
//       </div>

//       <div className="relative mb-8">
//         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
//         <Input
//           placeholder="Search trips by name, description, or category..."
//           className="pl-10"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>

//       {error && (
//         <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md">
//           <p>{error}</p>
//           <Button variant="outline" className="mt-2" onClick={fetchPublicTrips}>
//             Try Again
//           </Button>
//         </div>
//       )}

//       {filteredTrips.length === 0 && !error ? (
//         <div className="p-8 text-center bg-white rounded-lg shadow">
//           <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
//           <h3 className="mb-2 text-xl font-semibold">No public trips found</h3>
//           <p className="mb-4 text-gray-600">
//             {searchTerm
//               ? `No trips match your search for "${searchTerm}"`
//               : "There are no public trips available at the moment."}
//           </p>
//           {searchTerm && (
//             <Button variant="outline" onClick={() => setSearchTerm("")}>
//               Clear Search
//             </Button>
//           )}
//         </div>
//       ) : (
//         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//           {filteredTrips.map((trip) => {
//             const memberStatus = getMemberStatus(trip)
//             const isAcceptedMember = memberStatus === "accepted"
//             const hasRequestedToJoin = memberStatus === "requested"
//             const isPending = memberStatus === "pending" || memberStatus === "invited"

//             return (
//               <Card
//                 key={trip._id}
//                 className="h-full overflow-hidden transition-shadow hover:shadow-md flex flex-col"
//               >
//                 <div
//                   className="relative h-48 cursor-pointer"
//                   onClick={() => isAcceptedMember && handleTripClick(trip._id)}
//                 >
//                   <Image
//                     src={trip.thumbnail || "/images/placeholder.jpg"}
//                     alt={trip.name}
//                     fill
//                     className="object-cover"
//                   />
//                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
//                   <div className="absolute bottom-4 left-4 right-4">
//                     <h3 className="text-xl font-bold text-white">{trip.name}</h3>
//                     <p className="text-sm text-white/80 line-clamp-1">{trip.description}</p>
//                   </div>
//                 </div>

//                 <CardContent className="flex-grow py-4">
//                   <div className="space-y-2">
//                     <div className="flex items-center text-sm text-gray-600">
//                       <Calendar className="w-4 h-4 mr-2" />
//                       <span>
//                         {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
//                       </span>
//                     </div>
//                     <div className="flex items-center text-sm text-gray-600">
//                       <Users className="w-4 h-4 mr-2" />
//                       <span>
//                         {trip.members.filter(m => m.status === "accepted").length} members
//                         {trip.minMembers > 0 &&
//                           ` (min: ${trip.minMembers})`
//                         }
//                       </span>
//                     </div>
//                     <div className="flex items-center text-sm text-gray-600">
//                       <Tag className="w-4 h-4 mr-2" />
//                       <Badge variant="outline" className="capitalize">
//                         {trip.category.replace("_", " ")}
//                       </Badge>
//                     </div>
//                   </div>
//                 </CardContent>

//                 <CardFooter className="pt-0">
//                   <div className="w-full">
//                     <div className="flex items-center justify-between">
//                       <div className="flex -space-x-2">
//                         {trip.members
//                           .filter(member => member.status === "accepted")
//                           .slice(0, 3)
//                           .map((member) => (
//                             <Avatar key={member.user._id} className="border-2 border-white w-7 h-7">
//                               <AvatarImage src={member.user.profileImage} alt={member.user.name} />
//                               <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
//                             </Avatar>
//                           ))}
//                       </div>

//                       {status === "authenticated" && !isAcceptedMember && !isPending && (
//                         <div>
//                           {hasRequestedToJoin ? (
//                             <Badge variant="outline" className="bg-gray-100">
//                               <Clock className="w-3 h-3 mr-1" />
//                               Request Pending
//                             </Badge>
//                           ) : (
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               onClick={(e) => requestToJoin(e, trip._id)}
//                               disabled={requestingTrips[trip._id]}
//                             >
//                               {requestingTrips[trip._id] ? (
//                                 "Requesting..."
//                               ) : (
//                                 <>
//                                   <UserPlus className="w-3 h-3 mr-1" />
//                                   Request to Join
//                                 </>
//                               )}
//                             </Button>
//                           )}
//                         </div>
//                       )}

//                       {isPending && (
//                         <Badge variant="outline" className="bg-yellow-100">
//                           <Clock className="w-3 h-3 mr-1" />
//                           Invitation Pending
//                         </Badge>
//                       )}

//                       {isAcceptedMember && (
//                         <Badge variant="outline" className="bg-green-100 text-green-800">
//                           <Check className="w-3 h-3 mr-1" />
//                           Member
//                         </Badge>
//                       )}
//                     </div>

//                     {isAcceptedMember && (
//                       <Button
//                         className="w-full mt-3"
//                         size="sm"
//                         onClick={() => handleTripClick(trip._id)}
//                       >
//                         View Trip Details
//                       </Button>
//                     )}
//                   </div>
//                 </CardFooter>
//               </Card>
//             )
//           })}
//         </div>
//       )}
//     </div>
//   )
// }

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, calculateDaysLeft } from "@/lib/utils"
import { Search, Calendar, Users, Tag, Globe, LogIn, UserPlus, Check, Clock, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

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

  const getCategoryLabel = (category: string) => {
    // Convert category from snake_case or UPPER_CASE to Title Case with spaces
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const filteredTrips = trips.filter(
    (trip) =>
      trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Get the count of accepted members for a trip
  const getAcceptedMembersCount = (trip: Trip) => {
    return trip.members.filter(m => m.status === "accepted").length;
  }

  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50">Discover Adventures</h1>
        </div>

        <div className="mb-8 relative">
          <Skeleton className="w-full h-12 rounded-full" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[420px] rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-6xl bg-white dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50">Discover Adventures</h1>
        {status === "unauthenticated" && (
          <Button
            onClick={() => router.push("/login")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full px-5 transition-all"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in
          </Button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative mb-10"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search trips by name, location, or category..."
            className="pl-12 py-6 text-base rounded-full shadow-sm border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 mb-8 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-200 rounded-2xl"
        >
          <p className="font-medium">{error}</p>
          <Button variant="outline" className="mt-3" onClick={fetchPublicTrips}>
            Try Again
          </Button>
        </motion.div>
      )}

      {filteredTrips.length === 0 && !error ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <Globe className="w-16 h-16 mx-auto mb-5 text-gray-300 dark:text-gray-600" />
          <h3 className="mb-3 text-2xl font-semibold">No adventures found</h3>
          <p className="mb-6 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {searchTerm
              ? `No trips match your search for "${searchTerm}"`
              : "There are no public trips available at the moment."}
          </p>
          {searchTerm && (
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
              className="rounded-full px-6"
            >
              Clear Search
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map((trip, index) => {
            const memberStatus = getMemberStatus(trip)
            const isAcceptedMember = memberStatus === "accepted"
            const hasRequestedToJoin = memberStatus === "requested"
            const isPending = memberStatus === "pending" || memberStatus === "invited"
            const acceptedMembersCount = getAcceptedMembersCount(trip);
            const categoryLabel = getCategoryLabel(trip.category);

            const daysUntilTrip = trip.startDate ? calculateDaysLeft(new Date(trip.startDate), new Date()) : null;
            const isUpcoming = daysUntilTrip && daysUntilTrip > 0;

            return (
              <motion.div
                key={trip._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden rounded-2xl border-0 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col h-full bg-white dark:bg-gray-900">
                  <div
                    className="relative aspect-[4/3] cursor-pointer"
                    onClick={() => isAcceptedMember && handleTripClick(trip._id)}
                  >
                    <Image
                      src={trip.thumbnail || "/images/placeholder.jpg"}
                      alt={trip.name}
                      fill
                      className="object-cover"
                    />

                    {/* Glass effect overlay for date and location */}
                    <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
                      <h3 className="text-2xl font-semibold text-white mb-1">{trip.name}</h3>

                      <div className="flex items-center mt-1 text-white/90">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="text-sm">
                          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </span>
                      </div>
                    </div>

                    {/* Status badge for upcoming trips */}
                    {isUpcoming && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-500/90 text-white py-1 px-3 rounded-full text-xs font-medium">
                          {daysUntilTrip === 1 ? 'Tomorrow' : `In ${daysUntilTrip} days`}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="pt-5 pb-6 px-6 flex-grow flex flex-col">
                    <div className="mb-4">
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-2 text-sm">{trip.description}</p>
                    </div>

                    <div className="space-y-3 mt-auto">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 pb-1 border-b border-gray-100 dark:border-gray-800">
                        <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                        <Badge variant="outline" className="rounded-full bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-0">
                          {categoryLabel}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center -space-x-2">
                          {trip.members
                            .filter(member => member.status === "accepted")
                            .slice(0, 3)
                            .map((member) => (
                              <Avatar key={member.user._id} className="border-2 border-white dark:border-gray-900 w-8 h-8">
                                <AvatarImage src={member.user.profileImage} alt={member.user.name} />
                                <AvatarFallback className="bg-blue-500 text-white text-xs">
                                  {member.user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}

                          {acceptedMembersCount > 3 && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">+{acceptedMembersCount - 3}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4 mr-1 text-gray-500" />
                          <span>{acceptedMembersCount} / {trip.minMembers}</span>
                        </div>
                      </div>

                      <div className="pt-3">
                        {status === "authenticated" ? (
                          !isAcceptedMember && !isPending ? (
                            hasRequestedToJoin ? (
                              <Button disabled className="w-full rounded-full font-medium bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-50">
                                <Clock className="w-3 h-3 mr-2" />
                                Request Pending
                              </Button>
                            ) : (
                              <Button
                                onClick={(e) => requestToJoin(e, trip._id)}
                                disabled={requestingTrips[trip._id]}
                                className="w-full rounded-full font-medium bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                {requestingTrips[trip._id] ? (
                                  "Requesting..."
                                ) : (
                                  <>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Request to Join
                                  </>
                                )}
                              </Button>
                            )
                          ) : isPending ? (
                            <Button disabled className="w-full rounded-full font-medium bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-50">
                              <Clock className="w-3 h-3 mr-2" />
                              Invitation Pending
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleTripClick(trip._id)}
                              className="w-full rounded-full font-medium bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              View Trip Details
                            </Button>
                          )
                        ) : (
                          <Button
                            onClick={() => router.push("/login")}
                            className="w-full rounded-full font-medium bg-gray-100 hover:bg-gray-200 text-gray-800"
                          >
                            <LogIn className="w-4 h-4 mr-2" />
                            Sign in to Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
