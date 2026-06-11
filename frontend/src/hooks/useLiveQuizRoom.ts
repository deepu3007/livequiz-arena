import { useEffect, useRef, useState } from "react";

import type {
  AnswerStats,
  QuizQuestion,
  PendingTeacherRequest,
  RoomUser,
  UserRole,
  WsEvent,
} from "../types/quiz";

type UseLiveQuizRoomOptions = {
  defaultRole: UserRole;
};

function useLiveQuizRoom({ defaultRole }: UseLiveQuizRoomOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const getNameFromToken = () => {
    const token = sessionStorage.getItem("token");
    if (!token) return "";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username ?? payload.sub ?? "";
    } catch {
      return "";
    }
  };

  const [roomCode, setRoomCode] = useState(
    sessionStorage.getItem("lastRoomCode") ?? "",
  );
  const [name, setName] = useState(getNameFromToken);
  const [role] = useState<UserRole>(defaultRole);

  const [connected, setConnected] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("Not connected");
  const [isController, setIsController] = useState(false);
  const [approvalPending, setApprovalPending] = useState(false);
  const [pendingTeacherRequests, setPendingTeacherRequests] = useState<
    PendingTeacherRequest[]
  >([]);

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
  const [quizFinished, setQuizFinished] = useState(false);

  const [podium, setPodium] = useState<
    { name: string; score: number; rank: number }[]
  >([]);

  const [finalLeaderboard, setFinalLeaderboard] = useState<
    { name: string; score: number; rank: number }[]
  >([]);

  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [questionExpired, setQuestionExpired] = useState(false);

  const addEvent = (event: WsEvent) => {
    setEvents((previousEvents) => [event, ...previousEvents].slice(0, 80));
  };
  useEffect(() => {
    if (name.trim()) {
      sessionStorage.setItem("username", name);
    }
  }, [name]);

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
    setIsController(false);
    setApprovalPending(false);
    setPendingTeacherRequests([]);
    sessionStorage.setItem("role", role);

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
      if (data.type === "room_access") {
        setIsController(Boolean(data.payload?.is_controller));
        setApprovalPending(false);
      }

      if (data.type === "approval_pending") {
        setApprovalPending(true);
        setConnectionMessage(
          String(
            data.payload?.message ??
            "Waiting for the room creator to approve your join request.",
          ),
        );
      }

      if (data.type === "teacher_approval_denied") {
        alert(String(data.payload?.message ?? "Your teacher join request was denied."));
        setApprovalPending(false);
        socket.close();
      }

      if (data.type === "teacher_approval_approved") {
        setApprovalPending(false);
        setConnectionMessage("Approved. Connected as teacher viewer.");
      }

      if (data.type === "teacher_join_request" && data.payload?.teacher_name) {
        const teacherName = String(data.payload.teacher_name);

        setPendingTeacherRequests((previousRequests) => {
          if (
            previousRequests.some(
              (request) => request.teacher_name === teacherName,
            )
          ) {
            return previousRequests;
          }

          return [
            ...previousRequests,
            {
              teacher_name: teacherName,
              role: "teacher",
            },
          ];
        });
      }

      if (data.type === "teacher_join_requests") {
        setPendingTeacherRequests(
          ((data.payload?.requests as PendingTeacherRequest[]) ?? []).filter(
            (request) => Boolean(request.teacher_name),
          ),
        );
      }

      if (
        data.type === "teacher_join_request_cleared" &&
        data.payload?.teacher_name
      ) {
        const teacherName = String(data.payload.teacher_name);

        setPendingTeacherRequests((previousRequests) =>
          previousRequests.filter(
            (request) => request.teacher_name !== teacherName,
          ),
        );
      }

      if (data.type === "error" && data.payload?.message) {
        alert(String(data.payload.message));
      }

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

      if (data.type === "quiz_finished") {
        setQuizStatus("ended");

        setCurrentQuestion(null);
        setAnswerStats(null);
        setAnswerResult(null);
        setRemainingSeconds(null);
        setQuestionExpired(false);

        setQuizFinished(true);

        setPodium(
          (data.payload?.podium as {
            name: string;
            score: number;
            rank: number;
          }[]) ?? [],
        );

        setFinalLeaderboard(
          (data.payload?.leaderboard as {
            name: string;
            score: number;
            rank: number;
          }[]) ?? [],
        );

        setScoreboard(
          (data.payload?.leaderboard as {
            name: string;
            score: number;
            rank: number;
          }[]) ?? [],
        );
      }

      if (data.type === "answer_rejected") {
        alert(String(data.payload?.message ?? "Answer rejected"));
      }
    };

    socket.onclose = () => {
      setConnected(false);
      setUsers([]);
      setIsController(false);
      setApprovalPending(false);
      setPendingTeacherRequests([]);
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
    if (!isController) {
      alert("Only the room creator can start the quiz");
      return;
    }

    sendJson({
      type: "teacher_start_quiz",
      payload: {},
    });
  };

  const nextQuestion = () => {
    if (!isController) {
      alert("Only the room creator can control the quiz");
      return;
    }

    sendJson({
      type: "teacher_next_question",
      payload: {},
    });
  };

  const respondToTeacherJoinRequest = (
    teacherName: string,
    approved: boolean,
  ) => {
    sendJson({
      type: "teacher_approval_response",
      payload: {
        teacher_name: teacherName,
        approved,
      },
    });

    setPendingTeacherRequests((previousRequests) =>
      previousRequests.filter(
        (request) => request.teacher_name !== teacherName,
      ),
    );
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

  return {
    roomCode,
    setRoomCode,
    name,
    setName,
    role,
    connected,
    connectionMessage,
    users,
    events,
    chatMessage,
    setChatMessage,
    quizTitle,
    quizStatus,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    selectedOptionIndex,
    answerResult,
    answerStats,
    scoreboard,
    remainingSeconds,
    questionExpired,
    chatEvents,
    connectToRoom,
    disconnectFromRoom,
    sendChatMessage,
    sendPing,
    startQuiz,
    nextQuestion,
    submitAnswer,
    quizFinished,
    podium,
    finalLeaderboard,

    showLeaderboardModal,
    setShowLeaderboardModal,
    isController,
    approvalPending,
    pendingTeacherRequests,
    respondToTeacherJoinRequest,
  };
}

export default useLiveQuizRoom;
