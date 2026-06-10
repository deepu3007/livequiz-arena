const API_BASE = import.meta.env.VITE_API_URL;

export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) throw new Error("Login failed");

  const data = await response.json();

  console.log("LOGIN RESPONSE:", data);

  sessionStorage.setItem("token", data.access_token);

  console.log("TOKEN STORED:", sessionStorage.getItem("token"));

  return data;
}

export async function signup(username: string, password: string, role: string) {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password, role }),
  });

  if (!response.ok) throw new Error("Signup failed");

  const data = await response.json();

  // Store token in sessionStorage (tab-isolated)
  sessionStorage.setItem("token", data.access_token);

  return data;
}
