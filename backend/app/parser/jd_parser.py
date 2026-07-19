import os
import fitz  # PyMuPDF
from docx import Document
import logging

logger = logging.getLogger("app.parser.jd")

def parse_jd_file(file_path: str, ext: str) -> str:
    """Extracts raw text from PDF, DOCX, or TXT file."""
    ext = ext.lower().strip(".")
    text = ""
    
    if ext == "pdf":
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
        except Exception as e:
            logger.error(f"Error reading PDF job description: {str(e)}")
            text = f"Error reading PDF: {str(e)}"
            
    elif ext == "docx":
        try:
            doc = Document(file_path)
            paragraphs_text = [paragraph.text for paragraph in doc.paragraphs]
            text = "\n".join(paragraphs_text)
        except Exception as e:
            logger.error(f"Error reading DOCX job description: {str(e)}")
            text = f"Error reading DOCX: {str(e)}"
            
    elif ext == "txt":
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except Exception as e:
            logger.error(f"Error reading TXT job description: {str(e)}")
            text = f"Error reading TXT: {str(e)}"
            
    else:
        text = "Unsupported file type."
        
    return text.strip()
