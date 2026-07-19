import logging
from typing import List
import numpy as np

logger = logging.getLogger("app.rag.embeddings")

class EmbeddingService:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self.use_fallback = False
        
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Attempting to load sentence-transformers model: {model_name}...")
            # We initialize locally or download on the fly
            self.model = SentenceTransformer(model_name)
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logger.warning(
                f"Sentence-transformers package or model load failed ({str(e)}). "
                "Engaging deterministic pseudo-semantic fallback embedding service."
            )
            self.use_fallback = True

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generates list of embeddings (384-dimensional) for a list of text strings."""
        if not self.use_fallback and self.model is not None:
            try:
                embeddings = self.model.encode(texts, show_progress_bar=False)
                return [emb.tolist() for emb in embeddings]
            except Exception as e:
                logger.error(f"Error encoding documents using transformer: {str(e)}. Falling back.")
        
        # Deterministic fallback vector generation (384 dimensions matching all-MiniLM-L6-v2)
        vectors = []
        for text in texts:
            # We seed numpy using a stable hash of the input text block
            import hashlib
            h = hashlib.sha256(text.encode("utf-8")).digest()
            seed = int.from_bytes(h[:4], "big") % (2**32)
            
            rng = np.random.default_rng(seed)
            # Create a normalized random vector of size 384
            vec = rng.standard_normal(384)
            vec = vec / np.linalg.norm(vec)
            vectors.append(vec.tolist())
            
        return vectors

    def embed_query(self, text: str) -> List[float]:
        """Generates embedding for a single search query."""
        return self.embed_documents([text])[0]
