'use client'

import { useState } from "react"
import { createMilestone, createQuest } from "@/app/actions/game"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

export function CreateMilestoneBtn() {
  const [open, setOpen] = useState(false)

  async function onSubmit(formData: FormData) {
    await createMilestone(
      formData.get("title") as string, 
      formData.get("description") as string
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> New Milestone</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create New Milestone</DialogTitle></DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div><Label>Title</Label><Input name="title" required /></div>
          <div><Label>Description</Label><Textarea name="description" /></div>
          <Button type="submit" className="w-full">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CreateQuestBtn({ milestoneId }: { milestoneId: string }) {
  const [open, setOpen] = useState(false)

  async function onSubmit(formData: FormData) {
    const tasksRaw = formData.get("tasks") as string
    const tasks = tasksRaw.split(',').map(t => t.trim()).filter(t => t.length > 0)
    
    await createQuest(
      milestoneId,
      formData.get("title") as string,
      formData.get("description") as string,
      formData.get("difficulty") as any,
      tasks
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1"/> Add Quest</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Quest to Milestone</DialogTitle></DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input name="title" required />
          </div>
          
          {/* ADDED DESCRIPTION FIELD */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea name="description" placeholder="Describe the mission..." />
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select name="difficulty" defaultValue="MEDIUM">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
                <SelectItem value="EPIC">Epic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Tasks (Comma separated)</Label>
            <Textarea name="tasks" placeholder="Buy domain, Install Next.js, Setup DB" required />
          </div>
          
          <Button type="submit" className="w-full">Create Quest</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}