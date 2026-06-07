from fastapi import APIRouter

from app.db.mongodb import get_database

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check():
    return {
        "status": "ok",
        "service": "backend"
    }


@router.get("/db")
async def database_health_check():
    db = get_database()
    collections = await db.list_collection_names()

    return {
        "status": "ok",
        "database": db.name,
        "collections": collections
    }