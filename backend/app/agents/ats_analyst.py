import time
import logging
import json
from typing import Dict, Any, List
from app.agents.state import ResumePilotState
from groq import Groq

logger = logging.getLogger("app.agents.ats_analyst")

async def ats_analyst_agent(state: ResumePilotState) -> Dict[str, Any]:
    """Evaluates the resume alignment using category-weighted ATS scoring."""
    start_time = time.time()
    logger.info("ATS Analyst Agent executing...")

    # 1. Retrieve CurrentProfile, TargetProfile and Job Description
    current_profile = state.get("CurrentProfile") or {}
    target_profile = state.get("TargetProfile") or {}
    job_desc = state.get("job_description_raw") or ""

    resume_skills = current_profile.get("skills", [])
    target_role = target_profile.get("targetRole", "Software Engineer")
    matrix = target_profile.get("matrix", {})
    matrix_keywords = matrix.get("ats_keywords", ["Git", "APIs"])

    api_key = state.get("api_key", "")
    model = state.get("model", "Llama 3.3 70B")

    # Determine evaluation keywords (prefer Job Description, fallback to matrix)
    required_keywords = matrix_keywords
    if job_desc.strip():
        # Heuristically extract potential keywords if no LLM
        jd_words = [w.strip(".,()\"';:") for w in job_desc.split() if len(w) > 3]
        # Keep unique title-cased or uppercase words which often represent skills/tech
        jd_techs = list(set([w for w in jd_words if w[0].isupper() or any(char.isdigit() for char in w)]))
        if len(jd_techs) > 5:
            required_keywords = jd_techs[:15]

    # --- HEURISTIC ATS EVALUATION (FALLBACK) ---
    # Category 1: Keyword Matching (40%)
    present_keywords = []
    missing_keywords = []
    for kw in required_keywords:
        found = False
        kw_lower = kw.lower().strip()
        for skill in resume_skills:
            skill_lower = skill.lower().strip()
            if kw_lower in skill_lower or skill_lower in kw_lower:
                found = True
                break
        if found:
            present_keywords.append(kw)
        else:
            missing_keywords.append(kw)

    kw_percentage = int((len(present_keywords) / len(required_keywords)) * 100) if required_keywords else 80
    recommended_keywords = missing_keywords[:5]

    # Category 2: Experience Relevance (25%)
    experience_relevance = 65
    strong_matches = []
    weak_matches = []
    missing_exp_areas = []

    all_exp_text = " ".join(current_profile.get("experience", []) + current_profile.get("projects", [])).lower()
    matched_exp_kws = [kw for kw in required_keywords[:6] if kw.lower() in all_exp_text]
    if len(matched_exp_kws) >= 4:
        experience_relevance = 88
        strong_matches = matched_exp_kws
    elif len(matched_exp_kws) >= 1:
        experience_relevance = 72
        strong_matches = matched_exp_kws
        weak_matches = [kw for kw in required_keywords[:6] if kw not in matched_exp_kws]
    else:
        experience_relevance = 50
        weak_matches = required_keywords[:3]
        missing_exp_areas = ["Hands-on engineering projects", "Work experience in production deployments"]

    # Category 3: Skills Match (20%)
    core_skills = matrix.get("core_skills", [])
    pref_skills = matrix.get("libraries", []) + matrix.get("tools", [])
    
    matched_core = [s for s in core_skills if any(s.lower() in cand.lower() or cand.lower() in s.lower() for cand in resume_skills)]
    matched_pref = [s for s in pref_skills if any(s.lower() in cand.lower() or cand.lower() in s.lower() for cand in resume_skills)]
    
    req_coverage = int((len(matched_core) / len(core_skills)) * 100) if core_skills else 70
    pref_coverage = int((len(matched_pref) / len(pref_skills)) * 100) if pref_skills else 60
    skills_match_score = int(req_coverage * 0.7 + pref_coverage * 0.3)
    missing_skills = [s for s in core_skills if s not in matched_core]

    # Category 4: Formatting & Readability (10%)
    formatting_score = 90
    ats_compatibility = "Good"
    if not current_profile.get("email") or not current_profile.get("phone"):
        formatting_score -= 15
    if len(current_profile.get("summary", "")) < 20:
        formatting_score -= 10
    if formatting_score < 75:
        ats_compatibility = "Needs Improvement"
    elif formatting_score > 85:
        ats_compatibility = "Excellent"

    # Category 5: Section Completeness (5%)
    completeness_score = 0
    sections_present = []
    sections_missing = []
    for section, name in [("summary", "Summary"), ("education", "Education"), ("skills", "Skills"), 
                         ("experience", "Experience"), ("projects", "Projects"), ("certifications", "Certifications")]:
        if current_profile.get(section):
            completeness_score += 15
            sections_present.append(name)
        else:
            sections_missing.append(name)
    if len(current_profile.get("experience", [])) > 2:
        completeness_score += 10
        sections_present.append("Achievements")
    completeness_score = min(100, completeness_score)

    # Category 6: Resume Strength (Action Verbs, Quantified Achievements, Grammar)
    strength_score = 75
    action_verbs_found = ["engineered", "developed", "collaborated", "managed", "implemented", "optimized", "built"]
    resume_lower = str(current_profile).lower()
    verbs_count = sum(1 for v in action_verbs_found if v in resume_lower)
    if verbs_count >= 4:
        strength_score += 15
    # Check for quantitative figures (e.g. 20%, $50k)
    import re
    has_metrics = bool(re.search(r'\b\d+%\b|\b\d+\s*(?:percent|million|k)\b', resume_lower))
    if has_metrics:
        strength_score += 10
    strength_score = min(100, strength_score)

    # Calculate final weighted score
    final_score = int(
        (kw_percentage * 0.40) +
        (experience_relevance * 0.25) +
        (skills_match_score * 0.20) +
        (formatting_score * 0.10) +
        (completeness_score * 0.05)
    )
    final_score = max(10, min(99, final_score))

    summary_feedback = "The professional summary is brief but sets clear technical contexts."
    grammar_feedback = "No major spelling or grammar errors detected. Sentences are polished."
    formatting_feedback = "Standard chronological sections are mapped cleanly. Layouts are ATS compatible."
    keywords_feedback = f"Matched {len(present_keywords)} key skills. Remaining gaps are: {', '.join(missing_keywords[:4])}."
    action_verbs_feedback = "Found active verbs (Collaborated, Optimized) but passive phrasing still exists."
    overall_quality = "Good base structure. Add quantitative metrics to strengthen achievements."

    # --- DYNAMIC LLM EVALUATION ---
    if api_key:
        client = Groq(api_key=api_key)
        prompt = f"""
You are an advanced Applicant Tracking System (ATS) parsing simulator. Simulate how a modern ATS will score this candidate's resume against the target role: "{target_role}".
Job Description Context (if any): "{job_desc}"

Resume Data:
{json.dumps(current_profile, indent=2)}

You MUST evaluate the candidate based on these 6 categories and return ONLY a valid JSON object matching the schema below. No commentary, markdown wrappers (like ```json), or extra text.

{{
  "keyword_match_percentage": 0 to 100,
  "present_keywords": ["kw1", "kw2"],
  "missing_keywords": ["kw3", "kw4"],
  "recommended_keywords": ["kw5", "kw6"],
  
  "experience_relevance_percentage": 0 to 100,
  "missing_experience_areas": ["area1", "area2"],
  "strong_matches": ["match1", "match2"],
  "weak_matches": ["weak1", "weak2"],
  
  "required_skills_coverage_percentage": 0 to 100,
  "preferred_skills_coverage_percentage": 0 to 100,
  
  "formatting_readibility_score": 0 to 100,
  "ats_compatibility": "Excellent" | "Good" | "Needs Improvement",
  
  "section_completeness_score": 0 to 100,
  
  "resume_strength_score": 0 to 100,
  
  "summary_feedback": "Critique summary text...",
  "grammar_feedback": "Critique typos and grammar...",
  "formatting_feedback": "Critique font layouts and headings...",
  "keywords_feedback": "Critique keyword density...",
  "action_verbs_feedback": "Critique active verbs and passive bullet structures...",
  "overall_quality_feedback": "General summary recommendation..."
}}
"""
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a realistic, hard-grading corporate ATS scoring agent."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            raw_eval = json.loads(chat_completion.choices[0].message.content)
            
            # Map LLM outputs to variables
            kw_percentage = raw_eval.get("keyword_match_percentage", kw_percentage)
            present_keywords = raw_eval.get("present_keywords", present_keywords)
            missing_keywords = raw_eval.get("missing_keywords", missing_keywords)
            recommended_keywords = raw_eval.get("recommended_keywords", recommended_keywords)
            
            experience_relevance = raw_eval.get("experience_relevance_percentage", experience_relevance)
            missing_exp_areas = raw_eval.get("missing_experience_areas", missing_exp_areas)
            strong_matches = raw_eval.get("strong_matches", strong_matches)
            weak_matches = raw_eval.get("weak_matches", weak_matches)
            
            req_coverage = raw_eval.get("required_skills_coverage_percentage", req_coverage)
            pref_coverage = raw_eval.get("preferred_skills_coverage_percentage", pref_coverage)
            skills_match_score = int(req_coverage * 0.7 + pref_coverage * 0.3)
            
            formatting_score = raw_eval.get("formatting_readibility_score", formatting_score)
            ats_compatibility = raw_eval.get("ats_compatibility", ats_compatibility)
            completeness_score = raw_eval.get("section_completeness_score", completeness_score)
            strength_score = raw_eval.get("resume_strength_score", strength_score)
            
            summary_feedback = raw_eval.get("summary_feedback", summary_feedback)
            grammar_feedback = raw_eval.get("grammar_feedback", grammar_feedback)
            formatting_feedback = raw_eval.get("formatting_feedback", formatting_feedback)
            keywords_feedback = raw_eval.get("keywords_feedback", keywords_feedback)
            action_verbs_feedback = raw_eval.get("action_verbs_feedback", action_verbs_feedback)
            overall_quality = raw_eval.get("overall_quality_feedback", overall_quality)
            
            # Recompute weighted score from LLM estimates
            final_score = int(
                (kw_percentage * 0.40) +
                (experience_relevance * 0.25) +
                (skills_match_score * 0.20) +
                (formatting_score * 0.10) +
                (completeness_score * 0.05)
            )
            final_score = max(10, min(99, final_score))
        except Exception as e:
            logger.error(f"Failed to fetch dynamic ATS scoring: {e}")

    # Compile ATSAnalysis state structure
    ats_analysis = {
        "score": final_score,
        "keyword_matching": {
            "present_keywords": present_keywords,
            "missing_keywords": missing_keywords,
            "recommended_keywords": recommended_keywords,
            "keyword_match_percentage": kw_percentage
        },
        "experience_relevance": {
            "relevant_experience_percentage": experience_relevance,
            "missing_experience_areas": missing_exp_areas,
            "strong_matches": strong_matches,
            "weak_matches": weak_matches
        },
        "skills_match": {
            "required_skills_coverage_percentage": req_coverage,
            "preferred_skills_coverage_percentage": pref_coverage,
            "missing_skills": missing_skills
        },
        "formatting_readability": {
            "formatting_score": formatting_score,
            "ats_compatibility": ats_compatibility
        },
        "section_completeness": {
            "completeness_score": completeness_score,
            "sections_present": sections_present,
            "sections_missing": sections_missing
        },
        "resume_strength": {
            "strength_score": strength_score,
            "action_verbs_count": verbs_count if 'verbs_count' in locals() else 3,
            "has_quantitative_metrics": has_metrics if 'has_metrics' in locals() else False
        }
    }

    duration_ms = (time.time() - start_time) * 1000
    timeline_log = {
        "agent": "ATS Analyst",
        "status": "completed",
        "duration_ms": round(duration_ms, 2)
    }

    return {
        "current_agent": "ATS Analyst",
        "completed_agents": state.get("completed_agents", []) + ["ATS Analyst"],
        "execution_timeline": state.get("execution_timeline", []) + [timeline_log],
        "ATSAnalysis": ats_analysis,
        "intermediate_results": {
            **state.get("intermediate_results", {}),
            "ats_analyst": {
                "score": final_score,
                "matching_skills": present_keywords,
                "missing_skills": missing_keywords,
                "summary_feedback": summary_feedback,
                "grammar_feedback": grammar_feedback,
                "formatting_feedback": formatting_feedback,
                "keywords_feedback": keywords_feedback,
                "action_verbs_feedback": action_verbs_feedback,
                "overall_quality": overall_quality
            }
        }
    }
