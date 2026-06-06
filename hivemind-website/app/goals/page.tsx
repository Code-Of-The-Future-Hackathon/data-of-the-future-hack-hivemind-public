import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CreateMilestoneBtn } from "@/components/game/creation-forms"
import { MilestoneItem } from "@/components/game/milestone-item" // Import the new component
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      milestones: {
        orderBy: { createdAt: 'desc' },
        include: {
          quests: {
            orderBy: { createdAt: 'desc' },
            include: { tasks: { orderBy: { createdAt: 'asc' } } }
          }
        }
      }
    }
  })

  if (!user) return null

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Link href="/dashboard" className="text-zinc-400 hover:text-zinc-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Goal Manager</h1>
            </div>
            <p className="text-zinc-500">Plan your milestones and quests manually here.</p>
          </div>
          <CreateMilestoneBtn />
        </div>

        {/* Milestones List */}
        <div className="grid gap-8">
          {user.milestones.length === 0 && (
            <div className="text-center py-20 bg-white border-2 border-dashed border-zinc-200 rounded-xl">
                <h3 className="text-lg font-medium text-zinc-900">No milestones defined</h3>
                <p className="text-zinc-500 mb-4">Start by creating a big goal you want to achieve.</p>
                <CreateMilestoneBtn />
            </div>
          )}

          {user.milestones.map((milestone) => (
            // Use the new collapsible component
            <MilestoneItem key={milestone.id} milestone={milestone} />
          ))}
        </div>

      </div>
    </div>
  )
}