import { useEffect, useState } from "react";
import {
  FaBroadcastTower,
  FaPaperPlane,
  FaSatelliteDish,
} from "react-icons/fa";
import { FiMessageCircle, FiX } from "react-icons/fi";

import type { WsEvent } from "../types/quiz";

type RoomChatProps = {
  connected: boolean;
  chatMessage: string;
  chatEvents: WsEvent[];
  onChatMessageChange: (value: string) => void;
  onSendChatMessage: () => void;
  onPing: () => void;
};

function RoomChat({
  connected,
  chatMessage,
  chatEvents,
  onChatMessageChange,
  onSendChatMessage,
  onPing,
}: RoomChatProps) {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!open && chatEvents.length > 0) {
      setHasUnread(true);
    }
  }, [chatEvents, open]);

  const toggleChat = () => {
    if (!open) {
      setHasUnread(false);
    }

    setOpen(!open);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSendChatMessage();
    }
  };

  return (
    <>
      <button
        className="floating-chat-btn"
        onClick={toggleChat}
      >
        {open ? <FiX size={24} /> : <FiMessageCircle size={24} />}

        {hasUnread && !open && (
          <span className="chat-notification-dot" />
        )}
      </button>

      {open && (
        <div className="chatbot-window">
          <div className="card chat-card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-subtitle">Room Chat</div>

                <div className="card-title">
                  <FaBroadcastTower
                    size={22}
                    color="var(--blue)"
                  />
                  Broadcast
                </div>
              </div>

              <button
                className="btn btn-ghost btn-sm"
                onClick={onPing}
                disabled={!connected}
              >
                <FaSatelliteDish size={13} />
                Ping
              </button>
            </div>

            <div className="chat-feed chat-feed-scroll">
              {chatEvents.length === 0 ? (
                <p className="empty-text">
                  No messages yet
                </p>
              ) : (
                chatEvents.map((event, i) => (
                  <div
                    className={`chat-bubble ${
                      event.payload?.role === "teacher"
                        ? "teacher-bubble"
                        : ""
                    }`}
                    key={i}
                  >
                    <div className="chat-meta">
                      <strong>
                        {event.payload?.sender}
                      </strong>

                      <span
                        className={
                          event.payload?.role ===
                          "teacher"
                            ? "teacher-role"
                            : ""
                        }
                      >
                        {event.payload?.role}
                      </span>
                    </div>

                    <p>
                      {String(
                        event.payload?.message ?? ""
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="chat-input-row">
              <input
                className="chat-input"
                value={chatMessage}
                onChange={(e) =>
                  onChatMessageChange(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Message everyone..."
                disabled={!connected}
              />

              <button
                className="chat-send-btn"
                onClick={onSendChatMessage}
                disabled={!connected}
              >
                <FaPaperPlane size={13} />
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RoomChat;