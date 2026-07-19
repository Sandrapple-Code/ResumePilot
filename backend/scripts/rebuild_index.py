import os
import sys
import shutil
import logging

# Set up logging to stdout
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Ensure backend directory is in the PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.rag.vector_store import DB_DIR
from scripts.build_index import main as build_main

def main():
    print("WARNING: This will clear the persistent ChromaDB database folder and rebuild.")
    print(f"Database Directory Target: {DB_DIR}")
    
    if os.path.exists(DB_DIR):
        print("Clearing old vector database files...")
        try:
            # We clear database directory completely
            shutil.rmtree(DB_DIR)
            print("Database directory removed successfully.")
        except Exception as e:
            print(f"Failed to clear database folder: {str(e)}. Proceeding anyway...")
            
    build_main()

if __name__ == "__main__":
    main()
