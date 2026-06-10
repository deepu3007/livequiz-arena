import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaChartLine,
  FaChartPie,
  FaEdit,
  FaGamepad,
  FaSignOutAlt,
  FaUniversity,
  FaUserCircle,
} from "react-icons/fa";


type NavbarProps = {
  connected?: boolean;
};

function Navbar({ connected = false }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const token = sessionStorage.getItem("token");
  const isLoggedIn = !!token;

  let username = "";
  let role: "teacher" | "student" | undefined;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      username = payload.username ?? payload.sub ?? "";
      role = payload.role ?? undefined;
    } catch {
      sessionStorage.removeItem("token");
    }
  }

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("lastRoomCode");
    navigate("/");
  };

  return (
    <nav className="arena-navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo-icon">
          <FaUniversity size={22} />
        </div>

        <span className="navbar-wordmark">
          Live<span>Quiz</span> Arena
        </span>
      </Link>

      <div className="navbar-links">
        {role === "teacher" && (
          <>
            <Link
              to="/teacher"
              className={`navbar-link red-link ${isActive("/teacher") ? "active" : ""
                }`}
            >
              <FaChalkboardTeacher size={15} />
              Teacher
            </Link>

            <Link
              to="/create"
              className={`navbar-link red-link ${isActive("/create") ? "active" : ""
                }`}
            >
              <FaEdit size={15} />
              Create Quiz
            </Link>

            <Link
              to="/stats"
              className={`navbar-link red-link ${isActive("/stats") ? "active" : ""
                }`}
            >
              <FaChartPie size={15} />
              Stats
            </Link>
          </>
        )}

        {role === "student" && (
          <>
            <Link
              to="/student"
              className={`navbar-link red-link ${isActive("/student") ? "active" : ""
                }`}
            >
              <FaGamepad size={15} />
              Student
            </Link>

            <Link
              to="/student-stats"
              className={`navbar-link red-link ${isActive("/student-stats") ? "active" : ""
                }`}
            >
              <FaChartLine size={15} />
              My Stats
            </Link>
          </>
        )}
      </div>

      <div className="navbar-right">
        <div className="navbar-status">
          <div className={`status-dot ${connected ? "online" : ""}`} />

          <span className={`status-text ${connected ? "online" : ""}`}>
            {connected
              ? `${role === "teacher" ? "Teaching" : "Playing"} Live`
              : "Offline"}
          </span>
        </div>

        {isLoggedIn && (
          <>
            <div className="navbar-user">
              <FaUserCircle size={34} />

              <div>
                <div className="navbar-username">{username}</div>
                <div className="navbar-role">{role}</div>
              </div>
            </div>

            <button className="btn btn-red btn-sm" onClick={handleLogout}>
              <FaSignOutAlt />
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar; 