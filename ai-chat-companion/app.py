import os
import json
import asyncio
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

try:
    import google.generativeai as genai
except ImportError:
    genai = None
    print("google-generativeai not installed. AI features disabled.")

# --- 1. SERVICE CONFIGURATION ---
# Trigger reload
app = FastAPI(title="AI Microservice - Quest & Match Engine")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. GOOGLE GEMINI CONFIGURATION ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
MODEL = None
if genai and GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        generation_config = {
            "temperature": 0.7,
            # Increased to allow larger JSON responses / analyses
            "max_output_tokens": 10000,
            "response_mime_type": "application/json",
        }
        MODEL = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=generation_config,
        )
        print("Gemini model initialized.")
    except Exception as e:
        print(f"Gemini init failed: {e}")
else:
    print("GEMINI_API_KEY not set or library missing. AI feedback will fallback.")

# --- 4. DATA MODELS ---
class TaskModel(BaseModel):
    taskId: str
    title: str
    desc: str = ""

class QuestModel(BaseModel):
    questId: str
    title: str
    desc: str = ""
    tasks: List[TaskModel] = []

class MilestoneModel(BaseModel):
    milestoneId: str
    title: str
    desc: str = ""
    quests: List[QuestModel] = []

class AgentProfile(BaseModel):
    username: str
    # CHANGED: age is now optional
    age: Optional[int] = None
    # ADDED: dateOfBirth string (expected format YYYY-MM-DD or ISO)
    dateOfBirth: Optional[str] = None
    
    interests: List[str] = []
    location: str
    bio: Optional[str] = "New agent"
    user_input: Optional[str] = None
    
    current_roadmap: List[MilestoneModel] = []
    points: int = 0
    experience_level: int = 1  # 1-10 scale
    wants: List[str] = []
    achievements: List[str] = []
    problems: List[str] = []

    # ADDED: Validator to handle string input for list fields
    @field_validator('interests', 'wants', 'achievements', 'problems', mode='before')
    @classmethod
    def parse_string_to_list(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            # Attempt to parse if it looks like a JSON list
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            # Otherwise, treat as comma-separated values
            return [item.strip() for item in v.split(',') if item.strip()]
        return v

class MilestoneRequest(BaseModel):
    feedback: dict  # Expect the feedback JSON produced previously

def format_sse(data: str) -> str:
    return f"data: {data}\n\n"

# --- 5. MATCHING LOGIC REMOVED ---
# User requested removal of candidate matching functionality.
# Only global dataset stats and insights are used now.

# --- 6. AI FEEDBACK GENERATION ---
async def generate_feedback_stream(agent: dict, relevant_matches: list):
    if not MODEL:
        yield format_sse(json.dumps({"error": "AI model unavailable"}))
        yield format_sse("[DONE]")
        return

    # Calculate age from dateOfBirth if age is missing
    if agent.get('age') is None and agent.get('dateOfBirth'):
        try:
            dob_str = agent.get('dateOfBirth')
            # Handle potential ISO format with time (e.g. 2000-01-01T00:00:00.000Z) by splitting
            if 'T' in dob_str:
                dob_str = dob_str.split('T')[0]
            
            dob = datetime.strptime(dob_str, "%Y-%m-%d")
            today = datetime.today()
            calculated_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            agent['age'] = calculated_age
        except Exception as e:
            print(f"Error calculating age from DOB: {e}")
            # Age remains None, AI will have to deal with it or use the string directly

    # Separate roadmap from profile for clearer prompting
    current_roadmap = agent.get('current_roadmap', [])
    agent_profile_only = {k:v for k,v in agent.items() if k != 'current_roadmap'}
    
    # Extract specific user query if present
    user_query = agent.get('user_input', '')
    query_context = ""
    if user_query:
        query_context = f"\nUSER'S CURRENT REQUEST/MESSAGE:\n\"{user_query}\"\n(Please prioritize answering this specific request in your message.)\n"

    prompt = f"""
    You are an AI Analyst for the 'Hivemind' system.
    {query_context}

    AGENT PROFILE:
    {json.dumps(agent_profile_only)}

    CURRENT ROADMAP (Existing Milestones/Quests/Tasks):
    {json.dumps(current_roadmap)}

      TASK:
      1. Analyze the profile and roadmap against the dataset stats.
      2. Produce a natural language "message" with your analysis and specific recommendations.
      3. Create/Update the roadmap in a NESTED JSON format.
         - If the user asks for a specific goal, generate a Milestone -> Quests -> Tasks tree for it.
         - IMPORTANT: Only include items that are being CREATED, UPDATED, or DELETED. Do NOT include existing items that are unchanged.
         - If modifying existing items, keep their IDs.
         - For NEW items, use temporary IDs (e.g., "new-m-1", "new-q-1").
         - Operations: "create", "update", "delete".

    OUTPUT FORMAT:
    Return a SINGLE valid JSON object.
    
    JSON Schema:
    {{
        "message": "String (Markdown supported)",
        "milestones": [
            {{
                "milestoneId": "String (Real ID or 'new-m-X')",
                "operation": "create | update | delete",
                "title": "String",
                "desc": "String",
                "quests": [
                    {{
                        "questId": "String (Real ID or 'new-q-X')",
                        "operation": "create | update | delete",
                        "title": "String",
                        "desc": "String",
                        "difficulty": "EASY | MEDIUM | HARD | EPIC",
                        "tasks": [
                            {{
                                "taskId": "String (Real ID or 'new-t-X')",
                                "operation": "create | update | delete",
                                "title": "String",
                                "desc": "String" 
                            }}
                        ]
                    }}
                ]
            }}
        ]
    }}
    """
    try:
        # Stream the response chunk by chunk
        response = await MODEL.generate_content_async(prompt, stream=True)
        
        async for chunk in response:
            if chunk.text:
                # Send raw text chunks of the JSON
                yield format_sse(json.dumps({"chunk": chunk.text}))
                # No sleep needed with async iterator, but keeping a tiny yield doesn't hurt
                await asyncio.sleep(0) 
        
        yield format_sse("[DONE]")
        
    except Exception as e:
        print(f"AI Error: {e}")
        yield format_sse(json.dumps({"error": str(e)}))
        yield format_sse("[DONE]")


@app.post("/api/analyze-agent")
async def analyze_agent(payload: AgentProfile):
    agent_data = payload.dict()
    # Candidate matching removed per user request
    relevant_context = []
    
    return StreamingResponse(
        generate_feedback_stream(agent_data, relevant_context),
        media_type="text/event-stream"
    )

@app.post("/api/milestones/stream")
async def milestones_stream(payload: MilestoneRequest):
    """Stream milestone generation as SSE events.
    Each chunk is a JSON object with a single milestone or final vector.
    """
    from .milestones import compute_milestones  # local import to avoid circular issues
    feedback = payload.feedback or {}
    milestones = compute_milestones(feedback)

    async def gen():
        try:
            for m in milestones:
                yield format_sse(json.dumps({"milestone": m}))
                await asyncio.sleep(0)
            bit_vector = "".join(str(m["achieved"]) for m in milestones)
            yield format_sse(json.dumps({"bit_vector": bit_vector}))
            yield format_sse("[DONE]")
        except Exception as e:
            yield format_sse(json.dumps({"error": str(e)}))
            yield format_sse("[DONE]")

    return StreamingResponse(gen(), media_type="text/event-stream")

@app.get("/health")
async def health():
    return {"status": "ok", "model_ready": bool(MODEL)}

# Run with: uvicorn aiBackend.app:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("aiBackend.app:app", host="0.0.0.0", port=8000, reload=True)