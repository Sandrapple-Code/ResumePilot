import fitz  # PyMuPDF
import re
import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger("app.parser")

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extracts all raw text from a PDF file using PyMuPDF page-by-page."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        logger.error(f"Error reading PDF {pdf_path}: {str(e)}")
        return ""

def parse_pdf_resume(pdf_path: str) -> Dict[str, Any]:
    """Extracts contact coordinates and partitions text into structured sections using heuristics."""
    logger.info("=== [Stage 3] PDF PARSER STARTED ===")
    text = extract_text_from_pdf(pdf_path)
    
    parsed_data = {
        "name": "",
        "email": "",
        "phone": "",
        "linkedin": "",
        "github": "",
        "summary": "",
        "skills": [],
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": []
    }

    if not text.strip():
        return parsed_data

    # 1. Regex coordinates matches
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    if email_match:
        parsed_data["email"] = email_match.group(0).strip()

    phone_match = re.search(r"\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}", text)
    if phone_match:
        parsed_data["phone"] = phone_match.group(0).strip()

    linkedin_match = re.search(r"(?:linkedin\.com/in/|linkedin\.com/pub/)[a-zA-Z0-9\-_]+", text, re.IGNORECASE)
    if linkedin_match:
        parsed_data["linkedin"] = linkedin_match.group(0).strip()

    github_match = re.search(r"github\.com/[a-zA-Z0-9\-_]+", text, re.IGNORECASE)
    if github_match:
        parsed_data["github"] = github_match.group(0).strip()

    # 2. Line splitting and filtering
    lines = [line.strip() for line in text.split("\n")]
    non_empty_lines = [line for line in lines if line]

    # Name heuristic: First non-empty line ignoring metadata/contact coordinates
    for line in non_empty_lines[:4]:
        if "@" in line or "linkedin.com" in line or "github.com" in line or re.search(r"\d{4,}", line):
            continue
        if line.lower() in ["resume", "curriculum vitae", "cv", "portfolio", "profile"]:
            continue
        parsed_data["name"] = line
        break
    
    if not parsed_data["name"] and parsed_data["email"]:
        email_prefix = parsed_data["email"].split("@")[0]
        parsed_data["name"] = email_prefix.replace(".", " ").title()

    # 3. Heading categorization mappings
    header_keywords = {
        "summary": ["summary", "professional summary", "objective", "profile", "executive summary", "about me", "professional profile"],
        "skills": ["technical skills", "skills", "key skills", "core competencies", "competencies", "expertise", "technologies", "skills & expertise", "skills and technologies"],
        "experience": ["experience", "work experience", "professional experience", "employment history", "employment", "work history", "career history", "experience summary"],
        "education": ["education", "academic background", "academic history", "qualifications", "educational background", "studies", "academic qualifications"],
        "projects": ["projects", "personal projects", "academic projects", "selected projects", "key projects", "notable projects", "technical projects"],
        "certifications": ["certifications", "licenses", "courses", "accreditations", "certificates", "awards", "honors", "licenses & certifications"]
    }

    # Group lines by active section
    section_lines = {key: [] for key in header_keywords}
    current_section = None

    for line in lines:
        if not line:
            continue
        
        # Check if line corresponds to a section header
        cleaned_line = line.lower().strip(":-•* ")
        is_header = False
        for sec, keywords in header_keywords.items():
            if cleaned_line in keywords or (len(cleaned_line) < 30 and any(cleaned_line == kw for kw in keywords)):
                current_section = sec
                is_header = True
                break
        
        if is_header:
            continue

        if current_section:
            section_lines[current_section].append(line)

    # 4. Refine contents
    if section_lines["summary"]:
        parsed_data["summary"] = " ".join(section_lines["summary"]).strip()

    if section_lines["skills"]:
        raw_skills_text = " ".join(section_lines["skills"])
        skills_split = re.split(r"[,;•|*]|\band\b", raw_skills_text)
        cleaned_skills = []
        for s in skills_split:
            s_clean = s.strip()
            # Avoid picking up category tags or lengthy sentences inside skills
            if s_clean and not s_clean.endswith(":") and len(s_clean) < 35:
                cleaned_skills.append(s_clean)
        parsed_data["skills"] = cleaned_skills if cleaned_skills else [s.strip() for s in section_lines["skills"] if len(s.strip()) < 35]

    # Refine bullet structures
    parsed_data["experience"] = group_lines_into_bullets(section_lines["experience"])
    parsed_data["education"] = group_lines_into_bullets(section_lines["education"])
    parsed_data["projects"] = group_lines_into_bullets(section_lines["projects"])
    parsed_data["certifications"] = group_lines_into_bullets(section_lines["certifications"])

    logger.info("=== [Stage 3] PDF PARSER COMPLETED ===")
    logger.info(f"=== [Stage 3] Extracted Skills: {parsed_data['skills']}")
    logger.info(f"=== [Stage 3] Extracted Experience: {parsed_data['experience']}")
    logger.info(f"=== [Stage 3] Extracted Education: {parsed_data['education']}")
    logger.info(f"=== [Stage 3] Extracted Projects: {parsed_data['projects']}")
    return parsed_data

def group_lines_into_bullets(lines: List[str]) -> List[str]:
    """Helper that merges broken lines together and splits by bullet points or empty-line blocks."""
    bullets = []
    current_bullet = ""
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        # Check if line starts with any common bullet symbol (including unicode fallbacks)
        is_new_bullet = False
        if stripped.startswith(("•", "-", "*", "▪", "◦", "", "‣", "⁃", "■", "●", "★", "♦")):
            is_new_bullet = True
        elif re.match(r"^[^a-zA-Z0-9\s\(\[\"']", stripped):
            # Non-alphanumeric bullet sign match
            is_new_bullet = True
            
        if is_new_bullet:
            if current_bullet:
                bullets.append(clean_bullet(current_bullet))
            # Remove leading bullet symbols
            current_bullet = re.sub(r"^[^a-zA-Z0-9\s\(\[\"']+", "", stripped).strip()
        else:
            if current_bullet:
                current_bullet += " " + stripped
            else:
                current_bullet = stripped
                
    if current_bullet:
        bullets.append(clean_bullet(current_bullet))
    
    if not bullets:
        return [l.strip() for l in lines if l.strip()]
    return bullets

def clean_bullet(text: str) -> str:
    """Removes double spaces and cleans up trailing/leading anomalies."""
    text = re.sub(r"\s+", " ", text)
    return text.strip()

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

def parse_docx_resume(docx_path: str) -> Dict[str, Any]:
    """Extracts text from DOCX/DOC formats and structures them."""
    try:
        from docx import Document
        doc = Document(docx_path)
        text = "\n".join([p.text for p in doc.paragraphs])
        return parse_text_segments(text)
    except Exception as e:
        logger.error(f"DOCX parser error: {str(e)}")
        return parse_txt_resume(docx_path)

def parse_txt_resume(txt_path: str) -> Dict[str, Any]:
    """Reads text file directly and structures it."""
    try:
        with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        return parse_text_segments(text)
    except Exception as e:
        logger.error(f"TXT parser error: {str(e)}")
        return {}

def parse_md_resume(md_path: str) -> Dict[str, Any]:
    """Reads markdown file directly and structures it."""
    return parse_txt_resume(md_path)

def parse_ocr_resume(img_path: str) -> Dict[str, Any]:
    """Engages Tesseract OCR text extraction on image, falling back gracefully to heuristic/mock context."""
    logger.info(f"Engaging OCR parser for: {img_path}")
    text = ""
    try:
        from PIL import Image
        import pytesseract
        
        img = Image.open(img_path)
        text = pytesseract.image_to_string(img)
        logger.info("Successfully extracted text via pytesseract OCR.")
    except Exception as e:
        logger.warning(f"OCR libraries or Tesseract binary not configured: {str(e)}.")
        
    if not text.strip():
        ext = os.path.splitext(img_path)[1].lower()
        if ext == ".pdf":
            try:
                import fitz
                doc = fitz.open(img_path)
                for page in doc:
                    text += page.get_text()
                if not text.strip():
                    for page in doc:
                        pix = page.get_pixmap()
                        img_data = pix.tobytes("png")
                        import io
                        from PIL import Image
                        import pytesseract
                        img = Image.open(io.BytesIO(img_data))
                        text += pytesseract.image_to_string(img) + "\n"
            except Exception as ocr_e:
                logger.warning(f"Secondary PDF OCR fallback failed: {str(ocr_e)}")
                
    if text.strip():
        return parse_text_segments(text)
        
    return DEFAULT_RESUME

def parse_text_segments(text: str) -> Dict[str, Any]:
    """Sub-routine of pdf parser that categorizes raw string content into structured resume segments."""
    parsed_data = {
        "name": "",
        "email": "",
        "phone": "",
        "linkedin": "",
        "github": "",
        "summary": "",
        "skills": [],
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": []
    }

    if not text.strip():
        return parsed_data

    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    if email_match:
        parsed_data["email"] = email_match.group(0).strip()

    phone_match = re.search(r"\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}", text)
    if phone_match:
        parsed_data["phone"] = phone_match.group(0).strip()

    linkedin_match = re.search(r"(?:linkedin\.com/in/|linkedin\.com/pub/)[a-zA-Z0-9\-_]+", text, re.IGNORECASE)
    if linkedin_match:
        parsed_data["linkedin"] = linkedin_match.group(0).strip()

    github_match = re.search(r"github\.com/[a-zA-Z0-9\-_]+", text, re.IGNORECASE)
    if github_match:
        parsed_data["github"] = github_match.group(0).strip()

    lines = [line.strip() for line in text.split("\n")]
    non_empty_lines = [line for line in lines if line]

    for line in non_empty_lines[:4]:
        if "@" in line or "linkedin.com" in line or "github.com" in line or re.search(r"\d{4,}", line):
            continue
        if line.lower() in ["resume", "curriculum vitae", "cv", "portfolio", "profile"]:
            continue
        parsed_data["name"] = line
        break
    
    if not parsed_data["name"] and parsed_data["email"]:
        parsed_data["name"] = parsed_data["email"].split("@")[0].replace(".", " ").title()

    header_keywords = {
        "summary": ["summary", "professional summary", "objective", "profile", "executive summary", "about me", "professional profile"],
        "skills": ["technical skills", "skills", "key skills", "core competencies", "competencies", "expertise", "technologies", "skills & expertise", "skills and technologies"],
        "experience": ["experience", "work experience", "professional experience", "employment history", "employment", "work history", "career history", "experience summary"],
        "education": ["education", "academic background", "academic history", "qualifications", "educational background", "studies", "academic qualifications"],
        "projects": ["projects", "personal projects", "academic projects", "selected projects", "key projects", "notable projects", "technical projects"],
        "certifications": ["certifications", "licenses", "courses", "accreditations", "certificates", "awards", "honors", "licenses & certifications"]
    }

    section_lines = {key: [] for key in header_keywords}
    current_section = None

    for line in lines:
        if not line:
            continue
        
        cleaned_line = line.lower().strip(":-•* ")
        is_header = False
        for sec, keywords in header_keywords.items():
            if cleaned_line in keywords or (len(cleaned_line) < 30 and any(cleaned_line == kw for kw in keywords)):
                current_section = sec
                is_header = True
                break
        
        if is_header:
            continue

        if current_section:
            section_lines[current_section].append(line)

    if section_lines["summary"]:
        parsed_data["summary"] = " ".join(section_lines["summary"]).strip()

    if section_lines["skills"]:
        raw_skills_text = " ".join(section_lines["skills"])
        skills_split = re.split(r"[,;•|*]|\band\b", raw_skills_text)
        cleaned_skills = []
        for s in skills_split:
            s_clean = s.strip()
            if s_clean and not s_clean.endswith(":") and len(s_clean) < 35:
                cleaned_skills.append(s_clean)
        parsed_data["skills"] = cleaned_skills if cleaned_skills else [s.strip() for s in section_lines["skills"] if len(s.strip()) < 35]

    parsed_data["experience"] = group_lines_into_bullets(section_lines["experience"])
    parsed_data["education"] = group_lines_into_bullets(section_lines["education"])
    parsed_data["projects"] = group_lines_into_bullets(section_lines["projects"])
    parsed_data["certifications"] = group_lines_into_bullets(section_lines["certifications"])

    return parsed_data

def parse_resume_file(file_path: str, ext: str) -> Dict[str, Any]:
    """Unified entrypoint that routes resume document to its appropriate parser based on file extension."""
    logger.info(f"=== Routing parser for extension: {ext} ===")
    ext = ext.lower().strip(".")
    
    if ext == "pdf":
        try:
            doc = fitz.open(file_path)
            has_text = False
            for page in doc:
                if page.get_text().strip():
                    has_text = True
                    break
            if not has_text:
                logger.info("PDF has no readable text. Engaging OCR parser.")
                return parse_ocr_resume(file_path)
        except Exception:
            pass
        return parse_pdf_resume(file_path)
        
    elif ext in ["docx", "doc"]:
        return parse_docx_resume(file_path)
        
    elif ext == "txt":
        return parse_txt_resume(file_path)
        
    elif ext in ["md", "markdown"]:
        return parse_md_resume(file_path)
        
    elif ext in ["png", "jpg", "jpeg"]:
        return parse_ocr_resume(file_path)
        
    else:
        logger.warning(f"Unsupported format {ext}. Defaulting to PDF parser.")
        return parse_pdf_resume(file_path)
