import os
import sys
import logging

# Set up logging to stdout
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Ensure backend directory is in the PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.rag.index_builder import index_kb_directory

def main():
    kb_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "knowledge_base"))
    print(f"Starting Knowledge Base Indexing from: {kb_dir}")
    
    try:
        stats = index_kb_directory(kb_dir)
        print("\n==========================================")
        print("KNOWLEDGE BASE INDEXING COMPLETE")
        print("==========================================")
        print(f"Status:         {stats.get('status')}")
        print(f"Chunks Indexed: {stats.get('chunks_indexed')}")
        print(f"Indexed Sources: {', '.join(stats.get('sources', []))}")
        print("==========================================\n")
    except Exception as e:
        print(f"\n❌ Error during indexing: {str(e)}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
