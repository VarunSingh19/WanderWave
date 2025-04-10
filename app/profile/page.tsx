"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  User,
  Phone,
  MapPin,
  FileText,
  Upload,
  Pencil,
  Wallet,
  Users,
  MessageSquare,
  MapPinned,
  Calendar,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react"
import { formatDate } from "./utils"

// Import CSS
import "./profile.css"

// Types
interface Trip {
  _id: string
  name: string
  description: string
  startDate: string
  endDate: string
  location: string
  status: string
  thumbnail?: string
}

interface Message {
  _id: string
  sender: {
    _id: string
    name: string
    profileImage?: string
  }
  content: string
  createdAt: string
}

interface Friend {
  _id: string
  name: string
  profileImage?: string
}

// Form Schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Additional state for new features
  const [walletBalance, setWalletBalance] = useState(0)
  const [recentTrips, setRecentTrips] = useState<Trip[]>([])
  const [recentChats, setRecentChats] = useState<Message[]>([])
  const [friends, setFriends] = useState<Friend[]>([])

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      bio: "",
    },
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchWalletBalance()
      fetchRecentTrips()
      fetchRecentChats()
      fetchFriends()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()

      if (response.ok) {
        const { user } = data
        form.reset({
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          address: user.address || "",
          bio: user.bio || "",
        })
        setProfileImage(user.profileImage || null)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch("/api/profile/wallet")
      if (response.ok) {
        const data = await response.json()
        setWalletBalance(data.wallet.balance || 0)
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error)
    }
  }

  const fetchRecentTrips = async () => {
    try {
      const response = await fetch("/api/trips")
      if (response.ok) {
        const data = await response.json()
        setRecentTrips(data.trips.slice(0, 3) || [])
      }
    } catch (error) {
      console.error("Error fetching recent trips:", error)
    }
  }

  const fetchRecentChats = async () => {
    try {
      const response = await fetch("/api/messages")
      if (response.ok) {
        const data = await response.json()
        setRecentChats(data.messages.slice(0, 5) || [])
      }
    } catch (error) {
      console.error("Error fetching recent chats:", error)
    }
  }

  const fetchFriends = async () => {
    try {
      const response = await fetch("/api/friends")
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends || [])
      }
    } catch (error) {
      console.error("Error fetching friends:", error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setImageFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      setProfileImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true)

    try {
      const formData = {
        ...data,
        profileImage: imageFile ? profileImage : undefined,
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile")
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })

      // Update session data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          image: result.user.profileImage || session?.user.image,
        },
      })

      // Close the edit dialog
      setIsEditDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="apple-container">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center mb-8">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="w-48 h-8 mb-2" />
            <Skeleton className="w-32 h-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
          </div>

          <Skeleton className="w-full h-[300px] rounded-xl mb-8" />
          <Skeleton className="w-full h-[200px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="apple-container">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Profile Header */}
        <div className="text-center mb-10">
          <div className="apple-avatar">
            {profileImage ? (
              <img src={profileImage || "/placeholder.svg"} alt={form.getValues("name")} />
            ) : (
              <div className="w-full h-full bg-[var(--apple-blue)] flex items-center justify-center text-white text-4xl font-semibold">
                {form.getValues("name").charAt(0)}
              </div>
            )}
            <label htmlFor="profile-image" className="apple-avatar-edit">
              <Upload className="w-4 h-4 text-white" />
              <input id="profile-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
          <h1 className="text-3xl font-bold mt-4">{form.getValues("name")}</h1>
          <p className="text-[var(--apple-gray)] mt-2">{form.getValues("email")}</p>

          <div className="flex justify-center mt-4">
            <button onClick={() => setIsEditDialogOpen(true)} className="apple-button flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          <div className="apple-stat-card">
            <div className="flex justify-between items-start mb-2">
              <Wallet className="w-6 h-6 text-[var(--apple-blue)]" />
              <button onClick={() => router.push("/wallet")} className="text-[var(--apple-blue)] text-sm">
                View
              </button>
            </div>
            <div className="apple-stat-value text-[var(--apple-blue)]">${walletBalance.toFixed(2)}</div>
            <div className="apple-stat-label">Wallet Balance</div>
          </div>

          <div className="apple-stat-card">
            <div className="flex justify-between items-start mb-2">
              <MapPinned className="w-6 h-6 text-[var(--apple-green)]" />
              <button onClick={() => router.push("/trips")} className="text-[var(--apple-green)] text-sm">
                View
              </button>
            </div>
            <div className="apple-stat-value text-[var(--apple-green)]">{recentTrips.length}</div>
            <div className="apple-stat-label">Active Trips</div>
          </div>

          <div className="apple-stat-card">
            <div className="flex justify-between items-start mb-2">
              <Users className="w-6 h-6 text-[var(--apple-purple)]" />
              <button onClick={() => router.push("/friends")} className="text-[var(--apple-purple)] text-sm">
                View
              </button>
            </div>
            <div className="apple-stat-value text-[var(--apple-purple)]">{friends.length}</div>
            <div className="apple-stat-label">Friends</div>
          </div>

          <div className="apple-stat-card">
            <div className="flex justify-between items-start mb-2">
              <MessageSquare className="w-6 h-6 text-[var(--apple-orange)]" />
              <button onClick={() => router.push("/messages")} className="text-[var(--apple-orange)] text-sm">
                View
              </button>
            </div>
            <div className="apple-stat-value text-[var(--apple-orange)]">{recentChats.length}</div>
            <div className="apple-stat-label">New Messages</div>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="apple-card mb-10">
          <div className="apple-card-header flex justify-between items-center">
            <h2 className="apple-card-title">Recent Trips</h2>
            <button
              onClick={() => router.push("/trips")}
              className="text-[var(--apple-blue)] text-sm flex items-center"
            >
              See All <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="apple-card-content">
            {recentTrips.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {recentTrips.map((trip) => (
                  <div
                    key={trip._id}
                    className="apple-trip-card bg-white shadow-sm cursor-pointer"
                    onClick={() => router.push(`/trips/${trip._id}`)}
                  >
                    <div className="apple-trip-card-image">
                      <img
                        src={
                          trip.thumbnail ||
                          `https://source.unsplash.com/random/300x200/?${encodeURIComponent(trip.location || "travel")}`
                        }
                        alt={trip.name}
                      />
                    </div>
                    <div className="apple-trip-card-content">
                      <h3 className="apple-trip-card-title">{trip.name}</h3>
                      <div className="apple-trip-card-info flex items-center mb-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{trip.location || "No location"}</span>
                      </div>
                      <div className="apple-trip-card-info flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString()} -{" "}
                          {new Date(trip.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span
                          className={`apple-badge ${trip.status === "ACTIVE"
                            ? "apple-badge-green"
                            : trip.status === "UPCOMING"
                              ? "apple-badge-blue"
                              : "apple-badge-orange"
                            }`}
                        >
                          {trip.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--apple-gray)]">
                <p>You don't have any trips yet</p>
                <button onClick={() => router.push("/trips/new")} className="apple-button mt-4">
                  Plan Your First Trip
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Chats */}
        <div className="apple-card mb-10">
          <div className="apple-card-header flex justify-between items-center">
            <h2 className="apple-card-title">Recent Messages</h2>
            <button
              onClick={() => router.push("/messages")}
              className="text-[var(--apple-blue)] text-sm flex items-center"
            >
              See All <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="apple-card-content p-0">
            {recentChats.length > 0 ? (
              <div>
                {recentChats.map((message) => (
                  <div
                    key={message._id}
                    className="apple-chat-item border-b border-[var(--apple-light-gray)] cursor-pointer"
                    onClick={() => router.push("/messages")}
                  >
                    <div className="apple-chat-avatar">
                      {message.sender.profileImage ? (
                        <img src={message.sender.profileImage || "/placeholder.svg"} alt={message.sender.name} />
                      ) : (
                        <div className="w-full h-full bg-[var(--apple-blue)] flex items-center justify-center text-white font-medium">
                          {message.sender.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="apple-chat-content">
                      <div className="apple-chat-name">{message.sender.name}</div>
                      <div className="apple-chat-preview">{message.content}</div>
                    </div>
                    <div className="apple-chat-time">{formatDate(message.createdAt)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--apple-gray)]">
                <p>No recent messages</p>
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="apple-card">
          <div className="apple-card-header">
            <h2 className="apple-card-title">Account Information</h2>
          </div>

          <div className="apple-card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 text-[var(--apple-blue)] mr-3" />
                  <div>
                    <div className="text-[var(--apple-gray)] text-sm">Name</div>
                    <div className="font-medium">{form.getValues("name")}</div>
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <Phone className="w-5 h-5 text-[var(--apple-blue)] mr-3" />
                  <div>
                    <div className="text-[var(--apple-gray)] text-sm">Phone</div>
                    <div className="font-medium">{form.getValues("phone") || "Not provided"}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center mb-4">
                  <MapPin className="w-5 h-5 text-[var(--apple-blue)] mr-3" />
                  <div>
                    <div className="text-[var(--apple-gray)] text-sm">Address</div>
                    <div className="font-medium">{form.getValues("address") || "Not provided"}</div>
                  </div>
                </div>

                <div className="flex items-start mb-4">
                  <FileText className="w-5 h-5 text-[var(--apple-blue)] mr-3 mt-1" />
                  <div>
                    <div className="text-[var(--apple-gray)] text-sm">Bio</div>
                    <div className="font-medium">{form.getValues("bio") || "No bio available"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--apple-light-gray)]">
              <button onClick={() => setIsEditDialogOpen(true)} className="apple-button w-full">
                Edit Profile Information
              </button>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <div className="mt-8 text-center mb-8">
          <button
            onClick={() => router.push("/api/auth/signout")}
            className="text-[var(--apple-red)] flex items-center justify-center mx-auto"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {isEditDialogOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setIsEditDialogOpen(false)}
        >
          <div className="apple-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="apple-dialog-header flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Edit Profile</h2>
                <p className="text-[var(--apple-gray)] text-sm mt-1">Update your personal information</p>
              </div>
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="apple-close-button"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="apple-dialog-content">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="apple-form-row">
                  <label className="apple-form-label">Name</label>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-[var(--apple-gray)]" />
                    <input {...form.register("name")} className="apple-input" placeholder="Your name" />
                  </div>
                  {form.formState.errors.name && (
                    <p className="text-[var(--apple-red)] text-sm mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="apple-form-row">
                  <label className="apple-form-label">Email</label>
                  <input {...form.register("email")} className="apple-input bg-[var(--apple-light-gray)]" disabled />
                  <p className="text-[var(--apple-gray)] text-sm mt-1">Email cannot be changed</p>
                </div>

                <div className="apple-form-row">
                  <label className="apple-form-label">Phone</label>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-[var(--apple-gray)]" />
                    <input {...form.register("phone")} className="apple-input" placeholder="Your phone number" />
                  </div>
                </div>

                <div className="apple-form-row">
                  <label className="apple-form-label">Address</label>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-[var(--apple-gray)]" />
                    <input {...form.register("address")} className="apple-input" placeholder="Your address" />
                  </div>
                </div>

                <div className="apple-form-row">
                  <label className="apple-form-label">Bio</label>
                  <div className="flex">
                    <FileText className="w-4 h-4 mr-2 mt-2 text-[var(--apple-gray)]" />
                    <textarea
                      {...form.register("bio")}
                      className="apple-input apple-textarea"
                      placeholder="Tell us about yourself"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="apple-dialog-footer">
              <button type="button" onClick={() => setIsEditDialogOpen(false)} className="apple-button-secondary mr-2">
                Cancel
              </button>
              <button onClick={form.handleSubmit(onSubmit)} disabled={isSaving} className="apple-button">
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
