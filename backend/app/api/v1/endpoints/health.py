from fastapi import APIRouter

router = APIRouter()


@router.get("/health", status_code=200)
async def health_check():
    return {
        "status": "healthy",
        "service": "book-platform-api"
    }
