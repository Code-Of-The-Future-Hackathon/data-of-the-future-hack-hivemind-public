import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SettingsView } from "@/components/settings-view"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.email) redirect('/auth/login')

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email } 
  })

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Settings</h1>
          <p className="text-zinc-500">Manage your profile details and account preferences.</p>
        </div>
        <SettingsView user={user} />
      </div>
    </div>
  )
}