from fastapi import APIRouter, File, UploadFile, HTTPException, status, Response, Depends
import time
from datetime import datetime
from app.schemas.resume import ResumeRequest, ResumeAnalysis, ATSAnalysisContext
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.ai_config import APIKeyValidationRequest, APIKeyValidationResponse
from app.config import settings
from app.parser.pdf_parser import parse_pdf_resume
from app.services.ai_provider import GroqProvider, map_model_name
from app.agents.graph import app_graph
import uuid
import os
import json
import logging
from app.report.report_models import CareerReport
from app.report.report_service import ReportService
from app.firebase.auth_service import get_current_user
from typing import Dict, Any, Optional, List


logger = logging.getLogger("app.routes")
router = APIRouter()

DEFAULT_RESUME = {
    "name": "Sanskriti Pandey",
    "email": "sanskriti@resumepilot.ai",
    "phone": "+1 (555) 019-2834",
    "linkedin": "linkedin.com/in/sanskriti",
    "github": "github.com/sanskriti",
    "summary": "Frontend developer with 3+ years experience building web applications. Skilled in HTML, CSS, React, and TypeScript.",
    "skills": ["React", "TypeScript", "Tailwind CSS", "Next.js", "HTML5", "CSS3", "Git", "Redux", "Docker"],
    "experience": [
        "Frontend Engineer • TechCorp Solutions (2024 - Present) - Helped the team build the React frontend and style the website.",
        "Software Developer Intern • DevScale Inc (2023 - 2024) - Worked on Python script optimization and handled docker container deployment."
    ],
    "projects": ["Portfolio ResumePilot AI - Built responsive dashboard using Next.js."],
    "certifications": ["AWS Certified Cloud Practitioner"]
}

@router.get("/health", tags=["System"])
async def health_check():
    """System health validation endpoint."""
    return {
        "status": "healthy",
        "service": "ResumePilot AI Backend"
    }

from pydantic import BaseModel
class RegisterRequest(BaseModel):
    username: str
    password: str
    confirm_password: str

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/register", tags=["Auth"])
async def register(req: RegisterRequest):
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    if not req.username.strip():
        raise HTTPException(status_code=400, detail="Username cannot be empty.")
    
    from app.core.user_db import register_user
    try:
        user_record = register_user(req.username, req.password)
        return {
            "status": "success",
            "message": "User registered successfully.",
            "user_id": user_record["id"],
            "username": user_record["username"]
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed.")

@router.post("/login", tags=["Auth"])
async def login(req: LoginRequest):
    from app.core.user_db import authenticate_user, generate_token
    user_record = authenticate_user(req.username, req.password)
    if not user_record:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
        
    token = generate_token(user_record["id"], user_record["username"])
    return {
        "access_token": token,
        "user_id": user_record["id"],
        "username": user_record["username"]
    }

@router.get("/users/profile", tags=["Profile"])
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.firebase.firestore_service import get_user_profile
    profile_data = get_user_profile(current_user["uid"])
    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return profile_data

@router.post("/users/profile", tags=["Profile"])
async def update_profile(req: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.core.user_db import update_user_profile
    updated = update_user_profile(current_user["uid"], req)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found.")
    
    from app.firebase.firestore_service import get_user_profile
    return get_user_profile(current_user["uid"])

@router.post("/users/resumes/metadata", tags=["Resume"])
async def save_metadata(req: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.firebase.firestore_service import save_resume_version
    entry = {
        "upload_id": req.get("resumeId"),
        "filename": req.get("filename"),
        "timestamp": req.get("uploadDate") or datetime.utcnow().isoformat() + "Z",
        "ats_score": req.get("latestATSScore") or 0,
        "version": 1
    }
    save_resume_version(current_user["uid"], entry)
    return {"status": "success"}

@router.post("/users/resumes/current", tags=["Resume"])
async def set_current_resume_endpoint(req: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.firebase.firestore_service import setCurrentResume
    setCurrentResume(current_user["uid"], req["resumeId"])
    return {"status": "success"}

@router.get("/users/resumes/latest", tags=["Resume"])
async def get_latest_resume_endpoint(current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.firebase.firestore_service import getLatestResume
    from datetime import datetime
    res = getLatestResume(current_user["uid"])
    if not res:
        return None
    return res

@router.post("/validate-api-key", response_model=APIKeyValidationResponse, tags=["AI Settings"])
async def validate_api_key(request: APIKeyValidationRequest):
    """Validates API credentials using a lightweight Groq model test call."""
    logger.info(f"Validating API key for provider: {request.provider}")
    
    clean_key = request.api_key.strip() if request.api_key else ""
    if not clean_key:
        raise HTTPException(status_code=400, detail="No API Key Configured")
        
    # Instant validation for mock / testing keys
    if clean_key.startswith("gsk_mock") or clean_key.startswith("mock") or clean_key == "mock-key":
        return APIKeyValidationResponse(
            provider=request.provider,
            model=request.model or "Llama 3.3 70B",
            latency_ms=0.5,
            status="Valid Key (Mocked)",
            valid=True,
            message="Mock key authenticated successfully instantly."
        )
        
    start_time = time.time()
    try:
        from groq import Groq
        # Inject a strict 3.0 second timeout to avoid long validation delays
        client = Groq(api_key=clean_key, timeout=3.0)
        model = map_model_name(request.model or "Llama 3.3 70B")
        
        client.chat.completions.create(
            messages=[{"role": "user", "content": "Ping"}],
            model=model,
            max_tokens=1
        )
        
        latency = (time.time() - start_time) * 1000
        return APIKeyValidationResponse(
            provider=request.provider,
            model=request.model or "Llama 3.3 70B",
            latency_ms=round(latency, 2),
            status="Valid Key",
            valid=True,
            message="Authenticated successfully with Groq API."
        )
        
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        from groq import AuthenticationError, APIConnectionError
        
        if isinstance(e, AuthenticationError):
            detail = "Invalid API Key"
            status_label = "Authentication Failed"
        elif isinstance(e, APIConnectionError):
            detail = "Unable to reach Groq"
            status_label = "Connection Timeout"
        else:
            detail = f"Failed: {str(e)}"
            status_label = "Error"
            
        logger.error(f"Groq API Key validation failed: {str(e)}")
        return APIKeyValidationResponse(
            provider=request.provider,
            model=request.model or "Llama 3.3 70B",
            latency_ms=round(latency, 2),
            status=status_label,
            valid=False,
            message=detail
        )

@router.post("/upload", status_code=status.HTTP_201_CREATED, tags=["Resume"])
async def upload_resume(file: UploadFile = File(...), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Receives file, parses PDF text using PyMuPDF and caches outputs."""
    logger.info("=== [Stage 1] POST /upload CALLED ===")
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()

    if ext != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format. Only PDF uploads are accepted."
        )

    upload_id = str(uuid.uuid4())
    upload_dir = os.path.join(settings.UPLOAD_DIR, current_user["uid"])
    save_path = os.path.join(upload_dir, f"{upload_id}.pdf")

    try:
        content = await file.read()
        os.makedirs(upload_dir, exist_ok=True)
        with open(save_path, "wb") as f:
            f.write(content)
        logger.info(f"=== [Stage 2] Uploaded PDF saved to path: {save_path} ===")
        logger.info(f"Resume uploaded successfully: {filename} saved as {upload_id}.pdf")

        # Copy local temporary file to final resume_{upload_id}.pdf to persist it
        resume_pdf_path = os.path.join(upload_dir, f"resume_{upload_id}.pdf")
        try:
            import shutil
            shutil.copy2(save_path, resume_pdf_path)
            logger.info(f"Saved local PDF upload file as {resume_pdf_path}")
        except Exception as de:
            logger.error(f"Failed to copy local PDF to final path: {str(de)}")

        # Upload to Firebase Storage
        from app.firebase.storage_service import upload_file as upload_to_storage
        remote_path = f"resumes/{current_user['uid']}/{upload_id}.pdf"
        storage_uri = upload_to_storage(save_path, remote_path)
        logger.info(f"Uploaded resume to Firebase Storage: {storage_uri}")

        # Parse text contents
        parsed_data = {}
        if ext == ".pdf":
            try:
                parsed_data = parse_pdf_resume(save_path)
                logger.info("=== [Stage 4] Parsed Resume JSON generated ===")
                logger.info(f"=== [Stage 4] Skills: {parsed_data['skills']}")
                logger.info(f"=== [Stage 4] Experience: {parsed_data['experience']}")
                logger.info(f"=== [Stage 4] Education: {parsed_data['education']}")
                logger.info(f"=== [Stage 4] Projects: {parsed_data['projects']}")
                
                # Cache parsed JSON structured data separately
                from app.firebase.firestore_service import save_parsed_resume
                save_parsed_resume(current_user["uid"], upload_id, parsed_data)

                # Keep old format cache JSON path for backward compatibility
                cache_path = os.path.join(upload_dir, f"{upload_id}.json")
                with open(cache_path, "w", encoding="utf-8") as jf:
                    json.dump(parsed_data, jf, ensure_ascii=False, indent=2)
                logger.info(f"Parsed PDF resume cached to {cache_path}")
            except Exception as pe:
                logger.error(f"Failed to parse uploaded PDF: {str(pe)}")

        # Delete temporary local copy (save_path), keeping the persistent resume_{upload_id}.pdf!
        if os.path.exists(save_path):
            try:
                os.remove(save_path)
                logger.info(f"Deleted local temporary PDF upload file {save_path}")
            except Exception as de:
                logger.error(f"Failed to delete local temporary PDF: {str(de)}")

        # Save metadata containing the original filename
        try:
            meta_path = os.path.join(upload_dir, f"{upload_id}_meta.json")
            with open(meta_path, "w", encoding="utf-8") as mf:
                json.dump({"filename": filename, "upload_id": upload_id}, mf, ensure_ascii=False, indent=2)
            logger.info(f"Saved resume metadata for {upload_id} to {meta_path}")
            
            # Save initial resume version to history
            from app.firebase.firestore_service import save_resume_version
            save_resume_version(current_user["uid"], {
                "upload_id": upload_id,
                "filename": filename,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "ats_score": None,
                "version": 1,
                "parsedData": parsed_data
            })
        except Exception as me:
            logger.error(f"Failed to save resume metadata: {str(me)}")

        return {
            "filename": filename,
            "upload_id": upload_id,
            "size_bytes": len(content),
            "parsed_data": parsed_data
        }
    except Exception as e:
        logger.error(f"Failed to write uploaded file to path: {str(e)}")
        # Make sure to clean up if failed mid-way
        if os.path.exists(save_path):
            try:
                os.remove(save_path)
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded document."
        )

async def run_analysis_pipeline(
    uid: str,
    upload_id: str,
    target_role: str,
    api_key: Optional[str],
    model: Optional[str],
    job_desc: Optional[str],
    user_profile: Optional[Dict[str, Any]]
) -> ResumeAnalysis:
    from app.firebase.firestore_service import (
        get_parsed_resume, save_parsed_resume, save_ats_analysis, save_career_analysis,
        save_career_report, save_dashboard_summary, save_roadmap,
        save_projects, save_keyword_analytics, save_job_match,
        save_analysis_metadata, get_analysis_metadata,
        get_ats_analysis, get_career_analysis, get_roadmap,
        get_projects, get_keyword_analytics, get_job_match,
        get_career_report
    )
    from datetime import datetime
    
    # 1. API Key check
    api_key_str = api_key.strip() if (api_key and api_key.strip()) else ""
    
    # 2. Load Parsed Resume JSON
    parsed_data = get_parsed_resume(uid, upload_id)
    if not parsed_data:
        parsed_data = DEFAULT_RESUME

    # 3. Check Cache Invalidation
    cached_meta = get_analysis_metadata(uid, upload_id)
    
    role_changed = True
    jd_changed = True
    
    if cached_meta:
        role_changed = (cached_meta.get("target_role", "").lower() != target_role.lower())
        jd_changed = (cached_meta.get("job_description", "").strip() != (job_desc or "").strip())
    
    # Check if we have all necessary files cached
    cached_report_dict = get_career_report(upload_id)
    
    # If nothing changed and we have cached results, return them immediately!
    if not role_changed and not jd_changed and cached_report_dict:
        logger.info("=== [Stage 7] Dashboard retrieved cached analysis ===")
        # Load other cached files
        ats_val = get_ats_analysis(uid, upload_id)
        career_val = get_career_analysis(uid, upload_id)
        roadmap_val = get_roadmap(uid, upload_id)
        projects_val = get_projects(uid, upload_id)
        kw_val = get_keyword_analytics(uid, upload_id)
        job_match_val = get_job_match(uid, upload_id)
        
        # Determine overall score
        overall_score = cached_report_dict.get("overall_score", 78)
        
        def get_status_from_text(text: str) -> str:
            t = text.lower()
            if any(w in t for w in ["fail", "missing", "weak", "lacks", "poor", "incorrect"]):
                return "fail"
            elif any(w in t for w in ["warn", "improve", "should", "could", "recommend", "add", "passive"]):
                return "warn"
            return "pass"
            
        checklist = [
            {"title": "Professional Summary Quality", "desc": ats_val.get("summary_feedback", "Verified summary.") if ats_val else "Verified summary.", "status": get_status_from_text(ats_val.get("summary_feedback", "") if ats_val else "")},
            {"title": "Work Experience Evaluation", "desc": ats_val.get("experience_feedback", "Verified experience.") if ats_val else "Verified experience.", "status": get_status_from_text(ats_val.get("experience_feedback", "") if ats_val else "")},
            {"title": "Projects Contribution Index", "desc": ats_val.get("projects_feedback", "Verified projects.") if ats_val else "Verified projects.", "status": get_status_from_text(ats_val.get("projects_feedback", "") if ats_val else "")},
            {"title": "Keywords & Keyword Density", "desc": ats_val.get("keywords_feedback", "Verified keywords.") if ats_val else "Verified keywords.", "status": get_status_from_text(ats_val.get("keywords_feedback", "") if ats_val else "")},
            {"title": "Grammar, Punctuation & Typos", "desc": ats_val.get("grammar_feedback", "Verified grammar.") if ats_val else "Verified grammar.", "status": get_status_from_text(ats_val.get("grammar_feedback", "") if ats_val else "")},
            {"title": "Layout Flow & Structure", "desc": ats_val.get("formatting_feedback", "Verified format.") if ats_val else "Verified format.", "status": get_status_from_text(ats_val.get("formatting_feedback", "") if ats_val else "")},
            {"title": "Active Verbs & Impact", "desc": ats_val.get("action_verbs_feedback", "Verified action verbs.") if ats_val else "Verified action verbs.", "status": get_status_from_text(ats_val.get("action_verbs_feedback", "") if ats_val else "")},
            {"title": "Overall Resume Assessment", "desc": ats_val.get("overall_quality", "Overall resume critique finished.") if ats_val else "Overall resume critique finished.", "status": get_status_from_text(ats_val.get("overall_quality", "") if ats_val else "")}
        ]

        from app.history.history_models import KeywordAnalyticsItem
        kw_item = KeywordAnalyticsItem(**kw_val) if kw_val else None

        return ResumeAnalysis(
            score=overall_score,
            matching_skills=cached_report_dict.get("skills_analysis", []),
            missing_skills=cached_report_dict.get("missing_skills", []),
            auxiliary_skills=["Webpack", "Figma", "Docker"] if "devops" not in target_role.lower() else ["Kubernetes"],
            checklist=checklist,
            revisions=cached_report_dict.get("resume_rewrite_suggestions", []),
            parsed_data=parsed_data,
            execution_timeline=[],
            recommended_projects=cached_report_dict.get("project_recommendations", []),
            job_match=cached_report_dict.get("job_match_analysis", None),
            parsed_job_description=None,
            keyword_analytics=kw_item,
            current_profile=cached_report_dict.get("current_skills", []),
            target_profile={"targetRole": target_role},
            gap_analysis=career_val,
            ats_analysis=ats_val,
            career_roadmap=roadmap_val,
            project_recommendations=projects_val,
            career_report=cached_report_dict
        )

    # If cache is invalid, determine which agents are completed
    completed_agents = []
    initial_results = {}
    
    current_profile_val = {
        "parsed_resume": parsed_data,
        "skills": parsed_data.get("skills", []),
        "experience": parsed_data.get("experience", []),
        "projects": parsed_data.get("projects", []),
        "name": parsed_data.get("name"),
        "email": parsed_data.get("email"),
        "phone": parsed_data.get("phone"),
        "linkedin": parsed_data.get("linkedin"),
        "github": parsed_data.get("github"),
        "summary": parsed_data.get("summary")
    }
    completed_agents.append("Document Intelligence")
    
    target_profile_val = None
    gap_analysis_val = None
    career_roadmap_val = None
    project_recommendations_val = None

    if not role_changed:
        career_val = get_career_analysis(uid, upload_id)
        roadmap_val = get_roadmap(uid, upload_id)
        projects_val = get_projects(uid, upload_id)
        
        if career_val and roadmap_val and projects_val:
            gap_analysis_val = career_val
            career_roadmap_val = roadmap_val
            project_recommendations_val = projects_val
            
            completed_agents.append("Career Goal Agent")
            completed_agents.append("Gap Analysis Agent")
            completed_agents.append("Roadmap Generator")
            completed_agents.append("Project Recommender")

    # Build LangGraph input state
    inputs = {
        "intent": "Job Match" if (job_desc and job_desc.strip()) else "Resume Analysis",
        "upload_id": upload_id,
        "parsed_resume": parsed_data,
        "target_role": target_role,
        "api_key": api_key_str,
        "model": model or "Llama 3.3 70B",
        "current_agent": "",
        "completed_agents": completed_agents,
        "history": [],
        "intermediate_results": initial_results,
        "final_report": {},
        "execution_timeline": [],
        "job_description_raw": job_desc,
        "user_profile": user_profile,
        
        # Pre-populated states
        "CurrentProfile": current_profile_val,
        "TargetProfile": target_profile_val,
        "GapAnalysis": gap_analysis_val,
        "ATSAnalysis": None,
        "CareerRoadmap": career_roadmap_val,
        "ProjectRecommendations": project_recommendations_val,
        "KeywordAnalytics": None,
        "JobMatch": None,
        "CareerReport": None
    }

    logger.info("=== [Stage 5] ATS Engine Started ===")
    # Invoke compiled LangGraph multi-agent flow
    final_state = await app_graph.ainvoke(inputs)
    logger.info("=== [Stage 5] ATS Engine Completed ===")

    report = final_state.get("final_report", {})
    timeline = final_state.get("execution_timeline", [])
    ats_results = final_state.get("intermediate_results", {}).get("ats_analyst", {})
    
    target_profile_val = final_state.get("TargetProfile")

    # Save Parsed Resume
    save_parsed_resume(uid, upload_id, parsed_data)
    
    # Save ATS Analysis
    ats_analysis_to_save = final_state.get("ATSAnalysis") or {
        "score": ats_results.get("score", report.get("score", 78)),
        "summary_feedback": ats_results.get("summary_feedback", ""),
        "experience_feedback": ats_results.get("experience_feedback", ""),
        "projects_feedback": ats_results.get("projects_feedback", ""),
        "keywords_feedback": ats_results.get("keywords_feedback", ""),
        "grammar_feedback": ats_results.get("grammar_feedback", ""),
        "formatting_feedback": ats_results.get("formatting_feedback", ""),
        "action_verbs_feedback": ats_results.get("action_verbs_feedback", ""),
        "overall_quality": ats_results.get("overall_quality", ""),
        "keyword_matching": ats_results.get("keyword_matching", {}) or {
            "present_keywords": report.get("matching_skills", []),
            "missing_keywords": report.get("missing_skills", [])
        }
    }
    save_ats_analysis(uid, upload_id, ats_analysis_to_save)

    # Save Career Analysis (GapAnalysis)
    career_analysis_to_save = final_state.get("GapAnalysis") or {
        "known_skills": report.get("matching_skills", []),
        "missing_skills": report.get("missing_skills", []),
        "career_readiness": report.get("score", 78)
    }
    save_career_analysis(uid, upload_id, career_analysis_to_save)

    # Save Roadmap
    roadmap_to_save = final_state.get("CareerRoadmap") or {
        "learning_roadmap": report.get("learning_roadmap", [])
    }
    save_roadmap(uid, upload_id, roadmap_to_save)

    # Save Projects
    projects_to_save = final_state.get("ProjectRecommendations") or {
        "recommendations": report.get("recommended_projects", [])
    }
    save_projects(uid, upload_id, projects_to_save)

    # Save Job Match
    job_match_data = final_state.get("intermediate_results", {}).get("job_match", {})
    job_match_val = final_state.get("JobMatch") or job_match_data.get("job_match")
    save_job_match(uid, upload_id, job_match_val or {})

    # Helper to map statuses
    def get_status_from_text(text: str) -> str:
        t = text.lower()
        if any(w in t for w in ["fail", "missing", "weak", "lacks", "poor", "incorrect"]):
            return "fail"
        elif any(w in t for w in ["warn", "improve", "should", "could", "recommend", "add", "passive"]):
            return "warn"
        return "pass"

    checklist = [
        {"title": "Professional Summary Quality", "desc": ats_results.get("summary_feedback", "Verified professional summary."), "status": get_status_from_text(ats_results.get("summary_feedback", ""))},
        {"title": "Work Experience Evaluation", "desc": ats_results.get("experience_feedback", "Verified experience sections."), "status": get_status_from_text(ats_results.get("experience_feedback", ""))},
        {"title": "Projects Contribution Index", "desc": ats_results.get("projects_feedback", "Verified project portfolios."), "status": get_status_from_text(ats_results.get("projects_feedback", ""))},
        {"title": "Keywords & Keyword Density", "desc": ats_results.get("keywords_feedback", "Verified keyword counts."), "status": get_status_from_text(ats_results.get("keywords_feedback", ""))},
        {"title": "Grammar, Punctuation & Typos", "desc": ats_results.get("grammar_feedback", "Verified spelling syntax."), "status": get_status_from_text(ats_results.get("grammar_feedback", ""))},
        {"title": "Layout Flow & Structure", "desc": ats_results.get("formatting_feedback", "Verified page structures."), "status": get_status_from_text(ats_results.get("formatting_feedback", ""))},
        {"title": "Active Verbs & Impact", "desc": ats_results.get("action_verbs_feedback", "Verified metric active verbs."), "status": get_status_from_text(ats_results.get("action_verbs_feedback", ""))},
        {"title": "Overall Resume Assessment", "desc": ats_results.get("overall_quality", "Finished overall resume critique."), "status": get_status_from_text(ats_results.get("overall_quality", ""))}
    ]
    revisions = report.get("suggested_revisions", [])

    # Run Advanced Keyword Engine and Record Version History
    from app.history.keyword_engine import analyze_keywords
    from app.history.history_models import KeywordAnalyticsItem
    
    # Analyze keywords
    kw_results = analyze_keywords(
        resume_data=parsed_data,
        target_role=target_role,
        job_description=job_desc
    )
    kw_item = KeywordAnalyticsItem(**kw_results)
    save_keyword_analytics(uid, upload_id, kw_results)

    # Determine scores
    overall_score = report.get("score", 78)
    ats_score = ats_results.get("score", overall_score)
    job_match_score = job_match_val.get("overall_match_score") if job_match_val else None
    
    # Career Readiness Score calculation
    job_match_val_score = job_match_score if job_match_score is not None else 75
    career_readiness_score = int((overall_score + job_match_val_score) / 2)

    # Add to history service
    skills_snapshot = parsed_data.get("skills", [])
    missing_skills = report.get("missing_skills", [])
    missing_keywords = kw_results.get("missing", [])
    suggested_projects = [p.get("title", "") for p in report.get("recommended_projects", [])]
    
    try:
        from app.history.history_service import HistoryService
        history_service = HistoryService(uid=uid)
        history_service.add_entry_for_user(
            uid=uid,
            upload_id=upload_id,
            target_role=target_role,
            overall_score=overall_score,
            ats_score=ats_score,
            job_match_score=job_match_score,
            career_readiness_score=career_readiness_score,
            skills_snapshot=skills_snapshot,
            missing_skills=missing_skills,
            missing_keywords=missing_keywords,
            suggested_projects=suggested_projects
        )
    except Exception as he:
        logger.error(f"Failed to record history entry: {str(he)}")

    # Generate and Cache CareerReport (including keyword_analytics and other fields)
    try:
        report_service = ReportService(uid=uid)
        generated_report = report_service.generate_and_save_report(
            upload_id=upload_id,
            graph_output=final_state,
            parsed_resume=parsed_data,
            target_role=target_role
        )
        
        # Inject keyword_analytics
        report_dict = generated_report.model_dump()
        report_dict["keyword_analytics"] = kw_results
        
        # Save to Firestore
        save_career_report(uid, upload_id, report_dict)
    except Exception as re:
        logger.error(f"Failed to generate and cache CareerReport: {str(re)}")
        report_dict = report

    # Save Dashboard Summary
    dashboard_summary = {
        "score": overall_score,
        "ats_score": ats_score,
        "job_match_score": job_match_score,
        "career_readiness": career_readiness_score,
        "profile_completion": 100 if (user_profile and user_profile.get("education")) else 70,
        "latest_analysis_date": datetime.utcnow().isoformat() + "Z",
        "resume_filename": parsed_data.get("filename", "Resume.pdf")
    }
    save_dashboard_summary(uid, upload_id, dashboard_summary)

    # Update resume history entry with analysis data
    from app.firebase.firestore_service import save_resume_version
    save_resume_version(uid, {
        "upload_id": upload_id,
        "filename": parsed_data.get("filename", "Resume.pdf"),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "ats_score": overall_score,
        "version": 1,
        "parsedData": parsed_data
    })

    # Save inputs metadata for Cache Invalidation
    save_analysis_metadata(uid, upload_id, {
        "upload_id": upload_id,
        "target_role": target_role,
        "job_description": job_desc or "",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })

    logger.info("=== [Stage 6] Analysis successfully saved ===")
    logger.info(f"=== [Stage 6] Storage location: {os.path.join(settings.UPLOAD_DIR, uid)} ===")
    logger.info("=== [Stage 7] Dashboard ready to fetch analysis ===")

    return ResumeAnalysis(
        score=overall_score,
        matching_skills=report.get("matching_skills", []),
        missing_skills=report.get("missing_skills", []),
        auxiliary_skills=["Webpack", "Figma", "Docker"] if "devops" not in target_role.lower() else ["Kubernetes"],
        checklist=checklist,
        revisions=revisions,
        parsed_data=parsed_data,
        execution_timeline=timeline,
        recommended_projects=report.get("recommended_projects", []),
        job_match=job_match_val,
        parsed_job_description=report.get("parsed_job_description", None),
        keyword_analytics=kw_item,
        current_profile=final_state.get("CurrentProfile"),
        target_profile=target_profile_val,
        gap_analysis=final_state.get("GapAnalysis"),
        ats_analysis=final_state.get("ATSAnalysis"),
        career_roadmap=final_state.get("CareerRoadmap"),
        project_recommendations=final_state.get("ProjectRecommendations"),
        career_report=report_dict
    )

@router.post("/analyze", response_model=ATSAnalysisContext, tags=["Resume"])
async def analyze_resume(request: ResumeRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Orchestrates resume analysis using LangGraph StateGraph Supervisor Agent workflow."""
    # Always use the user's stored targetRole from profile as the single source of truth
    from app.firebase.firestore_service import get_user_profile
    user_profile = get_user_profile(current_user.get("uid"))
    target_role = user_profile.get("targetRole", "") if user_profile else ""
    if not target_role:
        target_role = "Software Engineer"  # Fallback
    
    logger.info(f"Analyzing resume for role: {target_role}, upload_id: {request.upload_id} for user {current_user.get('uid')}")

    await run_analysis_pipeline(
        uid=current_user["uid"],
        upload_id=request.upload_id,
        target_role=target_role,
        api_key=request.api_key,
        model=request.model,
        job_desc=request.job_description_raw,
        user_profile=user_profile
    )
    
    return compile_ats_context(current_user["uid"], request.upload_id)

@router.get("/reports", response_model=List[CareerReport], tags=["Report"])
async def list_career_reports(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves all pre-generated CareerReports for the current user from Firestore."""
    try:
        from app.firebase.firestore_service import get_all_reports_for_user
        reports_dict = get_all_reports_for_user(current_user["uid"])
        return [CareerReport.model_validate(r) for r in reports_dict]
    except Exception as e:
        logger.error(f"Failed to list career reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list career reports: {str(e)}")

@router.delete("/report/{upload_id}", tags=["Report"])
async def delete_career_report_endpoint(upload_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Deletes a career report from Firestore and local cache."""
    try:
        from app.firebase.firestore_service import delete_career_report as delete_firestore_report
        delete_firestore_report(upload_id)
        
        # Also clean up local file if any
        pdf_path = os.path.join(settings.UPLOAD_DIR, current_user["uid"], f"report_{upload_id}.pdf")
        json_path = os.path.join(settings.UPLOAD_DIR, current_user["uid"], f"report_{upload_id}.json")
        resume_pdf = os.path.join(settings.UPLOAD_DIR, current_user["uid"], f"{upload_id}.pdf")
        resume_json = os.path.join(settings.UPLOAD_DIR, current_user["uid"], f"{upload_id}.json")
        resume_meta = os.path.join(settings.UPLOAD_DIR, current_user["uid"], f"{upload_id}_meta.json")
        for p in [pdf_path, json_path, resume_pdf, resume_json, resume_meta]:
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass
        return {"status": "success", "message": "Report and associated files deleted"}
    except Exception as e:
        logger.error(f"Failed to delete report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")

@router.get("/report/{upload_id}", response_model=CareerReport, tags=["Report"])
async def get_career_report(upload_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves pre-generated CareerReport JSON, first looking in Firestore."""
    from app.firebase.firestore_service import get_career_report as get_firestore_report, get_user_profile, get_user_settings
    
    uid = current_user["uid"]
    profile_data = get_user_profile(uid)
    settings_data = get_user_settings(uid)
    
    report_dict = get_firestore_report(upload_id)
    
    need_regenerate = False
    
    # Resolve target role
    target_role = profile_data.get("targetRole", "") if profile_data else ""
    if not target_role:
        target_role = "Software Engineer" # Fallback if empty
        
    if report_dict:
        cached_role = report_dict.get("target_role", "")
        if target_role and cached_role.lower() != target_role.lower():
            need_regenerate = True
            logger.info(f"Target role changed from '{cached_role}' to '{target_role}'. Regenerating report.")
    else:
        # If report is missing, let's regenerate it!
        need_regenerate = True
        logger.info(f"No cached report found for upload_id '{upload_id}'. Generating it now.")
        
    if need_regenerate:
        try:
            api_key = settings_data.get("apiKey", "")
            model = settings_data.get("preferredModel", "Llama 3.3 70B")
            
            # Execute pipeline
            analysis = await run_analysis_pipeline(
                uid=uid,
                upload_id=upload_id,
                target_role=target_role,
                api_key=api_key,
                model=model,
                job_desc=None, # In GET request, JD is not passed
                user_profile=profile_data
            )
            report_dict = analysis.career_report
        except Exception as e:
            logger.error(f"Automatic report regeneration failed: {str(e)}")
            if not report_dict:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate report: {str(e)}"
                )
                
    if report_dict:
        try:
            return CareerReport.model_validate(report_dict)
        except Exception as ve:
            logger.warning(f"Firestore report data validation failed: {str(ve)}")
            
    # Fallback to local files if any
    report = ReportService(uid=uid).get_report(upload_id)
    if not report:
        raise HTTPException(
            status_code=404,
            detail=f"Career report for upload ID '{upload_id}' has not been generated yet. Please run resume analysis first."
        )
    return report

# --- Sub-Analysis GET Endpoints ---

@router.get("/users/resumes/{upload_id}/parsed", tags=["Sub-Analysis"])
async def get_parsed_resume_endpoint(upload_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.firebase.firestore_service import get_parsed_resume
    data = get_parsed_resume(current_user["uid"], upload_id)
    if not data:
        try:
            report = await get_career_report(upload_id, current_user)
            if report.parsed_data:
                return report.parsed_data
        except Exception:
            pass
        raise HTTPException(status_code=404, detail="Parsed resume not found.")
    return data

@router.get("/users/resumes/{upload_id}/ats-analysis", tags=["Sub-Analysis"])
async def get_ats_analysis_endpoint(upload_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.firebase.firestore_service import get_ats_analysis
    await get_career_report(upload_id, current_user)
    data = get_ats_analysis(current_user["uid"], upload_id)
    if not data:
        raise HTTPException(status_code=404, detail="ATS Analysis not found.")
    return data

@router.get("/users/resumes/{upload_id}/career-analysis", tags=["Sub-Analysis"])
async def get_career_analysis_endpoint(upload_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.firebase.firestore_service import get_career_analysis
    await get_career_report(upload_id, current_user)
    data = get_career_analysis(current_user["uid"], upload_id)
    if not data:
        raise HTTPException(status_code=404, detail="Career Analysis not found.")
    return data

@router.get("/users/resumes/{upload_id}/dashboard-summary", tags=["Sub-Analysis"])
async def get_dashboard_summary_endpoint(upload_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.firebase.firestore_service import get_dashboard_summary
    await get_career_report(upload_id, current_user)
    data = get_dashboard_summary(current_user["uid"], upload_id)
    if not data:
        raise HTTPException(status_code=404, detail="Dashboard Summary not found.")
    return data

@router.get("/users/resumes/{upload_id}/roadmap", tags=["Sub-Analysis"])
async def get_roadmap_endpoint(upload_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.firebase.firestore_service import get_roadmap
    await get_career_report(upload_id, current_user)
    data = get_roadmap(current_user["uid"], upload_id)
    if not data:
        raise HTTPException(status_code=404, detail="Roadmap not found.")
    return data

@router.get("/users/resumes/{upload_id}/projects", tags=["Sub-Analysis"])
async def get_projects_endpoint(upload_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.firebase.firestore_service import get_projects
    await get_career_report(upload_id, current_user)
    data = get_projects(current_user["uid"], upload_id)
    if not data:
        raise HTTPException(status_code=404, detail="Projects not found.")
    return data

@router.get("/users/resumes/{upload_id}/keyword-analytics", tags=["Sub-Analysis"])
async def get_keyword_analytics_endpoint(upload_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.firebase.firestore_service import get_keyword_analytics
    await get_career_report(upload_id, current_user)
    data = get_keyword_analytics(current_user["uid"], upload_id)
    if not data:
        raise HTTPException(status_code=404, detail="Keyword Analytics not found.")
    return data

@router.get("/users/resumes/{upload_id}/job-match", tags=["Sub-Analysis"])
async def get_job_match_endpoint(upload_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    from app.firebase.firestore_service import get_job_match
    await get_career_report(upload_id, current_user)
    data = get_job_match(current_user["uid"], upload_id)
    if not data:
        raise HTTPException(status_code=404, detail="Job Match details not found.")
    return data

@router.post("/report/{upload_id}/download", tags=["Report"])
async def download_career_report(upload_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Loads CareerReport, generates and caches the PDF, and returns it as a downloadable response."""
    # Check Firestore first
    from app.firebase.firestore_service import get_career_report as get_firestore_report
    report_dict = get_firestore_report(upload_id)
    report = None
    if report_dict:
        try:
            report = CareerReport.model_validate(report_dict)
        except Exception:
            pass

    if not report:
        report_service = ReportService(uid=current_user["uid"])
        report = report_service.get_report(upload_id)

    if not report:
        raise HTTPException(
            status_code=404,
            detail=f"Career report for upload ID '{upload_id}' has not been generated yet. Please run resume analysis first."
        )
        
    pdf_path = os.path.join(settings.UPLOAD_DIR, current_user["uid"], f"report_{upload_id}.pdf")
    
    pdf_bytes = None
    if os.path.exists(pdf_path):
        try:
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()
            logger.info(f"Loaded cached PDF for upload ID '{upload_id}' from {pdf_path}")
        except Exception as e:
            logger.error(f"Error loading cached PDF for '{upload_id}': {str(e)}")
            pdf_bytes = None
        
    if not pdf_bytes:
        try:
            from app.report.pdf.pdf_generator import PDFGenerator
            pdf_bytes = PDFGenerator.generate(report)
            
            os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
            with open(pdf_path, "wb") as f:
                f.write(pdf_bytes)
            logger.info(f"Generated and cached PDF for upload ID '{upload_id}' to {pdf_path}")
        except Exception as e:
            logger.error(f"Failed to generate PDF for upload ID '{upload_id}': {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to generate PDF report due to an internal rendering error."
            )
            
    filename = f"Career_Report_{upload_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat_with_pilo(request: ChatRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Processes messages using LangGraph coordinator Knowledge Agent flow and persists to Firestore."""
    logger.info(f"Processing chat query: {request.message} for user {current_user.get('uid')}")

    # 1. API Key check (set to empty if not configured)
    api_key_str = request.api_key.strip() if (request.api_key and request.api_key.strip()) else ""

    # 2. Invoke LangGraph with Chat intent
    chat_history = request.history + [{"sender": "user", "text": request.message}]
    inputs = {
        "intent": "Ask Pilo Chat",
        "upload_id": None,
        "parsed_resume": {},
        "target_role": request.target_role or "Senior Frontend Engineer",
        "api_key": api_key_str,
        "model": request.model or "Llama 3.3 70B",
        "current_agent": "",
        "completed_agents": [],
        "history": chat_history,
        "intermediate_results": {},
        "final_report": {},
        "execution_timeline": []
    }

    try:
        final_state = await app_graph.ainvoke(inputs)
    except Exception as ge:
        logger.error(f"LangGraph execution failed: {str(ge)}")
        raise HTTPException(status_code=500, detail=f"Multi-Agent chat execution failed: {str(ge)}")

    chat_results = final_state.get("intermediate_results", {}).get("knowledge_agent", {})
    reply = chat_results.get("reply", "I hear you, pilot! Let's explore your career possibilities.")
    mascot_state = chat_results.get("mascot_state", "happy")
    sources = chat_results.get("sources", [])
    timeline = final_state.get("execution_timeline", [])

    # 3. Save to Firestore if conversation_id is provided
    if request.conversation_id and current_user.get("uid") != "mock-uid":
        try:
            from app.firebase.firestore_service import save_chat_message
            save_chat_message(current_user["uid"], request.conversation_id, request.message, "user")
            save_chat_message(current_user["uid"], request.conversation_id, reply, "pilo")
        except Exception as e:
            logger.error(f"Failed to persist chat message in Firestore: {str(e)}")

    # 4. Dynamic suggestions chips
    msg = request.message.lower()
    suggested = ["Draft a professional summary", "Suggest resume action verbs", "Analyze my missing skills"]
    if "docker" in msg or "kubernetes" in msg:
        suggested = ["Docker mock interview question", "How to list DevOps projects?", "Explain container caching"]
    elif "skill" in msg or "missing" in msg:
        suggested = ["How to improve ATS matches", "Draft experience bullets", "Give me a mock interview"]
    elif "interview" in msg:
        suggested = ["Mock question feedback", "Try another question", "View target role key requirements"]

    return ChatResponse(
        reply=reply,
        mascot_state=mascot_state,
        suggested_prompts=suggested,
        execution_timeline=timeline,
        sources=sources
    )

@router.get("/chat/{conversation_id}", tags=["Chat"])
async def get_chat_conversation_history(conversation_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves all chat messages for a given conversation session from Firestore."""
    try:
        from app.firebase.firestore_service import get_chat_history as get_firestore_chat_history
        if current_user.get("uid") == "mock-uid":
            return []
        messages = get_firestore_chat_history(current_user["uid"], conversation_id)
        formatted = [{"sender": m["role"], "text": m["message"]} for m in messages]
        return formatted
    except Exception as e:
        logger.error(f"Failed to load chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load chat history: {str(e)}")

@router.get("/settings", tags=["Settings"])
async def get_settings(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Loads settings from Firestore."""
    try:
        from app.firebase.firestore_service import get_user_settings
        return get_user_settings(current_user["uid"])
    except Exception as e:
        logger.error(f"Failed to get settings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load settings: {str(e)}")

@router.post("/settings", tags=["Settings"])
async def update_settings(settings_data: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """Saves settings to Firestore."""
    try:
        from app.firebase.firestore_service import save_user_settings
        save_user_settings(current_user["uid"], settings_data)
        return {"status": "success", "message": "Settings updated"}
    except Exception as e:
        logger.error(f"Failed to save settings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {str(e)}")

@router.get("/knowledge-base/status", tags=["RAG"])
async def get_kb_status():
    """Retrieves vector database document counts and indexing metadata."""
    from app.rag.vector_store import VectorStore
    store = VectorStore()
    stats = store.get_stats()
    
    last_indexed = "Not Indexed Yet"
    from app.rag.vector_store import DB_DIR
    if os.path.exists(DB_DIR):
        mtimes = []
        for root, _, files in os.walk(DB_DIR):
            for file in files:
                mtimes.append(os.path.getmtime(os.path.join(root, file)))
        if mtimes:
            import datetime
            last_indexed = datetime.datetime.fromtimestamp(max(mtimes)).strftime("%Y-%m-%d %H:%M:%S")
            
    return {
        "indexed_documents": stats.get("count", 0),
        "embedding_model": stats.get("embedding_model", "all-MiniLM-L6-v2"),
        "vector_database": stats.get("database", "ChromaDB"),
        "last_indexed": last_indexed,
        "retrieval_status": "Ready" if stats.get("count", 0) > 0 else "Pending Indexing",
        "path": stats.get("path", "")
    }

@router.post("/parse-jd", tags=["Job Match"])
async def parse_job_description_file(file: UploadFile = File(...), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Receives file (PDF, DOCX, TXT), extracts text and returns raw content."""
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".pdf", ".docx", ".txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format. Accepts PDF, DOCX, or TXT uploads."
        )

    # Save to a temporary file in upload_dir
    upload_id = str(uuid.uuid4())
    temp_path = os.path.join(settings.UPLOAD_DIR, current_user["uid"], f"jd_{upload_id}{ext}")

    try:
        content = await file.read()
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(content)

        from app.parser.jd_parser import parse_jd_file
        text = parse_jd_file(temp_path, ext)

        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return {
            "filename": filename,
            "text": text
        }
    except Exception as e:
        logger.error(f"Failed to parse uploaded Job Description: {str(e)}")
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse job description file: {str(e)}"
        )


# --- Resume Version History & Comparison Endpoints ---

from typing import List
from app.history.history_service import HistoryService
from app.history.history_models import ResumeHistoryEntry, VersionComparison

@router.get("/history", response_model=List[ResumeHistoryEntry], tags=["History"])
async def get_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves all resume version history entries for the current user."""
    try:
        return HistoryService().get_all_entries_for_user(current_user["uid"])
    except Exception as e:
        logger.error(f"Failed to retrieve version history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve version history: {str(e)}")

@router.get("/history/compare", response_model=VersionComparison, tags=["History"])
async def compare_versions_endpoint(v1: int, v2: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Compares any two versions from the resume history for the current user."""
    try:
        comparison = HistoryService().compare_versions(v1, v2, current_user["uid"])
        if not comparison:
            raise HTTPException(status_code=404, detail=f"Versions {v1} or {v2} not found for comparison.")
        return comparison
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to compare versions {v1} and {v2}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to compare versions: {str(e)}")

@router.delete("/history", tags=["History"])
async def clear_history_endpoint(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Clears all version history entries for the current user."""
    try:
        HistoryService().clear_history_for_user(current_user["uid"])
        return {"status": "success", "message": "Resume history cleared successfully."}
    except Exception as e:
        logger.error(f"Failed to clear resume history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")


def compile_ats_context(uid: str, upload_id: str) -> ATSAnalysisContext:
    from app.firebase.firestore_service import (
        get_parsed_resume, get_ats_analysis, get_career_analysis,
        get_keyword_analytics, get_job_match, get_analysis_metadata,
        get_user_profile, get_career_report, get_roadmap, get_projects
    )
    from typing import List, Dict, Any
    
    parsed = get_parsed_resume(uid, upload_id) or {}
    ats = get_ats_analysis(uid, upload_id) or {}
    career = get_career_analysis(uid, upload_id) or {}
    kw = get_keyword_analytics(uid, upload_id) or {}
    job_m = get_job_match(uid, upload_id) or {}
    meta = get_analysis_metadata(uid, upload_id) or {}
    profile = get_user_profile(uid) or {}
    report = get_career_report(upload_id) or {}
    roadmap_data = get_roadmap(uid, upload_id) or {}
    projects_data = get_projects(uid, upload_id) or {}
    
    def ensure_list(val: Any) -> List[Any]:
        if isinstance(val, list):
            return val
        elif isinstance(val, str):
            return [val] if val.strip() else []
        return []

    extracted_skills = ensure_list(parsed.get("skills", []))
    experience = ensure_list(parsed.get("experience", []))
    education = ensure_list(parsed.get("education", []))
    projects = ensure_list(parsed.get("projects", []))
    certifications = ensure_list(parsed.get("certifications", []))
    
    matched_skills = ensure_list(career.get("known_skills") or ats.get("keyword_matching", {}).get("present_keywords", []))
    missing_skills = ensure_list(career.get("missing_skills") or ats.get("keyword_matching", {}).get("missing_keywords", []))
    required_skills = list(set(matched_skills + missing_skills))
    
    target_role = meta.get("target_role") or profile.get("targetRole") or "Software Engineer"
    job_description = meta.get("job_description")
    
    ats_score = ats.get("score") or 75
    if job_description and job_m:
        ats_score = job_m.get("overall_match_score") or ats_score
        
    checklist = ats.get("checklist") or [
        {"title": "Professional Summary Quality", "desc": ats.get("summary_feedback", "Verified professional summary."), "status": "pass"},
        {"title": "Work Experience Evaluation", "desc": ats.get("experience_feedback", "Verified experience sections."), "status": "pass"},
        {"title": "Projects Contribution Index", "desc": ats.get("projects_feedback", "Verified project portfolios."), "status": "pass"},
        {"title": "Keywords & Keyword Density", "desc": ats.get("keywords_feedback", "Verified keyword counts."), "status": "pass"},
        {"title": "Grammar, Punctuation & Typos", "desc": ats.get("grammar_feedback", "Verified spelling syntax."), "status": "pass"},
        {"title": "Layout Flow & Structure", "desc": ats.get("formatting_feedback", "Verified page structures."), "status": "pass"},
        {"title": "Active Verbs & Impact", "desc": ats.get("action_verbs_feedback", "Verified active verbs."), "status": "pass"},
        {"title": "Overall Resume Assessment", "desc": ats.get("overall_quality", "Finished overall resume critique."), "status": "pass"}
    ]
    
    resume_health = {
        "score": ats.get("score") or 75,
        "checklist": checklist,
        "summary_feedback": ats.get("summary_feedback", ""),
        "experience_feedback": ats.get("experience_feedback", ""),
        "projects_feedback": ats.get("projects_feedback", ""),
        "keywords_feedback": ats.get("keywords_feedback", ""),
        "formatting_feedback": ats.get("formatting_feedback", ""),
        "overall_quality": ats.get("overall_quality", "")
    }
    
    suggested_improvements = ats.get("revisions") or report.get("resume_rewrite_suggestions") or []

    # Get learning roadmap and projects
    learning_roadmap = roadmap_data.get("learning_roadmap") or report.get("learning_roadmap") or []
    recommended_projects = projects_data.get("recommendations") or projects_data.get("recommended_projects") or report.get("project_recommendations") or []
    
    # Structure job match details and parsed jd
    job_match_details = job_m.get("job_match") or job_m
    parsed_job_description = job_m.get("parsed_job_description")

    return ATSAnalysisContext(
        parsed_resume=parsed,
        extracted_skills=extracted_skills,
        experience=experience,
        education=education,
        projects=projects,
        certifications=certifications,
        target_role=target_role,
        job_description=job_description,
        required_skills=required_skills,
        missing_skills=missing_skills,
        matched_skills=matched_skills,
        keyword_match=kw,
        ats_score=ats_score,
        resume_health=resume_health,
        suggested_improvements=suggested_improvements,
        learning_roadmap=learning_roadmap,
        recommended_projects=recommended_projects,
        job_match_details=job_match_details if job_match_details else None,
        parsed_job_description=parsed_job_description if parsed_job_description else None,
        career_report=report if report else None
    )

@router.get("/users/resumes/{upload_id}/ats-context", response_model=ATSAnalysisContext, tags=["Resume"])
async def get_ats_context_endpoint(
    upload_id: str,
    job_desc: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieves compiled ATSAnalysisContext. If target role or job description changes, regenerates automatically."""
    from app.firebase.firestore_service import get_analysis_metadata, get_user_profile, get_user_settings
    
    uid = current_user["uid"]
    profile_data = get_user_profile(uid)
    settings_data = get_user_settings(uid)
    
    target_role = profile_data.get("targetRole", "") if profile_data else ""
    if not target_role:
        target_role = "Software Engineer"
        
    cached_meta = get_analysis_metadata(uid, upload_id)
    
    need_regenerate = False
    
    if cached_meta:
        role_changed = (cached_meta.get("target_role", "").lower() != target_role.lower())
        jd_changed = False
        if job_desc is not None:
            jd_changed = (cached_meta.get("job_description", "").strip() != job_desc.strip())
        if role_changed or jd_changed:
            need_regenerate = True
            logger.info(f"Analysis parameters changed (role changed: {role_changed}, jd changed: {jd_changed}). Regenerating.")
    else:
        need_regenerate = True
        logger.info(f"No cached analysis found for upload_id '{upload_id}'. Generating it now.")
        
    if need_regenerate:
        try:
            api_key = settings_data.get("apiKey", "")
            model = settings_data.get("preferredModel", "Llama 3.3 70B")
            
            # Execute pipeline
            await run_analysis_pipeline(
                uid=uid,
                upload_id=upload_id,
                target_role=target_role,
                api_key=api_key,
                model=model,
                job_desc=job_desc,
                user_profile=profile_data
            )
        except Exception as e:
            logger.error(f"Automatic context regeneration failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate ATS context: {str(e)}"
            )
            
    return compile_ats_context(uid, upload_id)

