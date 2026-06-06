import json
from typing import List, Dict

# Milestone generation based on AI feedback structure.
# Feedback schema expected:
# {
#   "feedback_summary": str,
#   "agent_class": str,
#   "generated_quests": [ {"title": str, ...} ],
#   "top_matches": [ {"username": str, ...} ]
# }

def compute_milestones(feedback: Dict) -> List[Dict]:
    """Derive milestone objects from feedback JSON.
    Each milestone contains:
      code: short identifier
      title: human readable
      achieved: 1 (true) or 0 (false)
      description: rationale
    """
    quests = feedback.get("generated_quests", []) or []
    matches = feedback.get("top_matches", []) or []
    agent_class = (feedback.get("agent_class") or "").lower()
    summary = feedback.get("feedback_summary") or ""

    milestones: List[Dict] = []

    def add(code: str, title: str, achieved_bool: bool, description: str):
        milestones.append({
            "code": code,
            "title": title,
            "achieved": 1 if achieved_bool else 0,
            "description": description
        })

    add("M1", "Initial Analysis Generated", bool(summary.strip()), "Feedback summary present indicates first pass analysis.")
    add("M2", "Agent Classified", agent_class not in {"", "unknown", "error"}, f"Agent class is '{agent_class or 'n/a'}'.")
    add("M3", "Quests Proposed", len(quests) >= 1, f"{len(quests)} quest(s) generated.")
    add("M4", "Matches Identified", len(matches) >= 2, f"{len(matches)} match candidates available.")
    add("M5", "Rich Feedback", len(summary) >= 120, f"Feedback length {len(summary)} chars (>=120 signals depth).")
    distinct_interests = set()
    for q in quests:
        for token in str(q.get("title", "")).split():
            distinct_interests.add(token.lower())
    add("M6", "Quest Diversity", len(distinct_interests) >= 4, f"Extracted {len(distinct_interests)} distinct tokens from quest titles.")

    return milestones

__all__ = ["compute_milestones"]
