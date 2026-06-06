'use client'

import { useEffect, useState } from "react"
import { Trophy, Zap } from "lucide-react"
import { animate, motion, useMotionValue, useTransform } from "motion/react"
import { cn } from "@/lib/utils"

interface UserStatsProps {
  level: number
  score: number
}

export function UserStats({ level, score }: UserStatsProps) {
  // Initialize with the LAST known score if it exists, otherwise start at current
  const startScore = score
  
  // Motion value starts at the OLD score
  const count = useMotionValue(startScore)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  
  const [isPopping, setIsPopping] = useState(false)

  useEffect(() => {
    // If the score we received is different from what we are currently displaying
    if (score !== count.get()) {
      
      // 1. Trigger Visual Pop
      setIsPopping(true)
      const timeout = setTimeout(() => setIsPopping(false), 600)

      // 2. Animate from OLD -> NEW
      const controls = animate(count, score, { duration: 2, ease: "circOut" })


      return () => {
        clearTimeout(timeout)
        controls.stop()
      }
    } else {
    }
  }, [score, count])

  return (
    <div className="hidden md:flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1.5 shadow-sm overflow-hidden relative group">
      
      {/* Visual Flash Background */}
      <div 
        className={cn(
          "absolute inset-0 bg-green-200/50 transition-opacity duration-500 pointer-events-none",
          isPopping ? "opacity-100" : "opacity-0"
        )} 
      />

      {/* Level Section */}
      <div className="flex items-center gap-1.5 border-r border-zinc-200 pr-3 mr-3 relative z-10">
        <Trophy className="w-3.5 h-3.5 text-yellow-600" />
        <span className="text-xs font-bold text-zinc-700">Lvl {level}</span>
      </div>

      {/* XP Section with Animation */}
      <div className="flex items-center gap-1.5 relative z-10">
        <motion.div
            animate={isPopping ? { scale: [1, 1.5, 1], rotate: [0, 15, -15, 0] } : {}}
            transition={{ duration: 0.5 }}
        >
            <Zap className={cn(
                "w-3.5 h-3.5 transition-colors duration-300",
                isPopping ? "text-green-600 fill-green-600" : "text-blue-500"
            )} />
        </motion.div>
        
        <motion.span 
            className={cn(
                "text-xs font-medium min-w-[3ch] tabular-nums", // tabular-nums prevents jitter
                isPopping ? "text-green-700 font-bold" : "text-zinc-600"
            )}
        >
            {rounded}
        </motion.span> 
        <span className="text-xs font-medium text-zinc-600">XP</span>
      </div>
    </div>
  )
}