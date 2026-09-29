from typing import Tuple
import faiss
import numpy as np


def create_index(embedding_dim: int) -> faiss.IndexFlatIP:
    if embedding_dim <= 0:
        raise ValueError("Invalid embedding dimension.")
    return faiss.IndexFlatIP(embedding_dim)


def add_embeddings(index: faiss.IndexFlatIP, embeddings: np.ndarray) -> None:
    if embeddings.ndim != 2:
        raise ValueError("Embeddings array must be 2-dimensional.")
    if embeddings.dtype != np.float32:
        embeddings = embeddings.astype(np.float32)
    index.add(embeddings)


def search_embeddings(
    index: faiss.IndexFlatIP,
    query_embedding: np.ndarray,
    top_k: int = 3
) -> Tuple[np.ndarray, np.ndarray]:
    if index.ntotal == 0:
        raise ValueError("Index contains no vectors.")

    if query_embedding.ndim == 1:
        query_embedding = np.expand_dims(query_embedding, axis=0)

    if query_embedding.dtype != np.float32:
        query_embedding = query_embedding.astype(np.float32)

    k = min(top_k, index.ntotal)
    return index.search(query_embedding, k)
