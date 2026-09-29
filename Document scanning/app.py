import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
TRUST_RAG_DIR = os.path.join(CURRENT_DIR, "TrustRAG")
if TRUST_RAG_DIR not in sys.path:
    sys.path.insert(0, TRUST_RAG_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from TrustRAG.app import *
