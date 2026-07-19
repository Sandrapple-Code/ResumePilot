from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.history.history_models import KeywordAnalyticsItem

class ResumeRequest(BaseModel):
    target_role: str = Field(..., description="Target job description role, e.g. Senior Frontend Engineer")
    summary: Optional[str] = Field(None, description="Current professional summary in resume")
    skills: Optional[str] = Field(None, description="Comma-separated skills list")
    job_bullets: Optional[List[str]] = Field(default=[], description="Chronological bullet points under experience")
    upload_id: Optional[str] = Field(None, description="Uploaded file reference ID to retrieve cached parsed data")
    api_key: Optional[str] = Field(None, description="Saved Groq API Key context passed from client browser")
    model: Optional[str] = Field(None, description="Preferred AI model for conducting critique")
    job_description_raw: Optional[str] = Field(None, description="Pasted or parsed raw job description text")
    user_profile: Optional[Dict[str, Any]] = Field(None, description="Optional user profile details for career goal matching")

class ResumeAnalysis(BaseModel):
    score: int = Field(..., ge=0, le=100, description="ATS matching score out of 100")
    matching_skills: List[str] = Field(default=[], description="Skills parsed that match the target role requirements")
    missing_skills: List[str] = Field(default=[], description="Critical missing skills identified for target role")
    auxiliary_skills: List[str] = Field(default=[], description="Optional or supporting competencies detected")
    checklist: List[Dict[str, Any]] = Field(
        default=[],
        description="Detailed ATS formatting and keywords checklist, items contain title, desc, and status (pass/warn/fail)"
    )
    revisions: List[Dict[str, str]] = Field(
        default=[],
        description="Suggested text revisions, items contain original, improved, and rationale"
    )
    parsed_data: Optional[Dict[str, Any]] = Field(None, description="Parsed text segments extracted from the PDF resume")
    execution_timeline: Optional[List[Dict[str, Any]]] = Field(None, description="Sequential agent execution timeline logs")
    recommended_projects: Optional[List[Dict[str, Any]]] = Field(default=[], description="Enriched recommended project learning templates")
    job_match: Optional[Dict[str, Any]] = Field(default=None, description="Job Description Matching Agent comparison details")
    parsed_job_description: Optional[Dict[str, Any]] = Field(default=None, description="Extracted structured fields from job description")
    keyword_analytics: Optional[KeywordAnalyticsItem] = None

    # Separation Architecture keys
    current_profile: Optional[Dict[str, Any]] = None
    target_profile: Optional[Dict[str, Any]] = None
    gap_analysis: Optional[Dict[str, Any]] = None
    ats_analysis: Optional[Dict[str, Any]] = None
    career_roadmap: Optional[Dict[str, Any]] = None
    project_recommendations: Optional[Dict[str, Any]] = None
    career_report: Optional[Dict[str, Any]] = None


class ATSAnalysisContext(BaseModel):
    parsed_resume: Dict[str, Any] = Field(..., description="Parsed resume text segments")
    extracted_skills: List[str] = Field(default=[], description="Skills parsed from the resume")
    experience: List[Any] = Field(default=[], description="Candidate work experience")
    education: List[Any] = Field(default=[], description="Candidate education history")
    projects: List[Any] = Field(default=[], description="Candidate projects list")
    certifications: List[Any] = Field(default=[], description="Candidate certifications")
    target_role: str = Field(..., description="Target role name selected by user")
    job_description: Optional[str] = Field(None, description="Job description text compared against")
    required_skills: List[str] = Field(default=[], description="Required skills list")
    missing_skills: List[str] = Field(default=[], description="Missing skills list")
    matched_skills: List[str] = Field(default=[], description="Matched skills list")
    keyword_match: Dict[str, Any] = Field(default={}, description="Keyword analytics results")
    ats_score: int = Field(..., description="Unified ATS matching score out of 100")
    resume_health: Dict[str, Any] = Field(default={}, description="ATS checklist items status and summary")
    suggested_improvements: List[Dict[str, str]] = Field(default=[], description="Suggested text revisions")
    
    # Centrally held learning resources
    learning_roadmap: List[Dict[str, Any]] = Field(default=[], description="Milestones learning roadmap")
    recommended_projects: List[Dict[str, Any]] = Field(default=[], description="Projects learning templates")
    job_match_details: Optional[Dict[str, Any]] = Field(default=None, description="Job matching analytics")
    parsed_job_description: Optional[Dict[str, Any]] = Field(default=None, description="Extracted structured fields from job description")
    career_report: Optional[Dict[str, Any]] = Field(default=None, description="Full career report cache")


