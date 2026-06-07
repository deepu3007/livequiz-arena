from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from app.db.mongodb import get_database
from app.schemas.session import StartSessionRequest
from app.utils.room_code import generate_room_code

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("/start", status_code=status.HTTP_201_CREATED)
async def start_session(payload: StartSessionRequest):
    db = get_database()

    quiz = await db.quizzes.find_one({"_id": payload.quiz_id})

    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )

    room_code = generate_room_code()

    while await db.sessions.find_one({"room_code": room_code}):
        room_code = generate_room_code()

    session_doc = {
        "_id": str(uuid4()),
        "quiz_id": payload.quiz_id,
        "quiz_title": quiz["title"],
        "room_code": room_code,
        "status": "waiting",
        "current_question_index": None,
        "students": [],
        "answers": [],
        "scores": {},
        "created_at": datetime.now(timezone.utc),
        "started_at": None,
        "ended_at": None
    }

    await db.sessions.insert_one(session_doc)

    return {
        "message": "Session started successfully",
        "room_code": room_code,
        "session": session_doc
    }


@router.get("")
async def get_all_sessions():
    db = get_database()

    sessions_cursor = db.sessions.find({}).sort("created_at", -1)
    sessions = await sessions_cursor.to_list(length=100)

    return {
        "count": len(sessions),
        "sessions": sessions
    }


@router.get("/{room_code}")
async def get_session_by_room_code(room_code: str):
    db = get_database()

    session = await db.sessions.find_one({"room_code": room_code.upper()})

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    return {
        "session": session
    }