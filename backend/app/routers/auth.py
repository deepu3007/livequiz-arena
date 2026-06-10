from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status

from app.db.mongodb import get_database
from app.schemas.auth import LoginRequest, SignupRequest
from app.services.auth_service import (
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Auth"])

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_SECONDS = 60


def get_utc_now():
    return datetime.now(timezone.utc)


def normalize_datetime(value):
    if value is None:
        return None

    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)

        return value

    return None


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest):
    db = get_database()

    existing_user = await db.users.find_one({"username": payload.username})

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    user_doc = {
        "username": payload.username,
        "password_hash": hash_password(payload.password),
        "role": payload.role,
        "failed_login_attempts": 0,
        "locked_until": None,
        "created_at": get_utc_now(),
    }

    await db.users.insert_one(user_doc)

    access_token = create_access_token(
        username=payload.username,
        role=payload.role,
    )

    return {
        "message": "Account created successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "username": payload.username,
        "role": payload.role,
    }


@router.post("/login")
async def login(payload: LoginRequest):
    db = get_database()

    user = await db.users.find_one({"username": payload.username})

    invalid_login_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password",
    )

    if user is None:
        raise invalid_login_exception

    now = get_utc_now()

    locked_until = normalize_datetime(user.get("locked_until"))

    if locked_until and locked_until > now:
        remaining_seconds = int((locked_until - now).total_seconds())

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please try again in {remaining_seconds} seconds.",
        )

    password_hash = user.get("password_hash") or user.get("hashed_password")

    password_is_valid = bool(
        password_hash and verify_password(payload.password, password_hash)
    )

    if not password_is_valid:
        current_attempts = int(user.get("failed_login_attempts", 0)) + 1

        if current_attempts >= MAX_LOGIN_ATTEMPTS:
            locked_until_time = now + timedelta(seconds=LOCKOUT_SECONDS)

            await db.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "failed_login_attempts": 0,
                        "locked_until": locked_until_time,
                    }
                },
            )

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Please try again in {LOCKOUT_SECONDS} seconds.",
            )

        attempts_left = MAX_LOGIN_ATTEMPTS - current_attempts

        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "failed_login_attempts": current_attempts,
                    "locked_until": None,
                }
            },
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid username or password. {attempts_left} attempt{'s' if attempts_left != 1 else ''} remaining.",
        )

    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "failed_login_attempts": 0,
                "locked_until": None,
            }
        },
    )

    access_token = create_access_token(
        username=user["username"],
        role=user["role"],
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"],
    }