import os
from typing import List, Dict, Any

class DocumentChunk:
    def __init__(self, content: str, source: str, page: int = 1):
        self.content = content
        self.source = source
        self.page = page

def split_text(text: str, chunk_size: int = 600, chunk_overlap: int = 100) -> List[str]:
    """Splits a text block into overlapping chunks."""
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= text_len:
            break
        start += chunk_size - chunk_overlap
        
    return chunks

def load_markdown_file(file_path: str) -> List[DocumentChunk]:
    """Loads markdown file contents and returns document chunks."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
        source_name = os.path.basename(file_path).replace(".md", "").replace("_", " ").title()
        raw_chunks = split_text(text)
        return [DocumentChunk(content=chunk, source=source_name) for chunk in raw_chunks]
    except Exception as e:
        print(f"Error loading markdown {file_path}: {str(e)}")
        return []

def load_txt_file(file_path: str) -> List[DocumentChunk]:
    """Loads plain text file contents and returns document chunks."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
        source_name = os.path.basename(file_path).replace(".txt", "").replace("_", " ").title()
        raw_chunks = split_text(text)
        return [DocumentChunk(content=chunk, source=source_name) for chunk in raw_chunks]
    except Exception as e:
        print(f"Error loading txt {file_path}: {str(e)}")
        return []

def load_pdf_file(file_path: str) -> List[DocumentChunk]:
    """Loads PDF pages using PyMuPDF and returns document chunks."""
    chunks = []
    source_name = os.path.basename(file_path).replace(".pdf", "").replace("_", " ").title()
    try:
        import fitz
        doc = fitz.open(file_path)
        for i, page in enumerate(doc):
            text = page.get_text()
            page_chunks = split_text(text)
            for chunk in page_chunks:
                chunks.append(DocumentChunk(content=chunk, source=source_name, page=i + 1))
    except Exception as e:
        print(f"Error loading PDF {file_path}: {str(e)}")
    return chunks

def load_directory(directory_path: str) -> List[DocumentChunk]:
    """Crawls a directory for md, txt, and pdf files to chunk."""
    all_chunks = []
    if not os.path.exists(directory_path):
        return all_chunks
        
    for root, _, files in os.walk(directory_path):
        for file in files:
            file_path = os.path.join(root, file)
            ext = os.path.splitext(file)[1].lower()
            if ext == ".md":
                all_chunks.extend(load_markdown_file(file_path))
            elif ext == ".txt":
                all_chunks.extend(load_txt_file(file_path))
            elif ext == ".pdf":
                all_chunks.extend(load_pdf_file(file_path))
                
    return all_chunks
