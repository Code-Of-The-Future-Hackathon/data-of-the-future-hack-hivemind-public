'use client'

import { useActionState } from "react"
import Link from "next/link"
import { login } from "@/app/actions/auth"
import { doSocialLogin } from "@/app/actions/social-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock } from "lucide-react"
import { FaGithub } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>

      <Card className="w-full max-w-md shadow-2xl border-zinc-100 bg-white/80 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-zinc-500">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Credentials Form */}
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input 
                  name="email" 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  className="pl-10 bg-zinc-50/50 border-zinc-200 focus:bg-white transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input 
                  name="password" 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  required 
                  className="pl-10 bg-zinc-50/50 border-zinc-200 focus:bg-white transition-all"
                />
              </div>
            </div>
            
            {state?.error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-md flex items-center gap-2">
                 ⚠️ {state.error}
              </div>
            )}

            <Button type="submit" className="w-full font-bold shadow-sm" disabled={isPending}>
              {isPending ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-400 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <form action={() => doSocialLogin("github")}>
              <Button variant="outline" className="w-full relative" type="submit">
                <FaGithub className="mr-2 h-4 w-4 text-zinc-900" />
                GitHub
              </Button>
            </form>

            <form action={() => doSocialLogin("google")}>
              <Button variant="outline" className="w-full relative" type="submit">
                <FcGoogle className="mr-2 h-4 w-4" />
                Google
              </Button>
            </form>
          </div>
        </CardContent>
        
        <CardFooter className="justify-center border-t p-6">
          <p className="text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-semibold text-zinc-900 hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}