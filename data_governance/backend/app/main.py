# main.py or wherever your FastAPI app is defined
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router

app = FastAPI(title="Data Governance API")

# ✅ Include your API router
app.include_router(api_router, prefix="/api")

# ✅ Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}

# ✅ Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],        # GET, POST, etc.
    allow_headers=["*"],        # Allow all headers
)