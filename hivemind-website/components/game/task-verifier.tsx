'use client'

import { useState, useRef } from "react"
import { useTransition } from "react"
import { uploadImages } from "@/app/actions/upload"
import { verifyTaskWithAI } from "@/app/actions/verify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sparkles, Upload, Loader2, CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "motion/react"

interface TaskVerifierProps {
  taskId: string
  taskContent: string
  isCompleted: boolean
}

export function TaskVerifier({ taskId, taskContent, isCompleted }: TaskVerifierProps) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'VERIFYING' | 'SUCCESS' | 'REJECTED'>('IDLE')
  const [feedback, setFeedback] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (isCompleted) {
    return (
      <div className="text-green-600 flex items-center text-xs font-medium animate-in fade-in">
        <Sparkles className="w-3 h-3 mr-1" /> Verified
      </div>
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      setStatus('REJECTED')
      setFeedback("Please upload visual proof.")
      return
    }

    setStatus('UPLOADING')
    
    try {
      // 1. Upload to Cloudinary
      const formData = new FormData()
      files.forEach(f => formData.append("file", f))
      
      const uploadRes = await uploadImages(formData)
      
      if (!uploadRes.urls || uploadRes.urls.length === 0) {
        throw new Error("Image upload failed")
      }

      // 2. Send to AI
      setStatus('VERIFYING')
      const aiRes = await verifyTaskWithAI(taskId, uploadRes.urls, comment)

      if (aiRes.success) {
        setStatus('SUCCESS')
        setFeedback(aiRes.reason)
        setTimeout(() => setOpen(false), 2000) // Close automatically
      } else {
        setStatus('REJECTED')
        setFeedback(aiRes.reason || aiRes.error || "Verification failed")
      }

    } catch (error) {
      setStatus('REJECTED')
      setFeedback("Something went wrong. Try again.")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 opacity-0 group-hover/task:opacity-100 transition-all duration-300"
        >
          <Sparkles className="w-3 h-3 mr-1" /> Verify with AI
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0 overflow-hidden shadow-xl border-purple-100" align="start" side="right">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 text-white">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <Bot className="w-4 h-4" /> AI Judge
          </h4>
          <p className="text-[10px] opacity-90 line-clamp-1">{taskContent}</p>
        </div>

        <div className="p-4 space-y-4">
          {status === 'SUCCESS' ? (
            <div className="text-center py-4 space-y-2 animate-in zoom-in">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-green-700">Approved!</p>
              <p className="text-xs text-zinc-500">{feedback}</p>
            </div>
          ) : (
            <>
              {/* File Input */}
              <div 
                className="border-2 border-dashed border-zinc-200 rounded-lg p-4 text-center cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileSelect}
                />
                {files.length > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-purple-600">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">{files.length} file(s) selected</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 mx-auto text-zinc-300" />
                    <p className="text-xs text-zinc-500">Click to upload proof</p>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <Textarea 
                placeholder="Tell the AI what you did..." 
                className="text-xs resize-none bg-zinc-50 border-zinc-200 focus-visible:ring-purple-500"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              {/* Feedback / Error Area */}
              {status === 'REJECTED' && (
                <div className="bg-red-50 text-red-600 text-xs p-2 rounded-md flex items-start gap-2">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{feedback}</span>
                </div>
              )}

              <Button 
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-8 text-xs" 
                onClick={handleSubmit}
                disabled={status === 'UPLOADING' || status === 'VERIFYING'}
              >
                {status === 'UPLOADING' ? (
                  <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Uploading...</>
                ) : status === 'VERIFYING' ? (
                  <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Judging...</>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Simple Icon component for usage inside
function Bot(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
    )
}