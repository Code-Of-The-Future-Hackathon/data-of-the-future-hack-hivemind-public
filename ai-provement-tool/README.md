[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/JWkIQuRe)

# AI Backend (FastAPI)

This repository now includes an AI microservice under `aiBackend/` that:
1. Loads an SPSS dataset (`easyshare_data.sav`) if present.
2. Performs simple relevance scoring across the entire dataset.
3. Calls Google Gemini (if `GEMINI_API_KEY` is configured) to generate feedback, quests, and top matches.
4. Exposes a REST endpoint for agent analysis.

## Folder Structure
```
aiBackend/
	app.py              # FastAPI application
	seed_db.py          # TinyDB seeder script
	quests_db.json      # (Ignored) TinyDB data store after seeding
	requirements.txt    # Python dependencies
	.env.example        # Environment variable template
```

## Setup
```powershell
cd aiBackend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # Then edit .env and set GEMINI_API_KEY
```

If you need SPSS support ensure `pyreadstat` installed (included in requirements).
Place your `easyshare_data.sav` file inside `aiBackend/` before starting for dataset loading.

## Seeding Dummy Users (TinyDB)
```powershell
venv\Scripts\activate
python seed_db.py
```
The file `quests_db.json` is ignored by git to avoid merge conflicts.

## Running the Server
```powershell
venv\Scripts\activate
uvicorn aiBackend.app:app --reload --port 8000
```
Visit: `http://localhost:8000/docs` for interactive Swagger UI.

## Streaming Milestones (SSE)
Endpoint: `POST /api/milestones/stream`

Send previously generated feedback JSON (from `/api/analyze-agent`) to receive a streamed sequence of milestone objects. Each Server-Sent Event chunk has the form:
```
data: {"milestone": {"code": "M1", "title": "Initial Analysis Generated", "achieved": 1, "description": "..."}}

data: {"milestone": { ... }}
...
data: {"bit_vector": "110010"}
data: [DONE]
```
Where `achieved` uses `1` for true and `0` for false. The final `bit_vector` concatenates all milestone achieved flags in order.

### Example PowerShell Call (Using curl)
```powershell
curl -N -H "Content-Type: application/json" -d '{"feedback": {"feedback_summary": "Agent shows strong alignment...", "agent_class": "innovator", "generated_quests": [{"title": "Build a prototype"}], "top_matches": [{"username": "DevOne"}, {"username": "DesignGuru"}]}}' http://localhost:8000/api/milestones/stream
```
(`-N` prevents curl from buffering so you see events live.)

### Integrating in Next.js
Use a fetch streaming reader (see provided SSE proxy pattern) or `EventSource` if you adapt the endpoint to `GET`.


## Analyze an Agent (Example Request)
```json
POST /api/analyze-agent
{
	"username": "TestUser",
	"age": 28,
	"interests": ["Python", "UI/UX"],
	"location": "Remote",
	"bio": "Exploring AI systems"
}
```

## Health Check
`GET /health` returns service status and dataset record count.

## Environment
Set `GEMINI_API_KEY` in `.env` to enable Gemini responses. Without it, the service responds with a fallback message.

## Notes
- `easyshare_data.sav` and `quests_db.json` are intentionally ignored.
- Scoring and matching logic are simplistic and can be extended.
- Increase `max_output_tokens` or adjust `temperature` in `app.py` for different AI behavior.

