const API_BASE_URL = import.meta.env.VITE_API_URL;

type UserRole = "teacher" | "student";

export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const backendMessage =
      typeof data?.detail === "string"
        ? data.detail
        : Array.isArray(data?.detail)
        ? data.detail.map((item: any) => item.msg).join(", ")
        : "";

    throw new Error(backendMessage || "Login failed");
  }

  sessionStorage.setItem("token", data.access_token);
  sessionStorage.setItem("username", data.username ?? username);
  sessionStorage.setItem("role", data.role);

  return data;
}

export async function signup(
  username: string,
  password: string,
  role: UserRole,
) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
      role,
    }),
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const backendMessage =
      typeof data?.detail === "string"
        ? data.detail
        : Array.isArray(data?.detail)
        ? data.detail.map((item: any) => item.msg).join(", ")
        : "";

    throw new Error(backendMessage || "Signup failed");
  }

  if (data.access_token) {
    sessionStorage.setItem("token", data.access_token);
    sessionStorage.setItem("username", data.username ?? username);
    sessionStorage.setItem("role", data.role ?? role);
  }

  return data;
}