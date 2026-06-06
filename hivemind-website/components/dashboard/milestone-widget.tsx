import { Progress } from "@/components/ui/progress"
import { Target } from "lucide-react"

export function MilestoneWidget({ milestone }: { milestone: any }) {
  const completed = milestone.quests.filter((q: any) => q.status === "COMPLETED").length
  const total = milestone.quests.length
  const percent = total === 0 ? 0 : (completed / total) * 100

  return (
    <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-md">
                    <Target className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-bold text-sm truncate w-32">{milestone.title}</h4>
            </div>
            <span className="text-xs font-medium text-zinc-500">{Math.round(percent)}%</span>
        </div>
        <Progress value={percent} className="h-2" />
        <p className="text-[10px] text-zinc-400 mt-2 text-right">
            {completed}/{total} Quests
        </p>
    </div>
  )
}