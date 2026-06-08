import type {
    CreatedQuizResponse,
    CreatedSessionResponse,
    QuestionDraft
  } from "../types/quiz";
  
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  
  type CreateQuizPayload = {
    title: string;
    description: string | null;
    questions: QuestionDraft[];
  };
  
  export async function createQuizApi(
    payload: CreateQuizPayload
  ): Promise<CreatedQuizResponse> {
    const response = await fetch(`${API_BASE_URL}/quizzes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create quiz");
    }
  
    return response.json();
  }
  
  export async function startSessionApi(
    quizId: string
  ): Promise<CreatedSessionResponse> {
    const response = await fetch(`${API_BASE_URL}/sessions/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quiz_id: quizId
      })
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to start session");
    }
  
    return response.json();
  }