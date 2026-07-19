import time
import logging
from typing import Dict, Any, List
from app.agents.state import ResumePilotState
from app.services.ai_provider import GroqProvider

logger = logging.getLogger("app.agents.resume_architect")

async def resume_architect_agent(state: ResumePilotState) -> Dict[str, Any]:
    """Rewrites resume points into active, metrics-driven sentences using Groq."""
    start_time = time.time()
    logger.info("Resume Architect Agent executing...")
    
    # 1. Fetch profiles from state
    current_profile = state.get("CurrentProfile") or {}
    target_profile = state.get("TargetProfile") or {}
    target_role = target_profile.get("targetRole", "Software Engineer")
    
    api_key = state.get("api_key", "")
    model = state.get("model", "Llama 3.3 70B")
    
    # Defaults
    # Target-specific fallback suggestions
    target = target_role.lower()
    if "devops" in target or "sre" in target or "cloud" in target:
        revisions = [
            {
                "original": "Worked on deployment scripts and set up Docker.",
                "improved": "Automated multi-stage Docker builds and Helm packaging, accelerating release cycles by 40% on GKE.",
                "rationale": "Shows container orchestration proficiency and quantifies release metric improvements."
            },
            {
                "original": "Managed system servers and kept logs.",
                "improved": "Integrated Prometheus and Grafana dashboards, decreasing Mean Time to Resolution (MTTR) by 25%.",
                "rationale": "Replaces generic systems task description with observability and resolution metrics."
            }
        ]
    elif "ai" in target or "ml" in target or "machine" in target or "data" in target:
        revisions = [
            {
                "original": "Made some machine learning models and pandas pipelines.",
                "improved": "Engineered Scikit-Learn regression pipelines and PyTorch CNNs, improving classification accuracy by 15%.",
                "rationale": "Replaces vague words with specialized library references and clear evaluation metrics."
            },
            {
                "original": "Cleaned datasets and made plots.",
                "improved": "Developed automated Pandas profiling and data-cleaning functions, saving 12 hours of manual analysis per week.",
                "rationale": "Highlights quantifiable time-saving metrics and programming capabilities."
            }
        ]
    else:
        revisions = [
            {
                "original": "Helped the team build the React frontend and style the website.",
                "improved": "Collaborated on next-gen React architecture, reducing render latencies by 30% using Tailwind CSS & code-splitting.",
                "rationale": "Quantifies achievements and incorporates active verbs instead of passive phrasing."
            },
            {
                "original": "Worked on Python script optimization and handled docker container deployment.",
                "improved": "Engineered multi-stage Docker build automation, reducing container sizes by 45% and speeding up CI/CD pipeline builds.",
                "rationale": "Includes specific technical metrics and highlights Docker keyword density."
            }
        ]
    
    if api_key:
        try:
            # Query Groq to rewrite items
            provider = GroqProvider(api_key=api_key, model_name=model)
            raw_analysis = await provider.analyze_resume(current_profile, target_role)
            raw_revisions = raw_analysis.get("suggested_revisions", [])
            
            extracted_revisions = []
            for rev in raw_revisions:
                if isinstance(rev, dict) and "original" in rev and "improved" in rev:
                    extracted_revisions.append({
                        "original": rev.get("original", "").strip(),
                        "improved": rev.get("improved", "").strip(),
                        "rationale": rev.get("rationale", "").strip()
                    })
            if extracted_revisions:
                revisions = extracted_revisions
        except Exception as e:
            logger.error(f"Groq rewrite call failed: {str(e)}")
            
    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    timeline_log = {
        "agent": "Resume Architect",
        "status": "completed",
        "duration_ms": round(duration_ms, 2)
    }
    
    return {
        "current_agent": "Resume Architect",
        "completed_agents": state.get("completed_agents", []) + ["Resume Architect"],
        "execution_timeline": state.get("execution_timeline", []) + [timeline_log],
        "intermediate_results": {
            **state.get("intermediate_results", {}),
            "resume_architect": {
                "revisions": revisions
            }
        }
    }
