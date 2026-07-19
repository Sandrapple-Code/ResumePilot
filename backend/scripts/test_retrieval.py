import os
import sys
import logging

# Ensure backend directory is in the PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.rag.retriever import Retriever

def main():
    # Retrieve query from arguments, default to a standard question
    query = "Explain Google's X-Y-Z formula for resumes"
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        
    print(f"Testing Retrieval for Query: '{query}'")
    print("==================================================\n")
    
    retriever = Retriever()
    merged_context, sources, matches = retriever.retrieve_context(query, top_k=5)
    
    print(f"Total Matches Found: {len(matches)}")
    print(f"Sources Used:        {', '.join(sources)}")
    print("--------------------------------------------------\n")
    
    for idx, match in enumerate(matches):
        print(f"Match #{idx + 1}")
        print(f"Source:     {match['metadata'].get('source', 'Unknown')}")
        print(f"Page:       {match['metadata'].get('page', 1)}")
        print(f"Similarity: {match['similarity']}")
        print(f"Content:\n{match['content']}")
        print("--------------------------------------------------\n")

if __name__ == "__main__":
    main()
