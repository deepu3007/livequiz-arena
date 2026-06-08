import {
  FaCheckCircle,
  FaClock,
  FaHourglassHalf,
  FaPlay,
  FaStepForward,
  FaTimesCircle,
  FaTrophy,
} from "react-icons/fa";
import type { AnswerStats, QuizQuestion, UserRole } from "../types/quiz";

type LiveQuizPanelProps = {
  role: UserRole;
  connected: boolean;
  quizTitle: string;
  quizStatus: "waiting" | "live" | "ended";
  currentQuestion: QuizQuestion | null;
  currentQuestionIndex: number | null;
  totalQuestions: number | null;
  selectedOptionIndex: number | null;
  answerResult: { is_correct: boolean; points: number; new_score: number } | null;
  answerStats: AnswerStats | null;
  remainingSeconds: number | null;
  questionExpired: boolean;
  onStartQuiz: () => void;
  onNextQuestion: () => void;
  onSubmitAnswer: (optionIndex: number) => void;
};

function LiveQuizPanel({
  role,
  connected,
  quizTitle,
  quizStatus,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  selectedOptionIndex,
  answerResult,
  answerStats,
  remainingSeconds,
  questionExpired,
  onStartQuiz,
  onNextQuestion,
  onSubmitAnswer,
}: LiveQuizPanelProps) {
  const progressValue = currentQuestion
    ? remainingSeconds === null
      ? 100
      : Math.max(
          0,
          Math.round((remainingSeconds / currentQuestion.time_limit_seconds) * 100)
        )
    : 0;

  const timerUrgent =
    remainingSeconds !== null && remainingSeconds <= 5 && !questionExpired;

  const timerWarning =
    remainingSeconds !== null &&
    remainingSeconds <= 10 &&
    !timerUrgent &&
    !questionExpired;

  const timerBarClass = questionExpired
    ? "expired"
    : timerUrgent
    ? "urgent"
    : timerWarning
    ? "warning"
    : "";

  const getStatusLabel = () => {
    if (quizStatus === "waiting") {
      return (
        <>
          <FaHourglassHalf size={12} />
          Waiting
        </>
      );
    }

    if (quizStatus === "live") {
      return (
        <>
          <span className="live-dot" />
          Live
        </>
      );
    }

    return (
      <>
        <FaCheckCircle size={12} />
        Ended
      </>
    );
  };

  return (
    <div className="card quiz-stage-card">
      <div className="card-stripe" />

      <div className="card-header">
        <div className="card-header-left">
          <div className="card-subtitle">Live Quiz</div>
          <div className="card-title">
            <FaTrophy size={22} color="#F5C400" />
            {quizTitle || "Quiz Control Center"}
          </div>
        </div>

        <span className={`quiz-status-badge ${quizStatus}`}>
          {getStatusLabel()}
        </span>
      </div>

      {role === "teacher" && (
        <div className="teacher-controls">
          <button
            className="btn btn-primary"
            onClick={onStartQuiz}
            disabled={!connected || quizStatus === "live"}
          >
            <FaPlay size={14} />
            Start Quiz
          </button>

          <button
            className="btn btn-yellow"
            onClick={onNextQuestion}
            disabled={!connected || quizStatus !== "live"}
          >
            <FaStepForward size={14} />
            Next Question
          </button>
        </div>
      )}

      <div className="quiz-panel-scroll">
        {quizStatus === "waiting" && (
          <div className="quiz-empty-state">
            <span className="quiz-empty-state-icon">
              <FaHourglassHalf />
            </span>

            <h3>Waiting for Teacher</h3>

            <p>
              {role === "teacher"
                ? "Connect to a room and click Start Quiz to begin."
                : "The quiz will start once your teacher begins the session."}
            </p>
          </div>
        )}

        {quizStatus === "ended" && (
          <div className="quiz-empty-state ended">
            <span className="quiz-empty-state-icon">
              <FaTrophy />
            </span>

            <h3>Quiz Complete!</h3>
            <p>Final scores are ready. Check the leaderboard on the right.</p>
          </div>
        )}

        {currentQuestion && (
          <div className="question-panel">
            <div className="question-meta">
              <span className="question-number-chip">
                Q{(currentQuestionIndex ?? 0) + 1}
                {totalQuestions ? ` / ${totalQuestions}` : ""}
              </span>

              <span
                className={`timer-pill ${
                  questionExpired ? "expired" : timerUrgent ? "urgent" : ""
                }`}
              >
                <FaClock size={13} />
                {questionExpired
                  ? "Time's Up!"
                  : `${remainingSeconds ?? currentQuestion.time_limit_seconds}s`}
              </span>
            </div>

            <div className="timer-bar-track">
              <div
                className={`timer-bar-fill ${timerBarClass}`}
                style={{ width: `${progressValue}%` }}
              />
            </div>

            <div className="question-text">{currentQuestion.text}</div>

            <div className="options-grid">
              {currentQuestion.options.map((option, index) => {
                const optionCount =
                  answerStats?.option_counts?.[String(index)] ?? 0;

                const selected = selectedOptionIndex === index;

                return (
                  <button
                    key={`${currentQuestion.id}-${index}`}
                    className={`option-button ${selected ? "selected" : ""}`}
                    onClick={() => onSubmitAnswer(index)}
                    disabled={
                      role !== "student" ||
                      !connected ||
                      answerResult !== null ||
                      questionExpired ||
                      remainingSeconds === 0
                    }
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="option-text">{option}</span>

                    {role === "teacher" && (
                      <span className="option-count">{optionCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {answerResult && role === "student" && (
              <div
                className={`answer-result ${
                  answerResult.is_correct ? "correct" : "wrong"
                }`}
              >
                <span className="answer-result-icon">
                  {answerResult.is_correct ? (
                    <FaCheckCircle />
                  ) : (
                    <FaTimesCircle />
                  )}
                </span>

                <div className="answer-result-content">
                  <strong>
                    {answerResult.is_correct
                      ? "Correct Answer!"
                      : "Wrong Answer"}
                  </strong>

                  <p>
                    +{answerResult.points} pts · Total score:{" "}
                    {answerResult.new_score}
                  </p>
                </div>
              </div>
            )}

            {questionExpired && !answerResult && role === "student" && (
              <div className="answer-result wrong">
                <span className="answer-result-icon">
                  <FaClock />
                </span>

                <div className="answer-result-content">
                  <strong>Time's Up!</strong>
                  <p>You didn't submit an answer in time.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveQuizPanel;