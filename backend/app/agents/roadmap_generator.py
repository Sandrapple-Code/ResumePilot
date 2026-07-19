import time
import logging
from typing import Dict, Any, List
from app.agents.state import ResumePilotState

logger = logging.getLogger("app.agents.roadmap_generator")

async def roadmap_generator_agent(state: ResumePilotState) -> Dict[str, Any]:
    """Roadmap Generator Agent constructs a tailored step-by-step learning roadmap."""
    start_time = time.time()
    logger.info("Roadmap Generator Agent executing...")

    intermediate = state.get("intermediate_results", {})
    
    # 1. Fetch parameters from state
    current_profile = state.get("CurrentProfile") or {}
    target_profile = state.get("TargetProfile") or {}
    gap_analysis = state.get("GapAnalysis") or {}

    timeline = target_profile.get("timeline") or "6 Months"
    hours = target_profile.get("studyHours") or "15"

    # Convert hours string to numeric weight
    try:
        hours_num = int(hours.replace("+", ""))
    except:
        hours_num = 15

    # Determine duration scaler based on hours per week
    # e.g., 5h = 3.0x duration, 15h = 1.0x, 30h = 0.5x duration
    if hours_num <= 5:
        scaler = 3.0
    elif hours_num <= 10:
        scaler = 1.8
    elif hours_num <= 15:
        scaler = 1.0
    elif hours_num <= 20:
        scaler = 0.7
    else:
        scaler = 0.4

    # 2. Get Gap Analysis Results
    already_known = gap_analysis.get("known_skills", [])
    priority_order = gap_analysis.get("priority_skills", [])

    # Get career matrix details
    matrix = target_profile.get("matrix", {})
    learning_order = matrix.get("learning_order", [])

    # 3. Construct Learning Steps
    roadmap = []
    step_num = 1

    # Step A: Identify matching completed steps from matrix learning_order
    # If the user already knows core aspects, list them first as "completed"
    completed_topics = []
    for topic in learning_order[:2]: # Look at first couple learning order milestones
        # Check if they have skills in this topic
        matched_skills_in_topic = [s for s in already_known if s.lower() in topic.lower() or topic.lower() in s.lower()]
        if matched_skills_in_topic or len(already_known) > 5:
            completed_topics.append(topic)
            roadmap.append({
                "step": step_num,
                "topic": topic,
                "duration": "Completed",
                "details": [f"Demonstrated proficiency in: {', '.join(matched_skills_in_topic or already_known[:2])}"],
                "status": "completed"
            })
            step_num += 1

    # Step B: Create milestones for missing priority skills
    remaining_topics = [t for t in learning_order if t not in completed_topics]
    if not remaining_topics:
        # Fallback to general categories from priority_order
        remaining_topics = [f"Master {skill}" for skill in priority_order[:3]]

    # Add the current working milestone
    if remaining_topics:
        current_topic = remaining_topics[0]
        # Calculate dynamic duration
        weeks = max(2, round(4 * scaler))
        roadmap.append({
            "step": step_num,
            "topic": current_topic,
            "duration": f"{weeks} Weeks",
            "details": [f"Focus on acquiring core skills: {', '.join(priority_order[:3])}"],
            "status": "current"
        })
        step_num += 1

        # Add locked upcoming milestones
        for topic in remaining_topics[1:]:
            weeks = max(2, round(6 * scaler))
            roadmap.append({
                "step": step_num,
                "topic": topic,
                "duration": f"{weeks} Weeks",
                "details": [f"Deep dive into advanced concepts under {topic}."],
                "status": "locked"
            })
            step_num += 1

    # If the roadmap is too short, add a fallback project step
    if len(roadmap) < 3:
        roadmap.append({
            "step": step_num,
            "topic": "Capstone Portfolio Project",
            "duration": f"{max(2, round(4 * scaler))} Weeks",
            "details": ["Build and deploy an end-to-end project highlighting your new capabilities."],
            "status": "locked"
        })

    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    timeline_log = {
        "agent": "Roadmap Generator",
        "status": "completed",
        "duration_ms": round(duration_ms, 2)
    }

    return {
        "current_agent": "Roadmap Generator",
        "completed_agents": state.get("completed_agents", []) + ["Roadmap Generator"],
        "execution_timeline": state.get("execution_timeline", []) + [timeline_log],
        "CareerRoadmap": {
            "learning_roadmap": roadmap
        },
        "intermediate_results": {
            **state.get("intermediate_results", {}),
            "roadmap_generator": {
                "timeline": timeline,
                "study_hours": hours,
                "learning_roadmap": roadmap
            }
        }
    }
