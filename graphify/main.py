from fastapi import FastAPI, HTTPException
import os

# Attempt to import Graphify, with fallback if library has issues
try:
    from graphifyy import Graphify
    IS_MOCK = False
except ImportError:
    print("Warning: graphifyy library not found or failed to import. Using mock Graphify.")
    IS_MOCK = True
    class Graphify:
        def __init__(self, source_dir):
            pass
        def query(self, q):
            return {"context": f"Mock Graphify context for query: {q}"}

app = FastAPI(title="Graphify Microservice")

# Initialize graphify on startup
WORKSPACE_DIR = "/workspace"
graph = None

@app.on_event("startup")
def startup_event():
    global graph
    print("Initializing Graphify Knowledge Graph...")
    if os.path.exists(WORKSPACE_DIR):
        graph = Graphify(source_dir=WORKSPACE_DIR)
        print("Graphify initialized successfully.")
    else:
        print(f"Warning: {WORKSPACE_DIR} does not exist.")

@app.get("/query")
def query_graph(q: str):
    if graph is None:
        raise HTTPException(status_code=500, detail="Graphify not initialized")
    
    try:
        results = graph.query(q)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {
        "status": "healthy", 
        "graph_initialized": graph is not None,
        "is_mock": IS_MOCK
    }
