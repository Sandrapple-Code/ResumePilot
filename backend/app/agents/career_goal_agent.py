import os
import json
import time
import logging
from typing import Dict, Any
from app.agents.state import ResumePilotState
from groq import Groq

logger = logging.getLogger("app.agents.career_goal_agent")

SKILL_MATRICES_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "skill_matrices"
)

def load_skill_matrix(target_role: str) -> Dict[str, Any]:
    """Loads the skill matrix JSON for a standard target role, using fuzzy matching."""
    normalized = target_role.lower().strip()
    # Normalize e.g. "AI/ML Engineer" -> "ai_ml_engineer"
    clean_role = normalized.replace(" ", "_").replace("/", "_").replace("-", "_")
    
    file_path = os.path.join(SKILL_MATRICES_DIR, f"{clean_role}.json")
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading skill matrix file {file_path}: {e}")

    # Fallback to directory scanning for fuzzy matches
    if os.path.exists(SKILL_MATRICES_DIR):
        try:
            files = os.listdir(SKILL_MATRICES_DIR)
            for file in files:
                if file.endswith(".json"):
                    base = file[:-5]
                    if base in clean_role or clean_role in base:
                        with open(os.path.join(SKILL_MATRICES_DIR, file), "r", encoding="utf-8") as f:
                            return json.load(f)
        except Exception as fe:
            logger.error(f"Error fuzzy scanning skill matrices: {fe}")

    # Return empty dict if no standard matches are found (triggers LLM fallback)
    return {}

async def generate_dynamic_skill_matrix(target_role: str, api_key: str, model_name: str) -> Dict[str, Any]:
    """Generates a structured skill matrix using Groq for custom/non-standard roles."""
    if not api_key:
        logger.warning("No API Key provided for dynamic skill matrix generation. Using empty matrix.")
        return {}

    client = Groq(api_key=api_key)
    prompt = f"""
You are a senior technical career advisor. Generate a comprehensive and structured skill matrix for the custom target career role: "{target_role}".
You MUST return ONLY a valid, raw JSON object matching the following structure. Do not include markdown wraps (like ```json), commentary, or extra text.

{{
  "core_skills": ["Skill 1", "Skill 2", "Skill 3"],
  "libraries": ["Library 1", "Library 2"],
  "frameworks": ["Framework 1", "Framework 2"],
  "tools": ["Tool 1", "Tool 2"],
  "cloud": ["Cloud platform or service 1", "Cloud service 2"],
  "soft_skills": ["Soft skill 1", "Soft skill 2"],
  "interview_topics": ["Topic 1", "Topic 2"],
  "recommended_projects": [
    {{
      "title": "Project Title",
      "description": "Short description of the project detailing target features.",
      "difficulty": "Easy" | "Medium" | "Hard",
      "duration": "e.g. 3 Weeks",
      "skills_learned": ["skill1", "skill2"],
      "stack": ["technology1", "technology2"],
      "learning_outcome": "Description of what they will achieve."
    }}
  ],
  "ats_keywords": ["keyword1", "keyword2", "keyword3"],
  "learning_order": ["Step 1", "Step 2", "Step 3"],
  "estimated_difficulty": "Easy" | "Medium" | "Hard"
}}
"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a career framework compiler that outputs ONLY JSON structured matrices."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        content = chat_completion.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        logger.error(f"Failed to dynamically generate skill matrix for '{target_role}': {e}")
        return {}

async def career_goal_agent(state: ResumePilotState) -> Dict[str, Any]:
    """Career Goal Agent loads the skill matrix requirements matching the target career path."""
    start_time = time.time()
    logger.info("Career Goal Agent executing...")

    user_prof = state.get("user_profile") or {}
    target_role = state.get("target_role") or user_prof.get("targetRole") or "Full Stack Developer"
    experience_level = user_prof.get("experienceLevel") or "Intermediate"
    study_hours = user_prof.get("studyHoursPerWeek") or "15"
    timeline = user_prof.get("targetTimeline") or "6 Months"
    
    api_key = state.get("api_key", "")
    model = state.get("model", "Llama 3.3 70B")

    # 1. Resolve and Load Skill Matrix
    matrix = load_skill_matrix(target_role)
    is_custom = False
    
    if not matrix:
        is_custom = True
        logger.info(f"Target role '{target_role}' not in pre-defined matrices. Generating dynamically...")
        matrix = await generate_dynamic_skill_matrix(target_role, api_key, model)

    # 2. Add safe default fallbacks if generation failed or is empty
    if not matrix:
        matrix = {
            "core_skills": ["Software Engineering Principles", "Algorithms", "Git Version Control", "Testing"],
            "libraries": [],
            "frameworks": [],
            "tools": ["Git", "VS Code"],
            "cloud": ["Cloud Foundations"],
            "soft_skills": ["Problem Solving", "Communication"],
            "interview_topics": ["Basic Programming Concepts", "Code Debugging"],
            "recommended_projects": [],
            "ats_keywords": [target_role, "Software Engineer", "Developer"],
            "learning_order": ["Fundamentals", "Practical Development", "Project Assembly"],
            "estimated_difficulty": "Medium"
        }

    # 3. Formulate Role Trends & Certifications based on career
    trends = []
    certs = []
    
    role_lower = target_role.lower()
    if "ai" in role_lower or "ml" in role_lower or "machine" in role_lower:
        trends = ["Generative AI & LLMs", "Retrieval-Augmented Generation (RAG)", "Vector Embeddings Indexing", "MLOps Pipelines"]
        certs = ["Google Cloud Professional Machine Learning Engineer", "AWS Certified Machine Learning - Specialty", "TensorFlow Developer Certificate"]
    elif "devops" in role_lower or "sre" in role_lower:
        trends = ["GitOps Deployments", "Kubernetes Multi-Cluster Orchestration", "Serverless Infrastructure as Code", "OpenTelemetry Observability"]
        certs = ["AWS Certified DevOps Engineer - Professional", "Certified Kubernetes Administrator (CKA)", "HashiCorp Certified: Terraform Associate"]
    elif "data" in role_lower:
        trends = ["Real-time Stream Ingestion", "Data Lakehouse Federation (Iceberg)", "Predictive Feature Stores", "dbt Pipeline Transformations"]
        certs = ["Google Cloud Professional Data Engineer", "Databricks Certified Data Engineer Associate", "Associate Certified Analytics Professional"]
    elif "cloud" in role_lower:
        trends = ["Multi-Cloud Mesh Architecture", "Serverless Containers", "Zero-Trust Cloud IAM Policies"]
        certs = ["AWS Certified Solutions Architect", "Google Cloud Associate Cloud Engineer", "Microsoft Certified: Azure Administrator"]
    elif "cyber" in role_lower or "security" in role_lower:
        trends = ["Zero-Trust Networking", "Cloud Security Posture Management (CSPM)", "Automated Threat Detection"]
        certs = ["CompTIA Security+", "Certified Information Systems Security Professional (CISSP)", "Certified Ethical Hacker (CEH)"]
    elif "design" in role_lower or "ui" in role_lower or "ux" in role_lower:
        trends = ["Design Systems Automation", "Figma Variables & Tokens", "Micro-Interactions UX"]
        certs = ["Google UX Design Certificate", "Interaction Design Foundation Certified Designer"]
    else:
        trends = ["TypeScript-First Platforms", "Edge Serverless Deployments", "API Gateways", "Static Page Optimization"]
        certs = ["AWS Certified Developer - Associate", "Postman API Design Certification"]

    target_profile = {
        "targetRole": target_role,
        "experienceLevel": experience_level,
        "studyHours": study_hours,
        "timeline": timeline,
        "matrix": matrix,
        "suggested_certifications": certs,
        "industry_trends": trends,
        "estimated_difficulty": matrix.get("estimated_difficulty", "Medium")
    }

    # Calculate execution duration
    duration_ms = (time.time() - start_time) * 1000
    timeline_log = {
        "agent": "Career Goal Agent",
        "status": "completed",
        "duration_ms": round(duration_ms, 2)
    }

    return {
        "current_agent": "Career Goal Agent",
        "completed_agents": state.get("completed_agents", []) + ["Career Goal Agent"],
        "execution_timeline": state.get("execution_timeline", []) + [timeline_log],
        "TargetProfile": target_profile,
        "intermediate_results": {
            **state.get("intermediate_results", {}),
            "career_goal_agent": {
                "target_role": target_role,
                "matrix": matrix,
                "is_custom": is_custom,
                "suggested_certifications": certs,
                "industry_trends": trends,
                "estimated_difficulty": matrix.get("estimated_difficulty", "Medium")
            }
        }
    }
