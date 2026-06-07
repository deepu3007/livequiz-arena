import { useRef, useState } from "react";
import "./App.css";

type UserRole = "teacher" | "student";

type RoomUser = {
  name: string;
  role: UserRole;
};

type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  time_limit_seconds: number;
};

type ScoreboardItem = {
  name: string;
  score: number;
  rank: number;
};

type AnswerStats = {
  question_id: string;
  answered_count: number;
  option_counts: Record<string, number>;
  correct_count: number;
  wrong_count: number;
  scoreboard: ScoreboardItem[];
};

type WsEvent = {
  type: string;
  payload?: {
    room_code?: string;
    online_count?: number;
    users?: RoomUser[];
    user?: RoomUser;
    sender?: string;
    role?: UserRole;
    message?: string;
    sent_at?: string;

    quiz_title?: string;
    total_questions?: number;
    question_index?: number;
    question?: QuizQuestion;

    question_id?: string;
    selected_option_index?: number;
    is_correct?: boolean;
    points?: number;
    new_score?: number;

    answered_count?: number;
    option_counts?: Record<string, number>;
    correct_count?: number;
    wrong_count?: number;
    scoreboard?: ScoreboardItem[];

    [key: string]: unknown;
  };
};

function App() {
  const socketRef = useRef<WebSocket | null>(null);

  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("student");

  const [connected, setConnected] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("Not connected");

  const [users, setUsers] = useState<RoomUser[]>([]);
  const [events, setEvents] = useState<WsEvent[]>([]);
  const [chatMessage, setChatMessage] = useState("");

  const [quizTitle, setQuizTitle] = useState("");
  const [quizStatus, setQuizStatus] = useState<"waiting" | "live" | "ended">(
    "waiting"
  );
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(
    null
  );
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null
  );
  const [answerResult, setAnswerResult] = useState<{
    is_correct: boolean;
    points: number;
    new_score: number;
  } | null>(null);
  const [answerStats, setAnswerStats] = useState<AnswerStats | null>(null);
  const [scoreboard, setScoreboard] = useState<ScoreboardItem[]>([]);

  const addEvent = (event: WsEvent) => {
    setEvents((previousEvents) => [event, ...previousEvents].slice(0, 80));
  };

  const connectToRoom = () => {
    const cleanRoomCode = roomCode.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanRoomCode || !cleanName) {
      alert("Please enter both room code and name");
      return;
    }

    const wsBaseUrl = import.meta.env.VITE_WS_URL;
    const url = `${wsBaseUrl}/ws/${cleanRoomCode}?name=${encodeURIComponent(
      cleanName
    )}&role=${role}`;

    const socket = new WebSocket(url);

    socket.onopen = () => {
      setConnected(true);
      setConnectionMessage(`Connected to room ${cleanRoomCode}`);

      addEvent({
        type: "local_connected",
        payload: {
          room_code: cleanRoomCode,
          message: "You connected successfully"
        }
      });
    };

    socket.onmessage = (event) => {
      const data: WsEvent = JSON.parse(event.data);
      addEvent(data);

      if (data.type === "room_state" && data.payload?.users) {
        setUsers(data.payload.users);
      }

      if (data.type === "quiz_started") {
        setQuizStatus("live");
        setQuizTitle(String(data.payload?.quiz_title ?? ""));
        setTotalQuestions(Number(data.payload?.total_questions ?? 0));
        setAnswerStats(null);
        setAnswerResult(null);
      }

      if (data.type === "question_started" && data.payload?.question) {
        setQuizStatus("live");
        setCurrentQuestion(data.payload.question);
        setCurrentQuestionIndex(Number(data.payload.question_index ?? 0));
        setTotalQuestions(Number(data.payload.total_questions ?? 0));
        setSelectedOptionIndex(null);
        setAnswerResult(null);
        setAnswerStats(null);
      }

      if (data.type === "answer_result") {
        setAnswerResult({
          is_correct: Boolean(data.payload?.is_correct),
          points: Number(data.payload?.points ?? 0),
          new_score: Number(data.payload?.new_score ?? 0)
        });
      }

      if (data.type === "answer_stats") {
        const stats: AnswerStats = {
          question_id: String(data.payload?.question_id ?? ""),
          answered_count: Number(data.payload?.answered_count ?? 0),
          option_counts: data.payload?.option_counts ?? {},
          correct_count: Number(data.payload?.correct_count ?? 0),
          wrong_count: Number(data.payload?.wrong_count ?? 0),
          scoreboard: data.payload?.scoreboard ?? []
        };

        setAnswerStats(stats);
        setScoreboard(stats.scoreboard);
      }

      if (data.type === "quiz_ended") {
        setQuizStatus("ended");
        setCurrentQuestion(null);
        setAnswerStats(null);
        setAnswerResult(null);
        setScoreboard(data.payload?.scoreboard ?? []);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      setUsers([]);
      setConnectionMessage("Disconnected from room");

      addEvent({
        type: "local_disconnected",
        payload: {
          message: "WebSocket connection closed"
        }
      });
    };

    socket.onerror = () => {
      setConnectionMessage("Connection error");

      addEvent({
        type: "local_error",
        payload: {
          message: "Could not connect to WebSocket"
        }
      });
    };

    socketRef.current = socket;
  };

  const disconnectFromRoom = () => {
    socketRef.current?.close();
    socketRef.current = null;
  };

  const sendJson = (payload: object) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      alert("You are not connected to a room");
      return;
    }

    socketRef.current.send(JSON.stringify(payload));
  };

  const sendChatMessage = () => {
    const cleanMessage = chatMessage.trim();

    if (!cleanMessage) return;

    sendJson({
      type: "chat_message",
      payload: {
        message: cleanMessage
      }
    });

    setChatMessage("");
  };

  const sendPing = () => {
    sendJson({
      type: "ping",
      payload: {}
    });
  };

  const startQuiz = () => {
    sendJson({
      type: "teacher_start_quiz",
      payload: {}
    });
  };

  const nextQuestion = () => {
    sendJson({
      type: "teacher_next_question",
      payload: {}
    });
  };

  const submitAnswer = (optionIndex: number) => {
    if (!currentQuestion) return;

    setSelectedOptionIndex(optionIndex);

    sendJson({
      type: "student_submit_answer",
      payload: {
        question_id: currentQuestion.id,
        selected_option_index: optionIndex
      }
    });
  };

  const handleChatEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      sendChatMessage();
    }
  };

  const onlineTeachers = users.filter((user) => user.role === "teacher").length;
  const onlineStudents = users.filter((user) => user.role === "student").length;

  const chatEvents = events.filter((event) => event.type === "chat_message");

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">FastAPI + React + WebSockets</p>
          <h1>LiveQuiz Arena</h1>
          <p className="hero-description">
            A real-time classroom quiz platform with live rooms, teacher
            controls, student participation, chat, and analytics.
          </p>
        </div>

        <div className={connected ? "status-pill online" : "status-pill offline"}>
          <span />
          {connected ? "Live connection" : "Offline"}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card connection-card">
          <div className="card-header">
            <div>
              <p className="section-label">Room Access</p>
              <h2>Join a live room</h2>
            </div>
          </div>

          <div className="form-group">
            <label>Room Code</label>
            <input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value)}
              placeholder="Example: A7K2P9"
              disabled={connected}
            />
          </div>

          <div className="form-group">
            <label>Your Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: Deepesh"
              disabled={connected}
            />
          </div>

          <div className="form-group">
            <label>Join As</label>
            <div className="role-switch">
              <button
                type="button"
                className={role === "teacher" ? "active" : ""}
                onClick={() => setRole("teacher")}
                disabled={connected}
              >
                Teacher
              </button>
              <button
                type="button"
                className={role === "student" ? "active" : ""}
                onClick={() => setRole("student")}
                disabled={connected}
              >
                Student
              </button>
            </div>
          </div>

          {!connected ? (
            <button className="primary-button" onClick={connectToRoom}>
              Connect to Room
            </button>
          ) : (
            <button className="danger-button" onClick={disconnectFromRoom}>
              Disconnect
            </button>
          )}

          <p className="helper-text">{connectionMessage}</p>
        </div>

        <div className="card stats-card">
          <p className="section-label">Room Overview</p>
          <h2>Live participants</h2>

          <div className="stats-row">
            <div className="stat-box">
              <span>{users.length}</span>
              <p>Total Online</p>
            </div>
            <div className="stat-box">
              <span>{onlineTeachers}</span>
              <p>Teachers</p>
            </div>
            <div className="stat-box">
              <span>{onlineStudents}</span>
              <p>Students</p>
            </div>
          </div>

          <div className="user-list">
            {users.length === 0 ? (
              <p className="empty-text">No active users yet.</p>
            ) : (
              users.map((user, index) => (
                <div className="user-item" key={`${user.name}-${user.role}-${index}`}>
                  <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <strong>{user.name}</strong>
                    <p>{user.role}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card quiz-card">
          <div className="card-header">
            <div>
              <p className="section-label">Live Quiz</p>
              <h2>{quizTitle || "Quiz control center"}</h2>
            </div>

            <div className={`quiz-status ${quizStatus}`}>{quizStatus}</div>
          </div>

          {role === "teacher" && (
            <div className="teacher-controls">
              <button
                className="primary-button compact"
                onClick={startQuiz}
                disabled={!connected || quizStatus === "live"}
              >
                Start Quiz
              </button>

              <button
                className="secondary-button compact"
                onClick={nextQuestion}
                disabled={!connected || quizStatus !== "live"}
              >
                Next Question
              </button>
            </div>
          )}

          {quizStatus === "waiting" && (
            <div className="quiz-empty-state">
              <h3>Waiting for the teacher to start the quiz</h3>
              <p>
                Once the teacher starts, the current question will appear here in
                real time.
              </p>
            </div>
          )}

          {quizStatus === "ended" && (
            <div className="quiz-empty-state success">
              <h3>Quiz ended</h3>
              <p>Final scores are available in the leaderboard.</p>
            </div>
          )}

          {currentQuestion && (
            <div className="question-panel">
              <div className="question-meta">
                <span>
                  Question {(currentQuestionIndex ?? 0) + 1}
                  {totalQuestions ? ` / ${totalQuestions}` : ""}
                </span>
                <span>{currentQuestion.time_limit_seconds}s</span>
              </div>

              <h3>{currentQuestion.text}</h3>

              <div className="options-grid">
                {currentQuestion.options.map((option, index) => {
                  const optionCount = answerStats?.option_counts?.[String(index)] ?? 0;
                  const selected = selectedOptionIndex === index;

                  return (
                    <button
                      key={`${currentQuestion.id}-${index}`}
                      className={selected ? "option-button selected" : "option-button"}
                      onClick={() => submitAnswer(index)}
                      disabled={role !== "student" || !connected || answerResult !== null}
                    >
                      <span>{String.fromCharCode(65 + index)}</span>
                      <strong>{option}</strong>
                      {role === "teacher" && (
                        <em>{optionCount} answer{optionCount === 1 ? "" : "s"}</em>
                      )}
                    </button>
                  );
                })}
              </div>

              {answerResult && role === "student" && (
                <div
                  className={
                    answerResult.is_correct
                      ? "answer-result correct"
                      : "answer-result wrong"
                  }
                >
                  <strong>
                    {answerResult.is_correct ? "Correct answer!" : "Wrong answer"}
                  </strong>
                  <p>
                    You earned {answerResult.points} points. Your score is now{" "}
                    {answerResult.new_score}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card analytics-card">
          <p className="section-label">Live Analytics</p>
          <h2>Answer stats</h2>

          {!answerStats ? (
            <p className="empty-text">No answer stats yet.</p>
          ) : (
            <>
              <div className="stats-row">
                <div className="stat-box">
                  <span>{answerStats.answered_count}</span>
                  <p>Answered</p>
                </div>
                <div className="stat-box">
                  <span>{answerStats.correct_count}</span>
                  <p>Correct</p>
                </div>
                <div className="stat-box">
                  <span>{answerStats.wrong_count}</span>
                  <p>Wrong</p>
                </div>
              </div>

              <div className="option-bars">
                {currentQuestion?.options.map((option, index) => {
                  const count = answerStats.option_counts[String(index)] ?? 0;
                  const percentage =
                    answerStats.answered_count === 0
                      ? 0
                      : Math.round((count / answerStats.answered_count) * 100);

                  return (
                    <div className="option-bar-row" key={option}>
                      <div className="option-bar-label">
                        <strong>{String.fromCharCode(65 + index)}</strong>
                        <span>{percentage}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p>
                        {option} — {count} answer{count === 1 ? "" : "s"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="card leaderboard-card">
          <p className="section-label">Scoreboard</p>
          <h2>Leaderboard</h2>

          {scoreboard.length === 0 ? (
            <p className="empty-text">No scores yet.</p>
          ) : (
            <div className="leaderboard-list">
              {scoreboard.map((item) => (
                <div className="leaderboard-item" key={item.name}>
                  <div className="rank">#{item.rank}</div>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.score} points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card chat-card">
          <div className="card-header">
            <div>
              <p className="section-label">Room Chat</p>
              <h2>Broadcast message</h2>
            </div>

            <button className="ghost-button" onClick={sendPing} disabled={!connected}>
              Ping
            </button>
          </div>

          <div className="chat-input-row">
            <input
              value={chatMessage}
              onChange={(event) => setChatMessage(event.target.value)}
              onKeyDown={handleChatEnter}
              placeholder="Send a message to everyone in this room..."
              disabled={!connected}
            />
            <button onClick={sendChatMessage} disabled={!connected}>
              Send
            </button>
          </div>

          <div className="chat-feed">
            {chatEvents.map((event, index) => (
              <div className="chat-bubble" key={index}>
                <div className="chat-meta">
                  <strong>{event.payload?.sender}</strong>
                  <span>{event.payload?.role}</span>
                </div>
                <p>{String(event.payload?.message ?? "")}</p>
              </div>
            ))}

            {chatEvents.length === 0 && (
              <p className="empty-text">No chat messages yet.</p>
            )}
          </div>
        </div>

        <div className="card events-card">
          <div className="card-header">
            <div>
              <p className="section-label">WebSocket Stream</p>
              <h2>Live event timeline</h2>
            </div>
          </div>

          <div className="event-list">
            {events.length === 0 ? (
              <p className="empty-text">Events will appear here after connecting.</p>
            ) : (
              events.map((event, index) => (
                <div className="event-item" key={index}>
                  <div className="event-type">{event.type}</div>
                  <pre>{JSON.stringify(event.payload ?? {}, null, 2)}</pre>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;