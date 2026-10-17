from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "True Cost Portal - Python FastAPI Backend",
        "version": "2.0.0"
    }
