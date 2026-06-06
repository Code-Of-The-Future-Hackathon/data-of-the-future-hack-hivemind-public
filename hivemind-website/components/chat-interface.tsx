'use client'

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { sendMessage, deleteMessage, editMessage } from "@/app/actions/chat"
import { uploadImages } from "@/app/actions/upload"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Send, User, Loader2, X, Paperclip, 
  MoreVertical, Pencil, Trash2, Check 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "motion/react"

// Types
type ChatUser = {
  id: string
  name: string | null
  username: string | null
  email: string | null
  image: string | null
}

type Message = {
  id: string
  content: string | null
  attachments: { url: string }[]
  createdAt: Date
  senderId: string
  sender: { name: string | null, image: string | null }
}

interface ChatInterfaceProps {
  users: ChatUser[]
}

export function ChatInterface({ users }: ChatInterfaceProps) {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [inputText, setInputText] = useState("")
  
  // Navigation Hooks
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  
  // States for Lightbox & Editing
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const isUserSwitch = useRef(false)
  const isAtBottomRef = useRef(true)

  // --- URL Query Param Logic ---
  useEffect(() => {
    const usernameParam = searchParams.get('username')
    
    // If there is a username param and we haven't selected that user yet
    if (usernameParam && users.length > 0) {
        const targetUser = users.find(u => u.username === usernameParam)
        
        if (targetUser && targetUser.id !== selectedUser?.id) {
            setSelectedUser(targetUser)
        }
    }
  }, [searchParams, users, selectedUser])

  // Wrapper to handle user selection and URL update
  const handleUserSelect = (user: ChatUser) => {
    setSelectedUser(user)
    if (user.username) {
        router.replace(`${pathname}?username=${user.username}`)
    } else {
        router.replace(pathname)
    }
  }

  // 1. Scroll Logic
  const handleScroll = () => {
    if (scrollViewportRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      isAtBottomRef.current = distanceFromBottom < 100
    }
  }

  useLayoutEffect(() => {
    const bottomDiv = bottomRef.current
    if (bottomDiv) {
        if (isUserSwitch.current) {
            bottomDiv.scrollIntoView({ behavior: "auto" })
            isUserSwitch.current = false
            isAtBottomRef.current = true
            return
        }
        const lastMessage = messages[messages.length - 1]
        const isMyMessage = lastMessage?.senderId === currentUserId
        if (isAtBottomRef.current || isMyMessage) {
            bottomDiv.scrollIntoView({ behavior: "smooth" })
        }
    }
  }, [messages, previewUrls, currentUserId, editingMessageId])

  // 2. Fetch Messages
  useEffect(() => {
    if (!selectedUser) return
    isUserSwitch.current = true 

    const fetchMsgs = async () => {
        const { getMessages } = await import("@/app/actions/chat")
        const result = await getMessages(selectedUser.id)
        if (Array.isArray(result)) return 
        
        setCurrentUserId(result.currentUserId)
        setMessages(prev => {
            if (JSON.stringify(prev) === JSON.stringify(result.messages)) return prev
            return result.messages as unknown as Message[]
        })
    }

    fetchMsgs() 
    const interval = setInterval(fetchMsgs, 3000)
    return () => clearInterval(interval)
  }, [selectedUser])

  // --- Handlers ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...newFiles])
      const newUrls = newFiles.map(file => URL.createObjectURL(file))
      setPreviewUrls(prev => [...prev, ...newUrls])
      isAtBottomRef.current = true
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if (!selectedUser) return
    if (!inputText.trim() && selectedFiles.length === 0) return

    setIsSending(true)
    isAtBottomRef.current = true

    try {
      let uploadedUrls: string[] = []
      if (selectedFiles.length > 0) {
        const formData = new FormData()
        selectedFiles.forEach(file => formData.append("file", file))
        const uploadRes = await uploadImages(formData)
        if (uploadRes.urls) uploadedUrls = uploadRes.urls
      }

      const optimisicMsg: Message = {
        id: Date.now().toString(),
        content: inputText,
        attachments: uploadedUrls.map(url => ({ url })),
        createdAt: new Date(),
        senderId: currentUserId,
        sender: { name: "Me", image: null } 
      }
      
      setMessages(prev => [...prev, optimisicMsg])
      await sendMessage(selectedUser.id, inputText, uploadedUrls)

      setInputText("")
      setSelectedFiles([])
      setPreviewUrls([])
      if (fileInputRef.current) fileInputRef.current.value = ""

    } catch (error) {
      console.error("Failed to send", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId))
    await deleteMessage(msgId)
  }

  const startEditing = (msg: Message) => {
    setEditingMessageId(msg.id)
    setEditContent(msg.content || "")
  }

  const saveEdit = async () => {
    if (!editingMessageId) return
    setMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, content: editContent } : m))
    const idToSave = editingMessageId
    setEditingMessageId(null)
    await editMessage(idToSave, editContent)
  }

  return (
    <>
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10"
            onClick={() => setZoomImage(null)} 
          >
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white/70 hover:text-white z-50" onClick={() => setZoomImage(null)}>
                <X className="h-8 w-8" />
            </Button>
            <motion.img 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={zoomImage} 
                className="max-w-full max-h-full object-contain rounded-md"
                onClick={(e) => e.stopPropagation()} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-[calc(100vh-100px)] w-full gap-0 border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
        
        {/* Sidebar */}
        <div className="w-80 flex flex-col border-r border-zinc-200 bg-zinc-50/50">
          <div className="p-4 border-b border-zinc-200 font-semibold text-sm text-zinc-500 uppercase tracking-wider bg-white">Messages</div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1"> 
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={cn("flex items-center gap-3 p-3 w-full rounded-lg text-left transition-all", selectedUser?.id === user.id ? "bg-white shadow-sm ring-1 ring-zinc-200" : "hover:bg-zinc-200/50")}
                >
                  <Avatar className="h-10 w-10 border border-zinc-200">
                    {/* FIX: Use undefined instead of "" to prevent browser network error */}
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white relative">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="h-16 px-6 border-b border-zinc-200 flex items-center gap-3 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                  <Avatar className="h-9 w-9 border border-zinc-200">
                      {/* FIX: Use undefined instead of "" */}
                      <AvatarImage src={selectedUser.image || undefined} />
                      <AvatarFallback>{selectedUser.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-bold text-zinc-900">{selectedUser.name}</span>
              </div>

              {/* Messages */}
              <div ref={scrollViewportRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 bg-zinc-50/30 scroll-smooth">
                <div className="flex flex-col gap-4">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId
                    const isEditing = editingMessageId === msg.id

                    return (
                      <div key={msg.id} className={cn("flex w-full group", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                          
                          {/* Attachments */}
                          {msg.attachments?.length > 0 && (
                            <div className={cn("grid gap-2 mb-2 p-1 bg-white rounded-xl border", msg.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
                              {msg.attachments.map((att, i) => (
                                  <img key={i} src={att.url} onClick={() => setZoomImage(att.url)} className="rounded-lg object-cover h-40 w-full cursor-zoom-in" />
                              ))}
                            </div>
                          )}
                          
                          {/* Message Bubble + Actions */}
                          <div className="flex items-end gap-2">
                            {/* Actions (Left side if user is sender) */}
                            {isMe && !isEditing && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="h-3 w-3 text-zinc-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => startEditing(msg)}><Pencil className="w-3 h-3 mr-2"/> Edit</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(msg.id)} className="text-red-600"><Trash2 className="w-3 h-3 mr-2"/> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* Content */}
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        value={editContent} 
                                        onChange={(e) => setEditContent(e.target.value)} 
                                        className="h-8 text-sm min-w-[200px]"
                                        autoFocus
                                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                                    />
                                    <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingMessageId(null)}><X className="h-4 w-4" /></Button>
                                </div>
                            ) : (
                                msg.content && (
                                    <div className={cn(
                                        "px-4 py-2 text-sm shadow-sm relative",
                                        isMe ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm" : "bg-white border text-zinc-800 rounded-2xl rounded-tl-sm"
                                    )}>
                                            {msg.content}
                                            <div className={cn("text-[9px] mt-1 text-right opacity-70", isMe ? "text-blue-100" : "text-zinc-400")}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                    </div>
                                )
                            )}
                          </div>

                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} className="h-1" />
                </div>
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-zinc-100">
                {previewUrls.length > 0 && (
                  <div className="flex gap-3 pb-3 px-1">
                      {previewUrls.map((url, i) => (
                          <div key={i} className="relative"><img src={url} className="h-16 w-16 rounded-md object-cover border" /><button onClick={() => removeFile(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button></div>
                      ))}
                  </div>
                )}
                <div className="flex items-end gap-2 bg-zinc-50 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-blue-500">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
                  <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-5 w-5 text-zinc-400" /></Button>
                  <Input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && !isSending && handleSend()} className="flex-1 border-0 bg-transparent focus-visible:ring-0" disabled={isSending} />
                  <Button onClick={handleSend} size="icon" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg" disabled={isSending || (!inputText.trim() && selectedFiles.length === 0)}>
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-300">
              <User className="h-16 w-16 mb-4 opacity-20" />
              <p>Select a user to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}