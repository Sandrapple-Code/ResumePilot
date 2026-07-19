import time
import logging
from typing import Dict, Any
from app.agents.state import ResumePilotState

logger = logging.getLogger("app.agents.report_agent")

async def report_agent(state: ResumePilotState) -> Dict[str, Any]:
    """Report Agent consolidates profile, gap, and ATS results into the final report payload."""
    start_time = time.time()
    logger.info("Report Agent executing...")
    
    intermediate = state.get("intermediate_results", {})
    
    # 1. Fetch parameters from new state keys
    current_profile = state.get("CurrentProfile") or {}
    target_profile = state.get("TargetProfile") or {}
    gap_analysis = state.get("GapAnalysis") or {}
    ats_analysis = state.get("ATSAnalysis") or {}
    career_roadmap = state.get("CareerRoadmap") or {}
    project_recommender_results = state.get("ProjectRecommendations") or {}

    score = ats_analysis.get("score", 75)
    matching_skills = ats_analysis.get("keyword_matching", {}).get("present_keywords", [])
    missing_skills = gap_analysis.get("missing_skills", [])
    weighted_readiness = gap_analysis.get("career_readiness", score)
    
    # 2. Fetch outputs from Resume Architect
    architect_results = intermediate.get("resume_architect", {})
    revisions = architect_results.get("revisions", [])
    
    # 3. Fetch outputs from Job Match Agent
    job_match_data = intermediate.get("job_match", {})
    job_match = job_match_data.get("job_match", None)
    parsed_jd = job_match_data.get("parsed_job_description", None)
    
    # Calculate strengths and weaknesses based on keyword matching
    strengths = [
        f"Solid alignment in key capabilities: {', '.join(matching_skills[:3])}.",
        "Chronological structure matches parsing templates accurately."
    ]
    if job_match:
        strengths.append(f"Successfully matched required skills for {job_match.get('role', 'target role')}.")
        
    weaknesses = []
    if missing_skills:
        weaknesses.append(f"Primary gaps in target capabilities: {', '.join(missing_skills[:3])}.")
    else:
        weaknesses.append("No critical skill gaps identified.")
    
    if job_match:
        missing_techs = job_match.get("missing_technologies", [])
        if missing_techs:
            weaknesses.append(f"Missing key job description technologies: {', '.join(missing_techs[:3])}.")
    else:
        weaknesses.append("Lack of metrics and quantitative achievements in experience bullets.")
    
    # 5. Generate Final Report
    final_report = {
        "score": score,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggested_revisions": revisions,
        "recommended_projects": project_recommender_results.get("recommendations", []),
        "learning_roadmap": career_roadmap.get("learning_roadmap", []),
        "next_steps": "1. Deploy suggested revisions into experience bullets. 2. Implement recommended projects to close gaps.",
        "job_match": job_match,
        "parsed_job_description": parsed_jd,
        
        # New Career Goal Separation fields
        "current_skills": current_profile.get("skills", []),
        "career_goal": target_profile.get("targetRole", "Software Engineer"),
        "required_skills": target_profile.get("matrix", {}).get("core_skills", []) + 
                           target_profile.get("matrix", {}).get("libraries", []) + 
                           target_profile.get("matrix", {}).get("frameworks", []),
        "skill_gap": missing_skills,
        "interview_prep": target_profile.get("matrix", {}).get("interview_topics", []),
        "suggested_certifications": target_profile.get("suggested_certifications", []),
        "estimated_readiness": weighted_readiness,
        "industry_trends": target_profile.get("industry_trends", []),
        "estimated_timeline": target_profile.get("timeline", "6 Months")
    }
    
    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    timeline_log = {
        "agent": "Report Agent",
        "status": "completed",
        "duration_ms": round(duration_ms, 2)
    }
    
    return {
        "current_agent": "Report Agent",
        "completed_agents": state.get("completed_agents", []) + ["Report Agent"],
        "execution_timeline": state.get("execution_timeline", []) + [timeline_log],
        "CareerReport": final_report,
        "final_report": final_report
    }
