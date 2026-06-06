'use client'

import { useState } from "react"
import { QuestCard } from "@/components/game/quest-card"
import { CreateQuestBtn } from "@/components/game/creation-forms"
import { DeleteMilestoneButton } from "@/components/game/delete-milestone-button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

// Define types based on your Prisma query
type MilestoneProps = {
  milestone: {
    id: string
    title: string
    description: string | null
    quests: any[] // Using any to avoid complex Prisma type matching issues in this snippet
  }
}

export function MilestoneItem({ milestone }: MilestoneProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden transition-all">
      {/* Milestone Header */}
      <div 
        className="p-6 border-b bg-zinc-50/50 flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer hover:bg-zinc-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
            {/* Toggle Icon */}
            <div className={cn("mt-1 p-1 rounded-md bg-zinc-200/50 text-zinc-500 transition-transform", isExpanded && "rotate-180")}>
                <ChevronDown className="w-5 h-5" />
            </div>
            
            <div>
            <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                {milestone.title}
            </h3>
            {milestone.description && (
                <p className="text-zinc-500 text-sm mt-1">{milestone.description}</p>
            )}
            </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <DeleteMilestoneButton id={milestone.id} />
          <CreateQuestBtn milestoneId={milestone.id} />
        </div>
      </div>

      {/* Quests Grid - Conditionally Rendered */}
      {isExpanded && (
        <div className="p-6 bg-zinc-50/30 animate-in fade-in slide-in-from-top-2 duration-200">
          {milestone.quests.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg bg-white/50">
              <p className="text-sm text-zinc-400 italic mb-2">This milestone has no quests yet.</p>
              <p className="text-xs text-zinc-300">Add small missions to achieve this goal.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestone.quests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}