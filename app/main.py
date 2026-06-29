from fastapi import FastAPI
from app.api.accidents import router as accident_router
from app.api import metadata
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Accident Data Platform"
)



@app.get("/")
def root():
    return {
        "message": "Accident Data Platform API"
    }
    
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(accident_router)
app.include_router(metadata.router)  