"use client"

import { useState, useEffect, useMemo } from "react"
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
  User,
  Search,
  Loader2
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

  // New states for user search
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Friend[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchFriendsData()
    }
  }, [status, router])

  // Search users when user types in search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (userSearchQuery.trim() && isAddFriendDialogOpen) {
        searchUsers(userSearchQuery)
      } else if (userSearchQuery.trim() === "") {
        // Show all available users when search is empty
        searchUsers("")
      }
    }, 300) // Debounce search

    return () => clearTimeout(delayedSearch)
  }, [userSearchQuery, isAddFriendDialogOpen])

  // Load users when dialog opens
  useEffect(() => {
    if (isAddFriendDialogOpen) {
      searchUsers("")
      setShowSearchResults(true)
    } else {
      setShowSearchResults(false)
      setUserSearchQuery("")
      setSearchResults([])
    }
  }, [isAddFriendDialogOpen])

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

  const searchUsers = async (query: string) => {
    try {
      setSearchLoading(true)
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error("Failed to search users")
      }

      const data = await response.json()
      setSearchResults(data.users || [])
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      })
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSendFriendRequestById = async (recipientId: string, recipientName: string) => {
    try {
      setSending(true)
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: recipientId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send friend request")
      }

      toast({
        title: "Success",
        description: `Friend request sent to ${recipientName}`,
      })

      // Remove user from search results
      setSearchResults(prev => prev.filter(user => user._id !== recipientId))
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
  const filteredFriends = useMemo(() => {
    return friends.filter(friend =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (friend.username && friend.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [friends, searchQuery])

  // Filter search results by user search query
  const filteredSearchResults = useMemo(() => {
    if (!userSearchQuery.trim()) return searchResults

    return searchResults.filter(user =>
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
      user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    )
  }, [searchResults, userSearchQuery])

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Friends
          </h1>
          <p className="text-gray-600 mt-2">Connect and chat with your travel companions</p>
        </div>
        <Dialog open={isAddFriendDialogOpen} onOpenChange={setIsAddFriendDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                Add a Friend
              </DialogTitle>
              <DialogDescription>
                Search for users or send a friend request using email/username
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col space-y-4 flex-1 overflow-hidden">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users by name, username, or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              {showSearchResults && (
                <div className="flex-1 overflow-y-auto min-h-0">
                  <h4 className="font-medium mb-3 text-sm text-gray-600 uppercase tracking-wide">
                    {userSearchQuery.trim() ? "Search Results" : "Available Users"}
                  </h4>

                  {searchLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="ml-2">Searching...</span>
                    </div>
                  ) : filteredSearchResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>{userSearchQuery.trim() ? "No users found" : "No available users"}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSearchResults.map((user) => (
                        <Card key={user._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={user.profileImage} alt={user.name} />
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-sm">{user.name}</h4>
                                    {user.username && (
                                      <Badge variant="secondary" className="text-xs">
                                        @{user.username}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleSendFriendRequestById(user._id, user.name)}
                                disabled={sending}
                                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                              >
                                {sending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    Add
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Manual Entry Section */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 text-sm text-gray-600 uppercase tracking-wide">
                  Send Request Manually
                </h4>
                <div className="space-y-3">
                  <Input
                    placeholder="Enter email or username"
                    value={friendIdentifier}
                    onChange={(e) => setFriendIdentifier(e.target.value)}
                  />
                  <Button
                    onClick={handleSendFriendRequest}
                    disabled={sending || !friendIdentifier.trim()}
                    className="w-full"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddFriendDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
          <TabsTrigger value="friends" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Friends ({friends.length})</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Requests ({receivedRequests.length + sentRequests.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md pl-10"
            />
          </div>

          {filteredFriends.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? "No friends found" : "No friends yet"}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  {searchQuery
                    ? "No friends match your search query. Try a different search term."
                    : "Start building your travel network by adding friends to connect and plan trips together."}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setIsAddFriendDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Your First Friend
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFriends.map((friend) => (
                <Card key={friend._id} className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar className="w-14 h-14 ring-2 ring-gray-100">
                        <AvatarImage src={friend.profileImage} alt={friend.name} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg">
                          {friend.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{friend.name}</h3>
                          {friend.username && (
                            <Badge variant="secondary" className="text-xs">
                              @{friend.username}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{friend.email}</p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => navigateToChat(friend._id)}
                      className="w-full group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Received Requests */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                Received Requests
              </h3>
              {receivedRequests.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <UserCheck className="w-12 h-12 mb-3 text-gray-400" />
                    <p className="text-gray-600">No pending friend requests</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {receivedRequests.map((request) => (
                    <Card key={request._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={request.sender.profileImage} alt={request.sender.name} />
                              <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                                {request.sender.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{request.sender.name}</h4>
                              <p className="text-sm text-gray-500">{request.sender.email}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleRespondToRequest(request._id, "accept")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRespondToRequest(request._id, "reject")}
                              className="border-red-200 text-red-600 hover:bg-red-50"
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
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Sent Requests
              </h3>
              {sentRequests.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <UserPlus className="w-12 h-12 mb-3 text-gray-400" />
                    <p className="text-gray-600">No outgoing friend requests</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((request) => (
                    <Card key={request._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={request.recipient.profileImage} alt={request.recipient.name} />
                              <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                {request.recipient.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{request.recipient.name}</h4>
                              <p className="text-sm text-gray-500">{request.recipient.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Pending
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelRequest(request._id)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
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
