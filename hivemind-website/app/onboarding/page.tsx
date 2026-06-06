
import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { UserInfoWizard } from "@/components/user-wizard"

export default async function OnboardingPage() {
    const session = await auth()

    if (!session?.user?.email) redirect("/login")

    // Check if they already have data (e.g. check if 'age' is set)
    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })
    if (user?.dateOfBirth) {
        redirect("/dashboard")
    }


    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-10 space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight">Let's build your profile</h1>
                <p className="text-zinc-500">We need a few details to personalize your Hivemind experience.</p>
            </div>

            <UserInfoWizard />
        </div>
    )
}