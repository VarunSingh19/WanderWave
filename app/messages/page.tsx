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
import { UserPlus, Send, Users, ArrowLeft, User, Paperclip, ImageIcon, Video, Check, CheckCheck, X, Loader2, Smile, MoreVertical, Download, Eye } from 'lucide-react'

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
  messageType: 'text' | 'image' | 'video'
  mediaUrl?: string
  read: boolean
  readAt?: string
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
  const [uploading, setUploading] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null)

  // Add refs to prevent infinite loops
  const markingAsReadRef = useRef(false)
  const lastMarkedFriendRef = useRef<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    const friendId = searchParams.get("friendId")
    if (friendId) {
      setSelectedFriendId(friendId)
      setShowConversations(false)
    }

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

      const friend = conversations.find(conv => conv.friend._id === selectedFriendId)?.friend
      if (friend) {
        setSelectedFriend(friend)
      }
    }
  }, [selectedFriendId, conversations])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fixed useEffect for marking messages as read
  useEffect(() => {
    if (
      selectedFriendId &&
      messages.length > 0 &&
      !markingAsReadRef.current &&
      lastMarkedFriendRef.current !== selectedFriendId
    ) {
      // Check if there are unread messages from the selected friend
      const hasUnreadMessages = messages.some(msg =>
        msg.sender === selectedFriendId && !msg.read
      )

      if (hasUnreadMessages) {
        markMessagesAsRead(selectedFriendId)
        lastMarkedFriendRef.current = selectedFriendId
      }
    }
  }, [selectedFriendId, messages])

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
      // Reset the last marked friend when fetching new messages
      lastMarkedFriendRef.current = null
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
    }
  }

  const markMessagesAsRead = async (friendId: string) => {
    // Prevent multiple simultaneous calls
    if (markingAsReadRef.current) return

    try {
      markingAsReadRef.current = true

      await fetch(`/api/messages/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId }),
      })

      // Update local state - only update messages that were actually unread
      setMessages(prev => prev.map(msg =>
        msg.sender === friendId && !msg.read
          ? { ...msg, read: true, readAt: new Date().toISOString() }
          : msg
      ))

      // Update conversations - only update if there was an unread count
      setConversations(prev => prev.map(conv =>
        conv.friend._id === friendId && conv.unreadCount > 0
          ? { ...conv, unreadCount: 0 }
          : conv
      ))
    } catch (error) {
      console.error("Error marking messages as read:", error)
    } finally {
      markingAsReadRef.current = false
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]

    if (file) {
      handleFileSelect({ target: { files: [file] } } as any)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image or video file",
        variant: "destructive",
      })
      return
    }

    setSelectedMedia(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const uploadMedia = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Upload failed with status ${response.status}`)
    }

    const data = await response.json()
    return data.url
  }

  const sendMessage = async (messageType: 'text' | 'image' | 'video' = 'text') => {
    if ((!messageInput.trim() && messageType === 'text') || (!selectedMedia && messageType !== 'text') || !selectedFriendId) {
      return
    }

    try {
      setSendingMessage(true)
      let mediaUrl = ''
      let content = messageInput.trim()

      if (messageType !== 'text' && selectedMedia) {
        setUploading(true)
        mediaUrl = await uploadMedia(selectedMedia)
        console.log("Media uploaded successfully:", mediaUrl)
        content = messageType === 'image' ? '📷 Image' : '🎥 Video'
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: selectedFriendId,
          content,
          messageType,
          mediaUrl: mediaUrl || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()
      setMessages(prev => [...prev, data.message])
      setMessageInput("")
      clearSelectedMedia()

      // Update conversations
      fetchConversations()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
      setUploading(false)
    }
  }

  const clearSelectedMedia = () => {
    setSelectedMedia(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage('text')
    }
  }

  const selectConversation = (friendId: string) => {
    // Reset the marking state when selecting a new conversation
    lastMarkedFriendRef.current = null
    setSelectedFriendId(friendId)
    if (isMobile) {
      setShowConversations(false)
    }
  }

  const goBackToConversations = () => {
    setShowConversations(true)
    setSelectedFriendId(null)
    setSelectedFriend(null)
    lastMarkedFriendRef.current = null
  }

  const formatMessageTime = (createdAt: string) => {
    const date = new Date(createdAt)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const getMessageStatusIcon = (message: Message, isLastMessage: boolean) => {
    if (message.sender !== session?.user?.id) return null

    if (message.read) {
      return <CheckCheck className="w-3 h-3 text-blue-400" />
    } else {
      return <Check className="w-3 h-3 text-gray-400" />
    }
  }

  const openImageModal = (imageUrl: string) => {
    setModalImageUrl(imageUrl)
    setImageModalOpen(true)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3 h-[calc(100vh-2rem)]">
            <div className="md:col-span-1">
              <Skeleton className="h-full rounded-2xl" />
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-3 h-[calc(100vh-2rem)]">
          {/* Conversations List */}
          {(!isMobile || showConversations) && (
            <div className="md:col-span-1">
              <Card className="h-full backdrop-blur-sm bg-white/80 border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <CardTitle className="flex items-center text-lg font-semibold">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                      <Users className="w-4 h-4" />
                    </div>
                    Messages
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-8rem)]">
                    {conversations.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">No conversations yet</h3>
                        <p className="text-gray-500 text-sm">Start a conversation with your friends</p>
                      </div>
                    ) : (
                      <div className="p-3 space-y-2">
                        {conversations.map((conversation) => (
                          <div
                            key={conversation.friend._id}
                            onClick={() => selectConversation(conversation.friend._id)}
                            className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-md ${selectedFriendId === conversation.friend._id
                              ? "bg-gradient-to-r from-blue-50 to-purple-50 shadow-md border-l-4 border-blue-500"
                              : "hover:bg-gray-50"
                              }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <Avatar className="w-12 h-12 ring-2 ring-white shadow-lg">
                                  <AvatarImage
                                    src={conversation.friend.profileImage || "/placeholder.svg"}
                                    alt={conversation.friend.name}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                                    {conversation.friend.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                    {conversation.friend.name}
                                  </h4>
                                  {conversation.unreadCount > 0 && (
                                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                {conversation.latestMessage && (
                                  <p className="text-sm text-gray-500 truncate">
                                    {conversation.latestMessage.content}
                                  </p>
                                )}
                                {conversation.latestMessage && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatMessageTime(conversation.latestMessage.createdAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Messages Area */}
          {(!isMobile || !showConversations) && (
            <div className="md:col-span-2">
              {selectedFriend ? (
                <Card className="h-full backdrop-blur-sm bg-white/80 border-0 shadow-xl rounded-2xl overflow-hidden flex flex-col">
                  {/* Header */}
                  <CardHeader className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="flex items-center space-x-4">
                      {isMobile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={goBackToConversations}
                          className="p-2 hover:bg-white/20 text-white"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </Button>
                      )}
                      <div className="relative">
                        <Avatar className="w-12 h-12 ring-2 ring-white shadow-lg">
                          <AvatarImage
                            src={selectedFriend.profileImage || "/placeholder.svg"}
                            alt={selectedFriend.name}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                            {selectedFriend.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{selectedFriend.name}</h3>
                        <p className="text-blue-100 text-sm">Active now</p>
                      </div>
                      <Button variant="ghost" size="sm" className="p-2 hover:bg-white/20 text-white">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent
                    className="flex-1 p-0 overflow-hidden relative"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {dragOver && (
                      <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg z-10 flex items-center justify-center">
                        <div className="text-center">
                          <Paperclip className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                          <p className="text-blue-600 font-semibold">Drop files here to upload</p>
                        </div>
                      </div>
                    )}

                    <ScrollArea className="h-full">
                      <div className="p-6 space-y-6">
                        {messages.map((message, index) => {
                          const isOwnMessage = message.sender === session?.user?.id
                          const isLastMessage = index === messages.length - 1
                          const showAvatar = index === 0 || messages[index - 1].sender !== message.sender

                          return (
                            <div
                              key={message._id}
                              className={`flex items-end space-x-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                            >
                              {!isOwnMessage && showAvatar && (
                                <Avatar className="w-8 h-8 mb-1">
                                  <AvatarImage
                                    src={selectedFriend.profileImage || "/placeholder.svg"}
                                    alt={selectedFriend.name}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-500 text-white text-xs">
                                    {selectedFriend.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {!isOwnMessage && !showAvatar && (
                                <div className="w-8"></div>
                              )}

                              <div
                                className={`group max-w-xs lg:max-w-md ${isOwnMessage ? "order-1" : "order-2"
                                  }`}
                              >
                                <div
                                  className={`px-4 py-3 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl ${isOwnMessage
                                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md"
                                    : "bg-white text-gray-900 rounded-bl-md border border-gray-100"
                                    }`}
                                >
                                  {message.messageType === 'image' && message.mediaUrl && (
                                    <div className="mb-2 relative group/image">
                                      <img
                                        src={message.mediaUrl || "/placeholder.svg"}
                                        alt="Shared image"
                                        className="rounded-xl max-w-full h-auto cursor-pointer transition-transform hover:scale-[1.02]"
                                        style={{ maxHeight: '300px', minWidth: '200px' }}
                                        onClick={() => openImageModal(message.mediaUrl!)}
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 rounded-xl transition-all duration-200 flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                                        <div className="flex space-x-2">
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            className="bg-white/90 hover:bg-white text-gray-900"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openImageModal(message.mediaUrl!)
                                            }}
                                          >
                                            <Eye className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            className="bg-white/90 hover:bg-white text-gray-900"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              window.open(message.mediaUrl, '_blank')
                                            }}
                                          >
                                            <Download className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {message.messageType === 'video' && message.mediaUrl && (
                                    <div className="mb-2">
                                      <video
                                        src={message.mediaUrl}
                                        controls
                                        className="rounded-xl max-w-full h-auto"
                                        style={{ maxHeight: '300px', minWidth: '200px' }}
                                      />
                                    </div>
                                  )}

                                  {message.content && (
                                    <p className="text-sm leading-relaxed break-words">
                                      {message.content}
                                    </p>
                                  )}

                                  <div className={`flex items-center justify-end mt-2 space-x-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'
                                    }`}>
                                    <span className="text-xs">
                                      {formatMessageTime(message.createdAt)}
                                    </span>
                                    {getMessageStatusIcon(message, isLastMessage)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Message Input */}
                  <CardFooter className="flex-shrink-0 bg-gray-50/50 backdrop-blur-sm">
                    <div className="w-full space-y-3">
                      {/* Media Preview */}
                      {previewUrl && (
                        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {selectedMedia?.type.startsWith('image/') ? (
                                <ImageIcon className="w-5 h-5 text-blue-500" />
                              ) : (
                                <Video className="w-5 h-5 text-purple-500" />
                              )}
                              <span className="text-sm font-medium text-gray-700">
                                {selectedMedia?.type.startsWith('image/') ? 'Image' : 'Video'} Preview
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearSelectedMedia}
                              className="p-1 hover:bg-red-50 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          {selectedMedia?.type.startsWith('image/') ? (
                            <img
                              src={previewUrl || "/placeholder.svg"}
                              alt="Preview"
                              className="rounded-lg max-h-40 object-cover shadow-md"
                            />
                          ) : (
                            <video
                              src={previewUrl}
                              className="rounded-lg max-h-40 object-cover shadow-md"
                              controls
                            />
                          )}
                        </div>
                      )}

                      <div className="flex items-end space-x-3">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*,video/*"
                          className="hidden"
                        />

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading || sendingMessage}
                          className="p-3 bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 transition-all duration-200"
                        >
                          <Paperclip className="w-5 h-5 text-gray-600" />
                        </Button>

                        <div className="flex-1">
                          <Input
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={sendingMessage || uploading}
                            className="bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl py-3 px-4 text-sm"
                          />
                        </div>

                        <Button
                          onClick={() => {
                            if (selectedMedia) {
                              const messageType = selectedMedia.type.startsWith('image/') ? 'image' : 'video'
                              sendMessage(messageType)
                            } else {
                              sendMessage('text')
                            }
                          }}
                          disabled={
                            sendingMessage ||
                            uploading ||
                            (!messageInput.trim() && !selectedMedia)
                          }
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                        >
                          {sendingMessage || uploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ) : (
                <Card className="h-full backdrop-blur-sm bg-white/80 border-0 shadow-xl rounded-2xl flex items-center justify-center">
                  <CardContent className="text-center p-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <User className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Select a conversation</h3>
                    <p className="text-gray-500 text-lg max-w-md">
                      Choose a friend from the list to start messaging and sharing moments together
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && modalImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImageModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:bg-white/20 z-10"
            >
              <X className="w-6 h-6" />
            </Button>
            <img
              src={modalImageUrl || "/placeholder.svg"}
              alt="Full size image"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
