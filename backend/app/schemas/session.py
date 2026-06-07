from pydantic import BaseModel, Field


class StartSessionRequest(BaseModel):
    quiz_id: str = Field(..., min_length=1)