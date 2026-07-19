import time
import logging
from typing import Dict, Any, List
from app.agents.state import ResumePilotState

logger = logging.getLogger("app.agents.gap_analysis")

def match_skills(candidate_skills: List[str], target_list: List[str]) -> List[str]:
    """Helper to perform case-insensitive substring matching between lists."""
    matched = []
    for target in target_list:
        found = False
        target_lower = target.lower().strip()
        for cand in candidate_skills:
            cand_lower = cand.lower().strip()
            if target_lower in cand_lower or cand_lower in target_lower:
                found = True
                break
        if found:
            matched.append(target)
    return matched

async def gap_analysis_agent(state: ResumePilotState) -> Dict[str, Any]:
    """Performs true skill gap analysis: candidate skills vs target career path matrix."""
    start_time = time.time()
    logger.info("Gap Analysis Agent executing...")

    # 1. Fetch CurrentProfile and TargetProfile from state
    current_profile = state.get("CurrentProfile") or {}
    target_profile = state.get("TargetProfile") or {}

    candidate_skills = current_profile.get("skills", [])
    matrix = target_profile.get("matrix", {})

    core = matrix.get("core_skills", [])
    libraries = matrix.get("libraries", [])
    frameworks = matrix.get("frameworks", [])
    tools = matrix.get("tools", [])
    cloud = matrix.get("cloud", [])
    soft = matrix.get("soft_skills", [])

    # 2. Categorize Matches and Gaps
    matched_core = match_skills(candidate_skills, core)
    missing_core = [s for s in core if s not in matched_core]

    matched_libs = match_skills(candidate_skills, libraries)
    missing_libs = [s for s in libraries if s not in matched_libs]

    matched_fws = match_skills(candidate_skills, frameworks)
    missing_fws = [s for s in frameworks if s not in matched_fws]

    matched_tools = match_skills(candidate_skills, tools)
    missing_tools = [s for s in tools if s not in matched_tools]

    matched_cloud = match_skills(candidate_skills, cloud)
    missing_cloud = [s for s in cloud if s not in matched_cloud]

    matched_soft = match_skills(candidate_skills, soft)
    missing_soft = [s for s in soft if s not in matched_soft]

    # Combine results
    already_known = list(set(matched_core + matched_libs + matched_fws + matched_tools + matched_cloud + matched_soft))
    missing_skills = list(set(missing_core + missing_libs + missing_fws + missing_tools + missing_cloud + missing_soft))
    advanced_skills = list(set(libraries + frameworks + cloud))

    # Priority Order (Core skills first, then Frameworks, Libraries, Cloud, Tools)
    priority_order = []
    priority_order.extend(missing_core)
    priority_order.extend(missing_fws)
    priority_order.extend(missing_libs)
    priority_order.extend(missing_cloud)
    priority_order.extend(missing_tools)
    # Deduplicate priority order
    priority_order = list(dict.fromkeys(priority_order))

    # 3. Weighted Career Readiness Score Calculation (0-100)
    # Weights: Core=40%, Fws/Libs=30%, Cloud/Tools=20%, Soft=10%
    def calc_ratio_score(matched_list, full_list) -> float:
        if not full_list:
            return 1.0
        return len(matched_list) / len(full_list)

    core_score = calc_ratio_score(matched_core, core) * 40
    fw_lib_score = calc_ratio_score(matched_fws + matched_libs, frameworks + libraries) * 30
    cloud_tool_score = calc_ratio_score(matched_cloud + matched_tools, cloud + tools) * 20
    soft_score = calc_ratio_score(matched_soft, soft) * 10

    weighted_readiness = int(core_score + fw_lib_score + cloud_tool_score + soft_score)
    # Clamp score between 10 and 98 (always leave room for learning and keep it realistic)
    weighted_readiness = max(10, min(98, weighted_readiness))

    gap_analysis = {
        "known_skills": already_known,
        "missing_skills": missing_skills,
        "advanced_skills": advanced_skills,
        "priority_skills": priority_order,
        "confidence_score": weighted_readiness,
        "career_readiness": weighted_readiness,
        "skill_gap_percentage": int(100 - weighted_readiness),
        "learning_difficulty": target_profile.get("estimated_difficulty", "Medium")
    }

    # Calculate execution duration
    duration_ms = (time.time() - start_time) * 1000
    timeline_log = {
        "agent": "Gap Analysis Agent",
        "status": "completed",
        "duration_ms": round(duration_ms, 2)
    }

    return {
        "current_agent": "Gap Analysis Agent",
        "completed_agents": state.get("completed_agents", []) + ["Gap Analysis Agent"],
        "execution_timeline": state.get("execution_timeline", []) + [timeline_log],
        "GapAnalysis": gap_analysis,
        "intermediate_results": {
            **state.get("intermediate_results", {}),
            "gap_analysis": {
                "already_known": already_known,
                "missing_skills": missing_skills,
                "advanced_skills": advanced_skills,
                "priority_order": priority_order,
                "confidence_score": weighted_readiness
            }
        }
    }
