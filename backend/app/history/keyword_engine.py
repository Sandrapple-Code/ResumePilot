import re
from typing import Dict, Any, List, Optional

# Predefined comprehensive list of standard industry skills/keywords
COMMON_KEYWORDS = [
    # Frontend
    "React", "TypeScript", "JavaScript", "Tailwind CSS", "Tailwind", "Next.js", "NextJS", "HTML5", "CSS3", "Redux", "Webpack", "Vite", "Sass", "Less", "Figma", "Vue", "Angular", "jQuery", "Bootstrap", "WebAssembly",
    # Backend / Languages
    "Python", "Node.js", "NodeJS", "Express", "GraphQL", "REST", "API", "Go", "Golang", "Java", "Spring Boot", "Spring", "C++", "C#", "Ruby", "Rails", "PHP", "Laravel", "Django", "Flask", "FastAPI",
    # Databases
    "PostgreSQL", "Postgres", "MySQL", "MongoDB", "Redis", "SQLite", "SQL", "NoSQL", "Cassandra", "Elasticsearch", "Firebase", "DynamoDB",
    # DevOps / Cloud / OS
    "Docker", "Kubernetes", "K8s", "AWS", "GCP", "Azure", "Terraform", "CI/CD", "GitHub Actions", "Jenkins", "Linux", "Bash", "Shell", "Ansible", "Git", "GitLab", "Prometheus", "Grafana", "YAML", "Nginx",
    # Data Science / ML
    "TensorFlow", "PyTorch", "Scikit-Learn", "Pandas", "NumPy", "Spark", "Hadoop", "Airflow", "Jupyter", "MLOps", "R", "SQL",
    # Legacy / Outdated
    "Adobe Flash", "Flash", "MS Paint", "Paint", "Dreamweaver", "FrontPage", "Silverlight", "ColdFusion", "COBOL", "FORTRAN"
]

def extract_keywords_from_text(text: str) -> List[str]:
    """Scans raw text case-insensitively for standard industry keywords."""
    found = []
    text_lower = text.lower()
    for kw in COMMON_KEYWORDS:
        pattern = r"\b" + re.escape(kw.lower()) + r"\b"
        if re.search(pattern, text_lower):
            found.append(kw)
    return found

def get_default_keywords_for_role(target_role: str) -> List[str]:
    """Returns standard required keywords based on target role category."""
    role = target_role.lower()
    if any(k in role for k in ["devops", "sre", "cloud", "platform", "infrastructure"]):
        return ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Git", "Python", "Bash", "Jenkins", "GCP", "Ansible"]
    elif any(k in role for k in ["fullstack", "full-stack", "backend", "node", "api"]):
        return ["React", "Node.js", "PostgreSQL", "TypeScript", "Docker", "GraphQL", "Redis", "Git", "Python", "SQL", "MongoDB", "REST"]
    elif any(k in role for k in ["ai", "ml", "machine", "data", "deep learning", "nlp"]):
        return ["Python", "SQL", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Scikit-Learn", "Git", "AWS", "Spark", "Airflow", "Jupyter"]
    else:
        # Frontend, Mobile, Web UI, Default
        return ["React", "TypeScript", "Tailwind CSS", "Next.js", "Jest", "CI/CD", "Git", "Redux", "Webpack", "HTML5", "CSS3", "JavaScript"]

def get_resume_full_text(resume_data: Dict[str, Any]) -> str:
    """Collates all text fields of a parsed resume structure into a single searchable text string."""
    parts = []
    if resume_data.get("summary"):
        parts.append(resume_data["summary"])
    
    skills = resume_data.get("skills", [])
    if isinstance(skills, list):
        parts.extend(skills)
    elif isinstance(skills, str):
        parts.append(skills)
        
    parts.extend(resume_data.get("experience", []))
    parts.extend(resume_data.get("projects", []))
    parts.extend(resume_data.get("education", []))
    parts.extend(resume_data.get("certifications", []))
    
    return " ".join(parts)

def analyze_keywords(resume_data: Dict[str, Any], target_role: str, job_description: Optional[str] = None) -> Dict[str, Any]:
    """Computes keyword coverage: matched, missing, duplicate and outdated items."""
    # 1. Determine required keywords
    if job_description and job_description.strip():
        required = extract_keywords_from_text(job_description)
        if not required:
            required = get_default_keywords_for_role(target_role)
    else:
        required = get_default_keywords_for_role(target_role)
        
    resume_text = get_resume_full_text(resume_data)
    resume_text_lower = resume_text.lower()
    
    matched = []
    missing = []
    
    for kw in required:
        # Check for word boundary
        pattern = r"\b" + re.escape(kw.lower()) + r"\b"
        if re.search(pattern, resume_text_lower):
            matched.append(kw)
        else:
            missing.append(kw)
            
    # 2. Duplicate keywords: repeated >= 3 times in resume text
    duplicate = {}
    for kw in matched:
        pattern = r"\b" + re.escape(kw.lower()) + r"\b"
        count = len(re.findall(pattern, resume_text_lower))
        if count >= 3:
            duplicate[kw] = count
            
    # 3. Unused / Outdated keywords detection (specifically look for outdated tools)
    OUTDATED_KEYWORDS = {
        "Adobe Flash": ["adobe flash", "flash"],
        "MS Paint": ["ms paint", "microsoft paint", "paint"],
        "Dreamweaver": ["dreamweaver", "macromedia dreamweaver"],
        "FrontPage": ["frontpage", "microsoft frontpage"],
        "Silverlight": ["silverlight", "microsoft silverlight"],
        "ColdFusion": ["coldfusion", "macromedia coldfusion"],
        "jQuery": ["jquery"]
    }
    
    unused = []
    for standard_name, aliases in OUTDATED_KEYWORDS.items():
        found = False
        for alias in aliases:
            pattern = r"\b" + re.escape(alias.lower()) + r"\b"
            if re.search(pattern, resume_text_lower):
                found = True
                break
        if found:
            unused.append(standard_name)
            
    # Add irrelevant skills for target role (e.g. Photoshop/Figma if target is DevOps)
    role_lower = target_role.lower()
    is_devops = any(k in role_lower for k in ["devops", "sre", "cloud", "platform", "infrastructure"])
    if is_devops:
        for irr in ["Photoshop", "Adobe Photoshop", "Sass", "Figma"]:
            pattern = r"\b" + re.escape(irr.lower()) + r"\b"
            if re.search(pattern, resume_text_lower):
                if irr not in unused:
                    unused.append(irr)
                    
    # Calculate coverage
    matched_count = len(matched)
    missing_count = len(missing)
    duplicate_count = sum(duplicate.values())
    unused_count = len(unused)
    
    total = matched_count + missing_count
    coverage_percentage = round((matched_count / total) * 100, 1) if total > 0 else 100.0
    
    return {
        "matched": matched,
        "missing": missing,
        "duplicate": duplicate,
        "unused": unused,
        "coverage_percentage": coverage_percentage,
        "matched_count": matched_count,
        "missing_count": missing_count,
        "duplicate_count": duplicate_count,
        "unused_count": unused_count
    }
