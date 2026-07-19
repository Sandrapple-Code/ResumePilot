import os
import json
import uuid
import bcrypt
import hmac
import hashlib
import base64
import time
from typing import Dict, Any, Optional
from threading import Lock

USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "users.json")
SECRET_KEY = "resumepilot-jwt-super-secret-signature-key-29381"
db_lock = Lock()

def init_db():
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    with db_lock:
        if not os.path.exists(USERS_FILE):
            with open(USERS_FILE, "w", encoding="utf-8") as f:
                json.dump({}, f)

def load_users() -> Dict[str, Dict[str, Any]]:
    init_db()
    with db_lock:
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

def save_users(users: Dict[str, Dict[str, Any]]):
    init_db()
    with db_lock:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, ensure_ascii=False, indent=2)

def generate_token(user_id: str, username: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": time.time() + 24 * 3600  # 24 hours
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        expected_sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig, signature):
            return None
        
        padding = "=" * (4 - len(payload_b64) % 4)
        payload_json = base64.urlsafe_b64decode(payload_b64 + padding).decode()
        payload = json.loads(payload_json)
        if time.time() > payload["exp"]:
            return None
        return payload
    except Exception:
        return None

def register_user(username: str, password: str) -> Dict[str, Any]:
    username = username.strip().lower()
    users = load_users()
    
    # Uniqueness check
    for uid, u in users.items():
        if u["username"] == username:
            raise ValueError("Username already exists.")
            
    user_id = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    now = datetime_now_iso()
    
    user_record = {
        "id": user_id,
        "username": username,
        "password_hash": password_hash,
        "full_name": "",
        "target_role": "",
        "experience_level": "",
        "education": "",
        "study_hours": "",
        "timeline": "",
        "created_at": now,
        "updated_at": now
    }
    
    users[user_id] = user_record
    save_users(users)
    return user_record

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    username = username.strip().lower()
    users = load_users()
    
    for uid, u in users.items():
        if u["username"] == username:
            if bcrypt.checkpw(password.encode("utf-8"), u["password_hash"].encode("utf-8")):
                return u
    return None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    users = load_users()
    return users.get(user_id)

def update_user_profile(user_id: str, profile_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    users = load_users()
    if user_id not in users:
        return None
        
    u = users[user_id]
    now = datetime_now_iso()
    
    # Map matching fields from request
    if "full_name" in profile_data: u["full_name"] = profile_data["full_name"]
    if "name" in profile_data: u["full_name"] = profile_data["name"]
    if "target_role" in profile_data: u["target_role"] = profile_data["target_role"]
    if "targetRole" in profile_data: u["target_role"] = profile_data["targetRole"]
    if "experience_level" in profile_data: u["experience_level"] = profile_data["experience_level"]
    if "experienceLevel" in profile_data: u["experience_level"] = profile_data["experienceLevel"]
    if "education" in profile_data: u["education"] = profile_data["education"]
    if "study_hours" in profile_data: u["study_hours"] = profile_data["study_hours"]
    if "studyHours" in profile_data: u["study_hours"] = profile_data["study_hours"]
    if "studyHoursPerWeek" in profile_data: u["study_hours"] = profile_data["studyHoursPerWeek"]
    if "timeline" in profile_data: u["timeline"] = profile_data["timeline"]
    if "targetTimeline" in profile_data: u["timeline"] = profile_data["targetTimeline"]
    
    # Save optional fields if exists
    for key in ["linkedin", "github", "portfolio", "bio", "username", "interests", "currentResumeId"]:
        if key in profile_data:
            u[key] = profile_data[key]
            
    # Aliases for resume id mapping
    if "resumeId" in profile_data: u["currentResumeId"] = profile_data["resumeId"]
    if "upload_id" in profile_data: u["currentResumeId"] = profile_data["upload_id"]
            
    u["updated_at"] = now
    users[user_id] = u
    save_users(users)
    return u

def datetime_now_iso() -> str:
    from datetime import datetime
    return datetime.utcnow().isoformat() + "Z"
