"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Input
} from "@/components/ui/input"
import {
  Button
} from "@/components/ui/button"
import {
  Badge
} from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  UserPlus,
  Send,
  Users,
  ArrowLeft,
  User
} from "lucide-react"

interface Friend {
  _id: string
  name: string
  email: string
  profileImage?: string
  username?: string
}

interface Message {
  _id: string
  sender: string
  recipient: string
  content: string
  read: boolean
  createdAt: string
}

interface Conversation {
  friend: Friend
  latestMessage?: {
    content: string
    createdAt: string
  }
  unreadCount: number
}

export default function MessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showConversations, setShowConversations] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    // Check if a friend ID is provided in the URL
    const friendId = searchParams.get("friendId")
    if (friendId) {
      setSelectedFriendId(friendId)
      setShowConversations(false)
    }

    // Handle mobile view
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)

    if (status === "authenticated") {
      fetchConversations()
    }

    return () => window.removeEventListener("resize", handleResize)
  }, [status, router, searchParams])

  useEffect(() => {
    if (selectedFriendId) {
      fetchMessages(selectedFriendId)

      // Find and set the selected friend data
      const friend = conversations.find(conv => conv.friend._id === selectedFriendId)?.friend
      if (friend) {
        setSelectedFriend(friend)
      }
    }
  }, [selectedFriendId, conversations])

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/messages")

      if (!response.ok) {
        throw new Error("Failed to fetch conversations")
      }

      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error("Error fetching conversations:", error)
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (friendId: string) => {
    try {
      const response = await fetch(`/api/messages?friendId=${friendId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageInput.trim() || !selectedFriendId) return

    try {
      setSendingMessage(true)
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: selectedFriendId,
          content: messageInput.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      // Add the new message to the list and clear input
      setMessages(prev => [...prev, data.data])
      setMessageInput("")

      // Update conversations with new message
      setConversations(prevConversations =>
        prevConversations.map(conv => {
          if (conv.friend._id === selectedFriendId) {
            return {
              ...conv,
              latestMessage: {
                content: messageInput.trim(),
                createdAt: new Date().toISOString()
              }
            }
          }
          return conv
        })
      )
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  const handleSelectConversation = (friendId: string) => {
    setSelectedFriendId(friendId)
    if (isMobile) {
      setShowConversations(false)
    }
  }

  const goBack = () => {
    setShowConversations(true)
  }

  if (status === "loading" || loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="mb-6">
          <Skeleton className="w-1/3 h-10 mb-2" />
        </div>
        <div className="grid h-[calc(100vh-200px)] gap-4 md:grid-cols-3">
          <Skeleton className="hidden md:block" />
          <Skeleton className="md:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Button onClick={() => router.push("/friends")} variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Friends
        </Button>
      </div>

      <div className="grid h-[calc(100vh-200px)] gap-4 overflow-hidden md:grid-cols-3">
        {/* Conversations List - Hidden on mobile when a chat is selected */}
        {(!isMobile || showConversations) && (
          <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Conversations
              </CardTitle>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <User className="w-12 h-12 mb-4 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium">No conversations yet</h3>
                  <p className="text-sm text-gray-600">
                    Add friends to start chatting
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/friends")}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Find Friends
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.friend._id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedFriendId === conversation.friend._id
                          ? "bg-primary/10"
                          : "hover:bg-primary/5"
                      }`}
                      onClick={() => handleSelectConversation(conversation.friend._id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={conversation.friend.profileImage} alt={conversation.friend.name} />
                            <AvatarFallback>
                              {conversation.friend.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.unreadCount > 0 && (
                            <Badge
                              className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 p-0 text-xs transform translate-x-1/3 -translate-y-1/3 rounded-full"
                            >
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{conversation.friend.name}</h4>
                            {conversation.latestMessage && (
                              <span className="text-xs text-gray-500">
                                {formatMessageTime(conversation.latestMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          {conversation.latestMessage && (
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.latestMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        )}

        {/* Chat Window - Hidden on mobile when showing conversations list */}
        {(!isMobile || !showConversations) && (
          <Card className="flex flex-col h-full overflow-hidden md:col-span-2">
            {selectedFriend ? (
              <>
                <CardHeader className="flex-shrink-0 border-b">
                  <div className="flex items-center">
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mr-2 p-0 h-8 w-8"
                        onClick={goBack}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    )}
                    <Avatar className="w-8 h-8 mr-2">
                      <AvatarImage src={selectedFriend.profileImage} alt={selectedFriend.name} />
                      <AvatarFallback>
                        {selectedFriend.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{selectedFriend.name}</CardTitle>
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-gray-500">
                        No messages yet. Start a conversation!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isSentByMe = message.sender === session?.user?.id
                        const shouldShowDate = index === 0 ||
                          formatMessageDate(messages[index - 1].createdAt) !== formatMessageDate(message.createdAt)

                        return (
                          <div key={message._id}>
                            {shouldShowDate && (
                              <div className="flex justify-center my-4">
                                <Badge variant="outline" className="bg-background">
                                  {formatMessageDate(message.createdAt)}
                                </Badge>
                              </div>
                            )}
                            <div className={`flex ${isSentByMe ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                isSentByMe
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}>
                                <p>{message.content}</p>
                                <div className={`text-xs mt-1 ${
                                  isSentByMe
                                    ? "text-primary-foreground/75"
                                    : "text-gray-500"
                                }`}>
                                  {formatMessageTime(message.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <CardFooter className="flex-shrink-0 pt-2 pb-3 border-t">
                  <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                    />
                    <Button type="submit" disabled={!messageInput.trim() || sendingMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </CardFooter>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Users className="w-16 h-16 mb-4 text-gray-400" />
                <h3 className="mb-2 text-xl font-medium">Select a conversation</h3>
                <p className="mb-4 text-gray-600">
                  Choose a friend from the list to start chatting
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
