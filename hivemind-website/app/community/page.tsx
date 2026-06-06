import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link" // Added import
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { FollowButton } from "@/components/follow-button"
import { Map as MapIcon, Swords, Users } from "lucide-react" 

export const dynamic = 'force-dynamic'

export default async function CommunityPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/login")

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { following: true }
  })

  if (!currentUser) return null

  // Fetch top 50 users by score
  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id }
    },
    take: 50,
    orderBy: { score: 'desc' },
    include: {
      _count: {
        select: {
          followedBy: true,
          milestones: true
        }
      },
      milestones: {
        select: {
          _count: {
            select: { quests: true }
          }
        }
      }
    }
  })

  // Create a Set for O(1) lookups
  const followingIds = new Set(currentUser.following.map(f => f.followingId))

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Community</h1>
                <p className="text-zinc-500 text-sm">Find others and grow together.</p>
            </div>
            <div className="text-xs font-bold bg-white px-3 py-1.5 rounded-full border shadow-sm text-zinc-600">
                {users.length} MEMBERS
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => {
            const totalQuests = user.milestones.reduce((acc, m) => acc + m._count.quests, 0)
            
            return (
              <Card key={user.id} className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow border-zinc-200">
                {/* Header */}
                <CardHeader className="p-4 pb-3 flex flex-row items-center gap-3 space-y-0">
                  <Avatar className="h-12 w-12 border border-zinc-100">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                        {user.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <Link href={`/profile/${user.username}`} className="hover:underline decoration-zinc-900 decoration-1 underline-offset-2">
                        <h3 className="font-bold text-base truncate leading-tight">{user.name}</h3>
                    </Link>
                    <p className="text-zinc-500 text-xs font-medium">Lvl {user.level} • {user.score} XP</p>
                  </div>
                </CardHeader>
                
                {/* Stats */}
                <CardContent className="px-4 pb-4 flex-1">
                    <div className="grid grid-cols-3 gap-2 h-full">
                        <div className="flex flex-col items-center justify-center p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                            <MapIcon className="h-3.5 w-3.5 text-blue-500 mb-1" />
                            <span className="font-bold text-sm leading-none">{user._count.milestones}</span>
                            <span className="text-[9px] uppercase text-zinc-400 font-bold mt-1">Goals</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                            <Swords className="h-3.5 w-3.5 text-orange-500 mb-1" />
                            <span className="font-bold text-sm leading-none">{totalQuests}</span>
                            <span className="text-[9px] uppercase text-zinc-400 font-bold mt-1">Quests</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                            <Users className="h-3.5 w-3.5 text-green-500 mb-1" />
                            <span className="font-bold text-sm leading-none">{user._count.followedBy}</span>
                            <span className="text-[9px] uppercase text-zinc-400 font-bold mt-1">Followers</span>
                        </div>
                    </div>
                </CardContent>

                {/* Footer */}
                <CardFooter className="p-4 pt-0">
                  <div className="w-full flex justify-center">
                    <FollowButton 
                        targetUserId={user.id} 
                        initialIsFollowing={followingIds.has(user.id)} 
                    />
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}