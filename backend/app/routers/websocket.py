from datetime import datetime, timezone

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from app.db.mongodb import get_database
from app.schemas.ws_messages import WebSocketIncomingMessage
from app.services.room_manager import room_manager

router = APIRouter(tags=["WebSocket"])

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def is_question_expired(question: dict, question_started_at: datetime) -> bool:
    started_at = ensure_utc_aware(question_started_at)
    elapsed_seconds = (utc_now() - started_at).total_seconds()

    return elapsed_seconds > question["time_limit_seconds"]

def remove_correct_answer(question: dict) -> dict:
    return {
        "id": question["id"],
        "text": question["text"],
        "options": question["options"],
        "time_limit_seconds": question["time_limit_seconds"]
    }


def build_answer_stats(session: dict, question_id: str, option_count: int) -> dict:
    answers_for_question = [
        answer
        for answer in session.get("answers", [])
        if answer["question_id"] == question_id
    ]

    option_counts = {
        str(index): 0
        for index in range(option_count)
    }

    correct_count = 0

    for answer in answers_for_question:
        selected_index = str(answer["selected_option_index"])
        option_counts[selected_index] = option_counts.get(selected_index, 0) + 1

        if answer["is_correct"]:
            correct_count += 1

    return {
        "answered_count": len(answers_for_question),
        "option_counts": option_counts,
        "correct_count": correct_count,
        "wrong_count": len(answers_for_question) - correct_count
    }


def build_scoreboard(scores: dict) -> list[dict]:
    scoreboard = [
        {
            "name": student_name,
            "score": score
        }
        for student_name, score in scores.items()
    ]

    scoreboard.sort(key=lambda item: item["score"], reverse=True)

    for index, item in enumerate(scoreboard):
        item["rank"] = index + 1

    return scoreboard


async def send_current_question(room_code: str, session: dict, quiz: dict):
    current_index = session.get("current_question_index")

    if current_index is None:
        return

    if current_index >= len(quiz["questions"]):
        return

    question = quiz["questions"][current_index]

    await room_manager.broadcast_to_room(room_code, {
        "type": "question_started",
        "payload": {
            "room_code": room_code,
            "question_index": current_index,
            "total_questions": len(quiz["questions"]),
            "question": remove_correct_answer(question),
            "question_started_at": session.get("current_question_started_at"),
            "server_time": utc_now(),
            "sent_at": utc_now()
        }
    })


@router.websocket("/ws/{room_code}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_code: str,
    name: str = Query(..., min_length=1),
    role: str = Query(..., pattern="^(teacher|student)$")
):
    room_code = room_code.upper()

    db = get_database()
    session = await db.sessions.find_one({"room_code": room_code})

    if session is None:
        await websocket.close(code=1008)
        return

    if session["status"] == "ended":
        await websocket.close(code=1008)
        return

    user = {
        "name": name,
        "role": role
    }

    await room_manager.connect(room_code, websocket, user)

    if role == "student":
        await db.sessions.update_one(
            {"room_code": room_code},
            {
                "$addToSet": {
                    "students": {
                        "name": name,
                        "joined_at": datetime.now(timezone.utc)
                    }
                },
                "$set": {
                    f"scores.{name}": session.get("scores", {}).get(name, 0)
                }
            }
        )

    await room_manager.broadcast_to_room(room_code, {
        "type": "user_joined",
        "payload": {
            "room_code": room_code,
            "user": user,
            "sent_at": datetime.now(timezone.utc)
        }
    })

    await room_manager.broadcast_to_room(
        room_code,
        room_manager.build_room_state_message(room_code)
    )

    try:
        while True:
            raw_message = await websocket.receive_json()

            try:
                incoming = WebSocketIncomingMessage(**raw_message)
            except ValidationError as error:
                await room_manager.send_to_websocket(websocket, {
                    "type": "error",
                    "payload": {
                        "message": "Invalid WebSocket message format",
                        "details": error.errors()
                    }
                })
                continue

            if incoming.type == "chat_message":
                message = incoming.payload.get("message")

                if not message:
                    await room_manager.send_to_websocket(websocket, {
                        "type": "error",
                        "payload": {
                            "message": "Message cannot be empty"
                        }
                    })
                    continue

                await room_manager.broadcast_to_room(room_code, {
                    "type": "chat_message",
                    "payload": {
                        "room_code": room_code,
                        "sender": name,
                        "role": role,
                        "message": message,
                        "sent_at": datetime.now(timezone.utc)
                    }
                })

            elif incoming.type == "teacher_start_quiz":
                if role != "teacher":
                    await room_manager.send_to_websocket(websocket, {
                        "type": "error",
                        "payload": {
                            "message": "Only teachers can start the quiz"
                        }
                    })
                    continue

                session = await db.sessions.find_one({"room_code": room_code})
                quiz = await db.quizzes.find_one({"_id": session["quiz_id"]})

                if quiz is None:
                    await room_manager.send_to_websocket(websocket, {
                        "type": "error",
                        "payload": {
                            "message": "Quiz not found for this session"
                        }
                    })
                    continue
                question_started_at = utc_now()

                await db.sessions.update_one(
                        {"room_code": room_code},
                        {
                            "$set": {
                                "status": "live",
                                "current_question_index": 0,
                                "current_question_started_at": question_started_at,
                                "started_at": question_started_at
                            }
                        }
                    )

                updated_session = await db.sessions.find_one({"room_code": room_code})

                await room_manager.broadcast_to_room(room_code, {
                    "type": "quiz_started",
                    "payload": {
                        "room_code": room_code,
                        "quiz_title": quiz["title"],
                        "total_questions": len(quiz["questions"]),
                        "started_by": name,
                        "sent_at": datetime.now(timezone.utc)
                    }
                })

                await send_current_question(room_code, updated_session, quiz)

            elif incoming.type == "teacher_next_question":
                if role != "teacher":
                    await room_manager.send_to_websocket(websocket, {
                        "type": "error",
                        "payload": {
                            "message": "Only teachers can move to the next question"
                        }
                    })
                    continue

                session = await db.sessions.find_one({"room_code": room_code})
                quiz = await db.quizzes.find_one({"_id": session["quiz_id"]})

                if session["status"] != "live":
                    await room_manager.send_to_websocket(websocket, {
                        "type": "error",
                        "payload": {
                            "message": "Quiz is not live"
                        }
                    })
                    continue

                current_index = session.get("current_question_index")

                if current_index is None:
                    next_index = 0
                else:
                    next_index = current_index + 1

                if next_index >= len(quiz["questions"]):
                    await db.sessions.update_one(
                        {"room_code": room_code},
                        {
                            "$set": {
                                "status": "ended",
                                "ended_at": datetime.now(timezone.utc)
                            }
                        }
                    )

                    final_session = await db.sessions.find_one({"room_code": room_code})

                    leaderboard = build_scoreboard(
                        final_session.get("scores", {})
                    )

                    await room_manager.broadcast_to_room(room_code, {
                        "type": "quiz_finished",
                        "payload": {
                            "room_code": room_code,
                            "podium": leaderboard[:3],
                            "leaderboard": leaderboard,
                            "sent_at": datetime.now(timezone.utc)
                        }
                    })

                    continue

                question_started_at = utc_now()

                await db.sessions.update_one(
                    {"room_code": room_code},
                    {
                        "$set": {
                            "current_question_index": next_index,
                            "current_question_started_at": question_started_at
                        }
                    }
                )

                updated_session = await db.sessions.find_one({"room_code": room_code})
                await send_current_question(room_code, updated_session, quiz)

            elif incoming.type == "student_submit_answer":
                if role != "student":
                    await room_manager.send_to_websocket(websocket, {
                        "type": "error",
                        "payload": {
                            "message": "Only students can submit answers"
                        }
                    })
                    continue

                selected_option_index = incoming.payload.get("selected_option_index")
                question_id = incoming.payload.get("question_id")

                if question_id is None or selected_option_index is None:
                    await room_manager.send_to_websocket(websocket, {
                        "type": "error",
                        "payload": {
                            "message": "question_id and selected_option_index are required"
                        }
                    })
                    continue

                session = await db.sessions.find_one({"room_code": room_code})
                quiz = await db.quizzes.find_one({"_id": session["quiz_id"]})

                if session["status"] != "live":
                    await room_manager.send_to_websocket(websocket, {
                        "type": "error",
                        "payload": {
                            "message": "Quiz is not live"
                        }
                    })
                    continue

                current_index = session.get("current_question_index")

                if current_index is None:
                    await room_manager.send_to_websocket(websocket, {
                        "type": "error",
                        "payload": {
                            "message": "No active question"
                        }
                    })
                    continue

                current_question = quiz["questions"][current_index]
                question_started_at = session.get("current_question_started_at")

                if question_started_at is None:
                    await room_manager.send_to_websocket(websocket, {
                        "type": "error",
                        "payload": {
                            "message": "Question timer was not started"
                        }
                    })
                    continue

                if is_question_expired(current_question, question_started_at):
                    await room_manager.send_to_websocket(websocket, {
                        "type": "answer_rejected",
                        "payload": {
                            "question_id": question_id,
                            "reason": "time_expired",
                            "message": "Time is up for this question",
                            "sent_at": utc_now()
                        }
                    })
                    continue

                if question_id != current_question["id"]:
                    await room_manager.send_to_websocket(websocket, {
                        "type": "error",
                        "payload": {
                            "message": "Answer submitted for wrong question"
                        }
                    })
                    continue

                already_answered = any(
                    answer["student_name"] == name
                    and answer["question_id"] == question_id
                    for answer in session.get("answers", [])
                )

                if already_answered:
                    await room_manager.send_to_websocket(websocket, {
                        "type": "error",
                        "payload": {
                            "message": "You already answered this question"
                        }
                    })
                    continue

                is_correct = selected_option_index == current_question["correct_option_index"]
                points = 100 if is_correct else 0

                current_score = session.get("scores", {}).get(name, 0)
                new_score = current_score + points

                answer_doc = {
                    "student_name": name,
                    "question_id": question_id,
                    "selected_option_index": selected_option_index,
                    "is_correct": is_correct,
                    "points": points,
                    "answered_at": datetime.now(timezone.utc)
                }

                await db.sessions.update_one(
                    {"room_code": room_code},
                    {
                        "$push": {
                            "answers": answer_doc
                        },
                        "$set": {
                            f"scores.{name}": new_score
                        }
                    }
                )

                updated_session = await db.sessions.find_one({"room_code": room_code})

                await room_manager.send_to_websocket(websocket, {
                    "type": "answer_result",
                    "payload": {
                        "question_id": question_id,
                        "is_correct": is_correct,
                        "points": points,
                        "new_score": new_score,
                        "sent_at": datetime.now(timezone.utc)
                    }
                })

                stats = build_answer_stats(
                    updated_session,
                    question_id,
                    len(current_question["options"])
                )

                await room_manager.broadcast_to_room(room_code, {
                    "type": "answer_stats",
                    "payload": {
                        "room_code": room_code,
                        "question_id": question_id,
                        **stats,
                        "scoreboard": build_scoreboard(updated_session.get("scores", {})),
                        "sent_at": datetime.now(timezone.utc)
                    }
                })

            elif incoming.type == "ping":
                await room_manager.send_to_websocket(websocket, {
                    "type": "pong",
                    "payload": {
                        "sent_at": datetime.now(timezone.utc)
                    }
                })

            else:
                await room_manager.send_to_websocket(websocket, {
                    "type": "error",
                    "payload": {
                        "message": f"Unknown event type: {incoming.type}"
                    }
                })

    except WebSocketDisconnect:
        room_manager.disconnect(room_code, websocket)

        await room_manager.broadcast_to_room(room_code, {
            "type": "user_left",
            "payload": {
                "room_code": room_code,
                "user": user,
                "sent_at": datetime.now(timezone.utc)
            }
        })

        await room_manager.broadcast_to_room(
            room_code,
            room_manager.build_room_state_message(room_code)
        )