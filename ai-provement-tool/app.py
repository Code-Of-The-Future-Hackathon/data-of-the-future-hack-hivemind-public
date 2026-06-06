import os
import json
import base64
import io
import time
from typing import Optional, List, Tuple, Dict

from dotenv import load_dotenv
from fastapi import FastAPI, Form, HTTPException
from pydantic import BaseModel, ValidationError
import PIL.Image
from groq import Groq

# --- Environment and API Key Setup ---
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file")

groq_client = Groq(api_key=GROQ_API_KEY)

app = FastAPI()


# --- Configuration ---
BASE_DIR = os.path.dirname(__file__)


# --- Pydantic Models ---
class Task(BaseModel):
    id: int
    title: str
    description: Optional[str] = None

class AIResponse(BaseModel):
    is_completed: bool
    reason: str


# Simple in-memory cache for AI responses
CACHE_TTL_SECONDS = 20 * 60  # 20 minutes
# key: (task_id, user_comment, tuple(image_urls)) -> (timestamp, AIResponse)
_ai_cache: Dict[Tuple[int, str, Tuple[str, ...]], Tuple[float, "AIResponse"]] = {}

# --- AI Evaluation Logic ---
async def evaluate_task_completion(task: Task, image_urls: List[str], user_text: Optional[str]) -> AIResponse:
    """Use Groq vision model to decide if the task is completed based on task, one or more image URLs, and user text.

    Uses a simple in-memory cache keyed by (task.id, user_text, image_urls) with a 20 minute TTL
    to avoid repeated AI calls for identical inputs.
    """

    # Normalize inputs for cache key
    user_comment = user_text or ""
    key = (task.id, user_comment, tuple(image_urls))

    # Check cache
    now = time.time()
    cached = _ai_cache.get(key)
    if cached is not None:
        ts, cached_response = cached
        if now - ts < CACHE_TTL_SECONDS:
            print("Using cached AI response")
            return cached_response
        else:
            # Expired entry
            _ai_cache.pop(key, None)

    # Start building the message content with the instruction text
    content_parts = [
        {
            "type": "text",
            "text": (
                        "You are an AI judge for a productivity app. Your role is to determine "
                        "if a user has completed a SPECIFIC task based on the evidence they provide.\n\n"
                        f"Task Title: {task.title}\n"
                        f"Task Description: {task.description or 'No description provided.'}\n"
                        f"User comment (very important): {user_comment}\n\n"
                        "Judging rules:\n"
                        "1. Take the USER COMMENT very seriously. Use it to understand what the user actually did, "
                        "   clarify ambiguous details in the images, and decide how well the evidence matches the task.\n"
                        "2. Be LENIENT about the quality of the evidence: if the images and user comment are reasonably "
                        "   connected to the task and look like a genuine attempt, do not penalize small imperfections.\n"
                        "3. Be STRICT about the task itself: the action, object, or goal must match the task title/description.\n"
                        "   - If the task is to read a specific book (e.g. 'Harry Potter 2') and the evidence clearly shows "
                        "     a different book (e.g. 'Harry Potter 1'), then the task is NOT completed, even if the user comment "
                        "     describes reading.\n"
                        "   - If the task is to run 10km and the evidence shows some other workout that is clearly not a 10km run, "
                        "     then the task is NOT completed.\n"
                        "4. When the images are ambiguous, use the user comment as the deciding factor: if the comment is consistent "
                        "   with the task and the images, lean toward is_completed = true; if it conflicts with the task, use "
                        "   is_completed = false.\n"
                        "5. Only mark is_completed = true when the combined evidence from images AND user comment supports that THIS "
                        "   exact task was done. If you are unsure whether the exact task was completed, prefer is_completed = false.\n\n"
                        "Now analyze the images and user comment following these rules.\n"
                        "Respond in JSON format with fields: is_completed (boolean) and reason (string). "
                        "Only output JSON."
                    ),
        },
    ]

    # Add each image URL as a separate image_url content part
    for url in image_urls:
        content_parts.append({
            "type": "image_url",
            "image_url": {"url": url},
        })

    messages = [
        {
            "role": "user",
            "content": content_parts,
        }
    ]

    try:
        completion = groq_client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=messages,
            response_format={"type": "json_object"},
            max_completion_tokens=256,
        )

        content = completion.choices[0].message.content
        if isinstance(content, list):
            # OpenAI-style SDK often returns list of content parts
            text = "".join(part.get("text", "") for part in content if isinstance(part, dict))
        else:
            text = str(content)

        ai_data = json.loads(text)
        response_obj = AIResponse(**ai_data)
        # Store in cache
        _ai_cache[key] = (now, response_obj)
        return response_obj
    except (json.JSONDecodeError, ValidationError) as e:
        return AIResponse(
            is_completed=False,
            reason=f"AI evaluation failed. Could not parse model response. Error: {e}. Raw response: {text if 'text' in locals() else ''}",
        )
    except Exception as e:
        return AIResponse(
            is_completed=False,
            reason=f"AI API call failed. Error: {e}",
        )

# --- API Endpoints ---
@app.post("/evaluate", response_model=AIResponse)
async def evaluate(
    task: str = Form(..., description="Task object as JSON string"),
    image_urls: str = Form(..., description="JSON array of public URLs of the proof images"),
    user_text: Optional[str] = Form(None, description="Optional user explanation / notes"),
):
    """Evaluates whether a task is completed based on one or more image URLs and optional user text."""

    try:
        task_obj = Task(**json.loads(task))
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid task JSON: {exc}")

    # Parse and validate image URLs (expecting a JSON array of strings)
    try:
        urls = json.loads(image_urls)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image_urls JSON: {exc}")

    if not isinstance(urls, list) or not urls:
        raise HTTPException(status_code=400, detail="image_urls must be a non-empty JSON array of URLs.")

    normalized_urls = []
    for url in urls:
        if isinstance(url, str) and url.startswith("http"):
            normalized_urls.append(url)

    if not normalized_urls:
        raise HTTPException(status_code=400, detail="image_urls must contain at least one valid URL starting with http or https.")

    # Get AI evaluation
    ai_result = await evaluate_task_completion(task_obj, normalized_urls, user_text)

    return ai_result

