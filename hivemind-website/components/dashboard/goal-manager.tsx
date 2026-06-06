'use client'

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { 
  createMilestone, updateMilestone, deleteMilestone,
  createQuest, updateQuest, deleteQuest,
  createTask, updateTask, deleteTask
} from "@/app/actions/game"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Target, Sparkles, PenTool, ExternalLink, 
  Trash2, Plus, ArrowLeft, Loader2, ChevronRight, Pencil 
} from "lucide-react"

import { TaskVerifier } from "@/components/game/task-verifier"

// --- TYPES ---
type Task = { id: string; content: string; isCompleted: boolean } 
type Quest = { id: string; title: string; description: string | null; difficulty: string; tasks: Task[] }
type Milestone = { id: string; title: string; description: string | null; quests: Quest[] }

interface GoalManagerProps {
  milestones: Milestone[]
}

type ViewState = 
  | { type: 'CHOICE' }
  | { type: 'LIST_MILESTONES' }
  | { type: 'FORM_MILESTONE', editData?: Milestone }
  | { type: 'LIST_QUESTS', milestoneId: string }
  | { type: 'FORM_QUEST', milestoneId: string, editData?: Quest }
  | { type: 'LIST_TASKS', milestoneId: string, questId: string }
  | { type: 'FORM_TASK', milestoneId: string, questId: string, editData?: Task }

export function GoalManager({ milestones, children }: { milestones: Milestone[], children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<ViewState>({ type: 'CHOICE' })
  const router = useRouter()

  const reset = () => setView({ type: 'CHOICE' })

  const renderContent = () => {
    switch (view.type) {
      case 'CHOICE':
        return <ChoiceView onSelectManual={() => setView({ type: 'LIST_MILESTONES' })} />
      case 'LIST_MILESTONES':
        return <MilestoneListView 
          milestones={milestones} 
          onEdit={(m) => setView({ type: 'FORM_MILESTONE', editData: m })}
          onSelect={(id) => setView({ type: 'LIST_QUESTS', milestoneId: id })}
          onCreate={() => setView({ type: 'FORM_MILESTONE' })}
          onBack={() => setView({ type: 'CHOICE' })}
        />
      case 'FORM_MILESTONE':
        return <MilestoneForm 
          editData={view.editData} 
          onCancel={() => setView({ type: 'LIST_MILESTONES' })}
        />
      case 'LIST_QUESTS':
        const activeMilestone = milestones.find(m => m.id === view.milestoneId)
        return <QuestListView 
          quests={activeMilestone?.quests || []}
          milestoneTitle={activeMilestone?.title}
          onEdit={(q) => setView({ type: 'FORM_QUEST', milestoneId: view.milestoneId, editData: q })}
          onSelect={(qId) => setView({ type: 'LIST_TASKS', milestoneId: view.milestoneId, questId: qId })}
          onCreate={() => setView({ type: 'FORM_QUEST', milestoneId: view.milestoneId })}
          onBack={() => setView({ type: 'LIST_MILESTONES' })}
        />
      case 'FORM_QUEST':
        return <QuestForm 
          milestoneId={view.milestoneId}
          editData={view.editData}
          onCancel={() => setView({ type: 'LIST_QUESTS', milestoneId: view.milestoneId })}
        />
      case 'LIST_TASKS':
        const parentMilestone = milestones.find(m => m.id === view.milestoneId)
        const activeQuest = parentMilestone?.quests.find(q => q.id === view.questId)
        return <TaskListView 
          tasks={activeQuest?.tasks || []}
          questTitle={activeQuest?.title}
          onEdit={(t) => setView({ type: 'FORM_TASK', milestoneId: view.milestoneId, questId: view.questId, editData: t })}
          onCreate={() => setView({ type: 'FORM_TASK', milestoneId: view.milestoneId, questId: view.questId })}
          onBack={() => setView({ type: 'LIST_QUESTS', milestoneId: view.milestoneId })}
        />
      case 'FORM_TASK':
        return <TaskForm 
          questId={view.questId}
          editData={view.editData}
          onCancel={() => setView({ type: 'LIST_TASKS', milestoneId: view.milestoneId, questId: view.questId })}
        />
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) reset(); }}>
      <DialogTrigger asChild>
        {children || (
            <Button variant="outline" className="gap-2">
                <Target className="w-4 h-4" /> Manage Goals
            </Button>
        )}
      </DialogTrigger>
      {/* Increased max-width to 600px to accommodate the AI Verifier button better */}
      <DialogContent className="sm:max-w-[600px]">
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}

// ================= SUB-COMPONENTS =================

function ChoiceView({ onSelectManual }: { onSelectManual: () => void }) {
  const router = useRouter()
  return (
    <div className="space-y-6 py-4">
      <DialogHeader>
        <DialogTitle className="text-center text-xl">Goal Management</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={onSelectManual} className="flex flex-col items-center justify-center p-6 border-2 border-zinc-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
          <div className="p-3 bg-zinc-100 rounded-full mb-3 group-hover:bg-blue-200 transition-colors"><PenTool className="w-6 h-6 text-zinc-600 group-hover:text-blue-700" /></div>
          <span className="font-bold text-zinc-900">Manual</span>
          <span className="text-xs text-zinc-500 text-center mt-1">Full control</span>
        </button>
        <button onClick={() => router.push('/ai-chat')} className="flex flex-col items-center justify-center p-6 border-2 border-zinc-100 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group">
          <div className="p-3 bg-zinc-100 rounded-full mb-3 group-hover:bg-purple-200 transition-colors"><Sparkles className="w-6 h-6 text-zinc-600 group-hover:text-purple-700" /></div>
          <span className="font-bold text-zinc-900">AI Assistant</span>
          <span className="text-xs text-zinc-500 text-center mt-1">Auto-generate</span>
        </button>
      </div>
    </div>
  )
}

// --- MILESTONE COMPONENTS ---

interface MilestoneListProps {
  milestones: Milestone[]
  onEdit: (m: Milestone) => void
  onSelect: (id: string) => void
  onCreate: () => void
  onBack: () => void
}

function MilestoneListView({ milestones, onEdit, onSelect, onCreate, onBack }: MilestoneListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b pr-10">
        <DialogTitle>Milestones</DialogTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-zinc-400 hover:text-zinc-700" 
          onClick={() => router.push('/goals')}
          title="Maximize to full page"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </DialogHeader>

      <ScrollArea className="h-[300px] pr-4">
        {milestones.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm py-10 border border-dashed rounded-lg">
                No milestones yet.
            </div>
        ) : (
            <div className="space-y-2">
            {milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-2 bg-zinc-50 rounded-lg group hover:bg-zinc-100">
                <div className="flex-1 cursor-pointer min-w-0" onClick={() => onSelect(m.id)}>
                    <p className="font-medium truncate">{m.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{m.quests.length} Quests</p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => onEdit(m)}>
                    <Pencil className="w-3 h-3 text-zinc-500" />
                </Button>
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 shrink-0 hover:text-red-600 hover:bg-red-50" 
                    disabled={isPending} 
                    onClick={() => { if(confirm('Delete?')) startTransition(() => deleteMilestone(m.id)) }}
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => onSelect(m.id)}>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                </Button>
                </div>
            ))}
            </div>
        )}
      </ScrollArea>
      <div className="flex justify-between pt-2 border-t">
        <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={onCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" /> New Milestone
        </Button>
      </div>
    </div>
  )
}

function MilestoneForm({ editData, onCancel }: { editData?: Milestone, onCancel: () => void }) {
  const [isPending, startTransition] = useTransition()
   
  const action = (formData: FormData) => {
    startTransition(async () => {
      if (editData) await updateMilestone(editData.id, formData.get('title') as string, formData.get('description') as string)
      else await createMilestone(formData.get('title') as string, formData.get('description') as string)
      onCancel()
    })
  }

  return (
    <form action={action} className="space-y-4">
      <DialogHeader><DialogTitle>{editData ? 'Edit' : 'Create'} Milestone</DialogTitle></DialogHeader>
      <div className="space-y-2"><Label>Title</Label><Input name="title" defaultValue={editData?.title} required /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={editData?.description || ""} /></div>
      <div className="flex justify-between pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Save'}</Button>
      </div>
    </form>
  )
}

// --- QUEST COMPONENTS ---

interface QuestListProps {
  quests: Quest[]
  milestoneTitle?: string
  onEdit: (q: Quest) => void
  onSelect: (id: string) => void
  onCreate: () => void
  onBack: () => void
}

function QuestListView({ quests, milestoneTitle, onEdit, onSelect, onCreate, onBack }: QuestListProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      <DialogHeader className="pb-2 border-b">
        <DialogTitle className="text-sm text-zinc-500 font-normal">Quests for</DialogTitle>
        <div className="font-bold text-lg truncate">{milestoneTitle}</div>
      </DialogHeader>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {quests.map((q) => (
            <div key={q.id} className="flex items-center gap-2 p-2 bg-zinc-50 rounded-lg group hover:bg-zinc-100">
              <div className="flex-1 cursor-pointer" onClick={() => onSelect(q.id)}>
                <p className="font-medium truncate">{q.title}</p>
                <p className="text-xs text-zinc-500">{q.tasks.length} Tasks • {q.difficulty}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(q)}><Pencil className="w-3 h-3 text-zinc-500" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-red-600" disabled={isPending} onClick={() => { if(confirm('Delete?')) startTransition(() => deleteQuest(q.id)) }}><Trash2 className="w-3 h-3" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onSelect(q.id)}><ChevronRight className="w-4 h-4 text-zinc-400" /></Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <Button onClick={onCreate}><Plus className="w-4 h-4 mr-2" /> New Quest</Button>
      </div>
    </div>
  )
}

function QuestForm({ milestoneId, editData, onCancel }: { milestoneId: string, editData?: Quest, onCancel: () => void }) {
  const [isPending, startTransition] = useTransition()
   
  const action = (formData: FormData) => {
    startTransition(async () => {
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const difficulty = formData.get('difficulty') as any
       
      if (editData) {
        await updateQuest(editData.id, title, description, difficulty)
      } else {
        await createQuest(milestoneId, title, description, difficulty)
      }
      onCancel()
    })
  }

  return (
    <form action={action} className="space-y-4">
      <DialogHeader><DialogTitle>{editData ? 'Edit' : 'Create'} Quest</DialogTitle></DialogHeader>
       
      <div className="space-y-2">
        <Label>Title</Label>
        <Input name="title" defaultValue={editData?.title} required />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
            name="description" 
            defaultValue={editData?.description || ""} 
            placeholder="Describe the mission details..." 
        />
      </div>

      <div className="space-y-2">
        <Label>Difficulty</Label>
        <Select name="difficulty" defaultValue={editData?.difficulty || "MEDIUM"}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
            <SelectItem value="EPIC">Epic</SelectItem>
          </SelectContent>
        </Select>
      </div>
       
      <div className="flex justify-between pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Save'}
        </Button>
      </div>
    </form>
  )
}

// --- TASK COMPONENTS ---

interface TaskListProps {
  tasks: Task[]
  questTitle?: string
  onEdit: (t: Task) => void
  onCreate: () => void
  onBack: () => void
}

function TaskListView({ tasks, questTitle, onEdit, onCreate, onBack }: TaskListProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      <DialogHeader className="pb-2 border-b">
        <DialogTitle className="text-sm text-zinc-500 font-normal">Tasks for</DialogTitle>
        <div className="font-bold text-lg truncate">{questTitle}</div>
      </DialogHeader>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {tasks.map((t) => (
            // Changed: items-center -> items-start to allow text wrapping
            <div key={t.id} className="flex items-start gap-2 p-3 bg-zinc-50 rounded-lg group hover:bg-zinc-100 group/task">
              
              {/* Text Container - Allowed to wrap */}
              <div className="flex-1 min-w-0 mr-2 mt-1">
                {/* Removed 'truncate', added 'break-words' and 'whitespace-normal' */}
                <p className="font-medium text-sm text-zinc-700 leading-snug break-words whitespace-normal">
                  {t.content}
                </p>
              </div>

              {/* Actions Container - Fixed Width */}
              <div className="flex items-center gap-1 shrink-0">
                <TaskVerifier 
                    taskId={t.id} 
                    taskContent={t.content} 
                    isCompleted={t.isCompleted} 
                />

                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(t)}>
                    <Pencil className="w-3 h-3 text-zinc-500" />
                </Button>
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 hover:text-red-600" 
                    disabled={isPending} 
                    onClick={() => { if(confirm('Delete?')) startTransition(() => deleteTask(t.id)) }}
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <Button onClick={onCreate}><Plus className="w-4 h-4 mr-2" /> New Task</Button>
      </div>
    </div>
  )
}

function TaskForm({ questId, editData, onCancel }: { questId: string, editData?: Task, onCancel: () => void }) {
  const [isPending, startTransition] = useTransition()
   
  const action = (formData: FormData) => {
    startTransition(async () => {
      const content = formData.get('content') as string
      if (editData) await updateTask(editData.id, content)
      else await createTask(questId, content)
      onCancel()
    })
  }

  return (
    <form action={action} className="space-y-4">
      <DialogHeader><DialogTitle>{editData ? 'Edit' : 'Create'} Task</DialogTitle></DialogHeader>
      <div className="space-y-2"><Label>Content</Label><Input name="content" defaultValue={editData?.content} required /></div>
      <div className="flex justify-between pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Save'}</Button>
      </div>
    </form>
  )
}