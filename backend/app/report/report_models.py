from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class CandidateInfo(BaseModel):
    name: str = Field(..., description="Candidate name")
    email: Optional[str] = Field(None, description="Candidate email")
    phone: Optional[str] = Field(None, description="Candidate phone number")
    linkedin: Optional[str] = Field(None, description="Candidate LinkedIn profile")
    github: Optional[str] = Field(None, description="Candidate GitHub profile")

class CareerReport(BaseModel):
    candidate_info: CandidateInfo = Field(..., description="Personal details parsed from the resume")
    target_role: str = Field(..., description="Target role name")
    resume_summary: str = Field(..., description="Executive summary of the candidate's profile")
    
    # Analysis metrics
    overall_score: int = Field(..., description="Consolidated overall score out of 100")
    ats_score: int = Field(..., description="ATS keyword alignment score out of 100")
    job_match_score: Optional[int] = Field(None, description="Job match score out of 100 (if job description provided)")
    
    # Detailed feedback sections
    ats_analysis: List[Dict[str, Any]] = Field(default=[], description="ATS checklist items")
    skills_analysis: List[str] = Field(default=[], description="Skills parsed from the resume")
    missing_skills: List[str] = Field(default=[], description="Key missing skills required for target role")
    strengths: List[str] = Field(default=[], description="Identified strengths")
    weaknesses: List[str] = Field(default=[], description="Identified weaknesses")
    
    # Suggestions & Action plans
    project_recommendations: List[Dict[str, Any]] = Field(default=[], description="Projects to build to bridge gaps")
    learning_roadmap: List[Dict[str, Any]] = Field(default=[], description="Structured learning path")
    resume_rewrite_suggestions: List[Dict[str, str]] = Field(default=[], description="Suggested text revisions")
    job_match_analysis: Optional[Dict[str, Any]] = Field(None, description="Full job description matching details")
    
    # New Career Goal Separation fields
    current_skills: Optional[List[str]] = Field(default=[], description="Skills parsed from the resume")
    career_goal: Optional[str] = Field(None, description="Target career path goal")
    required_skills: Optional[List[str]] = Field(default=[], description="Skills required by target matrix")
    skill_gap: Optional[List[str]] = Field(default=[], description="Skills gaps between current and target")
    interview_prep: Optional[List[str]] = Field(default=[], description="Interview topics from target matrix")
    suggested_certifications: Optional[List[str]] = Field(default=[], description="Certifications suggested")
    estimated_readiness: Optional[int] = Field(None, description="Estimated career readiness percentage")
    industry_trends: Optional[List[str]] = Field(default=[], description="Industry trends for the target role")
    estimated_timeline: Optional[str] = Field(None, description="Estimated study timeline")
    
    parsed_data: Optional[Dict[str, Any]] = Field(default=None, description="Parsed text segments extracted from the PDF resume")
    
    # Metadata
    knowledge_sources_used: List[str] = Field(default=[], description="List of RAG guide references used")
    generated_timestamp: str = Field(..., description="ISO timestamp of report generation")
    report_version: str = Field("1.0.0", description="Version of the report format")
