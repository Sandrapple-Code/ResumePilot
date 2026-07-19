import os
import logging
from typing import Dict, Any
from app.rag.document_loader import load_directory
from app.rag.embedding_service import EmbeddingService
from app.rag.vector_store import VectorStore

logger = logging.getLogger("app.rag.index_builder")

def index_kb_directory(kb_dir: str, collection_name: str = "resumepilot_knowledge") -> Dict[str, Any]:
    """Scans and indexes all documents inside the knowledge base directory into ChromaDB."""
    logger.info(f"Starting indexing for knowledge base folder: {kb_dir}")
    
    # 1. Load and chunk documents
    chunks = load_directory(kb_dir)
    if not chunks:
        logger.warning("No knowledge base documents found or parsed.")
        return {"chunks_indexed": 0, "status": "No documents found"}

    logger.info(f"Loaded {len(chunks)} text chunks. Generating embeddings...")
    
    # 2. Initialize services
    embedder = EmbeddingService()
    store = VectorStore(collection_name=collection_name)
    
    # 3. Clear existing database collection to prevent duplicates
    store.clear_collection()
    
    # 4. Generate embeddings
    texts = [chunk.content for chunk in chunks]
    embeddings = embedder.embed_documents(texts)
    
    # 5. Insert into vector store
    store.add_chunks(chunks, embeddings)
    
    logger.info(f"Successfully indexed {len(chunks)} chunks into vector store.")
    return {
        "chunks_indexed": len(chunks),
        "status": "Success",
        "sources": list(set([chunk.source for chunk in chunks]))
    }
