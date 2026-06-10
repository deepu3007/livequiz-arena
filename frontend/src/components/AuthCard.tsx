import { useState } from "react";
import { FaLock, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { login, signup } from "../services/auth";

type UserRole = "teacher" | "student";

export default function AuthCard() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      if (!username.trim() || !password.trim()) {
        setError("Please fill all fields");
        return;
      }

      if (mode === "signup") {
        await signup(username, password, role);

        alert("Account created successfully!");

        setMode("login");
        setPassword("");

        return;
      }

      const result = await login(username, password);

      // Store user details
      sessionStorage.setItem("role", result.role);
      sessionStorage.setItem("username", username);

      if (result.role === "teacher") {
        navigate("/teacher");
      } else {
        navigate("/student");
      }
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
          err !== null &&
          "message" in err &&
          typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : mode === "login"
            ? "Invalid username or password"
            : "Signup failed";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h3>{mode === "login" ? "Login" : "Create Account"}</h3>

      <input
        className="form-input"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        className="form-input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {mode === "signup" && (
        <select
          className="form-input"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      )}

      <button
        className="btn btn-primary w-full"
        onClick={handleSubmit}
        disabled={loading}
      >
        {mode === "login" ? (
          <>
            <FaLock />
            {loading ? " Logging In..." : " Login"}
          </>
        ) : (
          <>
            <FaUser />
            {loading ? " Creating..." : " Sign Up"}
          </>
        )}
      </button>

      {error && (
        <p
          style={{
            color: "#ef4444",
            marginTop: "10px",
            fontSize: "14px",
          }}
        >
          {error}
        </p>
      )}

      <button
        className="btn btn-ghost w-full"
        onClick={() => {
          setError("");
          setMode(mode === "login" ? "signup" : "login");
        }}
      >
        {mode === "login" ? "Create Account" : "Already have an account?"}
      </button>
    </div>
  );
}
