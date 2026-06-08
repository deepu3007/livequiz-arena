import { Link } from "react-router-dom";
import {
  FaBolt,
  FaChalkboardTeacher,
  FaEdit,
  FaGamepad,
  FaInfinity,
  FaTrophy,
} from "react-icons/fa";
import Navbar from "../components/Navbar";

function HomePage() {
  return (
    <div className="app">
      <Navbar />

      <div className="page-content">
        <section className="page-hero home-hero" style={{ marginBottom: 24 }}>
          <div className="stadium-stripes" />

          <div className="hero-inner">
            <div>
              <p className="hero-eyebrow">Live Sports-Style Classroom Battles</p>

              <h1>
                Live<span className="accent-yellow">Quiz</span>
                <br />
                <span className="accent-red">Arena</span>
              </h1>

              <p className="hero-description">
                Create live classroom quizzes, invite students with a room code,
                push questions in real time, and watch the leaderboard light up.
              </p>

              <div className="home-actions">
                <Link to="/create">
                  <button className="btn btn-red btn-lg">
                    <FaEdit size={15} />
                    Create Quiz
                  </button>
                </Link>

                <Link to="/teacher">
                  <button className="btn btn-yellow btn-lg">
                    <FaChalkboardTeacher size={15} />
                    Teacher Dashboard
                  </button>
                </Link>

                <Link to="/student">
                  <button
                    className="btn btn-outline btn-lg"
                    style={{
                      color: "white",
                      borderColor: "rgba(255,255,255,0.4)",
                    }}
                  >
                    <FaGamepad size={15} />
                    Join as Student
                  </button>
                </Link>
              </div>
            </div>

            <div className="home-feature-card">
              <p className="section-label">Platform Features</p>

              <ul>
                <li>Real-time WebSocket quiz rooms</li>
                <li>Teacher &amp; student roles</li>
                <li>Live answer analytics</li>
                <li>Live leaderboard &amp; charts</li>
                <li>MongoDB-backed quiz sessions</li>
                <li>Room chat &amp; event timeline</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="home-stats-strip">
          <div className="home-stat-block">
            <div className="home-stat-value">
              <FaBolt />
            </div>
            <div className="home-stat-label">Real-time WebSocket</div>
          </div>

          <div className="home-stat-block">
            <div className="home-stat-value">
              <FaInfinity />
            </div>
            <div className="home-stat-label">Questions per Quiz</div>
          </div>

          <div className="home-stat-block">
            <div className="home-stat-value">
              <FaTrophy />
            </div>
            <div className="home-stat-label">Live Leaderboard</div>
          </div>
        </div>

        <div className="home-role-cards">
          <Link to="/teacher" className="role-card teacher-card">
            <div className="role-card-icon">
              <FaChalkboardTeacher />
            </div>

            <div className="role-card-title">Teacher Dashboard</div>

            <div className="role-card-desc">
              Start quizzes, advance questions, monitor live responses, and see
              the leaderboard update in real time.
            </div>

            <div className="role-card-arrow">Enter Dashboard →</div>
          </Link>

          <Link to="/student" className="role-card student-card">
            <div className="role-card-icon">
              <FaGamepad />
            </div>

            <div className="role-card-title">Student Room</div>

            <div className="role-card-desc">
              Enter a room code, wait for the teacher to start, and compete
              against your classmates for the top spot.
            </div>

            <div className="role-card-arrow">Join a Room →</div>
          </Link>

          <Link to="/create" className="role-card create-card">
            <div className="role-card-icon">
              <FaEdit />
            </div>

            <div className="role-card-title">Create Quiz</div>

            <div className="role-card-desc">
              Build a custom quiz with multiple choice questions, set timers,
              and generate a live room code instantly.
            </div>

            <div className="role-card-arrow">Build a Quiz →</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;