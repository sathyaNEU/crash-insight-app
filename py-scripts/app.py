import os
from fastapi import FastAPI, Query, HTTPException, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone

load_dotenv()

app = FastAPI(title="Incident Retrieval API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:3000"],  # Your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Initialize Pinecone and embeddings
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
index_name = os.getenv("PINECONE_INDEX_NAME")

# Initialize vector store
vector_store = PineconeVectorStore(
    index_name=index_name,
    embedding=embeddings
)

@app.get("/retrieve")
async def retrieve(
    q: str = Query(..., description="Search query"),
    k: int = Query(5, description="Number of results to return", ge=1, le=100)
):
    if not q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    
    try:
        # Perform similarity search
        results = vector_store.similarity_search(q, k=k)
        
        # Format response
        chunks = [
            {
                "content": doc.page_content,
                "metadata": {
                    "incident_id": doc.metadata.get("incident_id"),
                    "crash_num": doc.metadata.get("crash_num"),
                    "incident_date": doc.metadata.get("incident_date")
                }
            }
            for doc in results
        ]
        
        return {
            "query": q,
            "k": k,
            "results": chunks
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving results: {str(e)}")

@app.get("/health")
async def health():
    return Response(status_code=200)