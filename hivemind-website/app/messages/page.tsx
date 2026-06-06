import { getUsersToChatWith } from "@/app/actions/chat"
import { ChatInterface } from "@/components/chat-interface"

export const dynamic = 'force-dynamic'

// Define props for Next.js 15 Page
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function MessagesPage({ searchParams }: PageProps) {
  // 1. Await the params
  const params = await searchParams
  const targetUsername = typeof params.username === 'string' ? params.username : undefined

  // 2. Pass the specific username to the action to ensure they are fetched
  const users = await getUsersToChatWith(targetUsername)

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      <div className="container mx-auto py-4">
        <ChatInterface users={users} />
      </div>
    </div>
  )
}