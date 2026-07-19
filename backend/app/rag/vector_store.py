import os
import logging
from typing import List, Dict, Any, Optional
from app.rag.document_loader import DocumentChunk

logger = logging.getLogger("app.rag.vector_store")

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db"))

class VectorStore:
    def __init__(self, collection_name: str = "resumepilot_knowledge"):
        self.collection_name = collection_name
        self.client = None
        self.collection = None
        self.initialize_store()

    def initialize_store(self):
        """Initializes persistent ChromaDB client and creates/gets collection."""
        try:
            import chromadb
            # Ensure path directory exists
            os.makedirs(DB_DIR, exist_ok=True)
            logger.info(f"Initializing persistent ChromaDB at directory: {DB_DIR}")
            self.client = chromadb.PersistentClient(path=DB_DIR)
            self.collection = self.client.get_or_create_collection(name=self.collection_name)
            logger.info(f"Collection '{self.collection_name}' initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {str(e)}")

    def add_chunks(self, chunks: List[DocumentChunk], embeddings: List[List[float]]):
        """Inserts text chunks along with generated embeddings into the vector database."""
        if not self.collection:
            logger.error("ChromaDB collection is not initialized.")
            return

        ids = [f"chunk_{i}_{hash(chunk.content)}" for i, chunk in enumerate(chunks)]
        documents = [chunk.content for chunk in chunks]
        metadatas = [{"source": chunk.source, "page": chunk.page} for chunk in chunks]

        try:
            self.collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            logger.info(f"Added {len(chunks)} chunks to collection '{self.collection_name}'.")
        except Exception as e:
            logger.error(f"Error adding chunks to vector store: {str(e)}")

    def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        """Queries database for top k similar chunks matching query embedding."""
        if not self.collection:
            logger.error("ChromaDB collection is not initialized.")
            return []

        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )
            
            # Reformat results into clean list of dicts
            formatted = []
            if results and "documents" in results and results["documents"]:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
                ids = results["ids"][0] if "ids" in results else [""] * len(docs)
                distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)

                for i in range(len(docs)):
                    # Compute similarity score from distance
                    # For cosine distance, similarity = 1 - distance
                    dist = distances[i]
                    similarity = round(max(0.0, 1.0 - dist), 4) if dist is not None else 1.0
                    
                    formatted.append({
                        "id": ids[i],
                        "content": docs[i],
                        "metadata": metas[i] or {},
                        "similarity": similarity
                    })
            return formatted
        except Exception as e:
            logger.error(f"Error querying ChromaDB: {str(e)}")
            return []

    def clear_collection(self):
        """Clears all records in the collection."""
        if not self.collection or not self.client:
            return
        try:
            self.client.delete_collection(name=self.collection_name)
            self.collection = self.client.get_or_create_collection(name=self.collection_name)
            logger.info(f"Cleared and recreated collection '{self.collection_name}'.")
        except Exception as e:
            logger.error(f"Failed to clear collection: {str(e)}")

    def get_stats(self) -> Dict[str, Any]:
        """Returns statistics of the vector database."""
        if not self.collection:
            return {"count": 0, "status": "Uninitialized"}
        try:
            count = self.collection.count()
            return {
                "count": count,
                "status": "Active",
                "embedding_model": "all-MiniLM-L6-v2",
                "database": "ChromaDB",
                "path": DB_DIR
            }
        except Exception as e:
            return {"count": 0, "status": f"Error: {str(e)}"}
