import json
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket


class RoomManager:
    def __init__(self):
        self.rooms: dict[str, list[dict[str, Any]]] = {}

    async def connect(
        self,
        room_code: str,
        websocket: WebSocket,
        user: dict[str, str]
    ):
        await websocket.accept()

        room_code = room_code.upper()

        if room_code not in self.rooms:
            self.rooms[room_code] = []

        self.rooms[room_code].append({
            "websocket": websocket,
            "user": user
        })

    def disconnect(self, room_code: str, websocket: WebSocket):
        room_code = room_code.upper()

        if room_code not in self.rooms:
            return

        self.rooms[room_code] = [
            connection
            for connection in self.rooms[room_code]
            if connection["websocket"] != websocket
        ]

        if len(self.rooms[room_code]) == 0:
            del self.rooms[room_code]

    def get_room_users(self, room_code: str) -> list[dict[str, str]]:
        room_code = room_code.upper()

        if room_code not in self.rooms:
            return []

        return [
            connection["user"]
            for connection in self.rooms[room_code]
        ]

    def get_online_count(self, room_code: str) -> int:
        room_code = room_code.upper()

        if room_code not in self.rooms:
            return 0

        return len(self.rooms[room_code])

    async def send_to_websocket(self, websocket: WebSocket, message: dict):
        await websocket.send_text(json.dumps(message, default=str))

    async def broadcast_to_room(self, room_code: str, message: dict):
        room_code = room_code.upper()

        if room_code not in self.rooms:
            return

        disconnected_connections = []

        for connection in self.rooms[room_code]:
            try:
                await connection["websocket"].send_text(
                    json.dumps(message, default=str)
                )
            except Exception:
                disconnected_connections.append(connection)

        for connection in disconnected_connections:
            self.disconnect(room_code, connection["websocket"])

    async def broadcast_to_role(self, room_code: str, role: str, message: dict):
        room_code = room_code.upper()

        if room_code not in self.rooms:
            return

        for connection in self.rooms[room_code]:
            if connection["user"]["role"] == role:
                try:
                    await connection["websocket"].send_text(
                        json.dumps(message, default=str)
                    )
                except Exception:
                    self.disconnect(room_code, connection["websocket"])

    def build_room_state_message(self, room_code: str) -> dict:
        return {
            "type": "room_state",
            "payload": {
                "room_code": room_code.upper(),
                "online_count": self.get_online_count(room_code),
                "users": self.get_room_users(room_code),
                "sent_at": datetime.now(timezone.utc)
            }
        }


room_manager = RoomManager()