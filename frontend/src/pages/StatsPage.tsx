import { useEffect, useState } from "react";
import {
    FaChartLine,
    FaChartPie,
    FaDoorOpen,
    FaFilter,
    FaQuestionCircle,
    FaRedo,
    FaTrophy,
    FaUsers,
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
import { getTeacherStatsApi } from "../api/quizApi";
import type { TeacherStatsFilters, TeacherStatsResponse } from "../types/quiz";
import SearchableSelect from "../components/SearchableSelect";

const CHART_COLORS = ["#ef4444", "#2563eb", "#facc15", "#22c55e", "#a855f7"];

const emptyStats: TeacherStatsResponse = {
    kpis: {
        rooms_hosted: 0,
        students_participated: 0,
        average_score: 0,
        quizzes_created: 0,
    },
    filters: {
        quizzes: [],
        rooms: [],
        students: [],
    },
    charts: {
        room_participation: [],
        quiz_performance: [],
        student_performance: [],
        score_distribution: [],
        correct_wrong: [],
        top_students: [],
    },
};

function StatsPage() {
    const [stats, setStats] = useState<TeacherStatsResponse>(emptyStats);
    const [filters, setFilters] = useState<TeacherStatsFilters>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadStats = async (nextFilters: TeacherStatsFilters = filters) => {
        try {
            setLoading(true);
            setError("");

            const data = await getTeacherStatsApi(nextFilters);

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

    const updateFilter = (
        key: keyof TeacherStatsFilters,
        value: string,
    ) => {
        const nextFilters: TeacherStatsFilters = {
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
                            <p className="hero-eyebrow">Teacher Analytics</p>

                            <h1>
                                Performance <span className="accent-red">Stats</span>
                            </h1>

                            <p className="hero-description">
                                Analyze rooms, quizzes, student participation, marks, and score
                                trends with interactive filters.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="stats-layout">
                    <aside className="stats-filter-panel card">
                        <div className="card-stripe" />

                        <div className="stats-filter-header">
                            <div>
                                <div className="card-subtitle">Control Panel</div>

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
                                            description: "Show analytics for every quiz",
                                        },
                                        ...stats.filters.quizzes.map((quiz) => ({
                                            value: quiz._id,
                                            label: quiz.title,
                                            description: `${quiz.question_count} question${quiz.question_count === 1 ? "" : "s"
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
                                            description: "Show analytics for every room",
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

                            <div className="form-group">
                                <SearchableSelect
                                    label="Student"
                                    placeholder="Type or select student..."
                                    value={filters.student_name ?? ""}
                                    options={[
                                        {
                                            value: "",
                                            label: "All students",
                                            description: "Show analytics for every student",
                                        },
                                        ...stats.filters.students.map((student) => ({
                                            value: student,
                                            label: student,
                                        })),
                                    ]}
                                    onChange={(value) => updateFilter("student_name", value)}
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
                                Select a quiz, room, or student to instantly update all charts.
                            </div>
                        </div>
                    </aside>

                    <main className="stats-main-panel">
                        {error && <div className="stats-error">{error}</div>}

                        <section className="teacher-kpi-ribbon stats-kpi-ribbon">
                            <div className="kpi-card">
                                <div className="kpi-icon">
                                    <FaDoorOpen />
                                </div>

                                <div className="kpi-content">
                                    <span className="kpi-value">
                                        {loading ? "..." : stats.kpis.rooms_hosted}
                                    </span>
                                    <span className="kpi-label">Rooms Hosted</span>
                                </div>
                            </div>

                            <div className="kpi-card">
                                <div className="kpi-icon">
                                    <FaUsers />
                                </div>

                                <div className="kpi-content">
                                    <span className="kpi-value">
                                        {loading ? "..." : stats.kpis.students_participated}
                                    </span>
                                    <span className="kpi-label">Students</span>
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
                                    <FaQuestionCircle />
                                </div>

                                <div className="kpi-content">
                                    <span className="kpi-value">
                                        {loading ? "..." : stats.kpis.quizzes_created}
                                    </span>
                                    <span className="kpi-label">Quizzes</span>
                                </div>
                            </div>
                        </section>

                        <section className="stats-chart-grid">
                            <div className="card stats-chart-card">
                                <div className="stats-chart-header">
                                    <h3>
                                        <FaDoorOpen />
                                        Room Participation
                                    </h3>
                                    <span>Participants by room</span>
                                </div>

                                <div className="stats-chart-box">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.charts.room_participation}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="room_code" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Bar dataKey="participants" name="Participants">
                                                {stats.charts.room_participation.map((_, index) => (
                                                    <Cell
                                                        key={`room-cell-${index}`}
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
                                        Score Distribution
                                    </h3>
                                    <span>Score percentage ranges</span>
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
                                                        key={`score-cell-${index}`}
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
                                        <FaTrophy />
                                        Quiz Performance
                                    </h3>
                                    <span>Average score by quiz</span>
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
                                                        key={`quiz-cell-${index}`}
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
                                    <span>Answer accuracy</span>
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
                                                        key={`cw-cell-${index}`}
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

                            <div className="card stats-chart-card stats-wide-chart">
                                <div className="stats-chart-header">
                                    <h3>
                                        <FaChartLine />
                                        Student Performance Trend
                                    </h3>
                                    <span>Score percentage across rooms</span>
                                </div>

                                <div className="stats-chart-box">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats.charts.student_performance}>
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

                            <div className="card stats-chart-card stats-wide-chart">
                                <div className="stats-chart-header">
                                    <h3>
                                        <FaUsers />
                                        Top Students
                                    </h3>
                                    <span>Total marks across filtered rooms</span>
                                </div>

                                <div className="stats-chart-box">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.charts.top_students}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="student_name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="score" name="Total Marks">
                                                {stats.charts.top_students.map((_, index) => (
                                                    <Cell
                                                        key={`student-cell-${index}`}
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

export default StatsPage;