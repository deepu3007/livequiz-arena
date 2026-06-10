from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.db.mongodb import get_database
from app.schemas.session import StartSessionRequest
from app.services.auth_service import get_current_user
from app.utils.room_code import generate_room_code

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("/start", status_code=status.HTTP_201_CREATED)
async def start_session(
    payload: StartSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create live rooms"
        )

    db = get_database()

    quiz = await db.quizzes.find_one({
    "_id": payload.quiz_id,
    "created_by": current_user["username"]
})

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
        "created_by": current_user["username"],
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
async def get_all_sessions(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view sessions"
        )

    db = get_database()

    sessions_cursor = db.sessions.find(
    {
        "created_by": current_user["username"]
    }
    ).sort("created_at", -1)

    sessions = await sessions_cursor.to_list(length=100)

    return {
        "count": len(sessions),
        "sessions": sessions
    }

@router.get("/teacher/kpis")
async def get_teacher_kpis(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view dashboard KPIs"
        )

    db = get_database()
    teacher_username = current_user["username"]

    quizzes_created = await db.quizzes.count_documents({
        "created_by": teacher_username
    })

    sessions = await db.sessions.find({
        "created_by": teacher_username
    }).to_list(length=1000)

    rooms_hosted = len(sessions)

    students_participated = 0
    score_percentages = []

    for session in sessions:
        scores = session.get("scores", {})

        if not isinstance(scores, dict):
            continue

        students_participated += len(scores)

        if not scores:
            continue

        quiz = await db.quizzes.find_one({
            "_id": session.get("quiz_id"),
            "created_by": teacher_username
        })

        if quiz is None:
            continue

        question_count = len(quiz.get("questions", []))

        if question_count == 0:
            continue

        max_score = question_count * 100

        for score in scores.values():
            try:
                score_number = float(score)
            except (TypeError, ValueError):
                continue

            score_percentage = round((score_number / max_score) * 100)

            if score_percentage < 0:
                score_percentage = 0

            if score_percentage > 100:
                score_percentage = 100

            score_percentages.append(score_percentage)

    average_score = (
        round(sum(score_percentages) / len(score_percentages))
        if score_percentages
        else 0
    )

    return {
        "rooms_hosted": rooms_hosted,
        "students_participated": students_participated,
        "average_score": average_score,
        "quizzes_created": quizzes_created
    }

@router.get("/teacher/stats")
async def get_teacher_stats(
    quiz_id: str | None = None,
    room_code: str | None = None,
    student_name: str | None = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view stats"
        )

    db = get_database()
    teacher_username = current_user["username"]

    quiz_query = {
        "created_by": teacher_username
    }

    quizzes = await db.quizzes.find(quiz_query).to_list(length=1000)

    quiz_map = {
        quiz["_id"]: quiz
        for quiz in quizzes
    }

    session_query = {
        "created_by": teacher_username
    }

    if quiz_id:
        session_query["quiz_id"] = quiz_id

    if room_code:
        session_query["room_code"] = room_code.upper()

    sessions = await db.sessions.find(session_query).sort(
        "created_at", -1
    ).to_list(length=1000)

    filtered_sessions = []

    for session in sessions:
        scores = session.get("scores", {})

        if student_name:
            if not isinstance(scores, dict) or student_name not in scores:
                continue

        filtered_sessions.append(session)

    sessions = filtered_sessions

    rooms_hosted = len(sessions)
    quizzes_created = len(quizzes)

    students_set = set()
    score_percentages = []

    room_participation = []
    quiz_performance_map = {}
    student_performance = []
    top_students_map = {}
    correct_wrong = {
        "correct": 0,
        "wrong": 0
    }

    score_distribution = {
        "0-20": 0,
        "21-40": 0,
        "41-60": 0,
        "61-80": 0,
        "81-100": 0
    }

    all_students = set()

    for session in sessions:
        scores = session.get("scores", {})
        answers = session.get("answers", [])
        quiz = quiz_map.get(session.get("quiz_id"))

        if not isinstance(scores, dict):
            scores = {}

        if not isinstance(answers, list):
            answers = []

        quiz_title = session.get("quiz_title", "Untitled Quiz")
        room = session.get("room_code", "Unknown Room")

        question_count = 0

        if quiz:
            question_count = len(quiz.get("questions", []))

        max_score = question_count * 100 if question_count > 0 else 100

        participant_names = list(scores.keys())

        if student_name:
            participant_names = [
                name for name in participant_names if name == student_name
            ]

        for name in participant_names:
            all_students.add(name)
            students_set.add(name)

            try:
                raw_score = float(scores.get(name, 0))
            except (TypeError, ValueError):
                raw_score = 0

            percentage = round((raw_score / max_score) * 100) if max_score else 0

            if percentage < 0:
                percentage = 0

            if percentage > 100:
                percentage = 100

            score_percentages.append(percentage)

            top_students_map[name] = top_students_map.get(name, 0) + raw_score

            student_performance.append({
                "student_name": name,
                "room_code": room,
                "quiz_title": quiz_title,
                "score": raw_score,
                "score_percentage": percentage,
                "created_at": session.get("created_at")
            })

            if percentage <= 20:
                score_distribution["0-20"] += 1
            elif percentage <= 40:
                score_distribution["21-40"] += 1
            elif percentage <= 60:
                score_distribution["41-60"] += 1
            elif percentage <= 80:
                score_distribution["61-80"] += 1
            else:
                score_distribution["81-100"] += 1

        room_participation.append({
            "room_code": room,
            "quiz_title": quiz_title,
            "participants": len(participant_names),
            "average_score": round(
                sum(
                    [
                        round((float(scores.get(name, 0)) / max_score) * 100)
                        for name in participant_names
                        if max_score
                    ]
                ) / len(participant_names)
            ) if participant_names else 0
        })

        quiz_key = session.get("quiz_id", "unknown")

        if quiz_key not in quiz_performance_map:
            quiz_performance_map[quiz_key] = {
                "quiz_id": quiz_key,
                "quiz_title": quiz_title,
                "total_score_percentage": 0,
                "attempts": 0,
                "rooms": 0
            }

        quiz_performance_map[quiz_key]["rooms"] += 1

        for name in participant_names:
            try:
                raw_score = float(scores.get(name, 0))
            except (TypeError, ValueError):
                raw_score = 0

            percentage = round((raw_score / max_score) * 100) if max_score else 0

            if percentage < 0:
                percentage = 0

            if percentage > 100:
                percentage = 100

            quiz_performance_map[quiz_key]["total_score_percentage"] += percentage
            quiz_performance_map[quiz_key]["attempts"] += 1

        for answer in answers:
            if not isinstance(answer, dict):
                continue

            answer_student_name = (
                answer.get("student_name")
                or answer.get("student")
                or answer.get("name")
            )

            if student_name and answer_student_name != student_name:
                continue

            is_correct = answer.get("is_correct")

            if is_correct is True:
                correct_wrong["correct"] += 1
            elif is_correct is False:
                correct_wrong["wrong"] += 1

    average_score = (
        round(sum(score_percentages) / len(score_percentages))
        if score_percentages
        else 0
    )

    quiz_performance = []

    for item in quiz_performance_map.values():
        attempts = item["attempts"]

        quiz_performance.append({
            "quiz_id": item["quiz_id"],
            "quiz_title": item["quiz_title"],
            "average_score": round(
                item["total_score_percentage"] / attempts
            ) if attempts else 0,
            "attempts": attempts,
            "rooms": item["rooms"]
        })

    top_students = sorted(
        [
            {
                "student_name": name,
                "score": score
            }
            for name, score in top_students_map.items()
        ],
        key=lambda item: item["score"],
        reverse=True
    )[:10]

    available_rooms = [
        {
            "room_code": session.get("room_code"),
            "quiz_id": session.get("quiz_id"),
            "quiz_title": session.get("quiz_title", "Untitled Quiz"),
            "status": session.get("status", "unknown"),
            "created_at": session.get("created_at")
        }
        for session in await db.sessions.find({
            "created_by": teacher_username
        }).sort("created_at", -1).to_list(length=1000)
    ]

    available_students = sorted(list(all_students))

    if not available_students:
        all_teacher_sessions = await db.sessions.find({
            "created_by": teacher_username
        }).to_list(length=1000)

        for teacher_session in all_teacher_sessions:
            teacher_scores = teacher_session.get("scores", {})

            if isinstance(teacher_scores, dict):
                for name in teacher_scores.keys():
                    all_students.add(name)

        available_students = sorted(list(all_students))

    return {
        "kpis": {
            "rooms_hosted": rooms_hosted,
            "students_participated": len(students_set),
            "average_score": average_score,
            "quizzes_created": quizzes_created
        },
        "filters": {
            "quizzes": [
                {
                    "_id": quiz["_id"],
                    "title": quiz.get("title", "Untitled Quiz"),
                    "description": quiz.get("description"),
                    "question_count": len(quiz.get("questions", []))
                }
                for quiz in quizzes
            ],
            "rooms": available_rooms,
            "students": available_students
        },
        "charts": {
            "room_participation": room_participation,
            "quiz_performance": quiz_performance,
            "student_performance": student_performance,
            "score_distribution": [
                {
                    "range": key,
                    "count": value
                }
                for key, value in score_distribution.items()
            ],
            "correct_wrong": [
                {
                    "name": "Correct",
                    "value": correct_wrong["correct"]
                },
                {
                    "name": "Wrong",
                    "value": correct_wrong["wrong"]
                }
            ],
            "top_students": top_students
        }
    }
    
@router.get("/student/stats")
async def get_student_stats(
    quiz_id: str | None = None,
    room_code: str | None = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view student stats"
        )

    db = get_database()
    student_username = current_user["username"]

    session_query = {
        f"scores.{student_username}": {
            "$exists": True
        }
    }

    if quiz_id:
        session_query["quiz_id"] = quiz_id

    if room_code:
        session_query["room_code"] = room_code.upper()

    sessions = await db.sessions.find(session_query).sort(
        "created_at", -1
    ).to_list(length=1000)

    quiz_ids = list({
        session.get("quiz_id")
        for session in sessions
        if session.get("quiz_id")
    })

    quizzes = await db.quizzes.find({
        "_id": {
            "$in": quiz_ids
        }
    }).to_list(length=1000)

    quiz_map = {
        quiz["_id"]: quiz
        for quiz in quizzes
    }

    rooms_played = len(sessions)
    quizzes_attempted = len(set(quiz_ids))
    total_marks = 0
    score_percentages = []

    correct_wrong = {
        "correct": 0,
        "wrong": 0
    }

    score_distribution = {
        "0-20": 0,
        "21-40": 0,
        "41-60": 0,
        "61-80": 0,
        "81-100": 0
    }

    performance_trend = []
    quiz_performance_map = {}
    recent_rooms = []

    for session in sessions:
        scores = session.get("scores", {})
        answers = session.get("answers", [])

        if not isinstance(scores, dict):
            scores = {}

        if not isinstance(answers, list):
            answers = []

        quiz = quiz_map.get(session.get("quiz_id"))
        quiz_title = session.get("quiz_title", "Untitled Quiz")
        room = session.get("room_code", "Unknown Room")

        question_count = 0

        if quiz:
            question_count = len(quiz.get("questions", []))

        max_score = question_count * 100 if question_count > 0 else 100

        try:
            raw_score = float(scores.get(student_username, 0))
        except (TypeError, ValueError):
            raw_score = 0

        percentage = round((raw_score / max_score) * 100) if max_score else 0

        if percentage < 0:
            percentage = 0

        if percentage > 100:
            percentage = 100

        total_marks += raw_score
        score_percentages.append(percentage)

        performance_item = {
            "room_code": room,
            "quiz_id": session.get("quiz_id"),
            "quiz_title": quiz_title,
            "score": raw_score,
            "score_percentage": percentage,
            "max_score": max_score,
            "created_at": session.get("created_at")
        }

        performance_trend.append(performance_item)
        recent_rooms.append(performance_item)

        if percentage <= 20:
            score_distribution["0-20"] += 1
        elif percentage <= 40:
            score_distribution["21-40"] += 1
        elif percentage <= 60:
            score_distribution["41-60"] += 1
        elif percentage <= 80:
            score_distribution["61-80"] += 1
        else:
            score_distribution["81-100"] += 1

        quiz_key = session.get("quiz_id", "unknown")

        if quiz_key not in quiz_performance_map:
            quiz_performance_map[quiz_key] = {
                "quiz_id": quiz_key,
                "quiz_title": quiz_title,
                "total_percentage": 0,
                "attempts": 0
            }

        quiz_performance_map[quiz_key]["total_percentage"] += percentage
        quiz_performance_map[quiz_key]["attempts"] += 1

        for answer in answers:
            if not isinstance(answer, dict):
                continue

            answer_student_name = (
                answer.get("student_name")
                or answer.get("student")
                or answer.get("name")
            )

            if answer_student_name != student_username:
                continue

            is_correct = answer.get("is_correct")

            if is_correct is True:
                correct_wrong["correct"] += 1
            elif is_correct is False:
                correct_wrong["wrong"] += 1

    average_score = (
        round(sum(score_percentages) / len(score_percentages))
        if score_percentages
        else 0
    )

    quiz_performance = []

    for item in quiz_performance_map.values():
        attempts = item["attempts"]

        quiz_performance.append({
            "quiz_id": item["quiz_id"],
            "quiz_title": item["quiz_title"],
            "average_score": round(
                item["total_percentage"] / attempts
            ) if attempts else 0,
            "attempts": attempts
        })

    available_quizzes = [
        {
            "_id": quiz["_id"],
            "title": quiz.get("title", "Untitled Quiz"),
            "description": quiz.get("description"),
            "question_count": len(quiz.get("questions", []))
        }
        for quiz in quizzes
    ]

    available_rooms = [
        {
            "room_code": session.get("room_code"),
            "quiz_id": session.get("quiz_id"),
            "quiz_title": session.get("quiz_title", "Untitled Quiz"),
            "status": session.get("status", "unknown"),
            "created_at": session.get("created_at")
        }
        for session in sessions
    ]

    return {
        "kpis": {
            "rooms_played": rooms_played,
            "quizzes_attempted": quizzes_attempted,
            "average_score": average_score,
            "total_marks": round(total_marks)
        },
        "filters": {
            "quizzes": available_quizzes,
            "rooms": available_rooms
        },
        "charts": {
            "performance_trend": list(reversed(performance_trend)),
            "quiz_performance": quiz_performance,
            "score_distribution": [
                {
                    "range": key,
                    "count": value
                }
                for key, value in score_distribution.items()
            ],
            "correct_wrong": [
                {
                    "name": "Correct",
                    "value": correct_wrong["correct"]
                },
                {
                    "name": "Wrong",
                    "value": correct_wrong["wrong"]
                }
            ],
            "recent_rooms": recent_rooms[:10]
        }
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