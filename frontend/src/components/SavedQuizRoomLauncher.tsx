import { useEffect, useMemo, useState } from "react";
import {
    FaBookOpen,
    FaExclamationTriangle,
    FaRocket,
    FaSync,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getSavedQuizzesApi, startSessionApi } from "../api/quizApi";
import type { SavedQuiz } from "../types/quiz";
import SearchableSelect from "./SearchableSelect";

type SavedQuizRoomLauncherProps = {
    onRoomCreated: (roomCode: string) => void;
};

function SavedQuizRoomLauncher({ onRoomCreated }: SavedQuizRoomLauncherProps) {
    const navigate = useNavigate();

    const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
    const [selectedQuizId, setSelectedQuizId] = useState("");
    const [loading, setLoading] = useState(false);
    const [creatingRoom, setCreatingRoom] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"" | "success" | "error">("");

    const selectedQuiz = useMemo(() => {
        return quizzes.find((quiz) => quiz._id === selectedQuizId);
    }, [quizzes, selectedQuizId]);

    const loadQuizzes = async () => {
        try {
            setLoading(true);
            setMessage("");
            setMessageType("");

            const data = await getSavedQuizzesApi();

            setQuizzes(data.quizzes);

            if (data.quizzes.length > 0) {
                setSelectedQuizId((current) => {
                    const currentStillExists = data.quizzes.some(
                        (quiz) => quiz._id === current,
                    );

                    if (current && currentStillExists) {
                        return current;
                    }

                    return data.quizzes[0]._id;
                });
            } else {
                setSelectedQuizId("");
            }
        } catch (error) {
            setQuizzes([]);
            setSelectedQuizId("");
            setMessage(
                error instanceof Error ? error.message : "Failed to load saved quizzes",
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuizzes();
    }, []);

    const createRoomFromSavedQuiz = async () => {
        if (!selectedQuizId) {
            setMessage("Select a saved quiz first");
            setMessageType("error");
            return;
        }

        try {
            setCreatingRoom(true);
            setMessage("");
            setMessageType("");

            const data = await startSessionApi(selectedQuizId);

            sessionStorage.setItem("lastRoomCode", data.room_code);
            onRoomCreated(data.room_code);

            setMessage(`Room created: ${data.room_code}`);
            setMessageType("success");

            navigate("/teacher");
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Failed to create live room",
            );
            setMessageType("error");
        } finally {
            setCreatingRoom(false);
        }
    };

    const questionCount =
        selectedQuiz?.question_count ?? selectedQuiz?.questions?.length ?? 0;

    return (
        <div className="card builder-card saved-quiz-launcher">
            <div className="card-stripe" />

            <div className="card-header saved-quiz-header">
                <div className="card-header-left">
                    <div className="card-subtitle">Saved Quizzes</div>

                    <div className="card-title">
                        <FaBookOpen size={14} color="var(--blue)" />
                        Create Room from Existing Quiz
                    </div>
                </div>

                <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={loadQuizzes}
                    disabled={loading || creatingRoom}
                >
                    <FaSync size={13} />
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </div>

            <div className="saved-quiz-launcher-body">
                {quizzes.length === 0 ? (
                    <div className="saved-quiz-empty">
                        {loading
                            ? "Loading your saved quizzes..."
                            : "No saved quizzes found. Create a quiz below first."}
                    </div>
                ) : (
                    <>
                        <div className="saved-quiz-grid">
                            <div className="form-group saved-quiz-select-group">
                                <SearchableSelect
                                    label="Choose Quiz"
                                    placeholder="Type or select a saved quiz..."
                                    value={selectedQuizId}
                                    disabled={creatingRoom}
                                    allowClear={false}
                                    options={quizzes.map((quiz) => ({
                                        value: quiz._id,
                                        label: quiz.title,
                                        description: `${quiz.question_count ?? quiz.questions?.length ?? 0} question${(quiz.question_count ?? quiz.questions?.length ?? 0) === 1 ? "" : "s"
                                            }${quiz.description ? ` · ${quiz.description}` : ""}`,
                                    }))}
                                    onChange={setSelectedQuizId}
                                />
                            </div>

                            <button
                                type="button"
                                className="btn btn-red saved-quiz-room-btn"
                                onClick={createRoomFromSavedQuiz}
                                disabled={creatingRoom || !selectedQuizId}
                            >
                                <FaRocket size={14} />
                                {creatingRoom ? "Creating Room..." : "Create Live Room"}
                            </button>
                        </div>

                        {selectedQuiz && (
                            <div className="saved-quiz-preview">
                                <div className="saved-quiz-preview-main">
                                    <strong>{selectedQuiz.title}</strong>

                                    {selectedQuiz.description && (
                                        <p>{selectedQuiz.description}</p>
                                    )}
                                </div>

                                <div className="saved-quiz-preview-count">
                                    {questionCount} question{questionCount === 1 ? "" : "s"}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {message && (
                    <p
                        className={`builder-message ${messageType === "error" ? "error" : "success"
                            }`}
                    >
                        {messageType === "error" && <FaExclamationTriangle size={13} />}
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}

export default SavedQuizRoomLauncher;