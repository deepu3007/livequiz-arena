from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from app.db.mongodb import get_database
from app.schemas.quiz import QuizCreate

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_quiz(payload: QuizCreate):
    for question in payload.questions:
        if question.correct_option_index >= len(question.options):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="correct_option_index must point to one of the options"
            )

    db = get_database()

    quiz_doc = {
        "_id": str(uuid4()),
        "title": payload.title,
        "description": payload.description,
        "questions": [
            {
                "id": str(uuid4()),
                "text": question.text,
                "options": question.options,
                "correct_option_index": question.correct_option_index,
                "time_limit_seconds": question.time_limit_seconds
            }
            for question in payload.questions
        ],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    await db.quizzes.insert_one(quiz_doc)

    return {
        "message": "Quiz created successfully",
        "quiz_id": quiz_doc["_id"],
        "quiz": quiz_doc
    }
    
@router.get("")
async def get_all_quizzes():
    db = get_database()

    quizzes_cursor = db.quizzes.find(
        {},
        {
            "questions.correct_option_index": 0
        }
    ).sort("created_at", -1)

    quizzes = await quizzes_cursor.to_list(length=100)

    return {
        "count": len(quizzes),
        "quizzes": quizzes
    }
    
@router.get("/{quiz_id}")
async def get_quiz_by_id(quiz_id: str):
    db = get_database()

    quiz = await db.quizzes.find_one(
        {"_id": quiz_id},
        {
            "questions.correct_option_index": 0
        }
    )

    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )

    return {
        "quiz": quiz
    }