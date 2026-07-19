from typing import Dict, Any, List, Optional, TypedDict

class ResumePilotState(TypedDict):
    """Shared state structure for the ResumePilot multi-agent LangGraph workflow."""
    intent: str
    upload_id: Optional[str]
    parsed_resume: Dict[str, Any]
    target_role: str
    api_key: str
    model: str
    
    current_agent: str
    completed_agents: List[str]
    history: List[Dict[str, Any]]
    
    intermediate_results: Dict[str, Any]
    final_report: Dict[str, Any]
    execution_timeline: List[Dict[str, Any]]
    job_description_raw: Optional[str]
    user_profile: Optional[Dict[str, Any]]
    
    # Separation Architecture Keys
    CurrentProfile: Optional[Dict[str, Any]]
    TargetProfile: Optional[Dict[str, Any]]
    GapAnalysis: Optional[Dict[str, Any]]
    ATSAnalysis: Optional[Dict[str, Any]]
    CareerRoadmap: Optional[Dict[str, Any]]
    ProjectRecommendations: Optional[Dict[str, Any]]
    KeywordAnalytics: Optional[Dict[str, Any]]
    JobMatch: Optional[Dict[str, Any]]
    CareerReport: Optional[Dict[str, Any]]
