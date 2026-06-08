import Navbar from "../components/Navbar";
import EventTimeline from "../components/EventTimeline";
import Leaderboard from "../components/Leaderboard";
import LiveAnalytics from "../components/LiveAnalytics";
import LiveParticipants from "../components/LiveParticipants";
import LiveQuizPanel from "../components/LiveQuizPanel";
import RoomChat from "../components/RoomChat";
import RoomJoinCard from "../components/RoomJoinCard";
import useLiveQuizRoom from "../hooks/useLiveQuizRoom";

function TeacherPage() {
  const room = useLiveQuizRoom({ defaultRole: "teacher" });

  return (
    <div className="app">
      <Navbar connected={room.connected} role="teacher" />
      <div className="page-content">
        {/* Page Hero */}
        <section className="page-hero" style={{ marginBottom: 24 }}>
          <div className="hero-inner">
            <div>
              <p className="hero-eyebrow">Teacher Dashboard</p>
              <h1>Host Live <span className="accent-red">Quiz</span></h1>
              <p className="hero-description">
                Connect to a room, start the quiz, push questions live, and watch
                your students compete in real time.
              </p>
            </div>
            <div
              className={`status-pill ${room.connected ? "online" : "offline"}`}
              style={{ marginTop: 4, flexShrink: 0 }}
            >
              <span />
              {room.connected ? "Live Connection" : "Offline"}
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Left Rail */}
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

          {/* Center Stage */}
          <section className="arena-stage">
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
            <LiveAnalytics
              answerStats={room.answerStats}
              currentQuestion={room.currentQuestion}
            />
          </section>

          {/* Right Rail */}
          <aside className="arena-right-rail">
            <Leaderboard scoreboard={room.scoreboard} />
            <RoomChat
              connected={room.connected}
              chatMessage={room.chatMessage}
              chatEvents={room.chatEvents}
              onChatMessageChange={room.setChatMessage}
              onSendChatMessage={room.sendChatMessage}
              onPing={room.sendPing}
            />
            <EventTimeline events={room.events} />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default TeacherPage;
