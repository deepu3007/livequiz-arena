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
export type SavedQuiz = {
  _id: string;
  title: string;
  description?: string | null;
  question_count?: number;
  questions?: QuizQuestion[];
  created_at?: string;
  updated_at?: string;
};
export type SavedQuizzesResponse = {
  count: number;
  quizzes: SavedQuiz[];
};

export type TeacherDashboardKpis = {
  rooms_hosted: number;
  students_participated: number;
  average_score: number;
  quizzes_created: number;
};

export type TeacherStatsFilters = {
  quiz_id?: string;
  room_code?: string;
  student_name?: string;
};

export type StatsQuizFilter = {
  _id: string;
  title: string;
  description?: string | null;
  question_count: number;
};

export type StatsRoomFilter = {
  room_code: string;
  quiz_id: string;
  quiz_title: string;
  status: string;
  created_at?: string;
};

export type TeacherStatsResponse = {
  kpis: TeacherDashboardKpis;
  filters: {
    quizzes: StatsQuizFilter[];
    rooms: StatsRoomFilter[];
    students: string[];
  };
  charts: {
    room_participation: {
      room_code: string;
      quiz_title: string;
      participants: number;
      average_score: number;
    }[];
    quiz_performance: {
      quiz_id: string;
      quiz_title: string;
      average_score: number;
      attempts: number;
      rooms: number;
    }[];
    student_performance: {
      student_name: string;
      room_code: string;
      quiz_title: string;
      score: number;
      score_percentage: number;
      created_at?: string;
    }[];
    score_distribution: {
      range: string;
      count: number;
    }[];
    correct_wrong: {
      name: string;
      value: number;
    }[];
    top_students: {
      student_name: string;
      score: number;
    }[];
  };
};
export type StudentStatsFilters = {
  quiz_id?: string;
  room_code?: string;
};

export type StudentDashboardKpis = {
  rooms_played: number;
  quizzes_attempted: number;
  average_score: number;
  total_marks: number;
};

export type StudentStatsResponse = {
  kpis: StudentDashboardKpis;
  filters: {
    quizzes: StatsQuizFilter[];
    rooms: StatsRoomFilter[];
  };
  charts: {
    performance_trend: {
      room_code: string;
      quiz_id: string;
      quiz_title: string;
      score: number;
      score_percentage: number;
      max_score: number;
      created_at?: string;
    }[];
    quiz_performance: {
      quiz_id: string;
      quiz_title: string;
      average_score: number;
      attempts: number;
    }[];
    score_distribution: {
      range: string;
      count: number;
    }[];
    correct_wrong: {
      name: string;
      value: number;
    }[];
    recent_rooms: {
      room_code: string;
      quiz_id: string;
      quiz_title: string;
      score: number;
      score_percentage: number;
      max_score: number;
      created_at?: string;
    }[];
  };
};