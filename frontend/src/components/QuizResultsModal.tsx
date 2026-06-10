import { FaMedal, FaTrophy } from "react-icons/fa";

type Player = {
  name: string;
  score: number;
  rank: number;
};

type Props = {
  open: boolean;
  podium: Player[];
  onViewLeaderboard: () => void;
  onClose: () => void;
};

function QuizResultsModal({ open, podium, onViewLeaderboard, onClose }: Props) {
  if (!open) return null;

  const first = podium.find((p) => p.rank === 1);
  const second = podium.find((p) => p.rank === 2);
  const third = podium.find((p) => p.rank === 3);

  return (
    <div className="lqa-results-overlay">
      <div className="lqa-results-modal">
        <div className="lqa-modal-header">
          <h2 className="lqa-results-title">
            <FaTrophy className="lqa-title-trophy" />
            Quiz Completed
          </h2>

          <button className="lqa-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="lqa-podium-container">
          {/* Second */}
          <div className="lqa-podium-place lqa-podium-second">
            <div className="lqa-player-info">
              <FaMedal className="lqa-silver-icon" />
              <h3>{second?.name ?? "-"}</h3>
              <span>{second?.score ?? 0} pts</span>
            </div>

            <div className="lqa-podium-block">
              <span>#2</span>
            </div>
          </div>

          {/* First */}
          <div className="lqa-podium-place lqa-podium-first">
            <div className="lqa-player-info">
              <FaTrophy className="lqa-gold-icon" />
              <h3>{first?.name ?? "-"}</h3>
              <span>{first?.score ?? 0} pts</span>
            </div>

            <div className="lqa-podium-block">
              <span>#1</span>
            </div>
          </div>

          {/* Third */}
          <div className="lqa-podium-place lqa-podium-third">
            <div className="lqa-player-info">
              <FaMedal className="lqa-bronze-icon" />
              <h3>{third?.name ?? "-"}</h3>
              <span>{third?.score ?? 0} pts</span>
            </div>

            <div className="lqa-podium-block">
              <span>#3</span>
            </div>
          </div>
        </div>

        <button className="lqa-leaderboard-btn" onClick={onViewLeaderboard}>
          View Full Leaderboard
        </button>
      </div>
    </div>
  );
}

export default QuizResultsModal;
