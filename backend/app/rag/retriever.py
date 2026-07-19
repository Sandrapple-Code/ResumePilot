import logging
from typing import List, Dict, Any, Tuple
from app.rag.embedding_service import EmbeddingService
from app.rag.vector_store import VectorStore

logger = logging.getLogger("app.rag.retriever")

class Retriever:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2", collection_name: str = "resumepilot_knowledge"):
        self.embedding_service = EmbeddingService(model_name=model_name)
        self.vector_store = VectorStore(collection_name=collection_name)

    def retrieve_context(self, query: str, top_k: int = 4) -> Tuple[str, List[str], List[Dict[str, Any]]]:
        """Searches vector store and returns merged context, source list, and matched chunks details."""
        if not query or not query.strip():
            return "", [], []

        logger.info(f"Retrieving context for query: {query}")
        
        # 1. Embed query
        query_emb = self.embedding_service.embed_query(query)
        
        # 2. Query VectorStore
        matches = self.vector_store.search(query_emb, top_k=top_k)
        
        # 3. Merge contexts and extract distinct sources
        contexts = []
        sources = []
        
        for match in matches:
            content = match["content"]
            source = match["metadata"].get("source", "Knowledge Document")
            
            contexts.append(f"Source: {source}\nContent: {content}")
            if source not in sources:
                sources.append(source)
                
        merged_context = "\n\n---\n\n".join(contexts)
        logger.info(f"Retrieved {len(matches)} relevant chunks from sources: {sources}")
        
        return merged_context, sources, matches
