// // File: app/trips/[id]/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, useParams } from "next/navigation";
// import Image from "next/image";
// import { useSession } from "next-auth/react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useToast } from "@/hooks/use-toast";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { formatDate, formatCurrency, calculateTripDuration } from "@/lib/utils";
// import { Calendar, Users, Tag, Wallet, MoreVertical, Edit, Trash2, UserCheck, UserMinus } from "lucide-react";
// import TripMembers from "@/components/trip-members";
// import TripExpenses from "@/components/trip-expenses";
// import TripChat from "@/components/trip-chat";

// interface Member {
//   user: {
//     _id: string;
//     name: string;
//     email: string;
//     profileImage?: string;
//   };
//   role: string;
//   status: string;
//   addedBy: string; // Add this field to match the definition in trip-members.tsx
// }

// interface Trip {
//   _id: string;
//   name: string;
//   description: string;
//   startDate: string;
//   endDate: string;
//   category: string;
//   isPublic: boolean;
//   thumbnail: string;
//   minMembers: number;
//   members: Member[]; // This will now be compatible with the TripMembers component
//   expenses: any[];
//   wallet: {
//     balance: number;
//     pendingWithdrawal: boolean;
//     withdrawalApprovals: string[];
//   };
// }

// export default function TripDetailsPage() {
//   const { id } = useParams();
//   const { data: session, status } = useSession();
//   const router = useRouter();
//   const { toast } = useToast();
//   const [trip, setTrip] = useState<Trip | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("overview");
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [pendingRequests, setPendingRequests] = useState<Member[]>([]);
//   const [processingRequestIds, setProcessingRequestIds] = useState<Record<string, boolean>>({});

//   useEffect(() => {
//     if (status === "unauthenticated") {
//       router.push("/login");
//     }

//     if (status === "authenticated") {
//       fetchTrip();
//     }
//   }, [status, router, id]);

//   useEffect(() => {
//     // Extract pending join requests when trip data is loaded
//     if (trip) {
//       const requests = trip.members.filter(member => member.status === "requested");
//       setPendingRequests(requests);
//     }
//   }, [trip]);

//   const fetchTrip = async () => {
//     try {
//       const response = await fetch(`/api/trips/${id}`);
//       const data = await response.json();

//       if (response.ok) {
//         // Populate shares.user with member information for each expense
//         if (data.trip && data.trip.expenses) {
//           data.trip.expenses.forEach((expense: { shares: { user: any }[] }) => {
//             if (expense.shares) {
//               expense.shares.forEach((share) => {
//                 // If share.user is just an ID or is undefined
//                 if (!share.user || typeof share.user === 'string' || !share.user.name) {
//                   // Find the member with matching ID from the trip members
//                   const member = data.trip.members.find((m: Member) =>
//                     m.user._id === (typeof share.user === 'string' ? share.user : share.user?._id)
//                   );
//                   // If found, replace with the full user object
//                   if (member) {
//                     share.user = member.user;
//                   }
//                 }
//               });
//             }
//           });
//         }
//         setTrip(data.trip);
//       } else {
//         if (data.error === "You do not have access to this trip") {
//           toast({
//             title: "Access Denied",
//             description: "You don't have permission to view this trip. You must be an accepted member.",
//             variant: "destructive",
//           });
//         }
//         router.push("/trips");
//       }
//     } catch (error) {
//       console.error("Error fetching trip:", error);
//       router.push("/trips");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEditTrip = () => {
//     router.push(`/trips/${id}/edit`);
//   };

//   const handleDeleteTrip = async () => {
//     if (!trip) return;

//     setIsDeleting(true);
//     try {
//       const response = await fetch(`/api/trips/${id}`, {
//         method: "DELETE",
//       });

//       if (response.ok) {
//         toast({
//           title: "Trip Deleted",
//           description: "Trip has been successfully deleted",
//         });
//         router.push("/trips");
//       } else {
//         const data = await response.json();
//         throw new Error(data.error || "Failed to delete trip");
//       }
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.message,
//         variant: "destructive",
//       });
//     } finally {
//       setIsDeleting(false);
//       setDeleteDialogOpen(false);
//     }
//   };

//   const handleRequestAction = async (memberId: string, action: "approve" | "reject") => {
//     setProcessingRequestIds(prev => ({ ...prev, [memberId]: true }));

//     try {
//       const response = await fetch(`/api/trips/${id}/members/${memberId}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           status: action === "approve" ? "accepted" : "rejected"
//         }),
//       });

//       if (!response.ok) {
//         const data = await response.json();
//         throw new Error(data.error || `Failed to ${action} member request`);
//       }

//       // Update the local state to reflect the change
//       setTrip(prevTrip => {
//         if (!prevTrip) return null;

//         const updatedMembers = prevTrip.members.map(member => {
//           if (member.user._id === memberId) {
//             return {
//               ...member,
//               status: action === "approve" ? "accepted" : "rejected"
//             };
//           }
//           return member;
//         });

//         return {
//           ...prevTrip,
//           members: updatedMembers
//         };
//       });

//       // Update the pending requests list
//       setPendingRequests(prev => prev.filter(req => req.user._id !== memberId));

//       toast({
//         title: `Request ${action === "approve" ? "Approved" : "Rejected"}`,
//         description: `Member request has been ${action === "approve" ? "approved" : "rejected"}.`,
//       });
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.message,
//         variant: "destructive",
//       });
//     } finally {
//       setProcessingRequestIds(prev => ({ ...prev, [memberId]: false }));
//     }
//   };

//   if (status === "loading" || loading) {
//     return (
//       <div className="container px-4 py-8 mx-auto">
//         <div className="mb-6">
//           <Skeleton className="w-1/3 h-10 mb-2" />
//           <Skeleton className="w-1/2 h-6" />
//         </div>

//         <Skeleton className="w-full h-[200px] mb-6" />

//         <div className="grid gap-6 md:grid-cols-3">
//           {[1, 2, 3].map((i) => (
//             <Skeleton key={i} className="h-40" />
//           ))}
//         </div>
//       </div>
//     );
//   }

//   if (!trip) {
//     return (
//       <div className="container px-4 py-8 mx-auto">
//         <div className="p-8 text-center bg-white rounded-lg shadow">
//           <h3 className="mb-2 text-xl font-semibold">Trip not found</h3>
//           <p className="mb-4 text-gray-600">
//             The trip you're looking for doesn't exist or you don't have access to it.
//           </p>
//           <Button onClick={() => router.push("/trips")}>Back to Trips</Button>
//         </div>
//       </div>
//     );
//   }

//   const isAuthor = trip.members.some(
//     (member) =>
//       member.user._id === session?.user.id && member.role === "author"
//   );

//   const isAcceptedMember = trip.members.some(
//     (member) =>
//       member.user._id === session?.user.id && member.status === "accepted"
//   );

//   if (!isAcceptedMember) {
//     return (
//       <div className="container px-4 py-8 mx-auto">
//         <div className="p-8 text-center bg-white rounded-lg shadow">
//           <h3 className="mb-2 text-xl font-semibold">Access Restricted</h3>
//           <p className="mb-4 text-gray-600">
//             You need to be an accepted member to view this trip's details.
//           </p>
//           <Button onClick={() => router.push("/trips")}>Back to Trips</Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container px-4 py-8 mx-auto">
//       <div className="mb-8">
//         <div className="flex items-center justify-between mb-4">
//           <h1 className="text-3xl font-bold">{trip.name}</h1>

//           {isAuthor && (
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant="ghost" size="icon">
//                   <MoreVertical className="w-5 h-5" />
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end">
//                 <DropdownMenuLabel>Trip Actions</DropdownMenuLabel>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem onClick={handleEditTrip}>
//                   <Edit className="w-4 h-4 mr-2" />
//                   Edit Trip
//                 </DropdownMenuItem>
//                 <DropdownMenuItem
//                   className="text-red-600 focus:text-red-600"
//                   onClick={() => setDeleteDialogOpen(true)}
//                 >
//                   <Trash2 className="w-4 h-4 mr-2" />
//                   Delete Trip
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           )}
//         </div>

//         <div className="relative h-64 mb-6 overflow-hidden rounded-xl">
//           <Image
//             src={trip.thumbnail || "/images/placeholder.jpg"}
//             alt={trip.name}
//             fill
//             className="object-cover"
//           />
//           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
//           <div className="absolute bottom-0 left-0 right-0 p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <Badge variant="outline" className="capitalize bg-white/20 text-white mb-2">
//                   {trip.category.replace("_", " ")}
//                 </Badge>
//                 <p className="text-white/80">{trip.description}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {isAuthor && pendingRequests.length > 0 && (
//         <Card className="mb-8 border-blue-200 bg-blue-50 w-full sm:w-10/12 md:w-8/12 lg:w-6/12 mx-auto">
//           <CardHeader className="pb-2">
//             <CardTitle className="text-lg">
//               Pending Join Requests ({pendingRequests.length})
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-3">
//               {pendingRequests.map(request => (
//                 <div
//                   key={request.user._id}
//                   className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white rounded-lg shadow-sm"
//                 >
//                   <div className="flex items-center">
//                     <Avatar className="w-10 h-10 mr-3">
//                       <AvatarImage src={request.user.profileImage} alt={request.user.name} />
//                       <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
//                     </Avatar>
//                     <div>
//                       <p className="font-medium">{request.user.name}</p>
//                       <p className="text-sm text-gray-500">{request.user.email}</p>
//                     </div>
//                   </div>
//                   <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-3 sm:mt-0 w-full sm:w-auto">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="border-green-500 text-green-700 hover:bg-green-50 w-full sm:w-auto"
//                       onClick={() => handleRequestAction(request.user._id, "approve")}
//                       disabled={processingRequestIds[request.user._id]}
//                     >
//                       <UserCheck className="w-4 h-4 mr-1" />
//                       Approve
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="border-red-500 text-red-700 hover:bg-red-50 w-full sm:w-auto"
//                       onClick={() => handleRequestAction(request.user._id, "reject")}
//                       disabled={processingRequestIds[request.user._id]}
//                     >
//                       <UserMinus className="w-4 h-4 mr-1" />
//                       Reject
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//       )}

//       <div className="grid gap-6 mb-8 md:grid-cols-3">
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-lg">Trip Dates</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-col">
//               <div className="flex items-center">
//                 <Calendar className="w-5 h-5 mr-2 text-primary" />
//                 <span>
//                   {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
//                 </span>
//               </div>
//               <div className="mt-1 text-sm text-gray-600 ml-7">
//                 {calculateTripDuration(trip.startDate, trip.endDate)} day trip
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-lg">Members</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center">
//               <Users className="w-5 h-5 mr-2 text-primary" />
//               <span>
//                 {trip.members.filter(m => m.status === "accepted").length} members
//                 {trip.minMembers > 0 &&
//                   <span className="text-sm text-gray-500"> (min: {trip.minMembers})</span>
//                 }
//               </span>
//               <div className="flex ml-auto -space-x-2">
//                 {trip.members
//                   .filter(m => m.status === "accepted")
//                   .slice(0, 3)
//                   .map((member) => (
//                     <Avatar
//                       key={member.user._id}
//                       className="border-2 border-white w-7 h-7"
//                     >
//                       <AvatarImage
//                         src={member.user.profileImage}
//                         alt={member.user.name}
//                       />
//                       <AvatarFallback>
//                         {member.user.name.charAt(0)}
//                       </AvatarFallback>
//                     </Avatar>
//                   ))}
//                 {trip.members.filter(m => m.status === "accepted").length > 3 && (
//                   <div className="flex items-center justify-center w-7 h-7 text-xs font-medium text-white bg-primary rounded-full border-2 border-white">
//                     +{trip.members.filter(m => m.status === "accepted").length - 3}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-lg">Trip Wallet</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center">
//               <Wallet className="w-5 h-5 mr-2 text-primary" />
//               <span>{formatCurrency(trip.wallet.balance)}</span>
//               {isAuthor && trip.wallet.balance > 0 && (
//                 <Button variant="outline" size="sm" className="ml-auto">
//                   Withdraw
//                 </Button>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Tabs defaultValue="overview" onValueChange={setActiveTab}>
//         <TabsList className="mb-6">
//           <TabsTrigger value="overview">Overview</TabsTrigger>
//           <TabsTrigger value="members">Members</TabsTrigger>
//           <TabsTrigger value="expenses">Expenses</TabsTrigger>
//           <TabsTrigger value="chat">Chat</TabsTrigger>
//         </TabsList>

//         <TabsContent value="overview">
//           <div className="grid gap-6 md:grid-cols-2">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Trip Details</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   <div>
//                     <h3 className="mb-1 font-medium">Description</h3>
//                     <p className="text-gray-600">{trip.description}</p>
//                   </div>
//                   <div>
//                     <h3 className="mb-1 font-medium">Category</h3>
//                     <div className="flex items-center">
//                       <Tag className="w-4 h-4 mr-2 text-primary" />
//                       <span className="capitalize">
//                         {trip.category.replace("_", " ")}
//                       </span>
//                     </div>
//                   </div>
//                   <div>
//                     <h3 className="mb-1 font-medium">Visibility</h3>
//                     <div className="flex items-center">
//                       <span>{trip.isPublic ? "Public" : "Private"}</span>
//                     </div>
//                   </div>
//                   <div>
//                     <h3 className="mb-1 font-medium">Minimum Members</h3>
//                     <div className="flex items-center">
//                       <span>{trip.minMembers} members required</span>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Recent Activity</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {trip.expenses.length === 0 ? (
//                   <p className="text-gray-600">No recent activity</p>
//                 ) : (
//                   <div className="space-y-4">
//                     {trip.expenses.slice(0, 5).map((expense) => (
//                       <div
//                         key={expense._id}
//                         className="flex items-center justify-between"
//                       >
//                         <div>
//                           <p className="font-medium">{expense.title}</p>
//                           <p className="text-sm text-gray-600">
//                             Added by {expense.addedBy.name} on{" "}
//                             {formatDate(expense.date)}
//                           </p>
//                         </div>
//                         <p className="font-medium">
//                           {formatCurrency(expense.amount)}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>

//         <TabsContent value="members">
//           <TripMembers
//             tripId={id as string}
//             members={trip.members}
//             isAuthor={isAuthor}
//             onUpdate={fetchTrip}
//           />
//         </TabsContent>

//         <TabsContent value="expenses">
//           <TripExpenses
//             tripId={id as string}
//             expenses={trip.expenses}
//             members={trip.members}
//             onUpdate={fetchTrip}
//           />
//         </TabsContent>

//         <TabsContent value="chat">
//           <TripChat tripId={id as string} />
//         </TabsContent>
//       </Tabs>

//       {/* Delete Trip Confirmation Dialog */}
//       <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Delete Trip</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to delete this trip? This action cannot be undone.
//               All trip data, expenses, and messages will be permanently removed.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
//               Cancel
//             </Button>
//             <Button variant="destructive" onClick={handleDeleteTrip} disabled={isDeleting}>
//               {isDeleting ? "Deleting..." : "Delete Trip"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }




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
import { Calendar, Users, Tag, Wallet, MoreVertical, Edit, Trash2, UserCheck, UserMinus, Map, Clock, MapPin } from "lucide-react";
import TripExpenses from "@/components/trip-expenses";
import TripChat from "@/components/trip-chat";
import { motion } from "framer-motion";
import TripMembers from "@/components/trip-members";
import { cn } from "@/lib/utils";
import TripWalletDialog from "@/components/trip-wallet-dialog";

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
  const [transferringFunds, setTransferringFunds] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const calculatedBalance = trip?.wallet?.balance || 0;
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container px-4 py-8 mx-auto max-w-6xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-50">{trip.name}</h1>

          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl shadow-lg border border-gray-100 dark:border-gray-800">
                <DropdownMenuLabel className="text-gray-500">Trip Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleEditTrip} className="cursor-pointer">
                  <Edit className="w-4 h-4 mr-2 text-blue-500" />
                  Edit Trip
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500 cursor-pointer"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Trip
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="relative h-72 mb-6 overflow-hidden rounded-2xl shadow-md">
          <Image
            src={trip.thumbnail || "/images/placeholder.jpg"}
            alt={trip.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="mb-3 px-3 py-1 bg-blue-500/80 text-white border-0 backdrop-blur-sm rounded-full font-medium">
                  {trip.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                </Badge>
                <p className="text-white/90 max-w-2xl text-lg font-light">{trip.description}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {isAuthor && pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="mb-8 border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 border-b border-blue-200/30">
              <CardTitle className="text-lg text-blue-700 dark:text-blue-300 flex items-center">
                <UserCheck className="w-5 h-5 mr-2" />
                Pending Join Requests ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <motion.div
                    key={request.user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center">
                      <Avatar className="w-10 h-10 mr-3 border-2 border-blue-100 dark:border-blue-800">
                        <AvatarImage src={request.user.profileImage} alt={request.user.name} />
                        <AvatarFallback className="bg-blue-500 text-white">{request.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{request.user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-3 sm:mt-0 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 w-full sm:w-auto rounded-full"
                        onClick={() => handleRequestAction(request.user._id, "approve")}
                        disabled={processingRequestIds[request.user._id]}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto rounded-full"
                        onClick={() => handleRequestAction(request.user._id, "reject")}
                        disabled={processingRequestIds[request.user._id]}
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid gap-6 mb-10 md:grid-cols-3"
      >
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              Trip Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-400" />
                <span className="font-medium">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 ml-7">
                {calculateTripDuration(trip.startDate, trip.endDate)} day journey
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-lg flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              Travelers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">
                  {trip.members.filter(m => m.status === "accepted").length} members
                </span>
                {trip.minMembers > 0 &&
                  <span className="text-sm text-gray-500 ml-1"> (min: {trip.minMembers})</span>
                }
              </div>
              <div className="flex -space-x-2">
                {trip.members
                  .filter(m => m.status === "accepted")
                  .slice(0, 4)
                  .map((member) => (
                    <Avatar
                      key={member.user._id}
                      className="border-2 border-white dark:border-gray-900 w-8 h-8"
                    >
                      <AvatarImage
                        src={member.user.profileImage}
                        alt={member.user.name}
                      />
                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                        {member.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                {trip.members.filter(m => m.status === "accepted").length > 4 && (
                  <div className="flex items-center justify-center w-8 h-8 text-xs font-medium text-white bg-blue-500 rounded-full border-2 border-white dark:border-gray-900">
                    +{trip.members.filter(m => m.status === "accepted").length - 4}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-lg flex items-center">
              <Wallet className="w-5 h-5 mr-2 text-blue-500" />
              Trip Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold">{formatCurrency(calculatedBalance)}</span>

              {isAuthor && calculatedBalance > 0 ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => setWalletDialogOpen(true)}
                  >
                    Withdraw
                  </Button>

                  {trip.wallet.pendingWithdrawal && trip.wallet.withdrawalApprovals.length >= Math.ceil(trip.members.filter(m => m.status === "accepted").length / 2) && (
                    <Button
                      size="sm"
                      className="rounded-full px-4 bg-green-500 hover:bg-green-600 text-white"
                      onClick={async () => {
                        setTransferringFunds(true);
                        try {
                          await fetch(`/api/trips/${id}/wallet/transfer`, {
                            method: "POST",
                          });
                          toast({
                            title: "Funds Transferred",
                            description: `${formatCurrency(calculatedBalance)} has been transferred to your wallet.`,
                          });
                          fetchTrip(); // Refresh trip data
                        } catch (error) {
                          toast({
                            title: "Transfer Failed",
                            description: "Failed to transfer funds to your wallet.",
                            variant: "destructive",
                          });
                        } finally {
                          setTransferringFunds(false);
                        }
                      }}
                      disabled={transferringFunds}
                    >
                      {transferringFunds ? "Transferring..." : "Transfer to Wallet"}
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-4 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => setWalletDialogOpen(true)}
                >
                  {isAuthor ? "Manage Wallet" : "View Details"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Tabs
          defaultValue="overview"
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-full w-fit">
            <TabsTrigger
              value="overview"
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${activeTab === "overview" ? "bg-white dark:bg-gray-700 shadow-sm" : ""
                }`}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${activeTab === "members" ? "bg-white dark:bg-gray-700 shadow-sm" : ""
                }`}
            >
              Members
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${activeTab === "expenses" ? "bg-white dark:bg-gray-700 shadow-sm" : ""
                }`}
            >
              Expenses
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${activeTab === "chat" ? "bg-white dark:bg-gray-700 shadow-sm" : ""
                }`}
            >
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="focus-visible:outline-none focus-visible:ring-0">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
                <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                  <CardTitle className="text-lg">Trip Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-2 font-medium text-gray-500 dark:text-gray-400">Description</h3>
                      <p className="text-gray-900 dark:text-gray-200">{trip.description}</p>
                    </div>
                    <div>
                      <h3 className="mb-2 font-medium text-gray-500 dark:text-gray-400">Category</h3>
                      <div className="flex items-center">
                        <Tag className="w-4 h-4 mr-2 text-blue-500" />
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 border-0 rounded-full">
                          {trip.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-2 font-medium text-gray-500 dark:text-gray-400">Location</h3>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                        <span>
                          {trip.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-2 font-medium text-gray-500 dark:text-gray-400">Visibility</h3>
                      <div className="flex items-center">
                        <Badge className={`rounded-full px-3 ${trip.isPublic
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          } border-0`}>
                          {trip.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
                <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {trip.expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Wallet className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400">No expenses recorded yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 rounded-full"
                        onClick={() => setActiveTab("expenses")}
                      >
                        Add an Expense
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {trip.expenses.slice(0, 5).map((expense, index) => (
                        <motion.div
                          key={expense._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{expense.title}</p>
                            <div className="flex items-center mt-1">
                              <Avatar className="w-5 h-5 mr-1">
                                <AvatarImage src={expense.addedBy.profileImage} alt={expense.addedBy.name} />
                                <AvatarFallback className="text-[10px]">{expense.addedBy.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {expense.addedBy.name} · {formatDate(expense.date)}
                              </p>
                            </div>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(expense.amount)}
                          </p>
                        </motion.div>
                      ))}

                      {trip.expenses.length > 5 && (
                        <Button
                          variant="ghost"
                          className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          onClick={() => setActiveTab("expenses")}
                        >
                          View All Expenses
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="focus-visible:outline-none focus-visible:ring-0">
            <TripMembers
              tripId={id as string}
              members={trip.members}
              isAuthor={isAuthor}
              onUpdate={fetchTrip}
            />
          </TabsContent>

          <TabsContent value="expenses" className="focus-visible:outline-none focus-visible:ring-0">
            <TripExpenses
              tripId={id as string}
              expenses={trip.expenses}
              members={trip.members}
              onUpdate={fetchTrip}
            />
          </TabsContent>

          <TabsContent value="chat" className="focus-visible:outline-none focus-visible:ring-0">
            <TripChat tripId={id as string} />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Delete Trip Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Trip</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400 mt-2">
              Are you sure you want to delete this trip? This action cannot be undone.
              All trip data, expenses, and messages will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="mt-3 sm:mt-0 rounded-full"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTrip}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 rounded-full"
            >
              {isDeleting ? "Deleting..." : "Delete Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TripWalletDialog
        open={walletDialogOpen}
        onOpenChange={setWalletDialogOpen}
        tripId={id as string}
      />
    </motion.div>
  );
}
