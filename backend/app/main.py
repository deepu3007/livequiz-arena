from fastapi import FastAPI

from app.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.routers import health, quizzes, session, websocket

app = FastAPI(
    title=settings.app_name,
    description="A real-time classroom quiz platform using FastAPI and WebSockets",
    version="1.0.0"
)


@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()


app.include_router(health.router)
app.include_router(quizzes.router)
app.include_router(session.router)
app.include_router(websocket.router)


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.app_name} API",
        "status": "running",
        "environment": settings.environment
    }