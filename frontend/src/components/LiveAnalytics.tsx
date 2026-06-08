import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FaChartBar, FaCheckCircle, FaTimesCircle, FaUsers } from "react-icons/fa";
import type { AnswerStats, QuizQuestion } from "../types/quiz";

type LiveAnalyticsProps = {
  answerStats: AnswerStats | null;
  currentQuestion: QuizQuestion | null;
};

const OPTION_COLORS = ["#1A56DB", "#F5C400", "#E31B23", "#22c55e"];

function LiveAnalytics({ answerStats, currentQuestion }: LiveAnalyticsProps) {
  console.log("LiveAnalytics answerStats:", answerStats);
  console.log("LiveAnalytics currentQuestion:", currentQuestion);

  const distributionData =
    currentQuestion && answerStats
      ? currentQuestion.options.map((option, index) => ({
          option: String.fromCharCode(65 + index),
          text: option,
          count: answerStats.option_counts?.[String(index)] ?? 0,
        }))
      : [];

  const pieData = answerStats
    ? [
        { name: "Correct", value: answerStats.correct_count ?? 0 },
        { name: "Wrong", value: answerStats.wrong_count ?? 0 },
      ]
    : [];

  const hasPieData = pieData.some((item) => item.value > 0);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-subtitle">Live Analytics</div>

          <div className="card-title">
            <FaChartBar size={22} color="#1A56DB" />
            Answer Stats
          </div>
        </div>
      </div>

      {!answerStats ? (
        <p className="empty-text" style={{ padding: "32px 20px" }}>
          Stats will appear once the quiz is live
        </p>
      ) : (
        <div className="analytics-scroll">
          <div className="analytics-stats">
            <div className="analytics-stat">
              <span className="analytics-stat-icon total">
                <FaUsers />
              </span>
              <span className="analytics-stat-value total">
                {answerStats.answered_count ?? 0}
              </span>
              <div className="analytics-stat-label">Answered</div>
            </div>

            <div className="analytics-stat">
              <span className="analytics-stat-icon correct">
                <FaCheckCircle />
              </span>
              <span className="analytics-stat-value correct">
                {answerStats.correct_count ?? 0}
              </span>
              <div className="analytics-stat-label">Correct</div>
            </div>

            <div className="analytics-stat">
              <span className="analytics-stat-icon wrong">
                <FaTimesCircle />
              </span>
              <span className="analytics-stat-value wrong">
                {answerStats.wrong_count ?? 0}
              </span>
              <div className="analytics-stat-label">Wrong</div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-panel">
              <div className="chart-header">
                <strong>Option Distribution</strong>
                <span>Live answer count</span>
              </div>

              <div className="chart-box">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="option" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value, _name, props) => [
                        value,
                        `Option ${props.payload.option}: ${props.payload.text}`,
                      ]}
                      contentStyle={{
                        background: "var(--white)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {distributionData.map((_, i) => (
                        <Cell key={i} fill={OPTION_COLORS[i % OPTION_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-panel">
              <div className="chart-header">
                <strong>Correct vs Wrong</strong>
                <span>Accuracy split</span>
              </div>

              <div className="chart-box">
                {hasPieData ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={78}
                        paddingAngle={4}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#E31B23" />
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          background: "var(--white)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="empty-text">No answers yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="option-bars">
            {currentQuestion?.options.map((option, index) => {
              const count = answerStats.option_counts?.[String(index)] ?? 0;

              const pct =
                answerStats.answered_count === 0
                  ? 0
                  : Math.round((count / answerStats.answered_count) * 100);

              return (
                <div className="option-bar-row" key={`${option}-${index}`}>
                  <div className="option-bar-label">
                    <strong>{String.fromCharCode(65 + index)}</strong>
                    <span>{pct}%</span>
                  </div>

                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>

                  <p>
                    {option} — {count} answer{count !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveAnalytics;