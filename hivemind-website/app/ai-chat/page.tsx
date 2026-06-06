import ChatUI from "@/components/chat-ui"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export const maxDuration = 60; // Allow 60s for AI generation

export default async function AIChatPage() {
  let session = await auth()
  if (!session?.user?.email) redirect("/auth/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  })

  if (!user) redirect("/auth/login")

  return (
    <div className="min-h-screen bg-zinc-50 p-6 flex flex-col md:flex-row justify-center items-start pt-10 gap-4">
      
      {/* Back Button: Left side on desktop, Top on mobile */}
      <div className="md:sticky md:top-10 shrink-0">
          <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-zinc-400 hover:text-zinc-700 transition-colors group"
              title="Back to Dashboard"
          >
              <div className="p-2 bg-white border border-zinc-200 rounded-full shadow-sm group-hover:bg-zinc-100 transition-all">
                  <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium md:hidden lg:inline-block">Back</span>
          </Link>
      </div>

      {/* Main Chat Container */}
      <div className="w-full max-w-2xl space-y-4">
        <ChatUI userId={user.id} />
        
        <div className="text-center text-xs text-zinc-400 mt-4">
            <p>The AI can analyze your profile and help generate new milestones.</p>
        </div>
      </div>
    </div>
  )
}