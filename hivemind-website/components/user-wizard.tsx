'use client'

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "motion/react"
import { userInfoSchema, type UserInfoValues } from "@/lib/schemas/user-info"
import { submitOnboarding } from "@/app/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const steps = [
  { id: 1, title: "Who You Are", description: "Identity & Demographics" },
  { id: 2, title: "Home & Heart", description: "Household and social circle" },
  { id: 3, title: "Origins", description: "Childhood conditions" },
  { id: 4, title: "Health Metrics", description: "Physical and mental well-being" },
  { id: 5, title: "Work & Wealth", description: "Career and financial status" },
]

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return ""
  return new Date(date).toISOString().split('T')[0]
}

export function UserInfoWizard({ initialData }: { initialData?: any }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [previousStep, setPreviousStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  
  const form = useForm<UserInfoValues>({
    resolver: zodResolver(userInfoSchema),
    defaultValues: {
      // ADDED: Identity fields
      username: initialData?.username || "",
      name: initialData?.name || "",
      
      bio: initialData?.bio || "",
      interests: initialData?.interests ? initialData.interests.join(", ") : "",
      dateOfBirth: formatDateForInput(initialData?.dateOfBirth), 
      gender: initialData?.gender || "",
      education: initialData?.education || "",
      maritalStatus: initialData?.maritalStatus || "",
      
      householdSize: initialData?.householdSize || 1,
      childrenCount: initialData?.childrenCount || 0,
      socialSupportLevel: initialData?.socialSupportLevel || "medium",
      
      childhoodMathSkill: initialData?.childhoodMathSkill || 5,
      booksInHome: initialData?.booksInHome || "11-25",
      
      bmi: initialData?.bmi || undefined,
      smoking: initialData?.smoking || "never",
      alcoholConsumption: initialData?.alcoholConsumption || "none",
      mentalHealthScore: initialData?.mentalHealthScore || 5,
      
      employmentStatus: initialData?.employmentStatus || "employed",
      incomePercentile: initialData?.incomePercentile || 50,
    },
    mode: "onChange", 
  })

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
  }

  const direction = currentStep > previousStep ? 1 : -1

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await form.trigger(fieldsToValidate as any)
    
    if (isValid) {
      setPreviousStep(currentStep)
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        onSubmit(form.getValues())
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setPreviousStep(currentStep)
      setCurrentStep(prev => prev - 1)
    }
  }

  function onSubmit(data: UserInfoValues) {
    startTransition(async () => {
      const result = await submitOnboarding(data)
      if (result?.error) {
        // If specific field error (like username taken), set it in the form
        if (result.error.toLowerCase().includes("username")) {
            form.setError("username", { type: "manual", message: result.error })
        } else {
            alert(`Error: ${result.error}`)
        }
      } else {
        console.log("Profile updated successfully")
      }
    })
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-sm font-medium text-zinc-500">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
        </div>
        <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
      </div>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <Card className="border-zinc-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col justify-between">
            <CardHeader className="bg-zinc-50 border-b pb-6">
              <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </CardHeader>

            <CardContent className="pt-8 flex-grow relative overflow-hidden bg-white">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  {renderStepContent(currentStep, form)}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            <CardFooter className="flex justify-between border-t bg-zinc-50 p-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0 || isPending}
                className="w-32"
              >
                Back
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={isPending}
                className="w-32 bg-zinc-900 text-white hover:bg-zinc-800"
              >
                {isPending ? "Saving..." : (currentStep === steps.length - 1 ? "Save Profile" : "Next")}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}

function getFieldsForStep(step: number): string[] {
  switch (step) {
    case 0: return ["username", "name", "dateOfBirth", "gender", "bio", "interests", "education", "maritalStatus"]
    case 1: return ["householdSize", "childrenCount", "socialSupportLevel"]
    case 2: return ["childhoodMathSkill", "booksInHome"]
    case 3: return ["bmi", "smoking", "alcoholConsumption", "mentalHealthScore"]
    case 4: return ["employmentStatus", "incomePercentile"]
    default: return []
  }
}

function renderStepContent(step: number, form: any) {
  switch (step) {
    case 0: // Demographics + Bio + Interests + Identity
      return (
        <div className="space-y-6">
          {/* Identity Section - Crucial for new OAuth users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-zinc-50 rounded-lg border border-zinc-100">
            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel>Username <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription className="text-[10px]">Unique handle for your profile.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="bio" render={({ field }) => (
            <FormItem>
              <FormLabel>Short Bio</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us a bit about yourself..." 
                  className="resize-none h-20" 
                  {...field} 
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="interests" render={({ field }) => (
            <FormItem>
              <FormLabel>Interests & Hobbies</FormLabel>
              <FormControl>
                <Input placeholder="Hiking, Coding, Cooking (comma separated)" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>Separate multiple interests with commas.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="education" render={({ field }) => (
              <FormItem>
                <FormLabel>Education</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Highest Degree" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="bachelors">Bachelor's</SelectItem>
                    <SelectItem value="masters">Master's</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="maritalStatus" render={({ field }) => (
              <FormItem>
                <FormLabel>Marital Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
      )

    // ... (Cases 1, 2, 3, 4 remain exactly the same as previous implementation)
    case 1: // Household
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="householdSize" render={({ field }) => (
                <FormItem>
                <FormLabel>Household Size</FormLabel>
                <FormControl>
                    <Input type="number" min={1} {...field} onChange={e => field.onChange(+e.target.value)} value={field.value ?? 1} />
                </FormControl>
                <FormDescription>Total people including yourself.</FormDescription>
                <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="childrenCount" render={({ field }) => (
                <FormItem>
                <FormLabel>Children</FormLabel>
                <FormControl>
                    <Input type="number" min={0} {...field} onChange={e => field.onChange(+e.target.value)} value={field.value ?? 0} />
                </FormControl>
                <FormDescription>Number of children you support.</FormDescription>
                <FormMessage />
                </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="socialSupportLevel" render={({ field }) => (
            <FormItem className="space-y-3 pt-4 border-t">
              <FormLabel>Social Support Network</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="low" /></FormControl>
                    <FormLabel className="font-normal">Low (I often feel alone)</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="medium" /></FormControl>
                    <FormLabel className="font-normal">Medium (I have some help)</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="high" /></FormControl>
                    <FormLabel className="font-normal">High (Strong community/family)</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      )
    
    case 2: // Childhood
      return (
        <div className="space-y-8">
            <FormField control={form.control} name="booksInHome" render={({ field }) => (
                <FormItem>
                <FormLabel>Books in home at age 10</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select approximate amount" /></SelectTrigger></FormControl>
                    <SelectContent>
                    <SelectItem value="0-10">0-10 (Almost none)</SelectItem>
                    <SelectItem value="11-25">11-25 (A shelf)</SelectItem>
                    <SelectItem value="26-100">26-100 (A bookcase)</SelectItem>
                    <SelectItem value="100+">100+ (A library)</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="childhoodMathSkill" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Math Skills at Age 10: {field.value}</FormLabel>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Struggled</span>
                <Slider min={1} max={10} step={1} defaultValue={[field.value || 5]} onValueChange={(val) => field.onChange(val[0])} className="flex-1" />
                <span className="text-sm text-muted-foreground">Genius</span>
              </div>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      )

    case 3: // Health
      return (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField control={form.control} name="smoking" render={({ field }) => (
                <FormItem>
                <FormLabel>Smoking History</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                    <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="former">Former Smoker</SelectItem>
                    <SelectItem value="current">Current Smoker</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )} />

             <FormField control={form.control} name="alcoholConsumption" render={({ field }) => (
                <FormItem>
                <FormLabel>Alcohol</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                    <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="social">Socially</SelectItem>
                    <SelectItem value="regular">Regularly</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )} />
           </div>

           <FormField control={form.control} name="bmi" render={({ field }) => (
                <FormItem>
                <FormLabel>BMI (Body Mass Index)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.1" placeholder="e.g. 24.5" {...field} onChange={e => field.onChange(+e.target.value)} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>Leave blank if unknown.</FormDescription>
                <FormMessage />
                </FormItem>
            )} />

           <FormField control={form.control} name="mentalHealthScore" render={({ field }) => (
            <FormItem className="pt-4 border-t">
              <FormLabel className="text-lg">Recent Mood (0-10)</FormLabel>
              <div className="flex items-center gap-4">
                <span className="text-2xl">😊</span>
                <Slider min={0} max={10} step={1} defaultValue={[field.value]} onValueChange={(val) => field.onChange(val[0])} className="flex-1" />
                <span className="text-2xl">😔</span>
              </div>
              <p className="text-center font-bold text-xl mt-2">{field.value}</p>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      )

    case 4: // Work & Money
        return (
            <div className="space-y-6">
              <FormField control={form.control} name="employmentStatus" render={({ field }) => (
                <FormItem>
                <FormLabel>Current Employment</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                    <SelectContent>
                    <SelectItem value="employed">Employed Full-Time</SelectItem>
                    <SelectItem value="part_time">Part-Time</SelectItem>
                    <SelectItem value="self_employed">Self Employed</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
              )} />

            <FormField control={form.control} name="incomePercentile" render={({ field }) => (
                <FormItem>
                <FormLabel className="text-lg">Income Percentile (0-100)</FormLabel>
                <FormControl>
                    <Input type="number" min={0} max={100} {...field} onChange={e => field.onChange(+e.target.value)} value={field.value ?? 50} />
                </FormControl>
                <FormDescription>
                    0 = Lowest Income, 100 = Highest Income in your area.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )} />
            </div>
        )
  }
}