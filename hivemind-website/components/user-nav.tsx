'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"
import { LogOut, Settings, User } from "lucide-react"

interface UserNavProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserNav({ user }: UserNavProps) {
  const [localImage, setLocalImage] = useState<string | null>(user.image ?? null)
  const [localName, setLocalName] = useState<string | null>(user.name ?? null)
  const [localEmail, setLocalEmail] = useState<string | null>(user.email ?? null)

  useEffect(() => {
    // Update local image when user prop changes
    setLocalImage(user.image ?? null)
    setLocalName(user.name ?? null)
    setLocalEmail(user.email ?? null)
  }, [user.image, user.name, user.email])

  useEffect(() => {
    const handler = (e: any) => {
      const img = e?.detail?.image
      if (img) setLocalImage(img)
    }

    const userHandler = (e: any) => {
      const d = e?.detail ?? {}
      if (d.image) setLocalImage(d.image)
      if (d.name) setLocalName(d.name)
      if (d.email) setLocalEmail(d.email)
    }

    window.addEventListener('avatar-updated', handler)
    window.addEventListener('user-updated', userHandler)
    return () => {
      window.removeEventListener('avatar-updated', handler)
      window.removeEventListener('user-updated', userHandler)
    }
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border border-zinc-200">
            <AvatarImage src={localImage || ""} alt={user.name || ""} />
            <AvatarFallback className="font-bold bg-zinc-100">
              {user.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{localName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {localEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600 focus:text-red-600 cursor-pointer"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}