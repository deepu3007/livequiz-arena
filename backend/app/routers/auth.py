from fastapi import APIRouter, HTTPException

from app.db.mongodb import get_database
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
)

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/signup")
async def signup(
    payload: SignupRequest
):
    db = get_database()

    existing = await db.users.find_one({
        "username": payload.username
    })

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    await db.users.insert_one({
        "username": payload.username,
        "password_hash": hash_password(
            payload.password
        ),
        "role": payload.role
    })

    return {
        "message": "Account created"
    }

@router.post("/login")
async def login(
    payload: LoginRequest
):
    db = get_database()

    user = await db.users.find_one({
        "username": payload.username
    })

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not verify_password(
        payload.password,
        user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_access_token(
        user["username"],
        user["role"]
    )

    return {
        "access_token": token,
        "role": user["role"]
    }