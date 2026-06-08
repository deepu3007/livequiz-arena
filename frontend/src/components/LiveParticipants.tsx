import { FaChalkboardTeacher, FaUserGraduate, FaUsers } from "react-icons/fa";
import type { RoomUser } from "../types/quiz";

type LiveParticipantsProps = {
  users: RoomUser[];
};

function LiveParticipants({ users }: LiveParticipantsProps) {
  const teachers = users.filter((u) => u.role === "teacher");
  const students = users.filter((u) => u.role === "student");

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-subtitle">Room Overview</div>

          <div className="card-title">
            <FaUsers size={22} color="var(--blue)" />
            Participants
          </div>
        </div>

        <span className="online-badge">
          <FaUsers size={12} />
          {users.length} Online
        </span>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <FaUsers className="stat-icon total" />
          <span style={{ color: "var(--blue)" }}>{users.length}</span>
          <p>Total</p>
        </div>

        <div className="stat-box">
          <FaChalkboardTeacher className="stat-icon teacher" />
          <span style={{ color: "var(--red)" }}>{teachers.length}</span>
          <p>Teachers</p>
        </div>

        <div className="stat-box">
          <FaUserGraduate className="stat-icon student" />
          <span style={{ color: "var(--blue-light)" }}>{students.length}</span>
          <p>Students</p>
        </div>
      </div>

      <div className="user-list user-list-scroll">
        {users.length === 0 ? (
          <p className="empty-text">No participants yet</p>
        ) : (
          users.map((user, idx) => (
            <div className="user-item" key={`${user.name}-${idx}`}>
              <div className={`user-avatar ${user.role}`}>
                {user.role === "teacher" ? (
                  <FaChalkboardTeacher size={16} />
                ) : (
                  <FaUserGraduate size={16} />
                )}
              </div>

              <div>
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LiveParticipants;