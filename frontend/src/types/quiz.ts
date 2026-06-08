export type UserRole = "teacher" | "student";

export type RoomUser = {
  name: string;
  role: UserRole;
};

export type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  time_limit_seconds: number;
};

export type ScoreboardItem = {
  name: string;
  score: number;
  rank: number;
};

export type AnswerStats = {
  question_id: string;
  answered_count: number;
  option_counts: Record<string, number>;
  correct_count: number;
  wrong_count: number;
  scoreboard: ScoreboardItem[];
};

export type WsEvent = {
  type: string;
  payload?: {
    room_code?: string;
    online_count?: number;
    users?: RoomUser[];
    user?: RoomUser;
    sender?: string;
    role?: UserRole;
    message?: string;
    sent_at?: string;

    quiz_title?: string;
    total_questions?: number;
    question_index?: number;
    question?: QuizQuestion;

    question_id?: string;
    selected_option_index?: number;
    is_correct?: boolean;
    points?: number;
    new_score?: number;

    answered_count?: number;
    option_counts?: Record<string, number>;
    correct_count?: number;
    wrong_count?: number;
    scoreboard?: ScoreboardItem[];

    [key: string]: unknown;
  };
};

export type QuestionDraft = {
  text: string;
  options: string[];
  correct_option_index: number;
  time_limit_seconds: number;
};

export type CreatedQuizResponse = {
  message: string;
  quiz_id: string;
  quiz: {
    _id: string;
    title: string;
    description?: string;
    questions: QuizQuestion[];
  };
};

export type CreatedSessionResponse = {
  message: string;
  room_code: string;
  session: {
    _id: string;
    quiz_id: string;
    quiz_title: string;
    room_code: string;
    status: string;
  };
};