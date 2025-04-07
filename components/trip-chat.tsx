"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { Send, MessageSquare } from "lucide-react"
import { io, type Socket } from "socket.io-client"

interface Message {
  _id: string
  content: string
  sender: {
    _id: string
    name: string
    email: string
    profileImage?: string
  }
  createdAt: string
  readBy: string[]
}

interface TripChatProps {
  tripId: string
}

export default function TripChat({ tripId }: TripChatProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()

    // Initialize socket connection
    initSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [tripId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initSocket = async () => {
    try {
      // Initialize socket connection
      await fetch("/api/socket")

      const socketInstance = io({
        path: "/api/socket",
        auth: {
          token: localStorage.getItem("next-auth.session-token") || "",
        },
      })

      socketInstance.on("connect", () => {
        console.log("Socket connected")
        socketInstance.emit("join-trip", tripId)
      })

      socketInstance.on("new-message", (message) => {
        if (message.tripId === tripId) {
          setMessages((prev) => [...prev, message])
        }
      })

      socketInstance.on("disconnect", () => {
        console.log("Socket disconnected")
      })

      setSocket(socketInstance)
    } catch (error) {
      console.error("Socket initialization error:", error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/messages`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    try {
      const response = await fetch(`/api/trips/${tripId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newMessage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      // If using socket, the message will be added via the socket event
      // Otherwise, add it manually
      if (!socket || !socket.connected) {
        setMessages((prev) => [...prev, data.data])
      }

      setNewMessage("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date)
    const today = new Date()

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    return formatDate(date)
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-2">
        <CardTitle>Trip Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 p-0">
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 mb-4 text-gray-400" />
              <h3 className="mb-2 text-xl font-semibold">No messages yet</h3>
              <p className="text-gray-600">Start the conversation with your trip members.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.sender._id === session?.user.id

                return (
                  <div key={message._id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                    <div className={`flex max-w-[70%] ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                      {!isCurrentUser && (
                        <Avatar className="w-8 h-8 mr-2">
                          <AvatarImage src={message.sender.profileImage} alt={message.sender.name} />
                          <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p>{message.content}</p>
                        </div>
                        <div className={`flex mt-1 text-xs text-gray-500 ${isCurrentUser ? "justify-end" : ""}`}>
                          <span>{message.sender.name}</span>
                          <span className="mx-1">•</span>
                          <span>{formatMessageDate(message.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="p-4 border-t">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

