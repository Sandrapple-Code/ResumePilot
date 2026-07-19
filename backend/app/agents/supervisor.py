import time
import logging
from typing import Dict, Any
from app.agents.state import ResumePilotState

logger = logging.getLogger("app.agents.supervisor")

async def supervisor_agent(state: ResumePilotState) -> Dict[str, Any]:
    """Workflow Coordinator (Supervisor Agent) determines intent and tracks executed nodes."""
    start_time = time.time()
    logger.info("Supervisor Agent executing...")
    
    intent = state.get("intent", "Resume Analysis")
    completed = state.get("completed_agents", [])
    
    # Simple check on what to log next
    logger.info(f"Supervisor: Current Intent is '{intent}', Completed Agents: {completed}")
    
    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    timeline_log = {
        "agent": "Workflow Coordinator",
        "status": "completed",
        "duration_ms": round(duration_ms, 2)
    }
    
    return {
        "current_agent": "Workflow Coordinator",
        "completed_agents": state.get("completed_agents", []) + ["Workflow Coordinator"],
        "execution_timeline": state.get("execution_timeline", []) + [timeline_log]
    }
