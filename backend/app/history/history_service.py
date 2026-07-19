import os
import json
import logging
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.config import settings
from app.history.history_models import ResumeHistoryEntry, VersionComparison, KeywordAnalyticsItem
from app.history.history_repository import HistoryRepository
from app.history.keyword_engine import analyze_keywords

logger = logging.getLogger("app.history.service")

class HistoryService:
    def __init__(self, repository: Optional[HistoryRepository] = None, uid: Optional[str] = None):
        if repository:
            self.repository = repository
        elif uid:
            self.repository = HistoryRepository(filepath=os.path.join(settings.UPLOAD_DIR, uid, "history.json"))
        else:
            self.repository = HistoryRepository()

    def get_all_entries(self) -> List[ResumeHistoryEntry]:
        """Retrieves all version history entries."""
        raw_entries = self.repository.get_all()
        return [ResumeHistoryEntry.model_validate(entry) for entry in raw_entries]

    def get_all_entries_for_user(self, uid: str) -> List[ResumeHistoryEntry]:
        """Retrieves all version history entries for a specific user from Firestore."""
        from app.firebase.firestore_service import get_all_resumes_for_user
        raw_entries = get_all_resumes_for_user(uid)
        return [ResumeHistoryEntry.model_validate(entry) for entry in raw_entries]

    def clear_history(self) -> None:
        """Clears all version history entries."""
        self.repository.clear()

    def clear_history_for_user(self, uid: str) -> None:
        """Clears all version history entries for a user from Firestore."""
        from app.firebase.firestore_service import clear_resumes_for_user
        clear_resumes_for_user(uid)

    def add_entry(
        self,
        upload_id: str,
        target_role: str,
        overall_score: int,
        ats_score: int,
        job_match_score: Optional[int],
        career_readiness_score: int,
        skills_snapshot: List[str],
        missing_skills: List[str],
        missing_keywords: List[str],
        suggested_projects: List[str],
        filename: Optional[str] = None
    ) -> ResumeHistoryEntry:
        """Adds a new resume version history entry (legacy mock version)."""
        entries = self.get_all_entries()
        existing_entry = None
        for e in entries:
            if e.upload_id == upload_id and e.target_role == target_role:
                existing_entry = e
                break

        if existing_entry:
            existing_entry.overall_score = overall_score
            existing_entry.ats_score = ats_score
            existing_entry.job_match_score = job_match_score
            existing_entry.career_readiness_score = career_readiness_score
            existing_entry.skills_snapshot = skills_snapshot
            existing_entry.missing_skills = missing_skills
            existing_entry.missing_keywords = missing_keywords
            existing_entry.suggested_projects = suggested_projects
            existing_entry.timestamp = datetime.utcnow().isoformat() + "Z"
            if filename:
                existing_entry.filename = filename
            self.repository.save_all([e.model_dump() for e in entries])
            return existing_entry

        next_version = len(entries) + 1
        if not filename:
            meta_path = os.path.join(settings.UPLOAD_DIR, f"{upload_id}_meta.json")
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                        filename = meta.get("filename")
                except Exception as e:
                    logger.error(f"Error reading upload metadata: {str(e)}")
            if not filename:
                filename = f"Resume_V{next_version}.pdf"

        new_entry = ResumeHistoryEntry(
            version=next_version,
            upload_id=upload_id,
            timestamp=datetime.utcnow().isoformat() + "Z",
            filename=filename,
            overall_score=overall_score,
            ats_score=ats_score,
            job_match_score=job_match_score,
            career_readiness_score=career_readiness_score,
            target_role=target_role,
            skills_snapshot=skills_snapshot,
            missing_skills=missing_skills,
            missing_keywords=missing_keywords,
            suggested_projects=suggested_projects
        )
        self.repository.add(new_entry.model_dump())
        return new_entry

    def add_entry_for_user(
        self,
        uid: str,
        upload_id: str,
        target_role: str,
        overall_score: int,
        ats_score: int,
        job_match_score: Optional[int],
        career_readiness_score: int,
        skills_snapshot: List[str],
        missing_skills: List[str],
        missing_keywords: List[str],
        suggested_projects: List[str],
        filename: Optional[str] = None
    ) -> ResumeHistoryEntry:
        """Adds a new resume version history entry for a user to Firestore."""
        from app.firebase.firestore_service import save_resume_version
        
        entries = self.get_all_entries_for_user(uid)
        existing_entry = None
        for e in entries:
            if e.upload_id == upload_id and e.target_role == target_role:
                existing_entry = e
                break

        if existing_entry:
            existing_entry.overall_score = overall_score
            existing_entry.ats_score = ats_score
            existing_entry.job_match_score = job_match_score
            existing_entry.career_readiness_score = career_readiness_score
            existing_entry.skills_snapshot = skills_snapshot
            existing_entry.missing_skills = missing_skills
            existing_entry.missing_keywords = missing_keywords
            existing_entry.suggested_projects = suggested_projects
            existing_entry.timestamp = datetime.utcnow().isoformat() + "Z"
            if filename:
                existing_entry.filename = filename
            save_resume_version(uid, existing_entry.model_dump())
            return existing_entry

        next_version = len(entries) + 1
        if not filename:
            meta_path = os.path.join(settings.UPLOAD_DIR, uid, f"{upload_id}_meta.json")
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                        filename = meta.get("filename")
                except Exception as e:
                    logger.error(f"Error reading upload metadata: {str(e)}")
            if not filename:
                filename = f"Resume_V{next_version}.pdf"

        new_entry = ResumeHistoryEntry(
            version=next_version,
            upload_id=upload_id,
            timestamp=datetime.utcnow().isoformat() + "Z",
            filename=filename,
            overall_score=overall_score,
            ats_score=ats_score,
            job_match_score=job_match_score,
            career_readiness_score=career_readiness_score,
            target_role=target_role,
            skills_snapshot=skills_snapshot,
            missing_skills=missing_skills,
            missing_keywords=missing_keywords,
            suggested_projects=suggested_projects
        )
        save_resume_version(uid, new_entry.model_dump())
        
        if uid == "mock-uid":
            try:
                self.repository.add(new_entry.model_dump())
            except Exception:
                pass
        return new_entry

    def _get_parsed_resume(self, upload_id: str, uid: Optional[str] = None) -> Dict[str, Any]:
        """Helper to get parsed resume from upload_id JSON cache."""
        if uid:
            path = os.path.join(settings.UPLOAD_DIR, uid, f"{upload_id}.json")
        else:
            path = os.path.join(settings.UPLOAD_DIR, f"{upload_id}.json")
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load parsed resume JSON: {str(e)}")
        return {}

    def compare_versions(self, v1_num: int, v2_num: int, uid: Optional[str] = None) -> Optional[VersionComparison]:
        """Compares two resume versions and calculates differences and trends."""
        if uid:
            entries = self.get_all_entries_for_user(uid)
        else:
            entries = self.get_all_entries()
        entry_map = {e.version: e for e in entries}

        if v1_num not in entry_map or v2_num not in entry_map:
            logger.warning(f"Could not find versions {v1_num} or {v2_num} for comparison.")
            return None

        v1 = entry_map[v1_num]
        v2 = entry_map[v2_num]

        # Calculate scores differences
        overall_diff = v2.overall_score - v1.overall_score
        overall_trend = "improved" if overall_diff > 0 else ("declined" if overall_diff < 0 else "unchanged")

        ats_diff = v2.ats_score - v1.ats_score
        ats_trend = "improved" if ats_diff > 0 else ("declined" if ats_diff < 0 else "unchanged")

        job_match_diff = None
        job_match_trend = None
        if v1.job_match_score is not None and v2.job_match_score is not None:
            job_match_diff = v2.job_match_score - v1.job_match_score
            job_match_trend = "improved" if job_match_diff > 0 else ("declined" if job_match_diff < 0 else "unchanged")
        elif v1.job_match_score is None and v2.job_match_score is not None:
            job_match_diff = v2.job_match_score
            job_match_trend = "improved"
        elif v1.job_match_score is not None and v2.job_match_score is None:
            job_match_diff = -v1.job_match_score
            job_match_trend = "declined"

        readiness_diff = v2.career_readiness_score - v1.career_readiness_score
        readiness_trend = "improved" if readiness_diff > 0 else ("declined" if readiness_diff < 0 else "unchanged")

        # Extract parsed resume contents for detailed comparisons
        resume1 = self._get_parsed_resume(v1.upload_id, uid)
        resume2 = self._get_parsed_resume(v2.upload_id, uid)

        # Keyword Coverage comparisons
        kw_analysis1 = analyze_keywords(resume1, v1.target_role)
        kw_analysis2 = analyze_keywords(resume2, v2.target_role)
        
        cov1 = kw_analysis1.get("coverage_percentage", 0.0)
        cov2 = kw_analysis2.get("coverage_percentage", 0.0)
        cov_diff = round(cov2 - cov1, 1)
        cov_trend = "improved" if cov_diff > 0 else ("declined" if cov_diff < 0 else "unchanged")

        # Skills comparison
        skills1 = set(v1.skills_snapshot)
        skills2 = set(v2.skills_snapshot)
        skills_added = sorted(list(skills2 - skills1))
        skills_removed = sorted(list(skills1 - skills2))

        # Missing keywords resolved
        keywords1 = set(v1.missing_keywords)
        keywords2 = set(v2.missing_keywords)
        keywords_resolved = sorted(list(keywords1 - keywords2))

        # Suggested projects resolved
        projects1 = set(v1.suggested_projects)
        projects2 = set(v2.suggested_projects)
        projects_resolved = sorted(list(projects1 - projects2))

        # Section-specific comparisons (Experience, Education, Certifications)
        exp_trend, exp_details = self._compare_list_details(
            resume1.get("experience", []), 
            resume2.get("experience", []),
            "experience"
        )
        
        edu_trend, edu_details = self._compare_list_details(
            resume1.get("education", []), 
            resume2.get("education", []),
            "education"
        )
        
        cert_trend, cert_details = self._compare_list_details(
            resume1.get("certifications", []), 
            resume2.get("certifications", []),
            "certification"
        )

        return VersionComparison(
            v1_version=v1_num,
            v2_version=v2_num,
            overall_score_diff=overall_diff,
            overall_score_trend=overall_trend,
            ats_score_diff=ats_diff,
            ats_score_trend=ats_trend,
            job_match_diff=job_match_diff,
            job_match_trend=job_match_trend,
            career_readiness_diff=readiness_diff,
            career_readiness_trend=readiness_trend,
            keyword_coverage_diff=cov_diff,
            keyword_coverage_trend=cov_trend,
            skills_added=skills_added,
            skills_removed=skills_removed,
            keywords_resolved=keywords_resolved,
            projects_resolved=projects_resolved,
            experience_trend=exp_trend,
            experience_details=exp_details,
            education_trend=edu_trend,
            education_details=edu_details,
            certifications_trend=cert_trend,
            certifications_details=cert_details
        )

    def _compare_list_details(self, list1: List[str], list2: List[str], label: str) -> tuple[str, List[str]]:
        """Helper to compare list strings of experiences, education, or certifications."""
        added = []
        for item2 in list2:
            if not any(self._is_similar(item2, item1) for item1 in list1):
                added.append(item2)
                
        removed = []
        for item1 in list1:
            if not any(self._is_similar(item1, item2) for item2 in list2):
                removed.append(item1)
                
        details = []
        if added:
            details.extend([f"Added {label}: {item}" for item in added])
        if removed:
            details.extend([f"Removed {label}: {item}" for item in removed])
            
        if added and not removed:
            trend = "improved"
        elif removed and not added:
            trend = "declined"
        elif added and removed:
            trend = "improved"  # Considered improved overall if items updated
        else:
            trend = "unchanged"
            details = ["No changes detected."]
            
        return trend, details

    def _is_similar(self, s1: str, s2: str) -> bool:
        """Heuristic similarity checker for experience/edu lines."""
        c1 = re.sub(r"[^a-zA-Z0-9\s]", "", s1).lower().strip()
        c2 = re.sub(r"[^a-zA-Z0-9\s]", "", s2).lower().strip()
        if not c1 or not c2:
            return False
        if c1 == c2:
            return True
        if c1 in c2 or c2 in c1:
            ratio = min(len(c1), len(c2)) / max(len(c1), len(c2))
            if ratio > 0.6:
                return True
        return False
