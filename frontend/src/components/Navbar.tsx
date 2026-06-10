import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaEdit,
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
  console.log("token: ", token);
  const isLoggedIn = !!token;

  let username = "";
  let role: "teacher" | "student" | undefined;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("payload:", payload);
      username = payload.username ?? payload.sub ?? "";
      role = payload.role ?? undefined;
      console.log("username is:", username);
      console.log("role is:", role);
      console.log("payload:", payload);
    } catch {
      // invalid token
    }
  }

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    sessionStorage.removeItem("token");
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
          <Link
            to="/create"
            className={`navbar-link red-link ${
              isActive("/create") ? "active" : ""
            }`}
          >
            <FaEdit size={15} />
            Create Quiz
          </Link>
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
