import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link" // <--- Import Link
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { FollowButton } from "@/components/follow-button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar, Map, Users, MessageSquare } from "lucide-react" // <--- Import MessageSquare

// Next.js 15: params is a Promise
export default async function PublicProfilePage(props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  const { username } = params;
  const session = await auth()

  // Fetch target user public info
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: {
        select: {
          followedBy: true,
          following: true,
          milestones: true,
          quests: true 
        }
      },
      quests: {
        where: { status: "COMPLETED" },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      }
    }
  })

  if (!user) return notFound()

  // Check if viewing own profile
  const isOwnProfile = session?.user?.email === user.email
  
  // Check follow status
  let isFollowing = false
  if (session?.user?.email && !isOwnProfile) {
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { following: true }
    })
    isFollowing = currentUser?.following.some(f => f.followingId === user.id) ?? false
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Card */}
        <Card className="overflow-hidden border-zinc-200 shadow-md">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={user.image || ""} />
                <AvatarFallback className="text-2xl font-bold bg-zinc-100">{user.name?.[0]}</AvatarFallback>
              </Avatar>
              
              {/* Actions Area: Message & Follow */}
              {!isOwnProfile && session?.user && (
                 <div className="mb-2 flex gap-2">
                    {/* Message Button */}
                    <Link 
                        href={`/messages?username=${user.username}`}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors shadow-sm"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Message
                    </Link>

                    {/* Follow Button */}
                    <FollowButton targetUserId={user.id} initialIsFollowing={isFollowing} />
                 </div>
              )}
            </div>

            <div>
                <h1 className="text-3xl font-bold text-zinc-900">{user.name}</h1>
                <p className="text-zinc-500 font-medium">Level {user.level} Explorer</p>
                
                <div className="flex gap-4 mt-4 text-sm text-zinc-600">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> Joined {new Date(user.createdAt).getFullYear()}
                    </span>
                    <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {user._count.followedBy} Followers
                    </span>
                </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total XP" value={user.score} icon={<Trophy className="text-yellow-500" />} />
            <StatCard label="Quests Done" value={user.quests.length} icon={<Trophy className="text-green-500" />} />
            <StatCard label="Active Goals" value={user._count.milestones} icon={<Map className="text-blue-500" />} />
            <StatCard label="Following" value={user._count.following} icon={<Users className="text-purple-500" />} />
        </div>

        {/* Recent Achievements (Trophy Case) */}
        <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Recent Achievements
                </h3>
            </CardHeader>
            <CardContent>
                {user.quests.length === 0 ? (
                    <p className="text-zinc-400 text-sm italic">No completed quests yet.</p>
                ) : (
                    <div className="space-y-3">
                        {user.quests.map(quest => (
                            <div key={quest.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                                <span className="font-medium text-zinc-700">{quest.title}</span>
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                                    +{quest.completionPoints} XP
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: any) {
    return (
        <Card className="flex flex-col items-center justify-center p-4 shadow-sm border-zinc-200">
            <div className="mb-2 p-2 bg-zinc-50 rounded-full">{icon}</div>
            <span className="text-2xl font-bold text-zinc-900">{value}</span>
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">{label}</span>
        </Card>
    )
}