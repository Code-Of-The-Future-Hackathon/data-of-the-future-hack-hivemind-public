'use server'

import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function sendMessage(receiverId: string, content: string, attachmentUrls: string[] = []) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    const sender = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    })

    if (!sender) return { error: "User not found" }

    try {
        await prisma.message.create({
            data: {
                senderId: sender.id,
                receiverId: receiverId,
                content: content,
                attachments: {
                    create: attachmentUrls.map(url => ({ url }))
                }
            },
        })

        revalidatePath("/messages")
        return { success: true }
    } catch (error) {
        return { error: "Failed to send" }
    }
}

export async function getUsersToChatWith(specificUsername?: string) {
    const session = await auth()
    if (!session?.user?.email) return []

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    })

    if (!currentUser) return []

    // 1. Base Query: Get all other users (In a real app, this might be 'friends' or 'recent chats')
    const users = await prisma.user.findMany({
        where: {
            id: { not: currentUser.id }
        },
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
            email: true
        },
        take: 50 // Optional limit
    })

    // 2. If a specific user is requested via URL, ensure they are in the list
    if (specificUsername) {
        const targetUser = await prisma.user.findUnique({
            where: { username: specificUsername },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                email: true
            }
        })

        // If found and not already in the list (and not self), add to top
        if (targetUser && targetUser.id !== currentUser.id) {
            const alreadyExists = users.some(u => u.id === targetUser.id)
            if (!alreadyExists) {
                users.unshift(targetUser) 
            }
        }
    }

    return users
}

export async function getMessages(otherUserId: string) {
    const session = await auth()
    if (!session?.user?.email) return []

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    })

    if (!currentUser) return []

    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: currentUser.id, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: currentUser.id },
            ],
        },
        orderBy: { createdAt: 'asc' },
        include: {
            sender: { select: { name: true, image: true } },
            receiver: { select: { name: true, image: true } },
            attachments: true
        }
    })

    return { messages, currentUserId: currentUser.id }
}

export async function deleteMessage(messageId: string) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!currentUser) return { error: "User not found" }

    // Ensure user owns the message
    const message = await prisma.message.findUnique({ where: { id: messageId } })
    if (!message || message.senderId !== currentUser.id) return { error: "Unauthorized" }

    await prisma.message.delete({ where: { id: messageId } })
    revalidatePath("/messages")
    return { success: true }
}

export async function editMessage(messageId: string, newContent: string) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } })

    if (!currentUser) return { error: "User not found" }

    const message = await prisma.message.findUnique({ where: { id: messageId } })
    if (!message || message.senderId !== currentUser.id) return { error: "Unauthorized" }

    await prisma.message.update({
        where: { id: messageId },
        data: { content: newContent }
    })
    revalidatePath("/messages")
    return { success: true }
}