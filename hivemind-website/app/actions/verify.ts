'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { completeTaskAndAwardXP } from "./game"

export async function verifyTaskWithAI(
  taskId: string, 
  imageUrls: string[], 
  userComment: string
) {
  // 1. Fetch the Task details to send to AI
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, content: true } // We use 'content' as title
  })

  if (!task) return { error: "Task not found" }

  // 2. Prepare Form Data for FastAPI
  // The Python backend expects 'task' and 'image_urls' as JSON strings
  const formData = new FormData()
  
  // Construct the task object expected by Pydantic
  const taskPayload = JSON.stringify({
    id: 123, // Dummy ID for AI, doesn't matter
    title: task.content, 
    description: "User submitted proof for this task."
  })

  formData.append("task", taskPayload)
  formData.append("image_urls", JSON.stringify(imageUrls))
  formData.append("user_text", userComment)

  try {
    // 3. Call the Python AI Backend
    const response = await fetch("http://127.0.0.1:1234/evaluate", {
      method: "POST",
      body: formData,
      cache: "no-store"
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("AI Backend Error:", text)
      return { error: "AI Service unavailable or rejected request." }
    }

    const result = await response.json()

    // 4. Process Result
    if (result.is_completed) {

      await completeTaskAndAwardXP(taskId)
      
      revalidatePath("/dashboard")
      revalidatePath("/goals")
      return { success: true, reason: result.reason }
    } else {
      // AI Rejected
      return { success: false, reason: result.reason }
    }

  } catch (error) {
    console.error("Verification failed:", error)
    return { error: "Failed to connect to AI judge." }
  }
}