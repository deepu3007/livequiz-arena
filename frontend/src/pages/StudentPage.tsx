import Navbar from "../components/Navbar";
import Leaderboard from "../components/Leaderboard";
import LiveParticipants from "../components/LiveParticipants";
import LiveQuizPanel from "../components/LiveQuizPanel";
import RoomChat from "../components/RoomChat";
import RoomJoinCard from "../components/RoomJoinCard";
import useLiveQuizRoom from "../hooks/useLiveQuizRoom";
import QuizResultsModal from "../components/QuizResultsModal";
import FinalLeaderboardModal from "../components/FinalLeaderboardModal";
import { useEffect, useState } from "react";
import { FaTrophy } from "react-icons/fa";

function StudentPage() {
  const room = useLiveQuizRoom({ defaultRole: "student" });
  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    if (room.quizFinished) {
      setShowResultsModal(true);
    }
  }, [room.quizFinished]);

  return (
    <div className="app">
      <Navbar />

      <div className="page-content">
        {/* Hero */}
        <section className="page-hero" style={{ marginBottom: 24 }}>
          <div className="hero-inner">
            <div>
              <p className="hero-eyebrow">Student Room</p>

              <h1>
                Join the <span className="accent-blue">Arena</span>
              </h1>

              <p className="hero-description">
                Enter the room code from your teacher, wait for the quiz to
                start, answer questions fast, and climb the leaderboard.
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

        {/* Main Layout */}
        <div className="teacher-dashboard-layout">
          {/* LEFT */}
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

            <LiveParticipants users={room.users} />
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
            <Leaderboard scoreboard={room.scoreboard} />
          </aside>
        </div>

        {/* Quiz Results Modal */}
        <QuizResultsModal
          open={showResultsModal}
          podium={room.podium}
          onViewLeaderboard={() => {
            setShowResultsModal(false);
            room.setShowLeaderboardModal(true);
          }}
          onClose={() => setShowResultsModal(false)}
        />

        {/* Full Leaderboard Modal */}
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

export default StudentPage;
