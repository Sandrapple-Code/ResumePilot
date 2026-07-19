from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ResumeHistoryEntry(BaseModel):
    version: int
    upload_id: str
    timestamp: str
    filename: str
    overall_score: int
    ats_score: int
    job_match_score: Optional[int] = None
    career_readiness_score: int
    target_role: str
    skills_snapshot: List[str]
    missing_skills: List[str]
    missing_keywords: List[str]
    suggested_projects: List[str]

class KeywordAnalyticsItem(BaseModel):
    matched: List[str]
    missing: List[str]
    duplicate: Dict[str, int]  # e.g., {"Python": 5}
    unused: List[str]
    coverage_percentage: float
    matched_count: int
    missing_count: int
    duplicate_count: int
    unused_count: int

class VersionComparison(BaseModel):
    v1_version: int
    v2_version: int
    
    # Core scores comparisons
    overall_score_diff: int
    overall_score_trend: str  # "improved", "declined", "unchanged"
    
    ats_score_diff: int
    ats_score_trend: str
    
    job_match_diff: Optional[int] = None
    job_match_trend: Optional[str] = None
    
    career_readiness_diff: int
    career_readiness_trend: str

    keyword_coverage_diff: float
    keyword_coverage_trend: str
    
    # Detailed section changes
    skills_added: List[str]
    skills_removed: List[str]
    keywords_resolved: List[str]
    projects_resolved: List[str]
    
    experience_trend: str
    experience_details: List[str]
    
    education_trend: str
    education_details: List[str]
    
    certifications_trend: str
    certifications_details: List[str]
