import os
import json
import asyncio
import shutil
import random
from typing import List, Optional
from datetime import datetime

import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator # Changed: Added field_validator

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

# --- 2. DATASET LOADING & STATS ---
EASYSHARE_DF = None
DATASET_STATS = "Dataset not loaded."

def load_dataset():
    global EASYSHARE_DF, DATASET_STATS
    try:
        base_dir = os.path.dirname(__file__)
        sav_path = os.path.join(base_dir, 'easyshare_data.sav')

        if os.path.exists(sav_path):
            # Prefer SPSS if available (Hackathon requirement)
            EASYSHARE_DF = pd.read_spss(sav_path)
            print(f"Loaded SPSS Dataset: {len(EASYSHARE_DF)} records.")
            # Print columns to help map variables (e.g. age, gender)
            print(f"Columns found: {list(EASYSHARE_DF.columns)[:10]}...") 
        else:
            print("No dataset found. Proceeding with empty dataframe.")
            EASYSHARE_DF = pd.DataFrame()
            
        if not EASYSHARE_DF.empty:
            EASYSHARE_DF.columns = [c.lower() for c in EASYSHARE_DF.columns]

            # --- Label mappings (basic) ---
            label_map_sphus = {
                1: 'Excellent', 2: 'Very good', 3: 'Good', 4: 'Fair', 5: 'Poor'
            }
            label_map_br015 = {
                1: 'Daily', 2: 'More than once a week', 3: 'Once a week', 4: 'One to three times a month', 5: 'Hardly ever or never'
            }
            label_map_ep005 = {
                1: 'Employed', 2: 'Unemployed', 3: 'Retired', 4: 'Student', 5: 'Homemaker', 6: 'Disabled', 7: 'Other'
            }
            label_map_mar = {
                1: 'Married/Registered', 2: 'Separated', 3: 'Divorced', 4: 'Widowed', 5: 'Never married'
            }

            def apply_labels(series, mapping):
                try:
                    return series.map(lambda x: mapping.get(x, x))
                except Exception:
                    return series

            # Defensive conversions: always coerce, never raise
            try:
                if 'sphus' in EASYSHARE_DF.columns:
                    sphus_num = pd.to_numeric(EASYSHARE_DF['sphus'], errors='coerce')
                    EASYSHARE_DF['sphus_l'] = apply_labels(sphus_num, label_map_sphus)
            except Exception:
                pass

            try:
                if 'br015_' in EASYSHARE_DF.columns:
                    br_num = pd.to_numeric(EASYSHARE_DF['br015_'], errors='coerce')
                    EASYSHARE_DF['br015_l'] = apply_labels(br_num, label_map_br015)
            except Exception:
                pass

            try:
                if 'ep005_' in EASYSHARE_DF.columns:
                    ep_num = pd.to_numeric(EASYSHARE_DF['ep005_'], errors='coerce')
                    EASYSHARE_DF['ep005_l'] = apply_labels(ep_num, label_map_ep005)
            except Exception:
                pass

            try:
                if 'mar_stat' in EASYSHARE_DF.columns:
                    mar_num = pd.to_numeric(EASYSHARE_DF['mar_stat'], errors='coerce')
                    EASYSHARE_DF['mar_stat_l'] = apply_labels(mar_num, label_map_mar)
            except Exception:
                pass

            # --- Core stats ---
            total = len(EASYSHARE_DF)

            # Age metrics
            avg_age = 'N/A'
            age_bins_str = ''
            if 'age' in EASYSHARE_DF.columns:
                age_series = EASYSHARE_DF['age']
                if age_series.dtype.name == 'category':
                    age_series = age_series.astype(str)
                numeric_age = pd.to_numeric(age_series, errors='coerce')
                try:
                    avg_age = round(numeric_age.mean(), 1)
                except Exception:
                    pass
                # Histogram bins (broad view)
                bins = [0, 30, 40, 50, 60, 70, 80, 120]
                labels = ['<30', '30-39', '40-49', '50-59', '60-69', '70-79', '80+']
                age_binned = pd.cut(numeric_age, bins=bins, labels=labels, right=False)
                age_counts = age_binned.value_counts(normalize=True).sort_index()
                age_bins_str = ', '.join([f"{idx}: {val:.1%}" for idx, val in age_counts.items()])

            # Top locations (country/location)
            loc_counts = ''
            for col in ['location', 'country', 'birth_country']:
                if col in EASYSHARE_DF.columns:
                    top_locs = EASYSHARE_DF[col].value_counts().head(5).to_dict()
                    loc_counts = f"Top {col.title()}: {top_locs}"
                    break

            # Gender distribution
            gender_dist = ''
            if 'female' in EASYSHARE_DF.columns:
                g_counts = EASYSHARE_DF['female'].value_counts(normalize=True).to_dict()
                g_str = ', '.join([f"female={int(k)}: {v:.1%}" for k, v in g_counts.items()])
                gender_dist = f"Gender Split: {g_str}"

            # Health status
            health_dist = ''
            src = 'sphus_l' if 'sphus_l' in EASYSHARE_DF.columns else ('sphus' if 'sphus' in EASYSHARE_DF.columns else None)
            if src:
                h_counts = EASYSHARE_DF[src].value_counts(normalize=True).head(5).to_dict()
                h_str = ', '.join([f"{k}: {v:.1%}" for k, v in h_counts.items()])
                health_dist = f"Self-Perceived Health: {h_str}"

            # Activity frequency
            activity_dist = ''
            src = 'br015_l' if 'br015_l' in EASYSHARE_DF.columns else ('br015_' if 'br015_' in EASYSHARE_DF.columns else None)
            if src:
                a_counts = EASYSHARE_DF[src].value_counts(normalize=True).head(5).to_dict()
                a_str = ', '.join([f"{k}: {v:.1%}" for k, v in a_counts.items()])
                activity_dist = f"Vigorous Activity: {a_str}"

            # Employment
            emp_dist = ''
            src = 'ep005_l' if 'ep005_l' in EASYSHARE_DF.columns else ('ep005_' if 'ep005_' in EASYSHARE_DF.columns else None)
            if src:
                e_counts = EASYSHARE_DF[src].value_counts(normalize=True).head(5).to_dict()
                e_str = ', '.join([f"{k}: {v:.1%}" for k, v in e_counts.items()])
                emp_dist = f"Employment: {e_str}"

            # Smoking & BMI summaries
            smoking_rate = ''
            if 'ever_smoked' in EASYSHARE_DF.columns:
                sm_counts = EASYSHARE_DF['ever_smoked'].value_counts(normalize=True).to_dict()
                sm_str = ', '.join([f"ever_smoked={k}: {v:.1%}" for k, v in sm_counts.items()])
                smoking_rate = f"Smoking History: {sm_str}"

            bmi_summary = ''
            bmi_col = 'bmi'
            if bmi_col in EASYSHARE_DF.columns:
                bmi_numeric = pd.to_numeric(EASYSHARE_DF[bmi_col], errors='coerce')
                mean_bmi = bmi_numeric.mean()
                over_30 = (bmi_numeric >= 30).mean()
                bmi_summary = f"BMI Avg: {mean_bmi:.1f}, Obesity (BMI>=30): {over_30:.1%}"

            # CASP well-being
            casp_summary = ''
            if 'casp' in EASYSHARE_DF.columns:
                try:
                    casp_num = pd.to_numeric(EASYSHARE_DF['casp'], errors='coerce')
                    casp_summary = f"CASP Avg: {casp_num.mean():.1f}"
                except Exception:
                    pass

            # --- Insights ---
            insights = []
            # Health & Activity Insight
            if 'sphus_l' in EASYSHARE_DF.columns and 'br015_l' in EASYSHARE_DF.columns:
                healthy = EASYSHARE_DF[EASYSHARE_DF['sphus_l'].isin(['Excellent', 'Very good'])]
                if not healthy.empty:
                    active_counts = healthy['br015_l'].value_counts(normalize=True)
                    vigorous_pct = active_counts.get('More than once a week', 0) * 100
                    insights.append(f"Among those in excellent/very good health, {vigorous_pct:.1f}% exercise >1x/week.")
            # CASP by marital status
            if 'casp' in EASYSHARE_DF.columns and 'mar_stat_l' in EASYSHARE_DF.columns:
                try:
                    EASYSHARE_DF['casp_num'] = pd.to_numeric(EASYSHARE_DF['casp'], errors='coerce')
                    avg_casp = EASYSHARE_DF.groupby('mar_stat_l')['casp_num'].mean().sort_values(ascending=False)
                    if not avg_casp.empty:
                        best_status = avg_casp.index[0]
                        insights.append(f"Highest CASP average observed in: {best_status}.")
                except Exception:
                    pass
            # Smoking vs BMI (simple signal)
            if 'ever_smoked' in EASYSHARE_DF.columns and bmi_col in EASYSHARE_DF.columns:
                try:
                    bmi_numeric = pd.to_numeric(EASYSHARE_DF[bmi_col], errors='coerce')
                    grp = pd.DataFrame({'bmi': bmi_numeric, 'smoked': EASYSHARE_DF['ever_smoked']}).dropna()
                    if not grp.empty:
                        diff = grp.groupby('smoked')['bmi'].mean()
                        if set(diff.index) >= {0,1}:
                            delta = diff.get(1, float('nan')) - diff.get(0, float('nan'))
                            insights.append(f"Average BMI difference (ever smoked vs not): {delta:.1f}.")
                except Exception:
                    pass

            DATASET_INSIGHTS = "\n".join(insights)
            sections = [
                f"Total Records: {total}",
                f"Average Age: {avg_age}",
                (f"Age Bins: {age_bins_str}" if age_bins_str else None),
                (loc_counts or None),
                (gender_dist or None),
                (health_dist or None),
                (activity_dist or None),
                (emp_dist or None),
                (smoking_rate or None),
                (bmi_summary or None),
                (casp_summary or None),
            ]
            summary_lines = [s for s in sections if s]
            DATASET_STATS = "\n".join(summary_lines) + ("\n\nDATASET INSIGHTS\n" + DATASET_INSIGHTS if DATASET_INSIGHTS else "")
            
    except Exception as e:
        print(f"Error loading dataset: {e}")
        EASYSHARE_DF = pd.DataFrame()
        DATASET_STATS = f"Error loading data: {str(e)}"

@app.on_event("startup")
async def startup_event():
    load_dataset()

# --- 3. GOOGLE GEMINI CONFIGURATION ---
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

    GLOBAL DATASET STATS (EasyShare Data):
    {DATASET_STATS}
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

@app.post("/api/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        base_dir = os.path.dirname(__file__)
        file_location = ""
        
        if file.filename.endswith('.sav'):
            file_location = os.path.join(base_dir, 'easyshare_data.sav')
        else:
            return {"error": "Invalid file format. Please upload .sav"}
            
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        # Reload the dataset to apply changes immediately
        load_dataset()
        
        return {
            "message": f"File uploaded successfully: {file.filename}", 
            "stats": DATASET_STATS
        }
    except Exception as e:
        return {"error": str(e)}

# Run with: uvicorn aiBackend.app:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("aiBackend.app:app", host="0.0.0.0", port=8000, reload=True)