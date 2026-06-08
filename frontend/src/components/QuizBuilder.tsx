import { useState } from "react";
import {
  FaCheck,
  FaClock,
  FaCopy,
  FaEdit,
  FaExclamationTriangle,
  FaPlus,
  FaRocket,
  FaSave,
  FaTrash,
  FaUndo,
} from "react-icons/fa";
import { createQuizApi, startSessionApi } from "../api/quizApi";
import type { QuestionDraft } from "../types/quiz";

type QuizBuilderProps = { onRoomCreated: (roomCode: string) => void };

function QuizBuilder({ onRoomCreated }: QuizBuilderProps) {
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderDescription, setBuilderDescription] = useState("");
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([
    {
      text: "",
      options: ["", "", "", ""],
      correct_option_index: 0,
      time_limit_seconds: 30,
    },
  ]);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [createdQuizId, setCreatedQuizId] = useState("");
  const [createdRoomCode, setCreatedRoomCode] = useState("");
  const [builderMessage, setBuilderMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "success" | "error">("");

  const updateDraft = (idx: number, updated: QuestionDraft) =>
    setQuestionDrafts((prev) => prev.map((q, i) => (i === idx ? updated : q)));

  const validate = () => {
    if (!builderTitle.trim()) return "Quiz title is required";

    for (let i = 0; i < questionDrafts.length; i++) {
      const q = questionDrafts[i];

      if (!q.text.trim()) return `Question ${i + 1} text is required`;

      if (q.options.some((o) => !o.trim())) {
        return `Question ${i + 1} needs all 4 options`;
      }

      if (q.time_limit_seconds < 5 || q.time_limit_seconds > 300) {
        return `Question ${i + 1} timer must be 5–300 seconds`;
      }
    }

    return null;
  };

  const createQuiz = async () => {
    const err = validate();

    if (err) {
      setBuilderMessage(err);
      setMessageType("error");
      return;
    }

    try {
      setCreatingQuiz(true);
      setBuilderMessage("");
      setCreatedQuizId("");
      setCreatedRoomCode("");

      const data = await createQuizApi({
        title: builderTitle.trim(),
        description: builderDescription.trim() || null,
        questions: questionDrafts.map((q) => ({
          text: q.text.trim(),
          options: q.options.map((o) => o.trim()),
          correct_option_index: q.correct_option_index,
          time_limit_seconds: q.time_limit_seconds,
        })),
      });

      setCreatedQuizId(data.quiz_id);
      setBuilderMessage("Quiz created! Now create a live room.");
      setMessageType("success");
    } catch (e) {
      setBuilderMessage(e instanceof Error ? e.message : "Something went wrong");
      setMessageType("error");
    } finally {
      setCreatingQuiz(false);
    }
  };

  const startSession = async () => {
    if (!createdQuizId) {
      setBuilderMessage("Create a quiz first");
      setMessageType("error");
      return;
    }

    try {
      setCreatingQuiz(true);
      setBuilderMessage("");

      const data = await startSessionApi(createdQuizId);

      setCreatedRoomCode(data.room_code);
      onRoomCreated(data.room_code);
      setBuilderMessage("Room created! Share the code with students.");
      setMessageType("success");
    } catch (e) {
      setBuilderMessage(e instanceof Error ? e.message : "Something went wrong");
      setMessageType("error");
    } finally {
      setCreatingQuiz(false);
    }
  };

  const reset = () => {
    setBuilderTitle("");
    setBuilderDescription("");
    setQuestionDrafts([
      {
        text: "",
        options: ["", "", "", ""],
        correct_option_index: 0,
        time_limit_seconds: 30,
      },
    ]);
    setCreatedQuizId("");
    setCreatedRoomCode("");
    setBuilderMessage("");
    setMessageType("");
  };

  return (
    <>
      <div className="card builder-card">
        <div className="card-stripe" />

        <div className="card-header">
          <div className="card-header-left">
            <div className="card-subtitle">Quiz Builder</div>

            <div className="card-title">
              <FaEdit size={22} color="var(--blue)" />
              Quiz Details
            </div>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={reset}>
            <FaUndo size={13} />
            Reset
          </button>
        </div>

        <div className="builder-grid">
          <div className="form-group">
            <label className="form-label">Quiz Title *</label>
            <input
              className="form-input"
              value={builderTitle}
              onChange={(e) => setBuilderTitle(e.target.value)}
              placeholder="e.g. Python Basics"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              value={builderDescription}
              onChange={(e) => setBuilderDescription(e.target.value)}
              placeholder="e.g. Beginner quiz on Python syntax"
            />
          </div>
        </div>
      </div>

      {questionDrafts.map((q, qi) => (
        <div className="card builder-card question-builder" key={qi}>
          <div className="question-builder-header">
            <div>
              <div className="q-number">Q{qi + 1}</div>
              <div className="q-label">Question setup</div>
            </div>

            <button
              className="btn btn-sm remove-question-btn"
              onClick={() => {
                if (questionDrafts.length === 1) {
                  alert("A quiz must have at least one question");
                  return;
                }

                setQuestionDrafts((prev) => prev.filter((_, i) => i !== qi));
              }}
            >
              <FaTrash size={13} />
              Remove
            </button>
          </div>

          <div className="question-builder-body">
            <div className="form-group">
              <label className="form-label">Question Text *</label>
              <input
                className="form-input"
                value={q.text}
                onChange={(e) =>
                  updateDraft(qi, { ...q, text: e.target.value })
                }
                placeholder="Type your question here..."
              />
            </div>

            <div className="options-editor">
              {q.options.map((opt, oi) => (
                <div className="form-group" key={oi}>
                  <label className="form-label">
                    Option {String.fromCharCode(65 + oi)}
                  </label>

                  <div className="option-editor-row">
                    <input
                      className="form-input"
                      value={opt}
                      onChange={(e) => {
                        const updated = q.options.map((o, i) =>
                          i === oi ? e.target.value : o
                        );

                        updateDraft(qi, { ...q, options: updated });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    />

                    <button
                      className={`correct-option-btn ${
                        q.correct_option_index === oi ? "active" : ""
                      }`}
                      onClick={() =>
                        updateDraft(qi, { ...q, correct_option_index: oi })
                      }
                      type="button"
                    >
                      {q.correct_option_index === oi ? (
                        <>
                          <FaCheck size={13} />
                          Correct
                        </>
                      ) : (
                        "Set Correct"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="timer-editor">
              <label>
                <FaClock size={14} />
              Time Limit
              </label>

              <input
                type="number"
                min={5}
                max={300}
                value={q.time_limit_seconds}
                onChange={(e) =>
                  updateDraft(qi, {
                    ...q,
                    time_limit_seconds: Number(e.target.value),
                  })
                }
              />

              <span>seconds</span>
            </div>
          </div>
        </div>
      ))}

      <div className="card builder-card">
        <div className="builder-actions">
          <button
            className="btn btn-ghost"
            onClick={() =>
              setQuestionDrafts((prev) => [
                ...prev,
                {
                  text: "",
                  options: ["", "", "", ""],
                  correct_option_index: 0,
                  time_limit_seconds: 30,
                },
              ])
            }
          >
            <FaPlus size={13} />
            Add Question
          </button>

          <button
            className="btn btn-primary"
            onClick={createQuiz}
            disabled={creatingQuiz}
          >
            <FaSave size={14} />
            {creatingQuiz ? "Creating..." : "Create Quiz"}
          </button>

          <button
            className="btn btn-red"
            onClick={startSession}
            disabled={!createdQuizId || creatingQuiz}
          >
            <FaRocket size={14} />
            {creatingQuiz ? "Creating..." : "Create Live Room"}
          </button>
        </div>

        {(builderMessage || createdQuizId || createdRoomCode) && (
          <div className="builder-result">
            {builderMessage && (
              <p
                className={`builder-message ${
                  messageType === "error" ? "error" : "success"
                }`}
              >
                {messageType === "success" && <FaCheck size={13} />}
                {messageType === "error" && <FaExclamationTriangle size={13} />}
                {builderMessage}
              </p>
            )}

            {createdQuizId && (
              <div className="result-row">
                <strong>Quiz ID</strong>

                <code className="result-code">{createdQuizId}</code>
              </div>
            )}

            {createdRoomCode && (
              <div className="result-row">
                <strong>Room Code</strong>

                <button
                  className="room-code-button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(createdRoomCode);
                    setBuilderMessage("Room code copied!");
                    setMessageType("success");
                  }}
                >
                  <FaCopy size={13} />
                  {createdRoomCode}
                </button>

                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Click to copy
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default QuizBuilder;