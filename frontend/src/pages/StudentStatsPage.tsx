import { useEffect, useState } from "react";
import {
  FaChartLine,
  FaChartPie,
  FaFilter,
  FaGamepad,
  FaMedal,
  FaQuestionCircle,
  FaRedo,
  FaStar,
} from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Navbar from "../components/Navbar";
import SearchableSelect from "../components/SearchableSelect";
import { getStudentStatsApi } from "../api/quizApi";
import type { StudentStatsFilters, StudentStatsResponse } from "../types/quiz";

const CHART_COLORS = ["#ef4444", "#2563eb", "#facc15", "#22c55e", "#a855f7"];
const CORRECT_WRONG_COLORS = ["#22c55e", "#ef4444"];

const emptyStudentStats: StudentStatsResponse = {
  kpis: {
    rooms_played: 0,
    quizzes_attempted: 0,
    average_score: 0,
    total_marks: 0,
  },
  filters: {
    quizzes: [],
    rooms: [],
  },
  charts: {
    performance_trend: [],
    quiz_performance: [],
    score_distribution: [],
    correct_wrong: [],
    recent_rooms: [],
  },
};

function StudentStatsPage() {
  const [stats, setStats] = useState<StudentStatsResponse>(emptyStudentStats);
  const [filters, setFilters] = useState<StudentStatsFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async (nextFilters: StudentStatsFilters = filters) => {
    try {
      setLoading(true);
      setError("");

      const data = await getStudentStatsApi(nextFilters);

      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats({});
  }, []);

  const updateFilter = (key: keyof StudentStatsFilters, value: string) => {
    const nextFilters: StudentStatsFilters = {
      ...filters,
      [key]: value || undefined,
    };

    setFilters(nextFilters);
    loadStats(nextFilters);
  };

  const clearFilters = () => {
    const nextFilters = {};

    setFilters(nextFilters);
    loadStats(nextFilters);
  };

  return (
    <div className="app">
      <Navbar />

      <div className="page-content">
        <section className="page-hero stats-hero">
          <div className="hero-inner">
            <div>
              <p className="hero-eyebrow">Student Analytics</p>

              <h1>
                My <span className="accent-red">Performance</span>
              </h1>

              <p className="hero-description">
                Track your quiz attempts, marks, score trends, and accuracy
                across all rooms you participated in.
              </p>
            </div>
          </div>
        </section>

        <div className="stats-layout">
          <aside className="stats-filter-panel card">
            <div className="card-stripe" />

            <div className="stats-filter-header">
              <div>
                <div className="card-subtitle">Student Control Panel</div>

                <h2>
                  <FaFilter />
                  Filters
                </h2>
              </div>

              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => loadStats(filters)}
                disabled={loading}
              >
                <FaRedo size={12} />
                Refresh
              </button>
            </div>

            <div className="stats-filter-body">
              <div className="form-group">
                <SearchableSelect
                  label="Quiz"
                  placeholder="Type or select quiz..."
                  value={filters.quiz_id ?? ""}
                  options={[
                    {
                      value: "",
                      label: "All quizzes",
                      description: "Show your performance for every quiz",
                    },
                    ...stats.filters.quizzes.map((quiz) => ({
                      value: quiz._id,
                      label: quiz.title,
                      description: `${quiz.question_count} question${
                        quiz.question_count === 1 ? "" : "s"
                      }`,
                    })),
                  ]}
                  onChange={(value) => updateFilter("quiz_id", value)}
                />
              </div>

              <div className="form-group">
                <SearchableSelect
                  label="Room"
                  placeholder="Type room code or quiz name..."
                  value={filters.room_code ?? ""}
                  options={[
                    {
                      value: "",
                      label: "All rooms",
                      description: "Show your performance for every room",
                    },
                    ...stats.filters.rooms.map((room) => ({
                      value: room.room_code,
                      label: room.room_code,
                      description: `${room.quiz_title} · ${room.status}`,
                    })),
                  ]}
                  onChange={(value) => updateFilter("room_code", value)}
                />
              </div>

              <button
                className="btn btn-red stats-clear-btn"
                type="button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>

              <div className="stats-filter-note">
                Select a quiz or room to focus your analytics.
              </div>
            </div>
          </aside>

          <main className="stats-main-panel">
            {error && <div className="stats-error">{error}</div>}

            <section className="teacher-kpi-ribbon stats-kpi-ribbon">
              <div className="kpi-card">
                <div className="kpi-icon">
                  <FaGamepad />
                </div>

                <div className="kpi-content">
                  <span className="kpi-value">
                    {loading ? "..." : stats.kpis.rooms_played}
                  </span>
                  <span className="kpi-label">Rooms Played</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon">
                  <FaQuestionCircle />
                </div>

                <div className="kpi-content">
                  <span className="kpi-value">
                    {loading ? "..." : stats.kpis.quizzes_attempted}
                  </span>
                  <span className="kpi-label">Quizzes Tried</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon">
                  <FaChartLine />
                </div>

                <div className="kpi-content">
                  <span className="kpi-value">
                    {loading ? "..." : `${stats.kpis.average_score}%`}
                  </span>
                  <span className="kpi-label">Avg Score</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon">
                  <FaStar />
                </div>

                <div className="kpi-content">
                  <span className="kpi-value">
                    {loading ? "..." : stats.kpis.total_marks}
                  </span>
                  <span className="kpi-label">Total Marks</span>
                </div>
              </div>
            </section>

            <section className="stats-chart-grid">
              <div className="card stats-chart-card stats-wide-chart">
                <div className="stats-chart-header">
                  <h3>
                    <FaChartLine />
                    My Score Trend
                  </h3>
                  <span>Score percentage by room</span>
                </div>

                <div className="stats-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.charts.performance_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="room_code" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="score_percentage"
                        name="Score %"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#ef4444" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card stats-chart-card">
                <div className="stats-chart-header">
                  <h3>
                    <FaMedal />
                    Quiz Performance
                  </h3>
                  <span>Average by quiz</span>
                </div>

                <div className="stats-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.charts.quiz_performance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quiz_title" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="average_score" name="Average Score %">
                        {stats.charts.quiz_performance.map((_, index) => (
                          <Cell
                            key={`student-quiz-cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card stats-chart-card">
                <div className="stats-chart-header">
                  <h3>
                    <FaChartPie />
                    Correct vs Wrong
                  </h3>
                  <span>Your answer accuracy</span>
                </div>

                <div className="stats-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.charts.correct_wrong}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={95}
                        label
                      >
                        {stats.charts.correct_wrong.map((_, index) => (
                          <Cell
                            key={`student-cw-cell-${index}`}
                            fill={
                              CORRECT_WRONG_COLORS[
                                index % CORRECT_WRONG_COLORS.length
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card stats-chart-card">
                <div className="stats-chart-header">
                  <h3>
                    <FaChartPie />
                    Score Distribution
                  </h3>
                  <span>Your score ranges</span>
                </div>

                <div className="stats-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.charts.score_distribution}
                        dataKey="count"
                        nameKey="range"
                        outerRadius={95}
                        label
                      >
                        {stats.charts.score_distribution.map((_, index) => (
                          <Cell
                            key={`student-score-cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card stats-chart-card">
                <div className="stats-chart-header">
                  <h3>
                    <FaGamepad />
                    Recent Rooms
                  </h3>
                  <span>Marks by room</span>
                </div>

                <div className="stats-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.charts.recent_rooms}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="room_code" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="score" name="Marks">
                        {stats.charts.recent_rooms.map((_, index) => (
                          <Cell
                            key={`student-room-cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default StudentStatsPage;