'use client'

import { useState, useRef, useTransition } from "react"
import { useFormStatus } from "react-dom"
import { updateUsername, updateEmail, updatePassword, updateDetails, updateAvatar } from "@/app/actions/profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Loader2 } from "lucide-react"

export function SettingsView({ user }: { user: any }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header Profile Card */}
      <div className="flex items-center gap-6 p-4 bg-white rounded-xl border shadow-sm">
        <AvatarUpload user={user} />
        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-zinc-500">{user.email}</p>
          <div className="flex gap-2 mt-2">
             <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Level {user.level}</span>
             <span className="text-xs font-bold px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">{user.score} XP</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="details">Profile Details</TabsTrigger>
          <TabsTrigger value="account">Account Security</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: PERSONAL DETAILS --- */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your bio, demographics, and background info.</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailsForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: ACCOUNT SECURITY --- */}
        <TabsContent value="account">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Display Name</CardTitle>
                <CardDescription>This is your public display name.</CardDescription>
              </CardHeader>
              <CardContent>
                <NameForm user={user} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Address</CardTitle>
                <CardDescription>Your email is used for login and notifications.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmailForm user={user} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Ensure your account is using a long, random password.</CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordForm />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// --- SUB-COMPONENTS ---

function formatDate(date: string | Date | null) {
    if (!date) return ""
    return new Date(date).toISOString().split('T')[0]
}

function DetailsForm({ user }: { user: any }) {
  const [msg, setMsg] = useState("")

  async function action(data: FormData) {
    const res = await updateDetails(null, data)
    setMsg(res?.error ? `Error: ${res.error}` : "Profile updated successfully!")
  }

  return (
    <form action={action} className="space-y-8">
      
      {/* 0. Bio & Interests */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider border-b pb-1">About You</h3>
        <div className="grid gap-4">
            <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea 
                    name="bio" 
                    placeholder="Tell us a bit about yourself..." 
                    defaultValue={user.bio || ""} 
                    className="resize-none h-24"
                />
            </div>
            <div className="space-y-2">
                <Label>Interests</Label>
                <Input 
                    name="interests" 
                    placeholder="Hiking, Coding, Cooking (comma separated)" 
                    defaultValue={user.interests ? user.interests.join(", ") : ""} 
                />
                <p className="text-[10px] text-zinc-500">Separate multiple interests with commas.</p>
            </div>
        </div>
      </div>

      {/* 1. Demographics */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider border-b pb-1">Demographics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input name="dateOfBirth" type="date" defaultValue={formatDate(user.dateOfBirth)} />
            </div>
            
            <div className="space-y-2">
                <Label>Gender</Label>
                <Select name="gender" defaultValue={user.gender || undefined}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Marital Status</Label>
                <Select name="maritalStatus" defaultValue={user.maritalStatus || undefined}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>

      {/* 2. Household */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider border-b pb-1">Household</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2"><Label>Household Size</Label><Input name="householdSize" type="number" min="1" defaultValue={user.householdSize} /></div>
            <div className="space-y-2"><Label>Children</Label><Input name="childrenCount" type="number" min="0" defaultValue={user.childrenCount} /></div>
            <div className="space-y-2">
                <Label>Social Support</Label>
                <Select name="socialSupportLevel" defaultValue={user.socialSupportLevel || undefined}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Low (Alone)</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High (Supported)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>

      {/* 3. Health & Stats */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider border-b pb-1">Health & Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label>BMI</Label><Input name="bmi" type="number" step="0.1" placeholder="24.5" defaultValue={user.bmi} /></div>
            <div className="space-y-2"><Label>Mental Health (0-10)</Label><Input name="mentalHealthScore" type="number" min="0" max="10" defaultValue={user.mentalHealthScore} /></div>
            
            <div className="space-y-2">
                <Label>Smoking</Label>
                <Select name="smoking" defaultValue={user.smoking || undefined}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="former">Former</SelectItem>
                        <SelectItem value="current">Current</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Alcohol</Label>
                <Select name="alcoholConsumption" defaultValue={user.alcoholConsumption || undefined}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>

      {/* 4. Work & Education */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider border-b pb-1">Work & Background</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>Education</Label>
                <Select name="education" defaultValue={user.education || undefined}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="high_school">High School</SelectItem>
                        <SelectItem value="bachelors">Bachelor's</SelectItem>
                        <SelectItem value="masters">Master's</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Employment</Label>
                <Select name="employmentStatus" defaultValue={user.employmentStatus || undefined}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="employed">Employed</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="self_employed">Self Employed</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2"><Label>Income Percentile (0-100)</Label><Input name="incomePercentile" type="number" min="0" max="100" defaultValue={user.incomePercentile} /></div>
            
            <div className="space-y-2">
                <Label>Books in Home (Age 10)</Label>
                <Select name="booksInHome" defaultValue={user.booksInHome || undefined}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0-10">0-10</SelectItem>
                        <SelectItem value="11-25">11-25</SelectItem>
                        <SelectItem value="26-100">26-100</SelectItem>
                        <SelectItem value="100+">100+</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-2"><Label>Math Skill Age 10 (1-10)</Label><Input name="childhoodMathSkill" type="number" min="1" max="10" defaultValue={user.childhoodMathSkill} /></div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end items-center gap-4 border-t pt-4">
        <p className={`text-sm ${msg.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>
        <SubmitBtn label="Save Changes" />
      </div>
    </form>
  )
}

function AvatarUpload({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      startTransition(async () => {
        const base64 = reader.result as string
        await updateAvatar(base64)
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
      <Avatar className="h-20 w-20 border-2 border-zinc-200">
        <AvatarImage src={user.image || ""} className={isPending ? "opacity-50" : ""} />
        <AvatarFallback className="text-xl font-bold">{user.name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {isPending ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
      </div>
      <input type="file" ref={inputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  )
}

function NameForm({ user }: { user: any }) {
  const [msg, setMsg] = useState("")

  async function action(data: FormData) {
    const res = await updateUsername(null, data)
    setMsg(res?.error || res?.success || "")
  }

  return (
    <form action={action}>
      <div className="flex gap-4 items-end">
        <div className="grid w-full gap-2">
          <Label htmlFor="name">Username</Label>
          <Input id="name" name="name" defaultValue={user.name || ""} />
        </div>
        <SubmitBtn />
      </div>
      {msg && <p className={`text-xs mt-2 font-medium ${msg.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
    </form>
  )
}

function EmailForm({ user }: { user: any }) {
  const [msg, setMsg] = useState("")

  async function action(data: FormData) {
    const res = await updateEmail(null, data)
    setMsg(res?.error || res?.success || "")
  }

  return (
    <form action={action}>
      <div className="flex gap-4 items-end">
        <div className="grid w-full gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={user.email || ""} />
        </div>
        <SubmitBtn />
      </div>
      {msg && <p className={`text-xs mt-2 font-medium ${msg.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
    </form>
  )
}

function PasswordForm() {
  const [msg, setMsg] = useState("")
  const ref = useRef<HTMLFormElement>(null)

  async function action(data: FormData) {
    const res = await updatePassword(null, data)
    if (res?.success) {
        setMsg("Password updated successfully")
        ref.current?.reset()
    } else {
        setMsg(res?.error || "Error")
    }
  }

  return (
    <form ref={ref} action={action} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="current">Current Password</Label>
        <Input id="current" name="currentPassword" type="password" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new">New Password</Label>
        <Input id="new" name="password" type="password" required />
      </div>
      <div className="flex justify-between items-center">
        <p className={`text-sm font-medium ${msg.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
        <SubmitBtn label="Update Password" />
      </div>
    </form>
  )
}

function SubmitBtn({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button disabled={pending} type="submit" className="min-w-[100px] shrink-0">
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
    </Button>
  )
}