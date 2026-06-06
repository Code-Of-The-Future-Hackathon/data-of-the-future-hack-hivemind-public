'use server'

import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleFollow(targetUserId: string, isFollowing: boolean) {
  const session = await auth()
  if (!session?.user?.email) return { error: "Unauthorized" }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  })

  if (!currentUser) return { error: "User not found" }
  if (currentUser.id === targetUserId) return { error: "Cannot follow yourself" }

  try {
    if (isFollowing) {
      // Unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUserId
          }
        }
      })
    } else {
      // Follow
      await prisma.follows.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUserId
        }
      })
    }

    revalidatePath("/community")
    revalidatePath(`/profile/${targetUserId}`)
    return { success: true }
  } catch (error) {
    console.error("Follow error:", error)
    return { error: "Failed to update follow status" }
  }
}