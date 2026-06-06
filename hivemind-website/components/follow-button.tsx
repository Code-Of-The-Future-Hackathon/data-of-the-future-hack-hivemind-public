'use client'

import { useState, useTransition } from "react"
import { toggleFollow } from "@/app/actions/social"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck, Loader2 } from "lucide-react"

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing: boolean
}

export function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    // Optimistic UI update
    setIsFollowing((prev) => !prev)

    startTransition(async () => {
      const result = await toggleFollow(targetUserId, isFollowing)
      if (result.error) {
        // Revert if failed
        setIsFollowing((prev) => !prev)
        alert(result.error)
      }
    })
  }

  return (
    <Button 
      size="sm" 
      variant={isFollowing ? "secondary" : "default"}
      onClick={handleToggle}
      disabled={isPending}
      className={isFollowing ? "hover:bg-red-100 hover:text-red-600" : ""}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="mr-2 h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  )
}