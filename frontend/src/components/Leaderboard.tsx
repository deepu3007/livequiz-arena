import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FaTrophy } from "react-icons/fa";
import { GiLaurelsTrophy } from "react-icons/gi";
import type { ScoreboardItem } from "../types/quiz";

type LeaderboardProps = { scoreboard: ScoreboardItem[] };

const BAR_COLORS = ["#F5C400", "#C0C0C0", "#CD7F32", "#1A56DB", "#4D7FFF", "#E31B23"];

function Leaderboard({ scoreboard }: LeaderboardProps) {
  const chartData = scoreboard.map((item) => ({
    name: item.name,
    score: item.score,
  }));

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <GiLaurelsTrophy color="#F5C400" size={22} />;
    }

    if (rank === 2) {
      return <GiLaurelsTrophy color="#C0C0C0" size={22} />;
    }

    if (rank === 3) {
      return <GiLaurelsTrophy color="#CD7F32" size={22} />;
    }

    return `#${rank}`;
  };

  return (
    <div className="card">
      <div className="card-stripe" />

      <div className="card-header">
        <div className="card-header-left">
          <div className="card-subtitle">Scoreboard</div>
          <div className="card-title">
            <FaTrophy color="#F5C400" size={24} />
            Leaderboard
          </div>
        </div>
      </div>

      {scoreboard.length === 0 ? (
        <p className="empty-text" style={{ padding: "32px 20px" }}>
          No scores yet — get playing!
        </p>
      ) : (
        <>
          <div style={{ padding: "0 12px 12px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 8, bottom: 0, left: -16, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--white)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontFamily: "var(--font-ui)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="leaderboard-list leaderboard-scroll">
            {scoreboard.map((item) => {
              const rankClass =
                item.rank === 1
                  ? "rank-1"
                  : item.rank === 2
                  ? "rank-2"
                  : item.rank === 3
                  ? "rank-3"
                  : "rank-other";

              return (
                <div className={`leaderboard-item ${rankClass}`} key={item.name}>
                  <div className={`rank-badge ${rankClass}`}>
                    {getRankIcon(item.rank)}
                  </div>

                  <div className="leaderboard-name">{item.name}</div>
                  <div className="leaderboard-score">{item.score}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Leaderboard;