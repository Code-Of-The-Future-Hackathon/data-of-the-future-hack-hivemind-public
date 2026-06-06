'use server'

import { signIn } from "@/app/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"

export async function register(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    if (!email || !password || !name) {
        return { error: "Missing fields" }
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return { error: "Email already in use" }
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        })

        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        })

        return { success: "User created!" }
    } catch (error) {
        if (error instanceof AuthError) {
             return { error: "Something went wrong during login" }
        }

        // If it's a redirect error (success), re-throw it so Next.js handles it
        throw error
    }
}

export async function login(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials!" }
                default:
                    return { error: "Something went wrong!" }
            }
        }
        throw error
    }
}