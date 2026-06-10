import Navbar from "../components/Navbar";
import Leaderboard from "../components/Leaderboard";
import LiveAnalytics from "../components/LiveAnalytics";
import LiveParticipants from "../components/LiveParticipants";
import LiveQuizPanel from "../components/LiveQuizPanel";
import RoomChat from "../components/RoomChat";
import RoomJoinCard from "../components/RoomJoinCard";
import useLiveQuizRoom from "../hooks/useLiveQuizRoom";
import QuizResultsModal from "../components/QuizResultsModal";
import FinalLeaderboardModal from "../components/FinalLeaderboardModal";
import { useEffect, useState } from "react";
import { FaTrophy } from "react-icons/fa";

function TeacherPage() {
  const room = useLiveQuizRoom({ defaultRole: "teacher" });

  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    if (room.quizFinished) {
      setShowResultsModal(true);
    }
  }, [room.quizFinished]);

  return (
    <div className="app">
      <Navbar connected={room.connected} role="teacher" username={room.name} />

      <div className="page-content">
        {/* Hero */}
        <section className="page-hero" style={{ marginBottom: 24 }}>
          <div className="hero-inner">
            <div>
              <p className="hero-eyebrow">Teacher Dashboard</p>

              <h1>
                Host Live <span className="accent-red">Quiz</span>
              </h1>

              <p className="hero-description">
                Connect to a room, start the quiz, push questions live, and
                watch your students compete in real time.
              </p>
            </div>

            <div
              className={`status-pill ${room.connected ? "online" : "offline"}`}
              style={{
                marginTop: 4,
                flexShrink: 0,
              }}
            >
              <span />
              {room.connected ? "Live Connection" : "Offline"}
            </div>
          </div>
        </section>

        {/* KPI Ribbon */}
        <section className="teacher-kpi-ribbon">
          <div className="kpi-card">
            <span className="kpi-value">42</span>
            <span className="kpi-label">Rooms Hosted</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-value">387</span>
            <span className="kpi-label">Students Participated</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-value">76%</span>
            <span className="kpi-label">Average Score</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-value">19</span>
            <span className="kpi-label">Quizzes Created</span>
          </div>
        </section>

        {/* Main Layout */}
        <div className="teacher-dashboard-layout">
          {/* LEFT RAIL */}
          <aside className="arena-left-rail">
            <RoomJoinCard
              roomCode={room.roomCode}
              name={room.name}
              role={room.role}
              connected={room.connected}
              connectionMessage={room.connectionMessage}
              onRoomCodeChange={room.setRoomCode}
              onNameChange={room.setName}
              onConnect={room.connectToRoom}
              onDisconnect={room.disconnectFromRoom}
            />

            <Leaderboard scoreboard={room.scoreboard} />
          </aside>

          {/* CENTER */}
          <section className="teacher-quiz-panel">
            <LiveQuizPanel
              role={room.role}
              connected={room.connected}
              quizTitle={room.quizTitle}
              quizStatus={room.quizStatus}
              currentQuestion={room.currentQuestion}
              currentQuestionIndex={room.currentQuestionIndex}
              totalQuestions={room.totalQuestions}
              selectedOptionIndex={room.selectedOptionIndex}
              answerResult={room.answerResult}
              answerStats={room.answerStats}
              remainingSeconds={room.remainingSeconds}
              questionExpired={room.questionExpired}
              onStartQuiz={room.startQuiz}
              onNextQuestion={room.nextQuestion}
              onSubmitAnswer={room.submitAnswer}
            />

            {room.quizFinished && (
              <div className="lqa-results-button-wrapper">
                <button
                  className="lqa-view-results-btn"
                  onClick={() => setShowResultsModal(true)}
                >
                  <FaTrophy />
                  <span>View Results</span>
                </button>
              </div>
            )}
          </section>

          {/* RIGHT */}
          <aside className="teacher-analytics-panel">
            <LiveAnalytics
              answerStats={room.answerStats}
              currentQuestion={room.currentQuestion}
            />
            <LiveParticipants users={room.users} />
          </aside>
        </div>
        <QuizResultsModal
          open={showResultsModal}
          podium={room.podium}
          onViewLeaderboard={() => {
            setShowResultsModal(false);
            room.setShowLeaderboardModal(true);
          }}
          onClose={() => setShowResultsModal(false)}
        />

        <FinalLeaderboardModal
          open={room.showLeaderboardModal}
          leaderboard={room.finalLeaderboard}
          onClose={() => room.setShowLeaderboardModal(false)}
        />

        {/* Floating Chat */}
        <RoomChat
          connected={room.connected}
          chatMessage={room.chatMessage}
          chatEvents={room.chatEvents}
          onChatMessageChange={room.setChatMessage}
          onSendChatMessage={room.sendChatMessage}
          onPing={room.sendPing}
        />
      </div>
    </div>
  );
}

export default TeacherPage;
