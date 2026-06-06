"use client";

import { useState } from "react";
import { 
  Check, X, Edit2, Loader2, ChevronRight, ChevronDown, 
  Target, Shield, CheckCircle2, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { 
  createMilestone, updateMilestone, deleteMilestone,
  createQuest, updateQuest, deleteQuest,
  createTask, updateTask, deleteTask
} from "@/app/actions/game";

// Types matching the AI response structure
type ProposalTask = {
  taskId: string; // 'new-t-X' or real ID
  operation: 'create' | 'update' | 'delete' | 'none';
  title: string;
  desc?: string;
};

type ProposalQuest = {
  questId: string; // 'new-q-X' or real ID
  operation: 'create' | 'update' | 'delete' | 'none';
  title: string;
  desc?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
  tasks: ProposalTask[];
};

type ProposalMilestone = {
  milestoneId: string; // 'new-m-X' or real ID
  operation: 'create' | 'update' | 'delete' | 'none';
  title: string;
  desc?: string;
  quests: ProposalQuest[];
};

interface RoadmapProposalProps {
  data: { milestones: ProposalMilestone[] };
}

export function RoadmapProposal({ data }: RoadmapProposalProps) {
  // Local state to manage edits/acceptances before they hit the DB
  const [milestones, setMilestones] = useState<ProposalMilestone[]>(data.milestones || []);

  const handleMilestoneChange = (index: number, updated: ProposalMilestone) => {
    const newM = [...milestones];
    newM[index] = updated;
    setMilestones(newM);
  };

  if (!milestones || milestones.length === 0) return null;

  return (
    <div className="mt-6 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-zinc-500" />
        <h3 className="font-semibold text-zinc-800 text-sm uppercase tracking-wider">Suggested Roadmap Changes</h3>
      </div>
      
      <div className="space-y-4">
        {milestones.map((m, idx) => (
          <MilestoneCard 
            key={m.milestoneId} 
            milestone={m} 
            onChange={(updated) => handleMilestoneChange(idx, updated)}
          />
        ))}
      </div>
    </div>
  );
}

// --- MILESTONE CARD ---
function MilestoneCard({ milestone, onChange }: { milestone: ProposalMilestone, onChange: (m: ProposalMilestone) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'ACCEPTED' | 'REJECTED'>('IDLE');
  const [realId, setRealId] = useState<string | null>(milestone.operation === 'create' ? null : milestone.milestoneId);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAccept = async () => {
    setStatus('LOADING');
    try {
      if (milestone.operation === 'create') {
        const res = await createMilestone(milestone.title, milestone.desc || "");
        if (res?.success && res.data) {
          setRealId(res.data.id); // Save the REAL ID
          setStatus('ACCEPTED');
        }
      } else if (milestone.operation === 'update') {
        await updateMilestone(milestone.milestoneId, milestone.title, milestone.desc || "");
        setRealId(milestone.milestoneId);
        setStatus('ACCEPTED');
      } else if (milestone.operation === 'delete') {
        await deleteMilestone(milestone.milestoneId);
        setStatus('ACCEPTED'); // Actually deleted, but marked as processed
      } else {
        setStatus('ACCEPTED'); // 'none' op
        setRealId(milestone.milestoneId);
      }
    } catch (e) {
      console.error(e);
      setStatus('IDLE'); // Allow retry
    }
  };

  const handleUpdateChild = (qIdx: number, updatedQuest: ProposalQuest) => {
    const newQuests = [...(milestone.quests || [])];
    newQuests[qIdx] = updatedQuest;
    onChange({ ...milestone, quests: newQuests });
  };

  if (status === 'REJECTED') return null; // Hide if rejected

  // Determine if children are blocked
  // Children blocked if: this is a CREATE op AND we haven't accepted (got a real ID) yet.
  const isChildrenBlocked = milestone.operation === 'create' && !realId;

  return (
    <div className={cn("border rounded-xl bg-white overflow-hidden shadow-sm transition-all", 
        status === 'ACCEPTED' ? "border-green-200 bg-green-50/30" : "border-zinc-200"
    )}>
      {/* Header */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
             {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
             <Badge variant={milestone.operation === 'create' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                {milestone.operation}
             </Badge>
             {isEditing ? (
               <Input value={milestone.title} onChange={e => onChange({...milestone, title: e.target.value})} className="h-7 text-sm" />
             ) : (
               <h4 className="font-semibold text-zinc-900">{milestone.title}</h4>
             )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            {status === 'ACCEPTED' ? (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Synced
                </Badge>
            ) : (
                <>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditing(!isEditing)}>
                        <Edit2 className="w-3 h-3 text-zinc-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-100 hover:text-red-600" onClick={() => setStatus('REJECTED')}>
                        <X className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="default" className="h-7 w-7 bg-green-600 hover:bg-green-700" onClick={handleAccept} disabled={status === 'LOADING'}>
                        {status === 'LOADING' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </Button>
                </>
            )}
          </div>
        </div>
        
        {isEditing && (
             <Textarea 
                value={milestone.desc || ""} 
                onChange={e => onChange({...milestone, desc: e.target.value})} 
                className="text-xs bg-zinc-50 mb-2" 
                placeholder="Description..."
             />
        )}
        {!isEditing && milestone.desc && <p className="text-xs text-zinc-500 ml-6 line-clamp-2">{milestone.desc}</p>}
      </div>

      {/* Children Quests */}
      {isExpanded && milestone.quests && milestone.quests.length > 0 && (
        <div className="bg-zinc-50/50 p-3 pl-8 border-t border-zinc-100 space-y-3">
          {isChildrenBlocked && (
             <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mb-2">
                <AlertCircle className="w-3 h-3" />
                <span>Accept parent milestone first to enable quests.</span>
             </div>
          )}
          
          {milestone.quests.map((q, idx) => (
             <QuestCard 
                key={q.questId} 
                quest={q} 
                parentRealId={realId} // Pass the real ID so quest can link to it
                isDisabled={isChildrenBlocked}
                onChange={(updated) => handleUpdateChild(idx, updated)}
             />
          ))}
        </div>
      )}
    </div>
  );
}

// --- QUEST CARD ---
function QuestCard({ quest, parentRealId, isDisabled, onChange }: { 
    quest: ProposalQuest, 
    parentRealId: string | null, 
    isDisabled: boolean,
    onChange: (q: ProposalQuest) => void 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'ACCEPTED' | 'REJECTED'>('IDLE');
  const [realId, setRealId] = useState<string | null>(quest.operation === 'create' ? null : quest.questId);

  const handleAccept = async () => {
    if (!parentRealId && quest.operation === 'create') return; // Safety check
    setStatus('LOADING');
    try {
        if (quest.operation === 'create' && parentRealId) {
            const res = await createQuest(parentRealId, quest.title, quest.desc || "", (quest.difficulty as any) || "MEDIUM");
            if (res?.success && res.data) {
                setRealId(res.data.id);
                setStatus('ACCEPTED');
            }
        } else if (quest.operation === 'update') {
            await updateQuest(quest.questId, quest.title, quest.desc || "", (quest.difficulty as any) || "MEDIUM");
            setRealId(quest.questId);
            setStatus('ACCEPTED');
        } else if (quest.operation === 'delete') {
            await deleteQuest(quest.questId);
            setStatus('ACCEPTED');
        } else {
             setStatus('ACCEPTED');
             setRealId(quest.questId);
        }
    } catch (e) {
        console.error(e);
        setStatus('IDLE');
    }
  };
  
  const handleUpdateTask = (tIdx: number, updatedTask: ProposalTask) => {
    const newTasks = [...(quest.tasks || [])];
    newTasks[tIdx] = updatedTask;
    onChange({ ...quest, tasks: newTasks });
  };

  if (status === 'REJECTED') return null;

  const isTasksBlocked = quest.operation === 'create' && !realId;

  return (
    <div className={cn("border rounded-lg bg-white shadow-sm p-3 relative", isDisabled && "opacity-60 grayscale pointer-events-none")}>
       {/* Quest Header */}
       <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1">
             <Shield className="w-3 h-3 text-purple-500" />
             {isEditing ? (
               <Input value={quest.title} onChange={e => onChange({...quest, title: e.target.value})} className="h-6 text-xs" />
             ) : (
               <span className="text-sm font-medium text-zinc-800">{quest.title}</span>
             )}
          </div>
          
          <div className="flex items-center gap-1">
             {status === 'ACCEPTED' ? (
                 <CheckCircle2 className="w-4 h-4 text-green-600" />
             ) : (
                <>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(!isEditing)}>
                        <Edit2 className="w-3 h-3 text-zinc-400" />
                    </Button>
                    <Button size="icon" variant="default" className="h-6 w-6 bg-purple-600 hover:bg-purple-700" onClick={handleAccept} disabled={status === 'LOADING' || isDisabled}>
                        {status === 'LOADING' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </Button>
                </>
             )}
          </div>
       </div>

       {/* Children Tasks */}
       {quest.tasks && quest.tasks.length > 0 && (
         <div className="pl-6 space-y-2 mt-2 border-l-2 border-zinc-100 ml-1.5">
            {quest.tasks.map((t, idx) => (
               <TaskCard 
                  key={t.taskId} 
                  task={t} 
                  parentRealId={realId}
                  isDisabled={isTasksBlocked || isDisabled}
                  onChange={(updated) => handleUpdateTask(idx, updated)}
               />
            ))}
         </div>
       )}
    </div>
  );
}

// --- TASK CARD ---
function TaskCard({ task, parentRealId, isDisabled, onChange }: {
    task: ProposalTask,
    parentRealId: string | null,
    isDisabled: boolean,
    onChange: (t: ProposalTask) => void
}) {
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'ACCEPTED' | 'REJECTED'>('IDLE');

    const handleAccept = async () => {
        if (!parentRealId && task.operation === 'create') return;
        setStatus('LOADING');
        try {
            if (task.operation === 'create' && parentRealId) {
                await createTask(parentRealId, task.title);
                setStatus('ACCEPTED');
            } else if (task.operation === 'update') {
                await updateTask(task.taskId, task.title);
                setStatus('ACCEPTED');
            } else if (task.operation === 'delete') {
                await deleteTask(task.taskId);
                setStatus('ACCEPTED');
            }
        } catch (e) {
            console.error(e);
            setStatus('IDLE');
        }
    };

    if (status === 'REJECTED') return null;

    return (
        <div className={cn("flex items-center justify-between text-xs bg-zinc-50 p-2 rounded border border-zinc-100", (isDisabled || status === 'ACCEPTED') && "opacity-75")}>
            <span className="truncate flex-1">{task.title}</span>
            <div className="flex gap-1 ml-2">
                {status === 'ACCEPTED' ? (
                     <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : (
                    <>
                        <button className="text-zinc-400 hover:text-red-500" onClick={() => setStatus('REJECTED')} disabled={isDisabled}>
                            <X className="w-3 h-3" />
                        </button>
                        <button className="text-blue-500 hover:text-blue-700" onClick={handleAccept} disabled={status === 'LOADING' || isDisabled}>
                             {status === 'LOADING' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}