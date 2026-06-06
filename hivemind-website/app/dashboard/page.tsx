import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { XpChart } from "@/components/dashboard/xp-chart"
import { MilestoneWidget } from "@/components/dashboard/milestone-widget"
import { QuestCard } from "@/components/game/quest-card"
import { GoalManager } from "@/components/dashboard/goal-manager" // <--- Import New Component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, Zap, Target } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      activityLogs: {
        where: { createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'asc' }
      },
      // We fetch ALL milestones (titles/ids) for the Manager component
      milestones: {
        orderBy: { createdAt: 'desc' },
        include: { quests: {
            include: { 
               tasks: true 
             }
        } }
      },
      quests: {
        where: { status: "IN_PROGRESS" },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { tasks: { orderBy: { createdAt: 'asc' } } }
      }
    }
  })

  if (!user) redirect("/auth/login")

  const xpForNextLevel = 1000
  const xpProgress = (user.score % xpForNextLevel) / 10

  // Filter active milestones for the widget display
  const activeMilestones = user.milestones.filter(m => m.status === 'IN_PROGRESS').slice(0, 3)

  return (
    <div className="min-h-screen bg-zinc-50/50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
                <p className="text-zinc-500">Welcome back, {user.name}. Ready to level up?</p>
            </div>
            <div className="flex gap-2">
                
                {/* NEW GOAL MANAGER POPUP */}
                <GoalManager milestones={user.milestones} />

                <Link href="/messages">
                    <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
                        <Sparkles className="w-4 h-4" /> Assistant
                    </Button>
                </Link>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card className="border-zinc-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            Activity (Last 7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-4xl font-bold text-zinc-900">{user.score}</span>
                            <span className="text-sm font-medium text-zinc-500">Total XP</span>
                        </div>
                        <XpChart logs={user.activityLogs} />
                    </CardContent>
                </Card>

                <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        Next Up
                        <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase">Priority</span>
                    </h3>
                    {user.quests.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-xl border border-dashed text-zinc-400">
                            No active quests. <GoalManager milestones={user.milestones}>
                                <span className="underline cursor-pointer ml-1 hover:text-zinc-600">Create one?</span>
                            </GoalManager>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {user.quests.map(quest => (
                                <QuestCard key={quest.id} quest={quest as any} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <Card className="bg-zinc-900 text-white border-0 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-zinc-400">Current Level</span>
                            <span className="text-2xl font-bold">{user.level}</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
                            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${xpProgress}%` }}></div>
                        </div>
                        <p className="text-xs text-zinc-400 text-right">
                            {user.score % xpForNextLevel} / {xpForNextLevel} XP to Lvl {user.level + 1}
                        </p>
                    </CardContent>
                </Card>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-zinc-900">Active Goals</h3>
                        <Link href="/goals">
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-zinc-500">View All <ArrowRight className="w-3 h-3 ml-1" /></Button>
                        </Link>
                    </div>
                    
                    <div className="space-y-3">
                        {activeMilestones.length === 0 ? (
                            <p className="text-xs text-zinc-400">No active milestones.</p>
                        ) : (
                            activeMilestones.map(m => (
                                <MilestoneWidget key={m.id} milestone={m} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}