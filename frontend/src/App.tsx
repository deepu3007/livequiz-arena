import { Navigate, Route, Routes } from "react-router-dom";

import CreateQuizPage from "./pages/CreateQuizPage";
import HomePage from "./pages/HomePage";
import StudentPage from "./pages/StudentPage";
import TeacherPage from "./pages/TeacherPage";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreateQuizPage />} />
      <Route path="/teacher" element={<TeacherPage />} />
      <Route path="/student" element={<StudentPage />} />

      {/* Old route redirects to teacher page */}
      <Route path="/live" element={<Navigate to="/teacher" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;