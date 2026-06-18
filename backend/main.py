from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analysis, sessions

app = FastAPI(title="Process Mining Studio v2", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
