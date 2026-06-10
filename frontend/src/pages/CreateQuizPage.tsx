import Navbar from "../components/Navbar";
import QuizBuilder from "../components/QuizBuilder";
import SavedQuizRoomLauncher from "../components/SavedQuizRoomLauncher";

function CreateQuizPage() {
  const handleRoomCreated = (newRoomCode: string) => {
    sessionStorage.setItem("lastRoomCode", newRoomCode);
  };

  return (
    <div className="app">
      <Navbar />

      <div className="page-content">
        <section className="page-hero" style={{ marginBottom: 24 }}>
          <div className="hero-inner">
            <div>
              <p className="hero-eyebrow">Quiz Setup</p>

              <h1>
                Build or Reuse a <span className="accent-red">Quiz</span>
              </h1>

              <p className="hero-description">
                Create a new quiz, or select a saved quiz and instantly generate
                a live room code for your students.
              </p>
            </div>
          </div>
        </section>

        <div className="builder-workspace">
          <SavedQuizRoomLauncher onRoomCreated={handleRoomCreated} />

          <QuizBuilder onRoomCreated={handleRoomCreated} />
        </div>
      </div>
    </div>
  );
}

export default CreateQuizPage;