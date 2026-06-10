import { type ChangeEvent, useRef, useState } from "react";
import {
  FaCheck,
  FaClock,
  FaCopy,
  FaEdit,
  FaDownload,
  FaExclamationTriangle,
  FaFileExcel,
  FaPlus,
  FaRocket,
  FaSave,
  FaTrash,
  FaUndo,
  FaUpload,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { createQuizApi, startSessionApi } from "../api/quizApi";
import type { QuestionDraft } from "../types/quiz";
import { useNavigate } from "react-router-dom";

type QuizBuilderProps = { onRoomCreated: (roomCode: string) => void };

type ExcelQuestionRow = {
  [key: string]: string | number | undefined;
};

const TEMPLATE_HEADERS = [
  "Question",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Correct Answer",
  "Time Limit Seconds",
];

const getExcelValue = (row: ExcelQuestionRow, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];

    if (value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
};

const parseCorrectAnswer = (value: string, options: string[]) => {
  const normalized = value.trim().toUpperCase();

  if (["A", "B", "C", "D"].includes(normalized)) {
    return normalized.charCodeAt(0) - 65;
  }

  const numeric = Number(normalized);

  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 4) {
    return numeric - 1;
  }

  const optionIndex = options.findIndex(
    (option) => option.trim().toUpperCase() === normalized,
  );

  return optionIndex;
};

function QuizBuilder({ onRoomCreated }: QuizBuilderProps) {
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderDescription, setBuilderDescription] = useState("");
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const downloadExcelTemplate = () => {
    const rows = [
      TEMPLATE_HEADERS,
      [
        "Which language is used with FastAPI?",
        "Python",
        "Java",
        "C++",
        "Ruby",
        "A",
        30,
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 42 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(workbook, "livequiz_questions_template.xlsx");
  };

  const importQuestionsFromExcel = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("The workbook does not contain any sheets");
      }

      const worksheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json<ExcelQuestionRow>(worksheet, {
        defval: "",
      });

      if (!rows.length) {
        throw new Error("The template does not contain any question rows");
      }

      const importedQuestions: QuestionDraft[] = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2;

        const text = getExcelValue(row, ["Question", "Question Text"]);

        const options = [
          getExcelValue(row, ["Option A", "A"]),
          getExcelValue(row, ["Option B", "B"]),
          getExcelValue(row, ["Option C", "C"]),
          getExcelValue(row, ["Option D", "D"]),
        ];

        const correctAnswer = getExcelValue(row, [
          "Correct Answer",
          "Correct Option",
          "Answer",
        ]);

        const timerValue = getExcelValue(row, [
          "Time Limit Seconds",
          "Time Limit",
          "Timer",
        ]);

        const isEmptyRow =
          !text && options.every((option) => !option) && !correctAnswer;

        if (isEmptyRow) {
          return;
        }

        if (!text) {
          throw new Error(`Row ${rowNumber}: question is required`);
        }

        if (options.some((option) => !option)) {
          throw new Error(`Row ${rowNumber}: all four options are required`);
        }

        if (!correctAnswer) {
          throw new Error(`Row ${rowNumber}: correct answer is required`);
        }

        const correct_option_index = parseCorrectAnswer(correctAnswer, options);

        if (correct_option_index < 0 || correct_option_index > 3) {
          throw new Error(
            `Row ${rowNumber}: correct answer must be A, B, C, D, 1-4, or exact option text`,
          );
        }

        const time_limit_seconds = timerValue ? Number(timerValue) : 30;

        if (
          !Number.isFinite(time_limit_seconds) ||
          time_limit_seconds < 5 ||
          time_limit_seconds > 300
        ) {
          throw new Error(
            `Row ${rowNumber}: time limit must be between 5 and 300 seconds`,
          );
        }

        importedQuestions.push({
          text,
          options,
          correct_option_index,
          time_limit_seconds,
        });
      });

      if (!importedQuestions.length) {
        throw new Error("No valid questions were found in the workbook");
      }

      setQuestionDrafts(importedQuestions);
      setCreatedQuizId("");
      setCreatedRoomCode("");
      setBuilderMessage(
        `Imported ${importedQuestions.length} question${importedQuestions.length === 1 ? "" : "s"
        } from Excel. Review them, then create the quiz.`,
      );
      setMessageType("success");
    } catch (error) {
      setBuilderMessage(
        error instanceof Error ? error.message : "Failed to import Excel file",
      );
      setMessageType("error");
    } finally {
      event.target.value = "";
    }
  };

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
      setBuilderMessage(
        e instanceof Error ? e.message : "Something went wrong",
      );
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

      navigate("/teacher");
      onRoomCreated(data.room_code);
      setBuilderMessage("Room created! Share the code with students.");
      setMessageType("success");
    } catch (e) {
      setBuilderMessage(
        e instanceof Error ? e.message : "Something went wrong",
      );
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
      <div className="card builder-card excel-import-card">
        <div className="excel-import-copy">
          <div className="card-subtitle">Bulk Upload</div>

          <div className="excel-import-title">
            <FaFileExcel size={20} color="var(--blue)" />
            Import questions from Excel
          </div>

          <p>
            Download the template, fill one question per row, then upload it to
            auto-fill the quiz questions below.
          </p>
        </div>

        <div className="excel-import-actions">
          <button className="btn btn-ghost" onClick={downloadExcelTemplate}>
            <FaDownload size={13} />
            Download Template
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden-file-input"
            onChange={importQuestionsFromExcel}
          />

          <button
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <FaUpload size={13} />
            Upload Excel
          </button>
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
                          i === oi ? e.target.value : o,
                        );

                        updateDraft(qi, { ...q, options: updated });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    />

                    <button
                      className={`correct-option-btn ${q.correct_option_index === oi ? "active" : ""
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
                className={`builder-message ${messageType === "error" ? "error" : "success"
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
