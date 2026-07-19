import logging
import uuid
import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.user_db import get_user_by_id, update_user_profile

logger = logging.getLogger("app.firebase.firestore")

# 1. User Profile Operations
def save_user_profile(uid: str, email: str, name: Optional[str] = None, photo_url: Optional[str] = None) -> Dict[str, Any]:
    """Saves or updates a user profile document in users/ collection."""
    profile_data = {}
    if name:
        profile_data["name"] = name
    res = update_user_profile(uid, profile_data)
    if res:
        return {
            "uid": res["id"],
            "email": res["username"] + "@resumepilot.ai",
            "name": res["full_name"]
        }
    return {"uid": uid, "email": email, "name": name or "User"}

def get_user_profile(uid: str) -> Optional[Dict[str, Any]]:
    """Retrieves user profile data from local JSON database."""
    res = get_user_by_id(uid)
    if not res:
        return None
    return {
        "uid": res["id"],
        "username": res.get("username", ""),
        "name": res.get("full_name", ""),
        "displayName": res.get("full_name", ""),
        "email": f"{res.get('username', '')}@resumepilot.ai",
        "targetRole": res.get("target_role", ""),
        "experienceLevel": res.get("experience_level", ""),
        "education": res.get("education", ""),
        "studyHoursPerWeek": res.get("study_hours", ""),
        "targetTimeline": res.get("timeline", ""),
        "preferredProvider": res.get("preferredProvider", "Groq"),
        "preferredModel": res.get("preferredModel", "Llama 3.3 70B"),
        "createdAt": res.get("created_at"),
        "updatedAt": res.get("updated_at"),
        "linkedin": res.get("linkedin", ""),
        "github": res.get("github", ""),
        "portfolio": res.get("portfolio", ""),
        "bio": res.get("bio", ""),
        "interests": res.get("interests", []),
        "currentResumeId": res.get("currentResumeId", None)
    }

# 2. Settings Operations
def get_user_settings(uid: str) -> Dict[str, Any]:
    """Gets AI config settings from users/ collection profile."""
    res = get_user_by_id(uid)
    if res:
        return {
            "preferredProvider": res.get("preferredProvider", "Groq"),
            "preferredModel": res.get("preferredModel", "Llama 3.3 70B"),
            "apiKey": res.get("apiKey", ""),
            "theme": "light",
            "preferences": {}
        }
    return {
        "preferredProvider": "Groq",
        "preferredModel": "Llama 3.3 70B",
        "apiKey": "",
        "theme": "light",
        "preferences": {}
    }

def save_user_settings(uid: str, settings_data: Dict[str, Any]) -> None:
    """Updates AI settings inside users/ collection profile."""
    from app.core.user_db import load_users, save_users
    users = load_users()
    if uid in users:
        if "preferredProvider" in settings_data:
            users[uid]["preferredProvider"] = settings_data["preferredProvider"]
        if "preferredModel" in settings_data:
            users[uid]["preferredModel"] = settings_data["preferredModel"]
        if "apiKey" in settings_data:
            users[uid]["apiKey"] = settings_data["apiKey"]
        save_users(users)

# 3. Resume / Version History Operations
def save_resume_version(uid: str, entry: Dict[str, Any]) -> None:
    """Saves a resume version entry under resumes/ collection."""
    from app.config import settings
    history_file = os.path.join(settings.UPLOAD_DIR, uid, "history.json")
    os.makedirs(os.path.dirname(history_file), exist_ok=True)
    
    history = []
    if os.path.exists(history_file):
        try:
            with open(history_file, "r", encoding="utf-8") as f:
                history = json.load(f)
        except Exception:
            pass
            
    # Check duplicate by upload_id only
    updated = False
    for idx, h in enumerate(history):
        if h.get("upload_id") == entry.get("upload_id"):
            # Merge existing data (keep old fields if not present in new entry
            merged = {**h, **entry}
            history[idx] = merged
            updated = True
            break
            
    if not updated:
        history.append(entry)
        
    with open(history_file, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

def get_all_resumes_for_user(uid: str) -> List[Dict[str, Any]]:
    """Fetches all resume versions for a user, sorted by version number in memory."""
    from app.config import settings
    history_file = os.path.join(settings.UPLOAD_DIR, uid, "history.json")
    if not os.path.exists(history_file):
        return []
    try:
        with open(history_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def clear_resumes_for_user(uid: str) -> None:
    """Deletes all resume documents belonging to a user."""
    from app.config import settings
    history_file = os.path.join(settings.UPLOAD_DIR, uid, "history.json")
    if os.path.exists(history_file):
        try:
            os.remove(history_file)
        except Exception:
            pass

# 4. Career Reports Operations
def save_career_report(uid: str, upload_id: str, report_data: Dict[str, Any]) -> None:
    """Persists a Career Report in local cache folder."""
    from app.config import settings
    report_file = os.path.join(settings.UPLOAD_DIR, uid, f"report_{upload_id}.json")
    os.makedirs(os.path.dirname(report_file), exist_ok=True)
    report_copy = dict(report_data)
    report_copy["uid"] = uid
    report_copy["upload_id"] = upload_id
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report_copy, f, ensure_ascii=False, indent=2)

def get_career_report(upload_id: str) -> Optional[Dict[str, Any]]:
    """Loads a Career Report by its upload_id."""
    from app.config import settings
    if not os.path.exists(settings.UPLOAD_DIR):
        return None
    for uid in os.listdir(settings.UPLOAD_DIR):
        report_file = os.path.join(settings.UPLOAD_DIR, uid, f"report_{upload_id}.json")
        if os.path.exists(report_file):
            try:
                with open(report_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
    return None

def get_all_reports_for_user(uid: str) -> List[Dict[str, Any]]:
    """Loads all career reports for a user."""
    from app.config import settings
    user_dir = os.path.join(settings.UPLOAD_DIR, uid)
    if not os.path.exists(user_dir):
        return []
    reports = []
    for file in os.listdir(user_dir):
        if file.startswith("report_") and file.endswith(".json"):
            try:
                with open(os.path.join(user_dir, file), "r", encoding="utf-8") as f:
                    reports.append(json.load(f))
            except Exception:
                pass
    return reports

def delete_career_report(upload_id: str) -> None:
    """Deletes a career report document."""
    from app.config import settings
    if not os.path.exists(settings.UPLOAD_DIR):
        return
    for uid in os.listdir(settings.UPLOAD_DIR):
        report_file = os.path.join(settings.UPLOAD_DIR, uid, f"report_{upload_id}.json")
        if os.path.exists(report_file):
            try:
                os.remove(report_file)
            except Exception:
                pass

# 5. Chat History Operations
def save_chat_message(uid: str, conversation_id: str, message: str, role: str) -> None:
    """Appends an individual Ask Pilo chat message."""
    from app.config import settings
    chat_file = os.path.join(settings.UPLOAD_DIR, uid, "chats.json")
    os.makedirs(os.path.dirname(chat_file), exist_ok=True)
    chats = []
    if os.path.exists(chat_file):
        try:
            with open(chat_file, "r", encoding="utf-8") as f:
                chats = json.load(f)
        except Exception:
            pass
    chats.append({
        "uid": uid,
        "conversationId": conversation_id,
        "message": message,
        "role": role,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    with open(chat_file, "w", encoding="utf-8") as f:
        json.dump(chats, f, ensure_ascii=False, indent=2)

def get_chat_history(uid: str, conversation_id: str) -> List[Dict[str, Any]]:
    """Fetches full chat history sorted by timestamp in memory."""
    from app.config import settings
    chat_file = os.path.join(settings.UPLOAD_DIR, uid, "chats.json")
    if not os.path.exists(chat_file):
        return []
    try:
        with open(chat_file, "r", encoding="utf-8") as f:
            chats = json.load(f)
            return [c for c in chats if c.get("conversationId") == conversation_id]
    except Exception:
        return []

def getLatestResume(uid: str) -> Optional[Dict[str, Any]]:
    """Gets the active or latest resume metadata for the user."""
    from app.core.user_db import get_user_by_id
    user_rec = get_user_by_id(uid)
    current_id = user_rec.get("currentResumeId") if user_rec else None
    
    history = get_all_resumes_for_user(uid)
    if not history:
        # Check meta json files under uploads/{uid}
        from app.config import settings
        user_dir = os.path.join(settings.UPLOAD_DIR, uid)
        if os.path.exists(user_dir):
            meta_files = [f for f in os.listdir(user_dir) if f.endswith("_meta.json")]
            if meta_files:
                meta_files.sort(key=lambda x: os.path.getmtime(os.path.join(user_dir, x)), reverse=True)
                try:
                    with open(os.path.join(user_dir, meta_files[0]), "r", encoding="utf-8") as jf:
                        meta_data = json.load(jf)
                    
                    # Load parsed data if exists
                    parsed_data = {}
                    parsed_path = os.path.join(user_dir, f"parsed_resume_{meta_data['upload_id']}.json")
                    if os.path.exists(parsed_path):
                        with open(parsed_path, "r", encoding="utf-8") as pf:
                            parsed_data = json.load(pf)
                    
                    # Check if we have analysis (get ats score from dashboard_summary)
                    latest_ats_score = None
                    dashboard_path = os.path.join(user_dir, f"dashboard_summary_{meta_data['upload_id']}.json")
                    if os.path.exists(dashboard_path):
                        with open(dashboard_path, "r", encoding="utf-8") as df:
                            dashboard = json.load(df)
                            latest_ats_score = dashboard.get("score", None)
                    
                    analysis_status = "parsed" if latest_ats_score is None else "completed"
                    
                    return {
                        "userId": uid,
                        "resumeId": meta_data["upload_id"],
                        "filename": meta_data["filename"],
                        "uploadDate": datetime.utcnow().isoformat() + "Z",
                        "analysisStatus": analysis_status,
                        "parsedData": parsed_data,
                        "latestATSScore": latest_ats_score,
                        "latestReportId": None
                    }
                except Exception:
                    pass
        return None
        
    target_entry = None
    if current_id:
        for h in history:
            if h.get("upload_id") == current_id:
                target_entry = h
                break
    if not target_entry:
        target_entry = history[-1]
        
    return {
        "userId": uid,
        "resumeId": target_entry.get("upload_id"),
        "filename": target_entry.get("filename"),
        "uploadDate": target_entry.get("timestamp") or datetime.utcnow().isoformat() + "Z",
        "analysisStatus": "completed",
        "parsedData": target_entry.get("parsedData") or {},
        "latestATSScore": target_entry.get("ats_score"),
        "latestReportId": target_entry.get("report_id")
    }

def setCurrentResume(uid: str, resume_id: str) -> None:
    """Updates the current resume pointer for the user."""
    from app.core.user_db import load_users, save_users
    users = load_users()
    if uid in users:
        users[uid]["currentResumeId"] = resume_id
        save_users(users)

# 6. Separate Sub-Analysis Persistence Helpers
def save_parsed_resume(uid: str, upload_id: str, data: Dict[str, Any]) -> None:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"parsed_resume_{upload_id}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_parsed_resume(uid: str, upload_id: str) -> Optional[Dict[str, Any]]:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"parsed_resume_{upload_id}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    # Check old path fallback
    old_path = os.path.join(settings.UPLOAD_DIR, uid, f"{upload_id}.json")
    if os.path.exists(old_path):
        with open(old_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def save_ats_analysis(uid: str, upload_id: str, data: Dict[str, Any]) -> None:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"ats_analysis_{upload_id}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_ats_analysis(uid: str, upload_id: str) -> Optional[Dict[str, Any]]:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"ats_analysis_{upload_id}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def save_career_analysis(uid: str, upload_id: str, data: Dict[str, Any]) -> None:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"career_analysis_{upload_id}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_career_analysis(uid: str, upload_id: str) -> Optional[Dict[str, Any]]:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"career_analysis_{upload_id}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def save_dashboard_summary(uid: str, upload_id: str, data: Dict[str, Any]) -> None:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"dashboard_summary_{upload_id}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_dashboard_summary(uid: str, upload_id: str) -> Optional[Dict[str, Any]]:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"dashboard_summary_{upload_id}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def save_roadmap(uid: str, upload_id: str, data: Dict[str, Any]) -> None:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"roadmap_{upload_id}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_roadmap(uid: str, upload_id: str) -> Optional[Dict[str, Any]]:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"roadmap_{upload_id}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def save_projects(uid: str, upload_id: str, data: Dict[str, Any]) -> None:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"projects_{upload_id}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_projects(uid: str, upload_id: str) -> Optional[Dict[str, Any]]:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"projects_{upload_id}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def save_keyword_analytics(uid: str, upload_id: str, data: Dict[str, Any]) -> None:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"keyword_analytics_{upload_id}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_keyword_analytics(uid: str, upload_id: str) -> Optional[Dict[str, Any]]:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"keyword_analytics_{upload_id}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def save_job_match(uid: str, upload_id: str, data: Dict[str, Any]) -> None:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"job_match_{upload_id}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_job_match(uid: str, upload_id: str) -> Optional[Dict[str, Any]]:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"job_match_{upload_id}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def save_analysis_metadata(uid: str, upload_id: str, data: Dict[str, Any]) -> None:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"metadata_{upload_id}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_analysis_metadata(uid: str, upload_id: str) -> Optional[Dict[str, Any]]:
    from app.config import settings
    path = os.path.join(settings.UPLOAD_DIR, uid, f"metadata_{upload_id}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None
