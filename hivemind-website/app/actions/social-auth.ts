'use server'

import { signIn } from "@/app/auth"

export async function doSocialLogin(provider: string) {
  await signIn(provider, { 
    redirectTo: "/onboarding"
  })
}