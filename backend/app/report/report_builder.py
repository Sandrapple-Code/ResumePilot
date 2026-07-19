import datetime
from app.report.report_models import CareerReport, CandidateInfo
from typing import Dict, Any, List

class ReportBuilder:
    @staticmethod
    def build_report(graph_output: Dict[str, Any], parsed_resume: Dict[str, Any], target_role: str) -> CareerReport:
        """Transforms LangGraph final report output and parsed resume data into a unified CareerReport."""
        
        # 1. Parse Candidate Info
        candidate_info = CandidateInfo(
            name=parsed_resume.get("name") or "Unknown Candidate",
            email=parsed_resume.get("email"),
            phone=parsed_resume.get("phone"),
            linkedin=parsed_resume.get("linkedin"),
            github=parsed_resume.get("github")
        )
        
        # 2. Extract Scores and Details
        final_report = graph_output.get("final_report", {})
        intermediate = graph_output.get("intermediate_results", {})
        ats_results = intermediate.get("ats_analyst", {})
        job_match_data = intermediate.get("job_match", {})
        job_match = job_match_data.get("job_match")
        
        # Determine overall scores
        overall_score = final_report.get("score", 75)
        ats_score = ats_results.get("score", overall_score)
        job_match_score = job_match.get("overall_match_score") if job_match else None
        
        # Setup ATS checklist
        ats_checklist = []
        
        def get_status_from_text(text: str) -> str:
            t = text.lower()
            if any(w in t for w in ["fail", "missing", "weak", "lacks", "poor", "incorrect"]):
                return "fail"
            elif any(w in t for w in ["warn", "improve", "should", "could", "recommend", "add", "passive"]):
                return "warn"
            return "pass"
            
        checklist_items = [
            ("Professional Summary Quality", "summary_feedback", "Verified professional summary."),
            ("Work Experience Evaluation", "experience_feedback", "Verified experience sections."),
            ("Projects Contribution Index", "projects_feedback", "Verified project portfolios."),
            ("Keywords & Keyword Density", "keywords_feedback", "Verified keyword counts."),
            ("Grammar, Punctuation & Typos", "grammar_feedback", "Verified spelling syntax."),
            ("Layout Flow & Structure", "formatting_feedback", "Verified page structures."),
            ("Active Verbs & Impact", "action_verbs_feedback", "Verified metric active verbs."),
            ("Overall Resume Assessment", "overall_quality", "Finished overall resume critique.")
        ]
        
        for title, key, default_desc in checklist_items:
            desc = ats_results.get(key, default_desc)
            ats_checklist.append({
                "title": title,
                "desc": desc,
                "status": get_status_from_text(desc)
            })

        # 3. Pull RAG Sources
        knowledge_results = intermediate.get("knowledge_agent", {})
        sources = knowledge_results.get("sources", ["harvard_resume_guide.md", "star_interview_method.md"])

        # 4. Construct unified report
        return CareerReport(
            candidate_info=candidate_info,
            target_role=target_role,
            resume_summary=parsed_resume.get("summary") or "Frontend developer seeking opportunities.",
            overall_score=overall_score,
            ats_score=ats_score,
            job_match_score=job_match_score,
            ats_analysis=ats_checklist,
            skills_analysis=parsed_resume.get("skills") or final_report.get("matching_skills", []),
            missing_skills=final_report.get("missing_skills", []),
            strengths=final_report.get("strengths", []),
            weaknesses=final_report.get("weaknesses", []),
            project_recommendations=final_report.get("recommended_projects", []),
            learning_roadmap=final_report.get("learning_roadmap", []),
            resume_rewrite_suggestions=final_report.get("suggested_revisions", []),
            job_match_analysis=job_match,
            
            # Separation Architecture fields
            current_skills=final_report.get("current_skills", []),
            career_goal=final_report.get("career_goal", target_role),
            required_skills=final_report.get("required_skills", []),
            skill_gap=final_report.get("skill_gap", []),
            interview_prep=final_report.get("interview_prep", []),
            suggested_certifications=final_report.get("suggested_certifications", []),
            estimated_readiness=final_report.get("estimated_readiness", overall_score),
            industry_trends=final_report.get("industry_trends", []),
            estimated_timeline=final_report.get("estimated_timeline", "6 Months"),
            parsed_data=parsed_resume,
            
            knowledge_sources_used=sources,
            generated_timestamp=datetime.datetime.utcnow().isoformat() + "Z",
            report_version="1.0.0"
        )
