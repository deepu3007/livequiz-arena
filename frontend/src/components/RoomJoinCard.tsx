import {
  FaChalkboardTeacher,
  FaGamepad,
  FaLink,
  FaTimes,
} from "react-icons/fa";
import type { UserRole } from "../types/quiz";

type RoomJoinCardProps = {
  roomCode: string;
  name: string;
  role: UserRole;
  connected: boolean;
  connectionMessage: string;
  onRoomCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
};

function RoomJoinCard({
  roomCode,
  name,
  role,
  connected,
  connectionMessage,
  onRoomCodeChange,
  onNameChange,
  onConnect,
  onDisconnect,
}: RoomJoinCardProps) {
  const messageClass =
    connectionMessage.toLowerCase().includes("error") ||
    connectionMessage.toLowerCase().includes("fail")
      ? "error"
      : connectionMessage.toLowerCase().includes("connect")
      ? "success"
      : "";

  // ==========================
  // CONNECTED VIEW
  // ==========================
  if (connected) {
    return (
      <div className="room-status-bar">
        <div className="room-status-left">
          <span className="room-online-dot" />

          <div>
            <div className="room-status-label">Connected</div>
            <div className="room-status-code">
              Room Code: <strong>{roomCode}</strong>
            </div>
          </div>
        </div>

        <button
          className="btn btn-red"
          onClick={onDisconnect}
        >
          <FaTimes size={12} />
          Disconnect
        </button>
      </div>
    );
  }

  // ==========================
  // DISCONNECTED VIEW
  // ==========================
  return (
    <div className="card connection-card">
      <div className="card-stripe" />

      <div className="card-header">
        <div className="card-header-left">
          <div className="card-subtitle">
            Room Access
          </div>

          <div className="card-title">
            {role === "teacher" ? (
              <FaChalkboardTeacher
                size={22}
                color="var(--blue)"
              />
            ) : (
              <FaGamepad
                size={22}
                color="var(--blue)"
              />
            )}

            Join as {role}
          </div>
        </div>

        <span className="status-pill">
          Ready
        </span>
      </div>

      <div className="card-body connection-card-body">
        <div className="form-group">
          <label className="form-label">
            Room Code
          </label>

          <input
            className="form-input code-input"
            value={roomCode}
            onChange={(e) =>
              onRoomCodeChange(
                e.target.value.toUpperCase()
              )
            }
            placeholder="A7K2P9"
            maxLength={8}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Your Name
          </label>

          <input
            className="form-input"
            value={name}
            onChange={(e) =>
              onNameChange(e.target.value)
            }
            placeholder={
              role === "teacher"
                ? "e.g. TeacherOne"
                : "e.g. StudentOne"
            }
          />
        </div>

        <div className="role-badge">
          <span className="role-icon">
            {role === "teacher" ? (
              <FaChalkboardTeacher />
            ) : (
              <FaGamepad />
            )}
          </span>

          <span>
            Role:{" "}
            <strong
              style={{
                textTransform: "capitalize",
              }}
            >
              {role}
            </strong>
          </span>
        </div>

        <button
          className="btn btn-primary w-full btn-lg"
          onClick={onConnect}
        >
          <FaLink size={14} />
          Connect to Room
        </button>

        <p className={`helper-text ${messageClass}`}>
          {connectionMessage ||
            "Enter code and name to connect"}
        </p>
      </div>
    </div>
  );
}

export default RoomJoinCard;