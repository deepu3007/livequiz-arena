from typing import Any

from pydantic import BaseModel, Field


class WebSocketIncomingMessage(BaseModel):
    type: str = Field(..., min_length=1)
    payload: dict[str, Any] = Field(default_factory=dict)