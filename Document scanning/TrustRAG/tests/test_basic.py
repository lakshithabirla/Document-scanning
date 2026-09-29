import os
import sys
import unittest

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(TEST_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.pdf_loader import load_pdf
from src.chunker import chunk_text

try:
    import numpy as np
    import faiss
    from src.vector_store import create_index, add_embeddings, search_embeddings
    from src.retriever import retrieve_relevant_chunks
    DEPS_AVAILABLE = True
except ImportError:
    DEPS_AVAILABLE = False


class TestPDFLoader(unittest.TestCase):
    def test_missing_file(self):
        with self.assertRaises(FileNotFoundError):
            load_pdf("missing_file_123.pdf")

    def test_invalid_extension(self):
        with self.assertRaises(ValueError):
            load_pdf("notes.txt")

    def test_empty_input(self):
        with self.assertRaises(ValueError):
            load_pdf("")


class TestChunker(unittest.TestCase):
    def test_chunking_metadata(self):
        pages = [
            {"page_number": 1, "text": "This is page one text."},
            {"page_number": 2, "text": "This is page two text."}
        ]
        chunks = chunk_text(pages, chunk_size=50, overlap=10)
        self.assertEqual(len(chunks), 2)
        self.assertEqual(chunks[0]["page_number"], 1)
        self.assertEqual(chunks[1]["page_number"], 2)

    def test_sliding_window_overlap(self):
        words = [f"w{i}" for i in range(150)]
        pages = [{"page_number": 1, "text": " ".join(words)}]
        chunks = chunk_text(pages, chunk_size=100, overlap=20)
        self.assertEqual(len(chunks), 2)
        chunk1_words = chunks[0]["text"].split()
        chunk2_words = chunks[1]["text"].split()
        self.assertEqual(len(chunk1_words), 100)
        self.assertEqual(chunk1_words[-20:], chunk2_words[:20])

    def test_empty_pages(self):
        pages = [{"page_number": 1, "text": "   "}]
        chunks = chunk_text(pages)
        self.assertEqual(len(chunks), 0)

    def test_invalid_params(self):
        pages = [{"page_number": 1, "text": "Sample text"}]
        with self.assertRaises(ValueError):
            chunk_text(pages, chunk_size=0)
        with self.assertRaises(ValueError):
            chunk_text(pages, chunk_size=50, overlap=50)


@unittest.skipUnless(DEPS_AVAILABLE, "Dependencies required for FAISS test")
class TestVectorSearch(unittest.TestCase):
    def setUp(self):
        self.dim = 4
        self.mock_embeddings = np.array([
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0]
        ], dtype=np.float32)
        self.mock_chunks = [
            {"chunk_id": "c1", "page_number": 1, "text": "Information about Topic A."},
            {"chunk_id": "c2", "page_number": 2, "text": "Information about Topic B."}
        ]

    def test_index_and_search(self):
        index = create_index(self.dim)
        add_embeddings(index, self.mock_embeddings)
        self.assertEqual(index.ntotal, 2)
        query = np.array([[1.0, 0.0, 0.0, 0.0]], dtype=np.float32)
        scores, ids = search_embeddings(index, query, top_k=1)
        self.assertEqual(ids[0][0], 0)
        self.assertAlmostEqual(float(scores[0][0]), 1.0, places=3)

    def test_retriever_structure(self):
        from unittest.mock import patch
        index = create_index(self.dim)
        add_embeddings(index, self.mock_embeddings)
        with patch("src.retriever.generate_query_embedding", return_value=np.array([[1.0, 0.0, 0.0, 0.0]], dtype=np.float32)):
            results = retrieve_relevant_chunks("Topic A", self.mock_chunks, index, top_k=1, threshold=0.5)
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0]["page_number"], 1)
            self.assertEqual(results[0]["chunk_id"], "c1")


if __name__ == "__main__":
    unittest.main()
