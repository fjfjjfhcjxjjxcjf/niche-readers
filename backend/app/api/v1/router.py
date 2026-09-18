from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, books, library, authors, admin, annotations, stats

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(books.router, prefix="/books", tags=["books"])
api_router.include_router(authors.router, prefix="/authors", tags=["authors"])
api_router.include_router(library.router, prefix="/library", tags=["library"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(annotations.router, prefix="/library/annotations", tags=["annotations"])
api_router.include_router(stats.router, prefix="/library/stats", tags=["stats"])
