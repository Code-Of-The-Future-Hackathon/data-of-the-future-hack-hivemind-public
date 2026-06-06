'use server'

import { prisma } from "@/lib/prisma"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export async function analyzeAgentAction(userId: string, userInput: string) {
  try {
    // 1. Fetch User Data from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        milestones: {
          include: {
            quests: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      throw new Error("User not found");
    }

    // 2. Transform DB data to Python Backend format
    // Python expects: { username, age, interests, location, bio, current_roadmap }
    const payload = {
      username: user.username || user.name || "User",
      dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0] || "Unknown", // Default if not set
      interests: user.interests ? user.interests.join(', ') : "",
      location: "Digital Nomad", // Placeholder as schema lacks location
      // Use the userInput as the immediate context/intent, fallback to DB bio
      bio: user.bio || "I want to improve my life.", 
      user_input: userInput,
      
      // Transform Roadmap
      current_roadmap: user.milestones.map(m => ({
        milestoneId: m.id,
        title: m.title,
        desc: m.description || "",
        quests: m.quests.map(q => ({
          questId: q.id,
          title: q.title,
          desc: q.description || "",
          tasks: q.tasks.map(t => ({
            taskId: t.id,
            title: t.content, // Python 'title' maps to Prisma 'content'
            desc: ""
          }))
        }))
      }))
    };

    // 3. Send to Python Backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/analyze-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend Error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return (async function* () {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        yield chunk;
      }
    })();

  } catch (error: any) {
    console.error('Server Action Error:', error);
    return (async function* () {
      yield `data: ${JSON.stringify({ error: error.message || "Unknown server error" })}\n\n[DONE]`;
    })();
  }
}