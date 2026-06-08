import { Link, useLocation } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaEdit,
  FaGamepad,
  FaHome,
  FaUniversity,
} from "react-icons/fa";

type NavbarProps = {
  connected?: boolean;
  role?: "teacher" | "student";
};

function Navbar({ connected = false, role }: NavbarProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

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
        <Link
          to="/"
          className={`navbar-link ${isActive("/") ? "active" : ""}`}
        >
          <FaHome size={15} />
          Home
        </Link>

        <Link
          to="/create"
          className={`navbar-link red-link ${isActive("/create") ? "active" : ""}`}
        >
          <FaEdit size={15} />
          Create Quiz
        </Link>

        <Link
          to="/teacher"
          className={`navbar-link ${isActive("/teacher") ? "active" : ""}`}
        >
          <FaChalkboardTeacher size={15} />
          Teacher
        </Link>

        <Link
          to="/student"
          className={`navbar-link ${isActive("/student") ? "active" : ""}`}
        >
          <FaGamepad size={15} />
          Student
        </Link>
      </div>

      <div className="navbar-status">
        <div className={`status-dot ${connected ? "online" : ""}`} />

        <span className={`status-text ${connected ? "online" : ""}`}>
          {connected
            ? `${role === "teacher" ? "Teaching" : "Playing"} Live`
            : "Not Connected"}
        </span>
      </div>
    </nav>
  );
}

export default Navbar;