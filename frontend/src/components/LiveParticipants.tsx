import { useState } from "react";
import {
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUsers,
  FaTimes,
} from "react-icons/fa";
import type { RoomUser } from "../types/quiz";

type LiveParticipantsProps = {
  users: RoomUser[];
};

function LiveParticipants({
  users,
}: LiveParticipantsProps) {
  const [showParticipants, setShowParticipants] =
    useState(false);

  const teachers = users.filter(
    (u) => u.role === "teacher"
  );

  const students = users.filter(
    (u) => u.role === "student"
  );

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-subtitle">
              Room Overview
            </div>

            <div className="card-title">
              <FaUsers
                size={22}
                color="var(--blue)"
              />
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
            <span
              style={{ color: "var(--blue)" }}
            >
              {users.length}
            </span>
            <p>Total</p>
          </div>

          <div className="stat-box">
            <FaChalkboardTeacher className="stat-icon teacher" />
            <span
              style={{ color: "var(--red)" }}
            >
              {teachers.length}
            </span>
            <p>Teachers</p>
          </div>

          <div className="stat-box">
            <FaUserGraduate className="stat-icon student" />
            <span
              style={{
                color:
                  "var(--blue-light)",
              }}
            >
              {students.length}
            </span>
            <p>Students</p>
          </div>
        </div>

        <div className="participants-actions">
          <button
            className="btn btn-primary w-full btn-lg"
            onClick={() =>
              setShowParticipants(true)
            }
          >
            View All Participants
          </button>
          <br></br>
          <br></br> 
        </div>
      </div>

      {showParticipants && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowParticipants(false)
          }
        >
          <div
            className="participants-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="participants-modal-header">
              <h3>
                Participants ({users.length})
              </h3>

              <button
                className="btn btn-ghost"
                onClick={() =>
                  setShowParticipants(false)
                }
              >
                <FaTimes />
              </button>
            </div>

            <div className="participants-modal-body">
              <div className="participant-section">
                <h4>
                  Teachers (
                  {teachers.length})
                </h4>

                {teachers.length === 0 ? (
                  <p className="empty-text">
                    No teachers connected
                  </p>
                ) : (
                  teachers.map(
                    (user, idx) => (
                      <div
                        className="user-item"
                        key={`teacher-${user.name}-${idx}`}
                      >
                        <div className="user-avatar teacher">
                          <FaChalkboardTeacher size={16} />
                        </div>

                        <div>
                          <div className="user-name">
                            {user.name}
                          </div>

                          <div className="user-role">
                            Teacher
                          </div>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>

              <div className="participant-section">
                <h4>
                  Students (
                  {students.length})
                </h4>

                {students.length === 0 ? (
                  <p className="empty-text">
                    No students connected
                  </p>
                ) : (
                  students.map(
                    (user, idx) => (
                      <div
                        className="user-item"
                        key={`student-${user.name}-${idx}`}
                      >
                        <div className="user-avatar student">
                          <FaUserGraduate size={16} />
                        </div>

                        <div>
                          <div className="user-name">
                            {user.name}
                          </div>

                          <div className="user-role">
                            Student
                          </div>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LiveParticipants;