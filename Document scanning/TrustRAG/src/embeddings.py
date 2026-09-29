from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer

_model: Optional[SentenceTransformer] = None


def get_model(model_name: str = "all-MiniLM-L6-v2") -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(model_name)
    return _model


def generate_embeddings(texts: List[str]) -> np.ndarray:
    if not texts:
        return np.empty((0, 384), dtype=np.float32)
    model = get_model()
    embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings.astype(np.float32)


def generate_query_embedding(query: str) -> np.ndarray:
    clean_query = query.strip()
    if not clean_query:
        raise ValueError("Query cannot be empty.")
    model = get_model()
    vector = model.encode([clean_query], convert_to_numpy=True, normalize_embeddings=True)
    return vector.astype(np.float32)
