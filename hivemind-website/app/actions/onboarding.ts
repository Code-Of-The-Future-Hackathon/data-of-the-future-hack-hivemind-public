'use server'

import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { userInfoSchema, type UserInfoValues } from "@/lib/schemas/user-info"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function submitOnboarding(data: UserInfoValues) {
  const session = await auth()

  if (!session?.user?.email) {
    return { error: "You must be logged in to save your profile." }
  }

  // Validate with Zod
  const validatedFields = userInfoSchema.safeParse(data)

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error)
    return { error: "Invalid data submitted." }
  }

  // Destructure fields that need manual transformation or specific handling
  const { dateOfBirth, interests, username, name, ...otherData } = validatedFields.data

  // Prepare the update object
  const updateData: any = {
    ...otherData,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    interests: interests 
      ? interests.split(',').map(s => s.trim()).filter(Boolean) 
      : [],
  }

  // Only attempt to update username/name if they are provided (prevent overwriting with empty if optional)
  if (username) updateData.username = username
  if (name) updateData.name = name

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    })
  } catch (error: any) {
    console.error("DB Update Error:", error)
    
    // Check for Unique Constraint Violation (P2002) for username
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return { error: "Username is already taken. Please choose another one." }
    }

    return { error: "Failed to save profile. Please try again." }
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}