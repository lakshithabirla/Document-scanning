from typing import Any, Dict, List
import faiss
from src.embeddings import generate_query_embedding
from src.vector_store import search_embeddings

TOP_K = 3
SIMILARITY_THRESHOLD = 0.35


def retrieve_relevant_chunks(
    query: str,
    chunks: List[Dict[str, Any]],
    index: faiss.IndexFlatIP,
    top_k: int = TOP_K,
    threshold: float = SIMILARITY_THRESHOLD
) -> List[Dict[str, Any]]:
    clean_query = query.strip()
    if not clean_query or not chunks or index is None or index.ntotal == 0:
        return []

    query_vector = generate_query_embedding(clean_query)
    scores, indices = search_embeddings(index, query_vector, top_k=top_k)

    results = []
    if len(scores) > 0 and len(indices) > 0:
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            similarity = float(score)
            if similarity < threshold:
                continue
            if 0 <= idx < len(chunks):
                item = chunks[idx]
                results.append({
                    "chunk_id": item.get("chunk_id", f"c_{idx}"),
                    "page_number": item.get("page_number", 1),
                    "similarity": round(similarity, 2),
                    "text": item.get("text", "")
                })

    return results
