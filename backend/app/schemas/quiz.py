from pydantic import BaseModel, Field
from typing import List


class QuestionCreate(BaseModel):
    text: str = Field(..., min_length=1)
    options: List[str] = Field(..., min_length=2, max_length=4)
    correct_option_index: int = Field(..., ge=0)
    time_limit_seconds: int = Field(default=30, ge=5, le=300)


class QuizCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    questions: List[QuestionCreate] = Field(..., min_length=1)