import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";

import StudentPanel from "./pages/StudentPanel";
import TeacherPanel from "./pages/TeacherPanel";
import SecretaryPanel from "./pages/SecretaryPanel";
import AdminPanel from "./pages/AdminPanel";
import TeacherCreateExam from "./pages/TeacherCreateExam";
import TeacherAttendance from "./pages/TeacherAttendance";
import StudentExam from "./pages/StudentExam";
import StudentTuition from "./pages/StudentTuition";
import TeacherStudents from "./pages/TeacherStudents";
import SecretaryClasses from "./pages/SecretaryClasses";
import SecretaryAttendance from "./pages/SecretaryAttendance";
import SecretaryTuitions from "./pages/SecretaryTuitions";
import NotFound from "./pages/NotFound";
import CoursesPage from "./pages/CoursesPage";
import ScrollToTop from "./components/ScrollToTop";
import ContactPage from "./pages/ContactPage";
import AdminStudents from "./pages/AdminStudents";
import AdminTeachers from "./pages/AdminTeachers";
import AdminTeacherDetails from "./pages/AdminTeacherDetails";
import AdminTuition from "./pages/AdminTuition";
import AdminStudentDetails from "./components/AdminStudentDetails";

function App() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/panel");

  function ScrollToAnchor() {
    const { hash } = useLocation();

    useEffect(() => {
      if (!hash) return;
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [hash]);

    return null;
  }

  return (
    <>
      {!isDashboard && <Navbar />}
      <ScrollToTop />
      <ScrollToAnchor />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<Login />} />

        <Route path="/panel/student" element={<StudentPanel />} />
        <Route path="/panel/student/tuition" element={<StudentTuition />} />
        <Route path="/panel/teacher/students" element={<TeacherStudents />} />
        <Route path="/panel/student/exam/:examId" element={<StudentExam />} />

        <Route path="/panel/teacher" element={<TeacherPanel />} />
        <Route
          path="/panel/teacher/create-exam"
          element={<TeacherCreateExam />}
        />
        <Route
          path="/panel/teacher/attendance/:classId"
          element={<TeacherAttendance />}
        />

        <Route path="/panel/secretary" element={<SecretaryPanel />} />
        <Route
          path="/panel/secretary/students/:id"
          element={<AdminStudentDetails />}
        />
        <Route path="/panel/secretary/classes" element={<SecretaryClasses />} />
        <Route
          path="/panel/secretary/attendance"
          element={<SecretaryAttendance />}
        />
        <Route
          path="/panel/secretary/tuition"
          element={<SecretaryTuitions />}
        />

        <Route path="/panel/admin" element={<AdminPanel />} />
        <Route path="/panel/admin/students" element={<AdminStudents />} />
        <Route path="/panel/admin/teachers" element={<AdminTeachers />} />
        <Route
          path="/panel/admin/teachers/:teacherId"
          element={<AdminTeacherDetails />}
        />
        <Route path="/panel/admin/tuition" element={<AdminTuition />} />
      </Routes>
      {!isDashboard && <Footer />}
    </>
  );
}

export default App;
