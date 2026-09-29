import os
import re
from typing import Any, Dict, List, Union

try:
    import fitz
except ImportError:
    fitz = None


def clean_extracted_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'-\n\s*', '', text)
    text = re.sub(r'\s*\n\s*', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def load_pdf(file_input: Union[str, bytes, Any]) -> List[Dict[str, Any]]:
    if file_input is None:
        raise ValueError("No file provided.")

    if isinstance(file_input, str):
        if not file_input.strip():
            raise ValueError("Invalid file path.")
        if not file_input.lower().endswith(".pdf"):
            raise ValueError("File must be a PDF document.")
        if not os.path.exists(file_input):
            raise FileNotFoundError(f"PDF file not found: {file_input}")

    if fitz is None:
        raise ImportError("PyMuPDF is not installed. Run: pip install pymupdf")

    doc = None
    try:
        if isinstance(file_input, str):
            try:
                doc = fitz.open(file_input)
            except Exception as e:
                raise ValueError(f"Could not open PDF file: {e}")
        else:
            if hasattr(file_input, "seek"):
                try:
                    file_input.seek(0)
                except Exception:
                    pass

            if hasattr(file_input, "getvalue"):
                data = file_input.getvalue()
            elif hasattr(file_input, "read"):
                data = file_input.read()
            elif isinstance(file_input, bytes):
                data = file_input
            else:
                raise ValueError("Unsupported file format.")

            if not data:
                raise ValueError("The uploaded PDF file is empty.")

            if not data.startswith(b"%PDF"):
                raise ValueError("The file is not a valid PDF.")

            try:
                doc = fitz.open(stream=data, filetype="pdf")
            except Exception as e:
                raise ValueError(f"Could not parse PDF: {e}")

        if len(doc) == 0:
            raise ValueError("The PDF has no pages.")

        pages_data = []
        for index in range(len(doc)):
            raw_text = doc[index].get_text() or ""
            cleaned = clean_extracted_text(raw_text)
            if cleaned:
                pages_data.append({
                    "page_number": index + 1,
                    "text": cleaned
                })

        if not pages_data:
            raise ValueError("No readable text found in this PDF. It might be scanned or image-only.")

        return pages_data
    finally:
        if doc is not None:
            doc.close()
