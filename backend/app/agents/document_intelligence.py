import time
import logging
from typing import Dict, Any
from app.agents.state import ResumePilotState

logger = logging.getLogger("app.agents.document_intelligence")

async def document_intelligence_agent(state: ResumePilotState) -> Dict[str, Any]:
    """Validates and normalizes parsed resume JSON structure to prepare document context."""
    start_time = time.time()
    logger.info("Document Intelligence Agent executing...")
    
    parsed = state.get("parsed_resume", {})
    
    # 1. Normalize sections, ensuring all required lists exist
    normalized = {
        "name": parsed.get("name", "").strip(),
        "email": parsed.get("email", "").strip(),
        "phone": parsed.get("phone", "").strip(),
        "linkedin": parsed.get("linkedin", "").strip(),
        "github": parsed.get("github", "").strip(),
        "summary": parsed.get("summary", "").strip(),
        "skills": [s.strip() for s in parsed.get("skills", []) if s.strip()],
        "education": [e.strip() for e in parsed.get("education", []) if e.strip()],
        "experience": [exp.strip() for exp in parsed.get("experience", []) if exp.strip()],
        "projects": [p.strip() for p in parsed.get("projects", []) if p.strip()],
        "certifications": [c.strip() for c in parsed.get("certifications", []) if c.strip()]
    }
    
    # 2. Separate soft skills and technologies
    soft_keywords = ["communication", "leadership", "problem solving", "collaboration", "agile", "scrum", 
                     "adaptability", "teamwork", "organization", "critical thinking", "creativity", 
                     "time management", "conflict resolution", "negotiation", "empathy", "interpersonal", "presentation"]
    
    soft_skills = []
    technologies = []
    for skill in normalized["skills"]:
        skill_lower = skill.lower()
        if any(keyword in skill_lower for keyword in soft_keywords):
            soft_skills.append(skill)
        else:
            technologies.append(skill)

    current_profile = {
        "name": normalized["name"],
        "email": normalized["email"],
        "phone": normalized["phone"],
        "linkedin": normalized["linkedin"],
        "github": normalized["github"],
        "summary": normalized["summary"],
        "skills": normalized["skills"],
        "education": normalized["education"],
        "experience": normalized["experience"],
        "projects": normalized["projects"],
        "certifications": normalized["certifications"],
        "technologies": technologies,
        "soft_skills": soft_skills
    }

    # 3. Detect missing structural sections
    missing_sections = []
    for section in ["summary", "skills", "experience", "education"]:
        if not normalized[section]:
            missing_sections.append(section)
            
    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    timeline_log = {
        "agent": "Document Intelligence",
        "status": "completed",
        "duration_ms": round(duration_ms, 2)
    }
    
    # Return state updates
    return {
        "current_agent": "Document Intelligence",
        "completed_agents": state.get("completed_agents", []) + ["Document Intelligence"],
        "execution_timeline": state.get("execution_timeline", []) + [timeline_log],
        "CurrentProfile": current_profile,
        "intermediate_results": {
            **state.get("intermediate_results", {}),
            "document_intelligence": {
                "normalized_resume": normalized,
                "missing_sections": missing_sections,
                "valid": True
            }
        }
    }
