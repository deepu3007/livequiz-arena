import { useState } from "react";
import { FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";
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
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (loading) return;
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
    <form className="auth-card" onSubmit={handleSubmit}>
      <h3>{mode === "login" ? "Login" : "Create Account"}</h3>

      <input
        className="form-input"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <div className="password-input-wrap">
        <input
          className="form-input password-input"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

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
        type="submit"
        className="btn btn-primary w-full"
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
        type="button"
        className="btn btn-ghost w-full"
        onClick={() => {
          setError("");
          setMode(mode === "login" ? "signup" : "login");
        }}
      >
        {mode === "login" ? "Create Account" : "Already have an account?"}
      </button>
    </form>
  );
}
