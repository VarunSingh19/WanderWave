"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Button
} from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import {
  UserPlus,
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  User
} from "lucide-react"

interface Friend {
  _id: string
  name: string
  email: string
  profileImage?: string
  username?: string
}

interface FriendRequest {
  _id: string
  sender: Friend
  recipient: Friend
  status: string
  createdAt: string
}

export default function FriendsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState<Friend[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false)
  const [friendIdentifier, setFriendIdentifier] = useState("")
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchFriendsData()
    }
  }, [status, router])

  const fetchFriendsData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/friends")

      if (!response.ok) {
        throw new Error("Failed to fetch friends data")
      }

      const data = await response.json()
      setFriends(data.friends || [])
      setSentRequests(data.sentRequests || [])
      setReceivedRequests(data.receivedRequests || [])
    } catch (error) {
      console.error("Error fetching friends data:", error)
      toast({
        title: "Error",
        description: "Failed to load friends data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendFriendRequest = async () => {
    if (!friendIdentifier || friendIdentifier.trim() === "") {
      toast({
        title: "Error",
        description: "Please enter an email or username",
        variant: "destructive",
      })
      return
    }

    try {
      setSending(true)
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientIdentifier: friendIdentifier.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send friend request")
      }

      toast({
        title: "Success",
        description: "Friend request sent successfully",
      })

      setFriendIdentifier("")
      setIsAddFriendDialogOpen(false)
      fetchFriendsData() // Refresh the data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/${requestId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to cancel request")
      }

      toast({
        title: "Success",
        description: "Friend request canceled",
      })

      fetchFriendsData() // Refresh the data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel request",
        variant: "destructive",
      })
    }
  }

  const handleRespondToRequest = async (requestId: string, action: "accept" | "reject") => {
    try {
      const response = await fetch(`/api/friends/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to process request")
      }

      toast({
        title: "Success",
        description: action === "accept"
          ? "Friend request accepted"
          : "Friend request rejected",
      })

      fetchFriendsData() // Refresh the data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      })
    }
  }

  const navigateToChat = (friendId: string) => {
    router.push(`/messages?friendId=${friendId}`)
  }

  // Filter friends by search query
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.username && friend.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === "loading" || loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="mb-6">
          <Skeleton className="w-1/3 h-10 mb-2" />
          <Skeleton className="w-1/2 h-6" />
        </div>
        <Skeleton className="w-full h-12 mb-6" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Friends</h1>
          <p className="text-gray-600">Manage your friends and chat with them</p>
        </div>
        <Dialog open={isAddFriendDialogOpen} onOpenChange={setIsAddFriendDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Friend</DialogTitle>
              <DialogDescription>
                Send a friend request using email or username
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-4">
                <Label htmlFor="friendIdentifier">Email or Username</Label>
                <Input
                  id="friendIdentifier"
                  placeholder="friend@example.com or username"
                  value={friendIdentifier}
                  onChange={(e) => setFriendIdentifier(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddFriendDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendFriendRequest}
                disabled={sending || !friendIdentifier.trim()}
              >
                {sending ? "Sending..." : "Send Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="friends">
        <TabsList className="mb-6">
          <TabsTrigger value="friends" className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Requests ({receivedRequests.length + sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <div className="mb-6">
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {filteredFriends.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Users className="w-12 h-12 mb-4 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold">No friends yet</h3>
                <p className="mb-4 text-gray-600">
                  {searchQuery
                    ? "No friends match your search query."
                    : "Add some friends to connect and chat with them."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddFriendDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friend
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFriends.map((friend) => (
                <Card key={friend._id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={friend.profileImage} alt={friend.name} />
                        <AvatarFallback>
                          {friend.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center">
                          <h3 className="font-medium">{friend.name}</h3>
                          {friend.username && (
                            <Badge variant="secondary" className="ml-2">
                              @{friend.username}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{friend.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-4 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToChat(friend._id)}
                      >
                        <Mail className="w-3.5 h-3.5 mr-1.5" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Received Requests */}
            <div>
              <h3 className="mb-4 text-xl font-semibold">Received Requests</h3>
              {receivedRequests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <UserCheck className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="text-gray-600">No pending friend requests</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {receivedRequests.map((request) => (
                    <Card key={request._id}>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Avatar className="w-10 h-10 mr-3">
                            <AvatarImage src={request.sender.profileImage} alt={request.sender.name} />
                            <AvatarFallback>
                              {request.sender.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 mr-4">
                            <h4 className="font-medium">{request.sender.name}</h4>
                            <p className="text-sm text-gray-500">{request.sender.email}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleRespondToRequest(request._id, "accept")}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRespondToRequest(request._id, "reject")}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Sent Requests */}
            <div>
              <h3 className="mb-4 text-xl font-semibold">Sent Requests</h3>
              {sentRequests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <UserPlus className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="text-gray-600">No outgoing friend requests</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <Card key={request._id}>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Avatar className="w-10 h-10 mr-3">
                            <AvatarImage src={request.recipient.profileImage} alt={request.recipient.name} />
                            <AvatarFallback>
                              {request.recipient.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 mr-4">
                            <h4 className="font-medium">{request.recipient.name}</h4>
                            <p className="text-sm text-gray-500">{request.recipient.email}</p>
                          </div>
                          <div>
                            <Badge variant="secondary" className="mb-2">Pending</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleCancelRequest(request._id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
