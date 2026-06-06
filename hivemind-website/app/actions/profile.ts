'use server'

import { prisma } from "@/lib/prisma"
import { auth, signOut } from "@/app/auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function updateEmail(prevState: any, formData: FormData) {
  const newEmail = formData.get('email') as string

  if (!newEmail) return { error: "Missing email" }

  const emailTrim = newEmail.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailTrim)) return { error: "Invalid email format" }

  const session = await auth()
  const currentEmail = session?.user?.email
  
  if (!currentEmail) return { error: "Not authenticated" }

  try {
    if (emailTrim === currentEmail.toLowerCase()) {
      return { success: "Email unchanged" }
    }

    const existing = await prisma.user.findUnique({ where: { email: emailTrim } })
    if (existing) return { error: "Email already in use" }

    await prisma.user.update({
      where: { email: currentEmail },
      data: { email: emailTrim }
    })

    revalidatePath('/settings')
    return { success: "Successfully updated email" }
  } catch (err) {
    return { error: "Could not update email" }
  }
}

export async function updatePassword(prevState: any, formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('password') as string

  if (!currentPassword) return { error: "Current password is required" }
  if (!newPassword || newPassword.length < 6) return { error: "Password must be at least 6 characters" }

  const session = await auth()
  if (!session?.user?.email) return { error: "Not authenticated" }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || !user.password) return { error: "No password set for this account" }

    const matches = await bcrypt.compare(currentPassword, user.password)
    if (!matches) return { error: "Current password is incorrect" }

    const hashed = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashed }
    })

    return { success: "Successfully updated password" }
  } catch (err) {
    return { error: "Could not update password" }
  }
}

export async function updateAvatar(imageData: string) {
  if (!imageData) return { error: 'No image provided' }

  const session = await auth()
  if (!session?.user?.email) return { error: 'Not authenticated' }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { image: imageData }
    })
    
    revalidatePath('/settings')
    return { success: 'Successfully updated avatar' }
  } catch (err) {
    return { error: 'Could not update avatar' }
  }
}

export async function updateUsername(prevState: any, formData: FormData) {
  const newName = formData.get('name') as string
  if (!newName) return { error: 'Missing name' }

  const session = await auth()
  if (!session?.user?.email) return { error: 'Not authenticated' }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { name: newName }
    })
    revalidatePath('/settings')
    return { success: 'Successfully updated name' }
  } catch (err) {
    return { error: 'Could not update name' }
  }
}

export async function updateDetails(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) return { error: 'Not authenticated' }

  // Helper to parse numbers safely
  const parseNumber = (val: FormDataEntryValue | null) => {
    if (!val) return null
    const num = Number(val)
    return isNaN(num) ? null : num
  }

  // Helper to parse strings (handling empty strings as null if preferred, though Prisma handles strings fine)
  const parseString = (val: FormDataEntryValue | null) => {
    const str = val?.toString().trim()
    return str || null
  }

  // 1. Handle Date of Birth
  const dobRaw = formData.get('dateOfBirth') as string
  const dateOfBirth = dobRaw ? new Date(dobRaw) : null

  // 2. Handle Interests (Comma separated string -> Array)
  const interestsRaw = formData.get('interests') as string
  const interests = interestsRaw 
    ? interestsRaw.split(',').map(s => s.trim()).filter(Boolean) 
    : []

  const data = {
    // Identity
    bio: parseString(formData.get('bio')),
    interests: interests,
    dateOfBirth: dateOfBirth,

    // Demographics
    gender: parseString(formData.get('gender')),
    education: parseString(formData.get('education')),
    maritalStatus: parseString(formData.get('maritalStatus')),
    
    // Household
    householdSize: parseNumber(formData.get('householdSize')),
    childrenCount: parseNumber(formData.get('childrenCount')),
    socialSupportLevel: parseString(formData.get('socialSupportLevel')),
    
    // Origins
    childhoodMathSkill: parseNumber(formData.get('childhoodMathSkill')),
    booksInHome: parseString(formData.get('booksInHome')),
    
    // Health
    bmi: parseNumber(formData.get('bmi')),
    smoking: parseString(formData.get('smoking')),
    alcoholConsumption: parseString(formData.get('alcoholConsumption')),
    mentalHealthScore: parseNumber(formData.get('mentalHealthScore')),
    
    // Work
    employmentStatus: parseString(formData.get('employmentStatus')),
    incomePercentile: parseNumber(formData.get('incomePercentile')),
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data
    })
    revalidatePath('/settings')
    return { success: 'Successfully updated details' }
  } catch (err) {
    console.error("Profile update error:", err)
    return { error: 'Could not update details' }
  }
}