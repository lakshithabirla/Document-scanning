import os
import sys
import streamlit as st

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from src.pdf_loader import load_pdf
from src.chunker import chunk_text
from src.embeddings import generate_embeddings
from src.vector_store import create_index, add_embeddings
from src.retriever import retrieve_relevant_chunks, TOP_K, SIMILARITY_THRESHOLD

st.set_page_config(
    page_title="TrustRAG",
    page_icon="📄",
    layout="centered"
)

if "document_processed" not in st.session_state:
    st.session_state.document_processed = False
if "document_name" not in st.session_state:
    st.session_state.document_name = ""
if "page_count" not in st.session_state:
    st.session_state.page_count = 0
if "chunk_count" not in st.session_state:
    st.session_state.chunk_count = 0
if "chunks" not in st.session_state:
    st.session_state.chunks = []
if "faiss_index" not in st.session_state:
    st.session_state.faiss_index = None
if "search_results" not in st.session_state:
    st.session_state.search_results = None
if "last_question" not in st.session_state:
    st.session_state.last_question = ""


def reset_state():
    st.session_state.document_processed = False
    st.session_state.document_name = ""
    st.session_state.page_count = 0
    st.session_state.chunk_count = 0
    st.session_state.chunks = []
    st.session_state.faiss_index = None
    st.session_state.search_results = None
    st.session_state.last_question = ""


with st.sidebar:
    st.title("TrustRAG")
    st.subheader("About")
    st.write(
        "TrustRAG retrieves relevant information from uploaded PDF documents "
        "using semantic similarity search."
    )
    st.subheader("Technology")
    st.markdown("- Python\n- Streamlit\n- PyMuPDF\n- Sentence Transformers\n- FAISS")
    
    if st.session_state.document_processed:
        st.divider()
        if st.button("Clear Document", use_container_width=True):
            reset_state()
            st.rerun()

st.title("TrustRAG")
st.caption("Document Question Answering System")
st.write("Upload a PDF document and ask questions about its contents.")
st.divider()

st.subheader("Upload Document")
uploaded_file = st.file_uploader("Upload your PDF document", type=["pdf"])

if uploaded_file is not None:
    st.success(f"Document uploaded: {uploaded_file.name}")
    col1, col2 = st.columns([2, 1])
    with col1:
        process_clicked = st.button("Process Document", type="primary", use_container_width=True)
    with col2:
        if st.button("Clear Document", use_container_width=True):
            reset_state()
            st.rerun()

    if process_clicked:
        with st.status("Processing document...", expanded=True) as status:
            try:
                st.write("Reading document...")
                pages = load_pdf(uploaded_file)
                st.write(f"Extracted {len(pages)} page(s)")

                st.write("Creating document chunks...")
                chunks = chunk_text(pages)
                st.write(f"Generated {len(chunks)} text chunk(s)")

                st.write("Building semantic index...")
                texts = [c["text"] for c in chunks]
                embeddings = generate_embeddings(texts)
                index = create_index(embeddings.shape[1])
                add_embeddings(index, embeddings)

                st.session_state.document_processed = True
                st.session_state.document_name = uploaded_file.name
                st.session_state.page_count = len(pages)
                st.session_state.chunk_count = len(chunks)
                st.session_state.chunks = chunks
                st.session_state.faiss_index = index
                st.session_state.search_results = None

                status.update(label="Document ready!", state="complete", expanded=False)
            except Exception as e:
                status.update(label="Failed to process document", state="error", expanded=True)
                st.error(f"Error processing PDF: {e}")
                st.stop()
else:
    if st.session_state.document_processed:
        reset_state()

if st.session_state.document_processed:
    st.divider()
    st.subheader("Document Ready")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Document", st.session_state.document_name)
    c2.metric("Pages", st.session_state.page_count)
    c3.metric("Text Chunks", st.session_state.chunk_count)
    c4.metric("Status", "Ready")

    st.divider()
    st.subheader("Ask a question")
    with st.form("qa_form"):
        user_query = st.text_input(
            "Question",
            placeholder="Type your question about the document...",
            label_visibility="collapsed"
        )
        submitted = st.form_submit_button("Ask Question", type="primary")

    if submitted:
        if not user_query.strip():
            st.warning("Please enter a question.")
        else:
            st.session_state.last_question = user_query
            with st.spinner("Searching document..."):
                results = retrieve_relevant_chunks(
                    query=user_query,
                    chunks=st.session_state.chunks,
                    index=st.session_state.faiss_index,
                    top_k=TOP_K,
                    threshold=SIMILARITY_THRESHOLD
                )
                st.session_state.search_results = results

    if st.session_state.search_results is not None:
        results = st.session_state.search_results
        st.subheader("Relevant Information")

        if not results:
            st.warning("No sufficiently relevant information was found in the provided document.")
        else:
            top_match = results[0]
            pct = int(round(top_match["similarity"] * 100))
            st.markdown(f'> "{top_match["text"]}"')

            st.markdown("#### Source")
            col_a, col_b, col_c = st.columns(3)
            col_a.markdown(f"**Document:** `{st.session_state.document_name}`")
            col_b.markdown(f"**Page:** `{top_match['page_number']}`")
            col_c.markdown(f"**Relevance:** `{pct}%`")

            if len(results) > 1:
                st.write("")
                with st.expander(f"Additional Results ({len(results) - 1} more)"):
                    for i, res in enumerate(results[1:], start=2):
                        res_pct = int(round(res["similarity"] * 100))
                        st.markdown(f"**Result {i}**")
                        st.markdown(f'> "{res["text"]}"')
                        st.caption(f"Page {res['page_number']} | Relevance: {res_pct}%")
                        st.divider()
else:
    if not uploaded_file:
        st.info("Please upload a PDF document first.")
