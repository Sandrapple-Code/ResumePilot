import logging
from langgraph.graph import StateGraph, END
from app.agents.state import ResumePilotState
from app.agents.supervisor import supervisor_agent
from app.agents.document_intelligence import document_intelligence_agent
from app.agents.ats_analyst import ats_analyst_agent
from app.agents.knowledge_agent import knowledge_agent
from app.agents.resume_architect import resume_architect_agent
from app.agents.project_recommender import project_recommender_agent
from app.agents.report_agent import report_agent
from app.agents.job_match_agent import job_match_agent
from app.agents.career_goal_agent import career_goal_agent
from app.agents.gap_analysis import gap_analysis_agent
from app.agents.roadmap_generator import roadmap_generator_agent

logger = logging.getLogger("app.agents.graph")

def supervisor_router(state: ResumePilotState) -> str:
    """Conditional routing function determining which agent to call next based on intent."""
    intent = state.get("intent", "Resume Analysis")
    completed = state.get("completed_agents", [])
    
    # 1. Ask Pilo Chat Intent
    if intent == "Ask Pilo Chat":
        if "Knowledge Agent" not in completed:
            return "knowledge_agent"
        return END

    # For other intents, we run document normalization first
    if "Document Intelligence" not in completed:
        return "document_intelligence"

    # Next run career goal mapping
    if "Career Goal Agent" not in completed:
        return "career_goal_agent"

    # 2. Resume Analysis / Skills Analysis / Job Match Intents
    if intent in ["Resume Analysis", "Skills Analysis", "Job Match"]:
        if "ATS Analyst" not in completed:
            return "ats_analyst"
        if (state.get("job_description_raw") or intent == "Job Match") and "Job Match" not in completed:
            return "job_match"
        if "Gap Analysis Agent" not in completed:
            return "gap_analysis"
        if "Resume Architect" not in completed:
            return "resume_architect"
        if "Project Recommender" not in completed:
            return "project_recommender"
        if "Roadmap Generator" not in completed:
            return "roadmap_generator"
        if "Report Agent" not in completed:
            return "report_agent"
        return END

    # 3. Resume Rewrite Intent
    if intent == "Resume Rewrite":
        if "Resume Architect" not in completed:
            return "resume_architect"
        if "Report Agent" not in completed:
            return "report_agent"
        return END

    # 4. Project Recommendation Intent
    if intent == "Project Recommendation":
        if "Gap Analysis Agent" not in completed:
            return "gap_analysis"
        if "Project Recommender" not in completed:
            return "project_recommender"
        if "Report Agent" not in completed:
            return "report_agent"
        return END

    # 5. Fallback Default: Analysis
    if "Report Agent" not in completed:
        return "report_agent"
    return END


# Build StateGraph
workflow = StateGraph(ResumePilotState)

# Add Node mapping
workflow.add_node("supervisor", supervisor_agent)
workflow.add_node("document_intelligence", document_intelligence_agent)
workflow.add_node("ats_analyst", ats_analyst_agent)
workflow.add_node("knowledge_agent", knowledge_agent)
workflow.add_node("resume_architect", resume_architect_agent)
workflow.add_node("project_recommender", project_recommender_agent)
workflow.add_node("report_agent", report_agent)
workflow.add_node("job_match", job_match_agent)
workflow.add_node("career_goal_agent", career_goal_agent)
workflow.add_node("gap_analysis", gap_analysis_agent)
workflow.add_node("roadmap_generator", roadmap_generator_agent)

# Set Entry Point
workflow.set_entry_point("supervisor")

# Configure Dynamic Routing from Supervisor Coordinator
workflow.add_conditional_edges(
    "supervisor",
    supervisor_router,
    {
        "document_intelligence": "document_intelligence",
        "career_goal_agent": "career_goal_agent",
        "ats_analyst": "ats_analyst",
        "knowledge_agent": "knowledge_agent",
        "resume_architect": "resume_architect",
        "project_recommender": "project_recommender",
        "report_agent": "report_agent",
        "job_match": "job_match",
        "gap_analysis": "gap_analysis",
        "roadmap_generator": "roadmap_generator",
        "__end__": END
    }
)

# Set returns from workers back to Supervisor Coordinator
workflow.add_edge("document_intelligence", "supervisor")
workflow.add_edge("career_goal_agent", "supervisor")
workflow.add_edge("ats_analyst", "supervisor")
workflow.add_edge("knowledge_agent", "supervisor")
workflow.add_edge("resume_architect", "supervisor")
workflow.add_edge("project_recommender", "supervisor")
workflow.add_edge("report_agent", "supervisor")
workflow.add_edge("job_match", "supervisor")
workflow.add_edge("gap_analysis", "supervisor")
workflow.add_edge("roadmap_generator", "supervisor")

# Compile
app_graph = workflow.compile()
