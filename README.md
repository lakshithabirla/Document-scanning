# 📄 Document Scanning

### AI-Powered Document Question Answering System

**Powered by Lakshitha Birla**

Document Scanning is a lightweight PDF question-answering system that allows users to upload a document and ask questions about its content.

It uses **PyMuPDF, Sentence Transformers, FAISS, and Streamlit** to extract, process, and semantically search document content.

## ✨ Features

* Upload PDF documents
* Extract and clean text
* Semantic search using embeddings
* FAISS-based similarity search
* Shows relevant passages
* Displays source page numbers
* Displays similarity scores
* Local processing without cloud APIs

## 🛠️ Technologies

* Python
* Streamlit
* PyMuPDF
* Sentence Transformers
* FAISS
* NumPy

## 📁 Project Structure

```text
Document-Scanning/
├── app.py
├── main.py
├── requirements.txt
├── README.md
├── data/
│   └── documents/
├── src/
│   ├── pdf_loader.py
│   ├── chunker.py
│   ├── embeddings.py
│   ├── vector_store.py
│   └── retriever.py
└── tests/
    └── test_basic.py
```

## ▶️ Run the Project

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

Then open:

```text
http://localhost:8501
```

## 📖 How It Works

```text
PDF
 ↓
Text Extraction
 ↓
Text Chunking
 ↓
Embeddings
 ↓
FAISS Search
 ↓
Relevant Passage + Page Number
```

## 🧪 Run Tests

```bash
python -m unittest tests/test_basic.py
```

## 👨‍💻 Credits

**Document Scanning**
**Powered by Lakshitha Birla**

© 2026 Lakshitha Birla
