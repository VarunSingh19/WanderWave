// "use client"

// import type React from "react"
// import { useEffect, useState } from "react"
// import { useRouter } from "next/navigation"
// import { useSession } from "next-auth/react"
// import { z } from "zod"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import { Skeleton } from "@/components/ui/skeleton"
// import { useToast } from "@/hooks/use-toast"
// import {
//   User,
//   Phone,
//   MapPin,
//   FileText,
//   Upload,
//   Pencil,
//   Wallet,
//   Users,
//   MessageSquare,
//   MapPinned,
//   Calendar,
//   ChevronRight,
//   LogOut,
//   X,
// } from "lucide-react"
// import { formatDate } from "./utils"

// // Import CSS
// import "./profile.css"
// import { WalletData } from "../wallet/types"

// // Types
// interface Trip {
//   _id: string
//   name: string
//   description: string
//   startDate: string
//   endDate: string
//   location: string
//   status: string
//   thumbnail?: string
// }

// interface Message {
//   _id: string
//   sender: {
//     _id: string
//     name: string
//     profileImage?: string
//   }
//   content: string
//   createdAt: string
// }

// interface Friend {
//   _id: string
//   name: string
//   profileImage?: string
// }

// // Form Schema
// const profileSchema = z.object({
//   name: z.string().min(2, "Name must be at least 2 characters"),
//   email: z.string().email("Invalid email address").optional(),
//   phone: z.string().optional(),
//   address: z.string().optional(),
//   bio: z.string().optional(),
// })

// type ProfileFormValues = z.infer<typeof profileSchema>

// export default function ProfilePage() {
//   const router = useRouter()
//   const { data: session, status, update } = useSession()
//   const { toast } = useToast()
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSaving, setIsSaving] = useState(false)
//   const [profileImage, setProfileImage] = useState<string | null>(null)
//   const [imageFile, setImageFile] = useState<File | null>(null)
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

//   // Additional state for new features
//   const [walletBalance, setWalletBalance] = useState(0)
//   const [recentTrips, setRecentTrips] = useState<Trip[]>([])
//   const [recentChats, setRecentChats] = useState<Message[]>([])
//   const [friends, setFriends] = useState<Friend[]>([])

//   const [walletData, setWalletData] = useState<WalletData | null>(null)
//   const [loading, setLoading] = useState(true)

//   const form = useForm<ProfileFormValues>({
//     resolver: zodResolver(profileSchema),
//     defaultValues: {
//       name: "",
//       email: "",
//       phone: "",
//       address: "",
//       bio: "",
//     },
//   })

//   useEffect(() => {
//     if (status === "unauthenticated") {
//       router.push("/login")
//       return
//     }

//     if (status === "authenticated") {
//       fetchProfile()
//       fetchWalletBalance()
//       fetchRecentTrips()
//       fetchRecentChats()
//       fetchFriends()
//     }
//   }, [status, router])

//   const fetchProfile = async () => {
//     try {
//       const response = await fetch("/api/profile")
//       const data = await response.json()

//       if (response.ok) {
//         const { user } = data
//         form.reset({
//           name: user.name,
//           email: user.email,
//           phone: user.phone || "",
//           address: user.address || "",
//           bio: user.bio || "",
//         })
//         setProfileImage(user.profileImage || null)
//       }
//     } catch (error) {
//       console.error("Error fetching profile:", error)
//       toast({
//         title: "Error",
//         description: "Failed to load profile data",
//         variant: "destructive",
//       })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // const fetchWalletBalance = async () => {
//   //   try {
//   //     const response = await fetch("/api/profile/wallet")
//   //     if (response.ok) {
//   //       const data = await response.json()
//   //       setWalletBalance(data.wallet.balance || 0)
//   //     }
//   //   } catch (error) {
//   //     console.error("Error fetching wallet balance:", error)
//   //   }
//   // }


//   const fetchWalletBalance = async () => {
//     if (status !== "authenticated") return

//     try {
//       setLoading(true)
//       const response = await fetch("/api/profile/wallet")

//       if (!response.ok) {
//         if (response.status === 401) {
//           // Auth error - session might have expired
//           router.push("/login")
//           return
//         }
//         throw new Error("Failed to load wallet data")
//       }

//       const data = await response.json()
//       setWalletData(data)
//     } catch (error) {
//       console.error("Error fetching wallet data:", error)
//       toast({
//         title: "Error",
//         description: "Failed to load wallet data",
//         variant: "destructive",
//       })
//     } finally {
//       setLoading(false)
//     }
//   }


//   const fetchRecentTrips = async () => {
//     try {
//       const response = await fetch("/api/trips")
//       if (response.ok) {
//         const data = await response.json()
//         setRecentTrips(data.trips.slice(0, 3) || [])
//       }
//     } catch (error) {
//       console.error("Error fetching recent trips:", error)
//     }
//   }

//   const fetchRecentChats = async () => {
//     try {
//       const response = await fetch("/api/messages")
//       if (response.ok) {
//         const data = await response.json()
//         setRecentChats(data.messages.slice(0) || [])
//       }
//     } catch (error) {
//       console.error("Error fetching recent chats:", error)
//     }
//   }

//   const fetchFriends = async () => {
//     try {
//       const response = await fetch("/api/friends")
//       if (response.ok) {
//         const data = await response.json()
//         setFriends(data.frienda || [])
//       }
//     } catch (error) {
//       console.error("Error fetching friends:", error)
//     }
//   }

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (!file) return

//     if (file.size > 5 * 1024 * 1024) {
//       toast({
//         title: "Error",
//         description: "Image size should be less than 5MB",
//         variant: "destructive",
//       })
//       return
//     }

//     setImageFile(file)

//     const reader = new FileReader()
//     reader.onload = () => {
//       setProfileImage(reader.result as string)
//     }
//     reader.readAsDataURL(file)
//   }

//   const onSubmit = async (data: ProfileFormValues) => {
//     setIsSaving(true)

//     try {
//       const formData = {
//         ...data,
//         profileImage: imageFile ? profileImage : undefined,
//       }

//       const response = await fetch("/api/profile", {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formData),
//       })

//       const result = await response.json()

//       if (!response.ok) {
//         throw new Error(result.error || "Failed to update profile")
//       }

//       toast({
//         title: "Profile updated",
//         description: "Your profile has been updated successfully",
//       })

//       // Update session data
//       await update({
//         ...session,
//         user: {
//           ...session?.user,
//           name: data.name,
//           image: result.user.profileImage || session?.user.image,
//         },
//       })

//       // Close the edit dialog
//       setIsEditDialogOpen(false)
//     } catch (error: any) {
//       toast({
//         title: "Update failed",
//         description: error.message,
//         variant: "destructive",
//       })
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   if (isLoading) {
//     return (
//       <div className="apple-container">
//         <div className="max-w-4xl mx-auto">
//           <div className="flex flex-col items-center mb-8">
//             <Skeleton className="w-24 h-24 rounded-full mb-4" />
//             <Skeleton className="w-48 h-8 mb-2" />
//             <Skeleton className="w-32 h-4" />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             <Skeleton className="h-[120px] rounded-xl" />
//             <Skeleton className="h-[120px] rounded-xl" />
//             <Skeleton className="h-[120px] rounded-xl" />
//           </div>

//           <Skeleton className="w-full h-[300px] rounded-xl mb-8" />
//           <Skeleton className="w-full h-[200px] rounded-xl" />
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="apple-container">
//       <div className="max-w-5xl mx-auto px-4 sm:px-6">
//         {/* Profile Header */}
//         <div className="text-center mb-10">
//           <div className="apple-avatar">
//             {profileImage ? (
//               <img src={profileImage || "/placeholder.svg"} alt={form.getValues("name")} />
//             ) : (
//               <div className="w-full h-full bg-[var(--apple-blue)] flex items-center justify-center text-white text-4xl font-semibold">
//                 {form.getValues("name").charAt(0)}
//               </div>
//             )}
//             <label htmlFor="profile-image" className="apple-avatar-edit">
//               <Upload className="w-4 h-4 text-white" />
//               <input id="profile-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
//             </label>
//           </div>
//           <h1 className="text-3xl font-bold mt-4">{form.getValues("name")}</h1>
//           <p className="text-[var(--apple-gray)] mt-2">{form.getValues("email")}</p>

//           <div className="flex justify-center mt-4">
//             <button onClick={() => setIsEditDialogOpen(true)} className="apple-button flex items-center gap-2">
//               <Pencil className="w-4 h-4" />
//               <span>Edit Profile</span>
//             </button>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
//           <div className="apple-stat-card">
//             <div className="flex justify-between items-start mb-2">
//               <Wallet className="w-6 h-6 text-[var(--apple-blue)]" />
//               <button onClick={() => router.push("/wallet")} className="text-[var(--apple-blue)] text-sm">
//                 View
//               </button>
//             </div>
//             <div className="apple-stat-value text-[var(--apple-blue)]">${walletBalance.toFixed(2)}</div>
//             <div className="apple-stat-label">Wallet Balance</div>
//           </div>

//           <div className="apple-stat-card">
//             <div className="flex justify-between items-start mb-2">
//               <MapPinned className="w-6 h-6 text-[var(--apple-green)]" />
//               <button onClick={() => router.push("/trips")} className="text-[var(--apple-green)] text-sm">
//                 View
//               </button>
//             </div>
//             <div className="apple-stat-value text-[var(--apple-green)]">{recentTrips.length}</div>
//             <div className="apple-stat-label">Active Trips</div>
//           </div>

//           <div className="apple-stat-card">
//             <div className="flex justify-between items-start mb-2">
//               <Users className="w-6 h-6 text-[var(--apple-purple)]" />
//               <button onClick={() => router.push("/friends")} className="text-[var(--apple-purple)] text-sm">
//                 View
//               </button>
//             </div>
//             <div className="apple-stat-value text-[var(--apple-purple)]">{friends.length}</div>
//             {/* <div className="apple-stat-value text-[var(--apple-purple)]">{friends.name}</div> */}
//             <div className="apple-stat-label">Friends</div>
//           </div>

//           <div className="apple-stat-card">
//             <div className="flex justify-between items-start mb-2">
//               <MessageSquare className="w-6 h-6 text-[var(--apple-orange)]" />
//               <button onClick={() => router.push("/messages")} className="text-[var(--apple-orange)] text-sm">
//                 View
//               </button>
//             </div>
//             <div className="apple-stat-value text-[var(--apple-orange)]">{recentChats.length}</div>
//             <div className="apple-stat-label">New Messages</div>
//           </div>
//         </div>

//         {/* Recent Trips */}
//         <div className="apple-card mb-10">
//           <div className="apple-card-header flex justify-between items-center">
//             <h2 className="apple-card-title">Recent Trips</h2>
//             <button
//               onClick={() => router.push("/trips")}
//               className="text-[var(--apple-blue)] text-sm flex items-center"
//             >
//               See All <ChevronRight className="w-4 h-4 ml-1" />
//             </button>
//           </div>

//           <div className="apple-card-content">
//             {recentTrips.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//                 {recentTrips.map((trip) => (
//                   <div
//                     key={trip._id}
//                     className="apple-trip-card bg-white shadow-sm cursor-pointer"
//                     onClick={() => router.push(`/trips/${trip._id}`)}
//                   >
//                     <div className="apple-trip-card-image">
//                       <img
//                         src={
//                           trip.thumbnail ||
//                           `https://source.unsplash.com/random/300x200/?${encodeURIComponent(trip.location || "travel")}`
//                         }
//                         alt={trip.name}
//                       />
//                     </div>
//                     <div className="apple-trip-card-content">
//                       <h3 className="apple-trip-card-title">{trip.name}</h3>
//                       <div className="apple-trip-card-info flex items-center mb-2">
//                         <MapPin className="w-3 h-3 mr-1" />
//                         <span>{trip.location || "No location"}</span>
//                       </div>
//                       <div className="apple-trip-card-info flex items-center">
//                         <Calendar className="w-3 h-3 mr-1" />
//                         <span>
//                           {new Date(trip.startDate).toLocaleDateString()} -{" "}
//                           {new Date(trip.endDate).toLocaleDateString()}
//                         </span>
//                       </div>
//                       <div className="mt-2">
//                         <span
//                           className={`apple-badge ${trip.status === "ACTIVE"
//                             ? "apple-badge-green"
//                             : trip.status === "UPCOMING"
//                               ? "apple-badge-blue"
//                               : "apple-badge-orange"
//                             }`}
//                         >
//                           {trip.status}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-8 text-[var(--apple-gray)]">
//                 <p>You don't have any trips yet</p>
//                 <button onClick={() => router.push("/trips/new")} className="apple-button mt-4">
//                   Plan Your First Trip
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Recent Chats */}
//         <div className="apple-card mb-10">
//           <div className="apple-card-header flex justify-between items-center">
//             <h2 className="apple-card-title">Recent Messages</h2>
//             <button
//               onClick={() => router.push("/messages")}
//               className="text-[var(--apple-blue)] text-sm flex items-center"
//             >
//               See All <ChevronRight className="w-4 h-4 ml-1" />
//             </button>
//           </div>

//           <div className="apple-card-content p-0">
//             {recentChats.length > 0 ? (
//               <div>
//                 {recentChats.map((message) => (
//                   <div
//                     key={message._id}
//                     className="apple-chat-item border-b border-[var(--apple-light-gray)] cursor-pointer"
//                     onClick={() => router.push("/messages")}
//                   >
//                     <div className="apple-chat-avatar">
//                       {message.sender.profileImage ? (
//                         <img src={message.sender.profileImage || "/placeholder.svg"} alt={message.sender.name} />
//                       ) : (
//                         <div className="w-full h-full bg-[var(--apple-blue)] flex items-center justify-center text-white font-medium">
//                           {message.sender.name.charAt(0)}
//                         </div>
//                       )}
//                     </div>
//                     <div className="apple-chat-content">
//                       <div className="apple-chat-name">{message.sender.name}</div>
//                       <div className="apple-chat-preview">{message.content}</div>
//                     </div>
//                     <div className="apple-chat-time">{formatDate(message.createdAt)}</div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-8 text-[var(--apple-gray)]">
//                 <p>No recent messages</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Account Info */}
//         <div className="apple-card">
//           <div className="apple-card-header">
//             <h2 className="apple-card-title">Account Information</h2>
//           </div>

//           <div className="apple-card-content">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <div className="flex items-center mb-4">
//                   <User className="w-5 h-5 text-[var(--apple-blue)] mr-3" />
//                   <div>
//                     <div className="text-[var(--apple-gray)] text-sm">Name</div>
//                     <div className="font-medium">{form.getValues("name")}</div>
//                   </div>
//                 </div>

//                 <div className="flex items-center mb-4">
//                   <Phone className="w-5 h-5 text-[var(--apple-blue)] mr-3" />
//                   <div>
//                     <div className="text-[var(--apple-gray)] text-sm">Phone</div>
//                     <div className="font-medium">{form.getValues("phone") || "Not provided"}</div>
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <div className="flex items-center mb-4">
//                   <MapPin className="w-5 h-5 text-[var(--apple-blue)] mr-3" />
//                   <div>
//                     <div className="text-[var(--apple-gray)] text-sm">Address</div>
//                     <div className="font-medium">{form.getValues("address") || "Not provided"}</div>
//                   </div>
//                 </div>

//                 <div className="flex items-start mb-4">
//                   <FileText className="w-5 h-5 text-[var(--apple-blue)] mr-3 mt-1" />
//                   <div>
//                     <div className="text-[var(--apple-gray)] text-sm">Bio</div>
//                     <div className="font-medium">{form.getValues("bio") || "No bio available"}</div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6 pt-6 border-t border-[var(--apple-light-gray)]">
//               <button onClick={() => setIsEditDialogOpen(true)} className="apple-button w-full">
//                 Edit Profile Information
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Logout button */}
//         <div className="mt-8 text-center mb-8">
//           <button
//             onClick={() => router.push("/api/auth/signout")}
//             className="text-[var(--apple-red)] flex items-center justify-center mx-auto"
//           >
//             <LogOut className="w-4 h-4 mr-2" />
//             Sign Out
//           </button>
//         </div>
//       </div>

//       {/* Edit Profile Dialog */}
//       {isEditDialogOpen && (
//         <div
//           className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
//           onClick={() => setIsEditDialogOpen(false)}
//         >
//           <div className="apple-dialog" onClick={(e) => e.stopPropagation()}>
//             <div className="apple-dialog-header flex justify-between items-center">
//               <div>
//                 <h2 className="text-xl font-semibold">Edit Profile</h2>
//                 <p className="text-[var(--apple-gray)] text-sm mt-1">Update your personal information</p>
//               </div>
//               <button
//                 onClick={() => setIsEditDialogOpen(false)}
//                 className="apple-close-button"
//                 aria-label="Close dialog"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="apple-dialog-content">
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//                 <div className="apple-form-row">
//                   <label className="apple-form-label">Name</label>
//                   <div className="flex items-center">
//                     <User className="w-4 h-4 mr-2 text-[var(--apple-gray)]" />
//                     <input {...form.register("name")} className="apple-input" placeholder="Your name" />
//                   </div>
//                   {form.formState.errors.name && (
//                     <p className="text-[var(--apple-red)] text-sm mt-1">{form.formState.errors.name.message}</p>
//                   )}
//                 </div>

//                 <div className="apple-form-row">
//                   <label className="apple-form-label">Email</label>
//                   <input {...form.register("email")} className="apple-input bg-[var(--apple-light-gray)]" disabled />
//                   <p className="text-[var(--apple-gray)] text-sm mt-1">Email cannot be changed</p>
//                 </div>

//                 <div className="apple-form-row">
//                   <label className="apple-form-label">Phone</label>
//                   <div className="flex items-center">
//                     <Phone className="w-4 h-4 mr-2 text-[var(--apple-gray)]" />
//                     <input {...form.register("phone")} className="apple-input" placeholder="Your phone number" />
//                   </div>
//                 </div>

//                 <div className="apple-form-row">
//                   <label className="apple-form-label">Address</label>
//                   <div className="flex items-center">
//                     <MapPin className="w-4 h-4 mr-2 text-[var(--apple-gray)]" />
//                     <input {...form.register("address")} className="apple-input" placeholder="Your address" />
//                   </div>
//                 </div>

//                 <div className="apple-form-row">
//                   <label className="apple-form-label">Bio</label>
//                   <div className="flex">
//                     <FileText className="w-4 h-4 mr-2 mt-2 text-[var(--apple-gray)]" />
//                     <textarea
//                       {...form.register("bio")}
//                       className="apple-input apple-textarea"
//                       placeholder="Tell us about yourself"
//                     />
//                   </div>
//                 </div>
//               </form>
//             </div>

//             <div className="apple-dialog-footer">
//               <button type="button" onClick={() => setIsEditDialogOpen(false)} className="apple-button-secondary mr-2">
//                 Cancel
//               </button>
//               <button onClick={form.handleSubmit(onSubmit)} disabled={isSaving} className="apple-button">
//                 {isSaving ? "Saving..." : "Save Changes"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// "use client"

// import type React from "react"
// import { useEffect, useState } from "react"
// import { useRouter } from "next/navigation"
// import { useSession } from "next-auth/react"
// import { z } from "zod"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import { Skeleton } from "@/components/ui/skeleton"
// import { useToast } from "@/hooks/use-toast"
// import {
//   User,
//   Phone,
//   MapPin,
//   FileText,
//   Upload,
//   Pencil,
//   Wallet,
//   Users,
//   MessageSquare,
//   MapPinned,
//   Calendar,
//   ChevronRight,
//   LogOut,
//   X,
// } from "lucide-react"
// import { formatDate } from "./utils"

// // Import CSS
// import "./profile.css"
// // import type { WalletData } from "../wallet/types"

// // Types
// interface Trip {
//   _id: string
//   name: string
//   description: string
//   startDate: string
//   endDate: string
//   location: string
//   status: string
//   thumbnail?: string
// }

// interface Conversation {
//   friend: {
//     _id: string
//     name: string
//     profileImage?: string
//   }
//   latestMessage?: {
//     content: string
//     createdAt: string
//   }
//   unreadCount: number
// }

// interface Friend {
//   _id: string
//   name: string
//   profileImage?: string
// }

// // Form Schema
// const profileSchema = z.object({
//   name: z.string().min(2, "Name must be at least 2 characters"),
//   email: z.string().email("Invalid email address").optional(),
//   phone: z.string().optional(),
//   address: z.string().optional(),
//   bio: z.string().optional(),
// })

// type ProfileFormValues = z.infer<typeof profileSchema>

// export default function ProfilePage() {
//   const router = useRouter()
//   const { data: session, status, update } = useSession()
//   const { toast } = useToast()
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSaving, setIsSaving] = useState(false)
//   const [profileImage, setProfileImage] = useState<string | null>(null)
//   const [imageFile, setImageFile] = useState<File | null>(null)
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

//   // Additional state for new features
//   const [walletBalance, setWalletBalance] = useState(0)
//   const [recentTrips, setRecentTrips] = useState<Trip[]>([])
//   const [recentChats, setRecentChats] = useState<Conversation[]>([])
//   const [friends, setFriends] = useState<Friend[]>([])

//   // const [walletData, setWalletData] = useState<WalletData | null>(null)
//   // const [loading, setLoading] = useState(true)

//   const form = useForm<ProfileFormValues>({
//     resolver: zodResolver(profileSchema),
//     defaultValues: {
//       name: "",
//       email: "",
//       phone: "",
//       address: "",
//       bio: "",
//     },
//   })

//   useEffect(() => {
//     if (status === "unauthenticated") {
//       router.push("/login")
//       return
//     }

//     if (status === "authenticated") {
//       fetchProfile()
//       fetchWalletBalance()
//       fetchRecentTrips()
//       fetchRecentChats()
//       fetchFriends()
//     }
//   }, [status, router])

//   const fetchProfile = async () => {
//     try {
//       const response = await fetch("/api/profile")
//       const data = await response.json()

//       if (response.ok) {
//         const { user } = data
//         form.reset({
//           name: user.name,
//           email: user.email,
//           phone: user.phone || "",
//           address: user.address || "",
//           bio: user.bio || "",
//         })
//         setProfileImage(user.profileImage || null)
//       }
//     } catch (error) {
//       console.error("Error fetching profile:", error)
//       toast({
//         title: "Error",
//         description: "Failed to load profile data",
//         variant: "destructive",
//       })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const fetchWalletBalance = async () => {
//     try {
//       const response = await fetch("/api/profile/wallet")
//       if (response.ok) {
//         const data = await response.json()
//         setWalletBalance(data.wallet.balance || 0)
//       }
//     } catch (error) {
//       console.error("Error fetching wallet balance:", error)
//     }
//   }


//   const fetchRecentTrips = async () => {
//     try {
//       const response = await fetch("/api/trips")
//       if (response.ok) {
//         const data = await response.json()
//         setRecentTrips(data.trips.slice(0, 3) || [])
//       }
//     } catch (error) {
//       console.error("Error fetching recent trips:", error)
//     }
//   }

//   const fetchRecentChats = async () => {
//     try {
//       const response = await fetch("/api/messages")
//       if (response.ok) {
//         const data = await response.json()
//         setRecentChats(data.conversations?.slice(0, 5) || []) // Get first 5 conversations
//       }
//     } catch (error) {
//       console.error("Error fetching recent chats:", error)
//     }
//   }

//   const fetchFriends = async () => {
//     try {
//       const response = await fetch("/api/friends")
//       if (response.ok) {
//         const data = await response.json()
//         setFriends(data.friends || [])
//         console.log("Friends data:", data.friends)
//       }
//     } catch (error) {
//       console.error("Error fetching friends:", error)
//     }
//   }

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (!file) return

//     if (file.size > 5 * 1024 * 1024) {
//       toast({
//         title: "Error",
//         description: "Image size should be less than 5MB",
//         variant: "destructive",
//       })
//       return
//     }

//     setImageFile(file)

//     const reader = new FileReader()
//     reader.onload = () => {
//       setProfileImage(reader.result as string)
//     }
//     reader.readAsDataURL(file)
//   }

//   const onSubmit = async (data: ProfileFormValues) => {
//     setIsSaving(true)

//     try {
//       const formData = {
//         ...data,
//         profileImage: imageFile ? profileImage : undefined,
//       }

//       const response = await fetch("/api/profile", {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formData),
//       })

//       const result = await response.json()

//       if (!response.ok) {
//         throw new Error(result.error || "Failed to update profile")
//       }

//       toast({
//         title: "Profile updated",
//         description: "Your profile has been updated successfully",
//       })

//       // Update session data
//       await update({
//         ...session,
//         user: {
//           ...session?.user,
//           name: data.name,
//           image: result.user.profileImage || session?.user.image,
//         },
//       })

//       // Close the edit dialog
//       setIsEditDialogOpen(false)
//     } catch (error: any) {
//       toast({
//         title: "Update failed",
//         description: error.message,
//         variant: "destructive",
//       })
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   if (isLoading) {
//     return (
//       <div className="apple-container">
//         <div className="max-w-4xl mx-auto">
//           <div className="flex flex-col items-center mb-8">
//             <Skeleton className="w-24 h-24 rounded-full mb-4" />
//             <Skeleton className="w-48 h-8 mb-2" />
//             <Skeleton className="w-32 h-4" />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             <Skeleton className="h-[120px] rounded-xl" />
//             <Skeleton className="h-[120px] rounded-xl" />
//             <Skeleton className="h-[120px] rounded-xl" />
//           </div>

//           <Skeleton className="w-full h-[300px] rounded-xl mb-8" />
//           <Skeleton className="w-full h-[200px] rounded-xl" />
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="apple-container">
//       <div className="max-w-5xl mx-auto px-4 sm:px-6">
//         {/* Profile Header */}
//         <div className="text-center mb-10">
//           <div className="apple-avatar">
//             {profileImage ? (
//               <img src={profileImage || "/placeholder.svg"} alt={form.getValues("name")} />
//             ) : (
//               <div className="w-full h-full bg-[var(--apple-blue)] flex items-center justify-center text-white text-4xl font-semibold">
//                 {form.getValues("name").charAt(0)}
//               </div>
//             )}
//             <label htmlFor="profile-image" className="apple-avatar-edit">
//               <Upload className="w-4 h-4 text-white" />
//               <input id="profile-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
//             </label>
//           </div>
//           <h1 className="text-3xl font-bold mt-4 capitalize">{form.getValues("name")}</h1>
//           <p className="text-[var(--apple-gray)] mt-2">{form.getValues("email")}</p>

//           <div className="flex justify-center mt-4">
//             <button onClick={() => setIsEditDialogOpen(true)} className="apple-button flex items-center gap-2">
//               <Pencil className="w-4 h-4" />
//               <span>Edit Profile</span>
//             </button>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
//           <div className="apple-stat-card">
//             <div className="flex justify-between items-start mb-2">
//               <Wallet className="w-6 h-6 text-[var(--apple-blue)]" />
//               <button onClick={() => router.push("/wallet")} className="text-[var(--apple-blue)] text-sm">
//                 View
//               </button>
//             </div>
//             <div className="apple-stat-value text-[var(--apple-blue)]">
//               {walletBalance !== null && walletBalance !== undefined
//                 ? `₹${walletBalance.toFixed(2)}`
//                 : "Fetching balance..."}
//             </div>

//             <div className="apple-stat-label">Wallet Balance</div>
//           </div>

//           <div className="apple-stat-card">
//             <div className="flex justify-between items-start mb-2">
//               <MapPinned className="w-6 h-6 text-[var(--apple-green)]" />
//               <button onClick={() => router.push("/trips")} className="text-[var(--apple-green)] text-sm">
//                 View
//               </button>
//             </div>
//             <div className="apple-stat-value text-[var(--apple-green)]">{recentTrips.length}</div>
//             <div className="apple-stat-label">Active Trips</div>
//           </div>

//           <div className="apple-stat-card">
//             <div className="flex justify-between items-start mb-2">
//               <Users className="w-6 h-6 text-[var(--apple-purple)]" />
//               <button onClick={() => router.push("/friends")} className="text-[var(--apple-purple)] text-sm">
//                 View
//               </button>
//             </div>
//             <div className="apple-stat-value text-[var(--apple-purple)]">{friends.length}</div>
//             {/* <div className="apple-stat-value text-[var(--apple-purple)]">
//               {friends.map((friend) => friend.name).join(', ')}
//             </div> */}
//             <div className="apple-stat-label">Friends</div>
//           </div>

//           <div className="apple-stat-card">
//             <div className="flex justify-between items-start mb-2">
//               <MessageSquare className="w-6 h-6 text-[var(--apple-orange)]" />
//               <button onClick={() => router.push("/messages")} className="text-[var(--apple-orange)] text-sm">
//                 View
//               </button>
//             </div>
//             <div className="apple-stat-value text-[var(--apple-orange)]">{recentChats.length}</div>
//             <div className="apple-stat-label">New Messages</div>
//           </div>
//         </div>

//         {/* Recent Trips */}
//         <div className="apple-card mb-10">
//           <div className="apple-card-header flex justify-between items-center">
//             <h2 className="apple-card-title">Recent Trips</h2>
//             <button
//               onClick={() => router.push("/trips")}
//               className="text-[var(--apple-blue)] text-sm flex items-center"
//             >
//               See All <ChevronRight className="w-4 h-4 ml-1" />
//             </button>
//           </div>

//           <div className="apple-card-content">
//             {recentTrips.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//                 {recentTrips.map((trip) => (
//                   <div
//                     key={trip._id}
//                     className="apple-trip-card bg-white shadow-sm cursor-pointer"
//                     onClick={() => router.push(`/trips/${trip._id}`)}
//                   >
//                     <div className="apple-trip-card-image">
//                       <img
//                         src={
//                           trip.thumbnail ||
//                           `https://source.unsplash.com/random/300x200/?${encodeURIComponent(trip.location || "travel")}`
//                         }
//                         alt={trip.name}
//                       />
//                     </div>
//                     <div className="apple-trip-card-content">
//                       <h3 className="apple-trip-card-title">{trip.name}</h3>
//                       <div className="apple-trip-card-info flex items-center mb-2">
//                         <MapPin className="w-3 h-3 mr-1" />
//                         <span>{trip.location || "No location"}</span>
//                       </div>
//                       <div className="apple-trip-card-info flex items-center">
//                         <Calendar className="w-3 h-3 mr-1" />
//                         <span>
//                           {new Date(trip.startDate).toLocaleDateString()} -{" "}
//                           {new Date(trip.endDate).toLocaleDateString()}
//                         </span>
//                       </div>
//                       <div className="mt-2">
//                         <span
//                           className={`apple-badge ${trip.status === "ACTIVE"
//                             ? "apple-badge-green"
//                             : trip.status === "UPCOMING"
//                               ? "apple-badge-blue"
//                               : "apple-badge-orange"
//                             }`}
//                         >
//                           {trip.status}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-8 text-[var(--apple-gray)]">
//                 <p>You don't have any trips yet</p>
//                 <button onClick={() => router.push("/trips/new")} className="apple-button mt-4">
//                   Plan Your First Trip
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Recent Chats */}
//         <div className="apple-card mb-10">
//           <div className="apple-card-header flex justify-between items-center">
//             <h2 className="apple-card-title">Recent Messages</h2>
//             <button
//               onClick={() => router.push("/messages")}
//               className="text-[var(--apple-blue)] text-sm flex items-center"
//             >
//               See All <ChevronRight className="w-4 h-4 ml-1" />
//             </button>
//           </div>

//           <div className="apple-card-content p-0">
//             {recentChats.length > 0 ? (
//               <div>
//                 {recentChats.map((conversation) => (
//                   <div
//                     key={conversation.friend._id}
//                     className="apple-chat-item border-b border-[var(--apple-light-gray)] cursor-pointer"
//                     onClick={() => router.push("/messages")}
//                   >
//                     <div className="apple-chat-avatar">
//                       {conversation.friend.profileImage ? (
//                         <img
//                           src={conversation.friend.profileImage || "/placeholder.svg"}
//                           alt={conversation.friend.name}
//                         />
//                       ) : (
//                         <div className="w-full h-full bg-[var(--apple-blue)] flex items-center justify-center text-white font-medium">
//                           {conversation.friend.name.charAt(0)}
//                         </div>
//                       )}
//                     </div>
//                     <div className="apple-chat-content">
//                       <div className="apple-chat-name">{conversation.friend.name}</div>
//                       <div className="apple-chat-preview">
//                         {conversation.latestMessage?.content || "No messages yet"}
//                       </div>
//                     </div>
//                     <div className="apple-chat-time">
//                       {conversation.latestMessage ? formatDate(conversation.latestMessage.createdAt) : ""}
//                     </div>
//                     {conversation.unreadCount > 0 && (
//                       <div className="ml-2">
//                         <span className="bg-[var(--apple-blue)] text-white text-xs px-2 py-1 rounded-full">
//                           {conversation.unreadCount}
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-8 text-[var(--apple-gray)]">
//                 <p>No recent messages</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Account Info */}
//         <div className="apple-card">
//           <div className="apple-card-header">
//             <h2 className="apple-card-title">Account Information</h2>
//           </div>

//           <div className="apple-card-content">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <div className="flex items-center mb-4">
//                   <User className="w-5 h-5 text-[var(--apple-blue)] mr-3" />
//                   <div>
//                     <div className="text-[var(--apple-gray)] text-sm">Name</div>
//                     <div className="font-medium capitalize">{form.getValues("name")}</div>
//                   </div>
//                 </div>

//                 <div className="flex items-center mb-4">
//                   <Phone className="w-5 h-5 text-[var(--apple-blue)] mr-3" />
//                   <div>
//                     <div className="text-[var(--apple-gray)] text-sm">Phone</div>
//                     <div className="font-medium">{form.getValues("phone") || "Not provided"}</div>
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <div className="flex items-center mb-4">
//                   <MapPin className="w-5 h-5 text-[var(--apple-blue)] mr-3" />
//                   <div>
//                     <div className="text-[var(--apple-gray)] text-sm">Address</div>
//                     <div className="font-medium capitalize">{form.getValues("address") || "Not provided"}</div>
//                   </div>
//                 </div>

//                 <div className="flex items-start mb-4">
//                   <FileText className="w-5 h-5 text-[var(--apple-blue)] mr-3 mt-1" />
//                   <div>
//                     <div className="text-[var(--apple-gray)] text-sm">Bio</div>
//                     <div className="font-medium">{form.getValues("bio") || "No bio available"}</div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6 pt-6 border-t border-[var(--apple-light-gray)]">
//               <button onClick={() => setIsEditDialogOpen(true)} className="apple-button w-full">
//                 Edit Profile Information
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Logout button */}
//         <div className="mt-8 text-center mb-8">
//           <button
//             onClick={() => router.push("/api/auth/signout")}
//             className="text-[var(--apple-red)] flex items-center justify-center mx-auto"
//           >
//             <LogOut className="w-4 h-4 mr-2" />
//             Sign Out
//           </button>
//         </div>
//       </div>

//       {/* Edit Profile Dialog */}
//       {isEditDialogOpen && (
//         <div
//           className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
//           onClick={() => setIsEditDialogOpen(false)}
//         >
//           <div className="apple-dialog" onClick={(e) => e.stopPropagation()}>
//             <div className="apple-dialog-header flex justify-between items-center">
//               <div>
//                 <h2 className="text-xl font-semibold">Edit Profile</h2>
//                 <p className="text-[var(--apple-gray)] text-sm mt-1">Update your personal information</p>
//               </div>
//               <button
//                 onClick={() => setIsEditDialogOpen(false)}
//                 className="apple-close-button"
//                 aria-label="Close dialog"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="apple-dialog-content">
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//                 <div className="apple-form-row">
//                   <label className="apple-form-label">Name</label>
//                   <div className="flex items-center">
//                     <User className="w-4 h-4 mr-2 text-[var(--apple-gray)]" />
//                     <input {...form.register("name")} className="apple-input" placeholder="Your name" />
//                   </div>
//                   {form.formState.errors.name && (
//                     <p className="text-[var(--apple-red)] text-sm mt-1">{form.formState.errors.name.message}</p>
//                   )}
//                 </div>

//                 <div className="apple-form-row">
//                   <label className="apple-form-label">Email</label>
//                   <input {...form.register("email")} className="apple-input bg-[var(--apple-light-gray)]" disabled />
//                   <p className="text-[var(--apple-gray)] text-sm mt-1">Email cannot be changed</p>
//                 </div>

//                 <div className="apple-form-row">
//                   <label className="apple-form-label">Phone</label>
//                   <div className="flex items-center">
//                     <Phone className="w-4 h-4 mr-2 text-[var(--apple-gray)]" />
//                     <input {...form.register("phone")} className="apple-input" placeholder="Your phone number" />
//                   </div>
//                 </div>

//                 <div className="apple-form-row">
//                   <label className="apple-form-label">Address</label>
//                   <div className="flex items-center">
//                     <MapPin className="w-4 h-4 mr-2 text-[var(--apple-gray)]" />
//                     <input {...form.register("address")} className="apple-input" placeholder="Your address" />
//                   </div>
//                 </div>

//                 <div className="apple-form-row">
//                   <label className="apple-form-label">Bio</label>
//                   <div className="flex">
//                     <FileText className="w-4 h-4 mr-2 mt-2 text-[var(--apple-gray)]" />
//                     <textarea
//                       {...form.register("bio")}
//                       className="apple-input apple-textarea"
//                       placeholder="Tell us about yourself"
//                     />
//                   </div>
//                 </div>
//               </form>
//             </div>

//             <div className="apple-dialog-footer">
//               <button type="button" onClick={() => setIsEditDialogOpen(false)} className="apple-button-secondary mr-2">
//                 Cancel
//               </button>
//               <button onClick={form.handleSubmit(onSubmit)} disabled={isSaving} className="apple-button">
//                 {isSaving ? "Saving..." : "Save Changes"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }



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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  User,
  Phone,
  MapPin,
  FileText,
  Pencil,
  Wallet,
  Users,
  MessageSquare,
  MapPinned,
  Calendar,
  ChevronRight,
  LogOut,
  Camera,
  Star,
  TrendingUp,
  Activity,
  Globe,
  Heart,
  Settings,
  Bell,
  Shield,
  CreditCard,
  Plane,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { formatDate } from "./utils"

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

interface Conversation {
  friend: {
    _id: string
    name: string
    profileImage?: string
  }
  latestMessage?: {
    content: string
    createdAt: string
  }
  unreadCount: number
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
  const [recentChats, setRecentChats] = useState<Conversation[]>([])
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
        setRecentChats(data.conversations?.slice(0, 5) || [])
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
        console.log("Friends data:", data.friends)
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

      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          image: result.user.profileImage || session?.user.image,
        },
      })

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200"
      case "UPCOMING":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-orange-100 text-orange-800 border-orange-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Activity className="w-3 h-3" />
      case "UPCOMING":
        return <Clock className="w-3 h-3" />
      case "COMPLETED":
        return <CheckCircle className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Skeleton */}
            <div className="text-center mb-12">
              <Skeleton className="w-32 h-32 rounded-full mx-auto mb-6" />
              <Skeleton className="w-64 h-8 mx-auto mb-2" />
              <Skeleton className="w-48 h-4 mx-auto mb-4" />
              <Skeleton className="w-32 h-10 mx-auto" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-96 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </div>
              <div className="space-y-8">
                <Skeleton className="h-80 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Profile Header */}
          <div className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-teal-600 to-teal-600 rounded-3xl opacity-90" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fillRule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fillOpacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] rounded-3xl" />

            <div className="relative text-center py-16 px-8">
              <div className="relative inline-block mb-6">
                <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
                  <AvatarImage src={profileImage || "/placeholder.svg"} alt={form.getValues("name")} />
                  <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {form.getValues("name").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile-image"
                  className="absolute -bottom-2 -right-2 bg-white rounded-full p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-110"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <h1 className="text-4xl font-bold text-white mb-2 capitalize">{form.getValues("name")}</h1>
              <p className="text-blue-100 text-lg mb-2">{form.getValues("email")}</p>
              {form.getValues("bio") && (
                <p className="text-blue-50 max-w-md mx-auto mb-6 italic">"{form.getValues("bio")}"</p>
              )}

              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  onClick={() => setIsEditDialogOpen(true)}
                  className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 transition-all duration-200"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  className="bg-white text-blue-600 border-white hover:bg-blue-50 transition-all duration-200"
                  onClick={() => router.push("/settings")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-8 mb-12 relative z-10">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/wallet")}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">₹{walletBalance.toFixed(2)}</div>
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <div className="mt-2 text-xs text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2.5% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <MapPinned className="w-6 h-6 text-blue-600" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/trips")}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Plane className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{recentTrips.length}</div>
                <p className="text-sm text-gray-600">Active Trips</p>
                <div className="mt-2 text-xs text-blue-600 flex items-center">
                  <Globe className="w-3 h-3 mr-1" />
                  {recentTrips.filter((trip) => trip.status === "ACTIVE").length} ongoing
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/friends")}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-1">{friends.length}</div>
                <p className="text-sm text-gray-600">Travel Buddies</p>
                <div className="mt-2 text-xs text-purple-600 flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  {Math.floor(friends.length * 0.8)} active this month
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-orange-600" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/messages")}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <Bell className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
                <div className="text-2xl font-bold text-orange-600 mb-1">{recentChats.length}</div>
                <p className="text-sm text-gray-600">New Messages</p>
                <div className="mt-2 text-xs text-orange-600 flex items-center">
                  <Activity className="w-3 h-3 mr-1" />
                  {recentChats.reduce((acc, chat) => acc + chat.unreadCount, 0)} unread
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Recent Trips & Messages */}
            <div className="lg:col-span-2 space-y-8">
              {/* Enhanced Recent Trips */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center">
                        <MapPinned className="w-5 h-5 mr-2 text-blue-600" />
                        Recent Adventures
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Your latest travel experiences</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => router.push("/trips")}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      See All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentTrips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {recentTrips.map((trip) => (
                        <div
                          key={trip._id}
                          className="group cursor-pointer bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100"
                          onClick={() => router.push(`/trips/${trip._id}`)}
                        >
                          <div className="relative h-32 overflow-hidden">
                            <img
                              src={
                                trip.thumbnail ||
                                `https://source.unsplash.com/400x200/?${encodeURIComponent(trip.location || "travel")}`
                              }
                              alt={trip.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <Badge
                              className={`absolute top-2 right-2 ${getStatusColor(trip.status)} flex items-center gap-1`}
                            >
                              {getStatusIcon(trip.status)}
                              {trip.status}
                            </Badge>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{trip.name}</h3>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="line-clamp-1">{trip.location || "No location"}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>
                                {new Date(trip.startDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                -{" "}
                                {new Date(trip.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plane className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips yet</h3>
                      <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
                      <Button onClick={() => router.push("/trips/new")} className="bg-teal-600 hover:bg-teal-700">
                        <Plane className="w-4 h-4 mr-2" />
                        Plan Your First Trip
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Recent Messages */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-orange-600" />
                        Recent Conversations
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Stay connected with your travel buddies</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => router.push("/messages")}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      See All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {recentChats.length > 0 ? (
                    <div className="space-y-1">
                      {recentChats.map((conversation, index) => (
                        <div
                          key={conversation.friend._id}
                          className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${index !== recentChats.length - 1 ? "border-b border-gray-100" : ""
                            }`}
                          onClick={() => router.push("/messages")}
                        >
                          <Avatar className="w-12 h-12 mr-4">
                            <AvatarImage
                              src={conversation.friend.profileImage || "/placeholder.svg"}
                              alt={conversation.friend.name}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {conversation.friend.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-gray-900 truncate">{conversation.friend.name}</h4>
                              <span className="text-xs text-gray-500">
                                {conversation.latestMessage ? formatDate(conversation.latestMessage.createdAt) : ""}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.latestMessage?.content || "No messages yet"}
                            </p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-orange-500 text-white ml-2">{conversation.unreadCount}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                      <p className="text-gray-600">Start chatting with your travel buddies!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Account Info & Quick Actions */}
            <div className="space-y-8">
              {/* Account Information */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Full Name</p>
                        <p className="text-sm text-gray-600 capitalize">{form.getValues("name")}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Phone Number</p>
                        <p className="text-sm text-gray-600">{form.getValues("phone") || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MapPin className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Address</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {form.getValues("address") || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <FileText className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Bio</p>
                        <p className="text-sm text-gray-600">{form.getValues("bio") || "No bio available"}</p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => setIsEditDialogOpen(true)} className="w-full bg-teal-600 hover:bg-teal-700">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-gray-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/wallet")}>
                    <CreditCard className="w-4 h-4 mr-3" />
                    Manage Wallet
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/settings")}>
                    <Settings className="w-4 h-4 mr-3" />
                    Account Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/privacy")}>
                    <Shield className="w-4 h-4 mr-3" />
                    Privacy & Security
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => router.push("/api/auth/signout")}
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information and preferences</DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="name" {...form.register("name")} className="pl-10" placeholder="Enter your full name" />
                </div>
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input id="email" {...form.register("email")} disabled className="bg-gray-50 text-gray-500" />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    className="pl-10"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="address"
                    {...form.register("address")}
                    className="pl-10"
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="bio"
                    {...form.register("bio")}
                    className="pl-10 min-h-[80px] resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
