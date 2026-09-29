Document Scanning  — Document Question Answering System
A lightweight question-answering project for analyzing real PDF documents using semantic search (PyMuPDF, Sentence Transformers, FAISS, and Streamlit).
What It Does
TrustRAG allows you to upload any text-based PDF document (e.g., lecture slides, textbook chapters, research papers, or syllabus documents) and ask questions about its content.
Instead of generating unverified text or calling expensive cloud APIs, TrustRAG retrieves the exact relevant passages directly from your document, showing the exact page number and a relevance score.
Project Structure
code
Text
TrustRAG/
├── app.py                    # Streamlit web application
├── main.py                   # Terminal CLI alternative
├── requirements.txt          # Project dependencies
├── README.md                 # Setup and run instructions
│
├── data/
│   └── documents/
│       └── sample.pdf        # Sample document for testing
│
├── src/
│   ├── __init__.py
│   ├── pdf_loader.py         # PyMuPDF text extraction with text cleaning
│   ├── chunker.py            # Word sliding-window chunking with overlap
│   ├── embeddings.py         # all-MiniLM-L6-v2 local vector generator
│   ├── vector_store.py       # FAISS inner product index
│   └── retriever.py          # Top-3 similarity search with threshold
│
└── tests/
    ├── __init__.py
    └── test_basic.py         # Unit tests
Running in VS Code
1. Open the project in VS Code
Open VS Code, click File > Open Folder..., and select the TrustRAG folder.
2. Open the Integrated Terminal
Press Ctrl + ` (backtick) or go to Terminal > New Terminal.
3. Create and activate a virtual environment
On Windows:
code
Bash
python -m venv venv
venv\Scripts\activate
On macOS / Linux:
code
Bash
python3 -m venv venv
source venv/bin/activate
4. Install dependencies
code
Bash
pip install -r requirements.txt
5. Launch the application
code
Bash
streamlit run app.py
VS Code or your terminal will display a local URL (usually http://localhost:8501). Your web browser will open automatically.
How to Analyze Real Documents
Upload your PDF: Click Browse files and pick any text-based PDF from your computer (e.g. course notes, research paper, technical documentation).
Process Document: Click Process Document. The system will:
Extract text page-by-page while cleaning line breaks and hyphenated words.
Segment the text into word-safe chunks preserving original page numbers.
Compute 384-dimensional dense embeddings locally on CPU.
Index the embeddings into an in-memory FAISS index.
Ask Questions: Enter any question related to the document (e.g., "What are the main components of the architecture?").
Inspect the Answer: The system displays the most relevant passage from your document along with the exact source page and similarity score.
Clear & Switch: Use Clear Document at any time to reset and analyze a different PDF.
Note: For scanned PDFs (images of physical paper), text must be OCR-selectable for PyMuPDF to extract it.
Running Unit Tests
To run the automated tests from the terminal:
code
Bash
python -m unittest tests/test_basic.py
or
code
Bash
pytest

## Powered BY ##
Lakshitha Birla.
