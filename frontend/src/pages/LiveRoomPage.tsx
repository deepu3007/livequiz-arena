import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import EventTimeline from "../components/EventTimeline";
import Leaderboard from "../components/Leaderboard";
import LiveAnalytics from "../components/LiveAnalytics";
import LiveParticipants from "../components/LiveParticipants";
import LiveQuizPanel from "../components/LiveQuizPanel";
import RoomChat from "../components/RoomChat";
import RoomJoinCard from "../components/RoomJoinCard";

import type {
  AnswerStats,
  QuizQuestion,
  RoomUser,
  UserRole,
  WsEvent,
} from "../types/quiz";

function LiveRoomPage() {
  const socketRef = useRef<WebSocket | null>(null);

  const [roomCode, setRoomCode] = useState(
    sessionStorage.getItem("lastRoomCode") ?? "",
  );
  const [name, setName] = useState("");
  const [role] = useState<UserRole>("student");

  const [connected, setConnected] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("Not connected");

  const [users, setUsers] = useState<RoomUser[]>([]);
  const [events, setEvents] = useState<WsEvent[]>([]);
  const [chatMessage, setChatMessage] = useState("");

  const [quizTitle, setQuizTitle] = useState("");
  const [quizStatus, setQuizStatus] = useState<"waiting" | "live" | "ended">(
    "waiting",
  );
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
    null,
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<
    number | null
  >(null);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  );
  const [answerResult, setAnswerResult] = useState<{
    is_correct: boolean;
    points: number;
    new_score: number;
  } | null>(null);
  const [answerStats, setAnswerStats] = useState<AnswerStats | null>(null);
  const [scoreboard, setScoreboard] = useState<
    { name: string; score: number; rank: number }[]
  >([]);

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [questionExpired, setQuestionExpired] = useState(false);

  const addEvent = (event: WsEvent) => {
    setEvents((previousEvents) => [event, ...previousEvents].slice(0, 80));
  };

  useEffect(() => {
    if (remainingSeconds === null) return;

    if (remainingSeconds <= 0) {
      setQuestionExpired(true);
      return;
    }

    const timerId = window.setTimeout(() => {
      setRemainingSeconds((previousSeconds) => {
        if (previousSeconds === null) return null;
        return previousSeconds - 1;
      });
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [remainingSeconds]);

  const connectToRoom = () => {
    const cleanRoomCode = roomCode.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanRoomCode || !cleanName) {
      alert("Please enter both room code and name");
      return;
    }

    sessionStorage.setItem("lastRoomCode", cleanRoomCode);

    const wsBaseUrl = import.meta.env.VITE_WS_URL;
    const url = `${wsBaseUrl}/ws/${cleanRoomCode}?name=${encodeURIComponent(
      cleanName,
    )}&role=${role}`;

    const socket = new WebSocket(url);

    socket.onopen = () => {
      setConnected(true);
      setConnectionMessage(`Connected to room ${cleanRoomCode}`);

      addEvent({
        type: "local_connected",
        payload: {
          room_code: cleanRoomCode,
          message: "You connected successfully",
        },
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
        const question = data.payload.question;

        setQuizStatus("live");
        setCurrentQuestion(question);
        setCurrentQuestionIndex(Number(data.payload.question_index ?? 0));
        setTotalQuestions(Number(data.payload.total_questions ?? 0));
        setSelectedOptionIndex(null);
        setAnswerResult(null);
        setAnswerStats(null);
        setRemainingSeconds(question.time_limit_seconds);
        setQuestionExpired(false);
      }

      if (data.type === "answer_result") {
        setAnswerResult({
          is_correct: Boolean(data.payload?.is_correct),
          points: Number(data.payload?.points ?? 0),
          new_score: Number(data.payload?.new_score ?? 0),
        });
      }

      if (data.type === "answer_stats") {
        const stats: AnswerStats = {
          question_id: String(data.payload?.question_id ?? ""),
          answered_count: Number(data.payload?.answered_count ?? 0),
          option_counts: data.payload?.option_counts ?? {},
          correct_count: Number(data.payload?.correct_count ?? 0),
          wrong_count: Number(data.payload?.wrong_count ?? 0),
          scoreboard: data.payload?.scoreboard ?? [],
        };

        setAnswerStats(stats);
        setScoreboard(stats.scoreboard);
      }

      if (data.type === "quiz_ended") {
        setQuizStatus("ended");
        setCurrentQuestion(null);
        setAnswerStats(null);
        setAnswerResult(null);
        setRemainingSeconds(null);
        setQuestionExpired(false);
        setScoreboard(data.payload?.scoreboard ?? []);
      }

      if (data.type === "answer_rejected") {
        alert(String(data.payload?.message ?? "Answer rejected"));
      }
    };

    socket.onclose = () => {
      setConnected(false);
      setUsers([]);
      setConnectionMessage("Disconnected from room");

      addEvent({
        type: "local_disconnected",
        payload: {
          message: "WebSocket connection closed",
        },
      });
    };

    socket.onerror = () => {
      setConnectionMessage("Connection error");

      addEvent({
        type: "local_error",
        payload: {
          message: "Could not connect to WebSocket",
        },
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
        message: cleanMessage,
      },
    });

    setChatMessage("");
  };

  const sendPing = () => {
    sendJson({
      type: "ping",
      payload: {},
    });
  };

  const startQuiz = () => {
    sendJson({
      type: "teacher_start_quiz",
      payload: {},
    });
  };

  const nextQuestion = () => {
    sendJson({
      type: "teacher_next_question",
      payload: {},
    });
  };

  const submitAnswer = (optionIndex: number) => {
    if (!currentQuestion) return;

    if (questionExpired || remainingSeconds === 0) {
      alert("Time is up for this question");
      return;
    }

    setSelectedOptionIndex(optionIndex);

    sendJson({
      type: "student_submit_answer",
      payload: {
        question_id: currentQuestion.id,
        selected_option_index: optionIndex,
      },
    });
  };

  const chatEvents = events.filter((event) => event.type === "chat_message");

  return (
    <main className="app">
      <section className="hero compact-hero">
        <div>
          <p className="eyebrow">Live Room</p>
          <h1>Quiz Room</h1>
          <p className="hero-description">
            Connect as a teacher or student and participate in the live quiz.
          </p>
        </div>

        <div className="page-actions">
          <Link className="nav-action secondary-nav-action" to="/">
            Home
          </Link>
          <Link className="nav-action primary-nav-action" to="/create">
            Create Quiz
          </Link>
        </div>

        <div
          className={connected ? "status-pill online" : "status-pill offline"}
        >
          <span />
          {connected ? "Live connection" : "Offline"}
        </div>
      </section>

      <section className="arena-workspace live-room-workspace">
        <aside className="arena-sidebar arena-left-rail">
          <RoomJoinCard
            roomCode={roomCode}
            name={name}
            role={role}
            connected={connected}
            connectionMessage={connectionMessage}
            onRoomCodeChange={setRoomCode}
            onNameChange={setName}
            onConnect={connectToRoom}
            onDisconnect={disconnectFromRoom}
          />

          <LiveParticipants users={users} />
        </aside>

        <section className="arena-stage">
          <LiveQuizPanel
            role={role}
            connected={connected}
            quizTitle={quizTitle}
            quizStatus={quizStatus}
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            selectedOptionIndex={selectedOptionIndex}
            answerResult={answerResult}
            answerStats={answerStats}
            remainingSeconds={remainingSeconds}
            questionExpired={questionExpired}
            onStartQuiz={startQuiz}
            onNextQuestion={nextQuestion}
            onSubmitAnswer={submitAnswer}
          />

          <LiveAnalytics
            answerStats={answerStats}
            currentQuestion={currentQuestion}
          />
        </section>

        <aside className="arena-sidebar arena-right-rail">
          <Leaderboard scoreboard={scoreboard} />

          <RoomChat
            connected={connected}
            chatMessage={chatMessage}
            chatEvents={chatEvents}
            onChatMessageChange={setChatMessage}
            onSendChatMessage={sendChatMessage}
            onPing={sendPing}
          />

          <EventTimeline events={events} />
        </aside>
      </section>
    </main>
  );
}

export default LiveRoomPage;
