import Navbar from "../components/Navbar";
import QuizBuilder from "../components/QuizBuilder";

function CreateQuizPage() {
  return (
    <div className="app">
      <Navbar />
      <div className="page-content">
        <section className="page-hero" style={{ marginBottom: 24 }}>
          <div className="hero-inner">
            <div>
              <p className="hero-eyebrow">Quiz Setup</p>
              <h1>Build a <span className="accent-red">Quiz</span></h1>
              <p className="hero-description">
                Create questions, set timers, choose the right answers, then
                generate a live room code to share with your students.
              </p>
            </div>
          </div>
        </section>

        <div className="builder-workspace">
          <QuizBuilder
            onRoomCreated={(newRoomCode) => {
              sessionStorage.setItem("lastRoomCode", newRoomCode);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CreateQuizPage;
