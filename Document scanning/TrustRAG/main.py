import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from src.pdf_loader import load_pdf
from src.chunker import chunk_text
from src.embeddings import generate_embeddings
from src.vector_store import create_index, add_embeddings
from src.retriever import retrieve_relevant_chunks, TOP_K, SIMILARITY_THRESHOLD


def main():
    print("=" * 40)
    print("        TRUSTRAG")
    print(" DOCUMENT QUESTION ANSWERING SYSTEM")
    print("=" * 40)

    while True:
        try:
            pdf_path = input("\nEnter PDF path: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            sys.exit(0)

        if not pdf_path:
            continue

        if not os.path.isfile(pdf_path):
            print("Error: PDF file not found.")
            continue

        try:
            print("\nReading PDF pages...")
            pages = load_pdf(pdf_path)
            print(f"Extracted {len(pages)} page(s).")
            break
        except Exception as e:
            print(f"Error: {e}")

    try:
        print("Splitting text into chunks...")
        chunks = chunk_text(pages)
        if not chunks:
            print("Error: No readable text found in document.")
            sys.exit(1)
        print(f"Generated {len(chunks)} chunks.")

        print("Generating embeddings...")
        texts = [c["text"] for c in chunks]
        embeddings = generate_embeddings(texts)

        print("Building FAISS index...")
        index = create_index(embeddings.shape[1])
        add_embeddings(index, embeddings)
        print("System ready for questions!\n")
    except Exception as e:
        print(f"Initialization error: {e}")
        sys.exit(1)

    doc_name = os.path.basename(pdf_path)

    while True:
        try:
            question = input("Enter your question: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting. Goodbye!")
            break

        if not question:
            print("Please enter a question.\n")
            continue

        results = retrieve_relevant_chunks(
            query=question,
            chunks=chunks,
            index=index,
            top_k=TOP_K,
            threshold=SIMILARITY_THRESHOLD
        )

        print("\n" + "=" * 40)
        print("SEARCH RESULTS")
        print("=" * 40)

        if not results:
            print("\nNo sufficiently relevant information was found in the provided document.\n")
        else:
            for rank, item in enumerate(results, start=1):
                print(f"\nResult {rank}")
                print(f"Source: {doc_name}")
                print(f"Page: {item['page_number']}")
                print(f"Similarity: {item['similarity']:.2f}\n")
                print(item["text"])
            print()

        try:
            choice = input("Would you like to ask another question? (y/n): ").strip().lower()
            if choice not in ("y", "yes"):
                print("\nGoodbye!")
                break
            print()
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye!")
            break


if __name__ == "__main__":
    main()
