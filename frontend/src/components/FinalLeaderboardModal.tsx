type Player = {
  name: string;
  score: number;
  rank: number;
};

type Props = {
  open: boolean;
  leaderboard: Player[];
  onClose: () => void;
};

function FinalLeaderboardModal({ open, leaderboard, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="leaderboard-modal">
        <h2 className="leaderboard-title">🏆 Final Leaderboard</h2>

        {leaderboard.map((player) => (
          <div
            key={player.name}
            className={`leaderboard-row ${
              player.rank === 1
                ? "top1"
                : player.rank === 2
                  ? "top2"
                  : player.rank === 3
                    ? "top3"
                    : ""
            }`}
          >
            <span>#{player.rank}</span>
            <span>{player.name}</span>
            <span>{player.score}</span>
          </div>
        ))}

        <div style={{ textAlign: "center" }}>
          <button className="modal-button close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default FinalLeaderboardModal;
