from typing import Any, Dict, List


def chunk_text(
    pages: List[Dict[str, Any]],
    chunk_size: int = 120,
    overlap: int = 25
) -> List[Dict[str, Any]]:
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be non-negative and less than chunk_size")

    chunks = []
    chunk_num = 1

    for page in pages:
        page_num = page.get("page_number", 1)
        text = page.get("text", "").strip()
        if not text:
            continue

        words = text.split()
        if not words:
            continue

        if len(words) <= chunk_size:
            chunks.append({
                "chunk_id": f"p{page_num}_c{chunk_num}",
                "page_number": page_num,
                "text": " ".join(words)
            })
            chunk_num += 1
            continue

        step = chunk_size - overlap
        for start_idx in range(0, len(words), step):
            end_idx = min(start_idx + chunk_size, len(words))
            chunk_words = words[start_idx:end_idx]

            chunks.append({
                "chunk_id": f"p{page_num}_c{chunk_num}",
                "page_number": page_num,
                "text": " ".join(chunk_words)
            })
            chunk_num += 1

            if end_idx >= len(words):
                break

    return chunks
