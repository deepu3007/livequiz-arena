import { Navigate } from "react-router-dom";

type Props = {
  children: React.ReactNode;
  role?: "teacher" | "student";
};

export default function ProtectedRoute({ children, role }: Props) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userRole = payload.role;

    if (role && role !== userRole) {
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  } catch {
    sessionStorage.removeItem("token");
    return <Navigate to="/" replace />;
  }
}