import type {
  CreatedQuizResponse,
  CreatedSessionResponse,
  QuestionDraft,
  SavedQuizzesResponse,
  StudentStatsFilters,
  StudentStatsResponse,
  TeacherDashboardKpis,
  TeacherStatsFilters,
  TeacherStatsResponse,
} from "../types/quiz";

const API_BASE_URL = import.meta.env.VITE_API_URL;

type CreateQuizPayload = {
  title: string;
  description: string | null;
  questions: QuestionDraft[];
};

function getAuthHeaders() {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("You are not logged in. Please login again.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function createQuizApi(
  payload: CreateQuizPayload,
): Promise<CreatedQuizResponse> {
  const response = await fetch(`${API_BASE_URL}/quizzes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to create quiz");
  }

  return response.json();
}

export async function getSavedQuizzesApi(): Promise<SavedQuizzesResponse> {
  const response = await fetch(`${API_BASE_URL}/quizzes`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to load saved quizzes");
  }

  return response.json();
}

export async function startSessionApi(
  quizId: string,
): Promise<CreatedSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/start`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      quiz_id: quizId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to start session");
  }

  return response.json();
}

export async function getTeacherDashboardKpisApi(): Promise<TeacherDashboardKpis> {
  const response = await fetch(`${API_BASE_URL}/sessions/teacher/kpis`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to load dashboard KPIs");
  }

  return response.json();
}

export async function getTeacherStatsApi(
  filters: TeacherStatsFilters,
): Promise<TeacherStatsResponse> {
  const params = new URLSearchParams();

  if (filters.quiz_id) {
    params.set("quiz_id", filters.quiz_id);
  }

  if (filters.room_code) {
    params.set("room_code", filters.room_code);
  }

  if (filters.student_name) {
    params.set("student_name", filters.student_name);
  }

  const queryString = params.toString();

  const response = await fetch(
    `${API_BASE_URL}/sessions/teacher/stats${
      queryString ? `?${queryString}` : ""
    }`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to load teacher stats");
  }

  return response.json();
}
export async function getStudentStatsApi(
  filters: StudentStatsFilters,
): Promise<StudentStatsResponse> {
  const params = new URLSearchParams();

  if (filters.quiz_id) {
    params.set("quiz_id", filters.quiz_id);
  }

  if (filters.room_code) {
    params.set("room_code", filters.room_code);
  }

  const queryString = params.toString();

  const response = await fetch(
    `${API_BASE_URL}/sessions/student/stats${
      queryString ? `?${queryString}` : ""
    }`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to load student stats");
  }

  return response.json();
}