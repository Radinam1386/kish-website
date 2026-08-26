import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  UsersRound,
  PlusCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import "./TeacherPanel.css";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

function TeacherPanel() {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        const [classroomsData, examsData, sessionsData, submissionsData] =
          await Promise.all([
            api.classrooms.list(),
            api.exams.list(),
            api.sessions.list(),
            api.submissions.list(),
          ]);

        if (!alive) return;
        setClasses(classroomsData);
        setExams(examsData);
        setSessions(sessionsData);
        setSubmissions(submissionsData);
      } catch (err) {
        if (alive) setError(err.message || "دریافت اطلاعات پنل ناموفق بود.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const totalStudents = useMemo(
    () => classes.reduce((total, cls) => total + (cls.student_count || 0), 0),
    [classes],
  );

  return (
    <DashboardLayout role="پنل معلم" title="پنل معلم" menuType="teacher">
      <div className="teacher-panel-x7k2-root">
        <div className="teacher-panel-x7k2-stat-grid">
          <StatCard
            title="کلاس‌های فعال"
            value={`${classes.length} کلاس`}
            hint="این ترم"
            icon={<BookOpen />}
            color="light-green"
          />

          <StatCard
            title="کل دانش‌آموزان"
            value={`${totalStudents} نفر`}
            hint="در کلاس‌های من"
            icon={<UsersRound />}
            color="red"
          />

          <StatCard
            title="حضور ثبت‌شده"
            value={`${sessions.length} جلسه`}
            hint="این ترم"
            icon={<ClipboardCheck />}
            color="blue"
          />

          <StatCard
            title="آزمون‌های ایجادشده"
            value={`${exams.length} آزمون`}
            hint="این ترم"
            icon={<FileText />}
            color="light-orange"
          />
        </div>

        <section className="teacher-panel-x7k2-section">
          <div className="teacher-panel-x7k2-section-head">
            <h3 className="teacher-panel-x7k2-section-title">کلاس‌های من</h3>
            <Link
              to="/panel/teacher/create-exam"
              className="teacher-panel-x7k2-action-link"
            >
              <AnimatedButton variant="danger" icon={<PlusCircle size={18} />}>
                ایجاد آزمون
              </AnimatedButton>
            </Link>
          </div>

          <div className="teacher-panel-x7k2-table-shell">
            <div className="teacher-panel-x7k2-table-scroll">
              <table className="teacher-panel-x7k2-table">
                <thead>
                  <tr>
                    <th>نام کلاس</th>
                    <th>دانش‌آموزان</th>
                    <th>زمان</th>
                    <th>تشکیل‌شده</th>
                    <th>باقی‌مانده</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan="6">در حال دریافت اطلاعات...</td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td colSpan="6">{error}</td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    classes.map((cls) => (
                      <tr key={cls.id}>
                        <td>
                          <Link to={`/panel/teacher/classes/${cls.id}`} style={{ textDecoration: "none" }}>
                            <span className="teacher-panel-x7k2-class-tag teacher-panel-x7k2-class-tag--highlight">
                              {cls.name}
                            </span>
                          </Link>
                        </td>

                        <td>
                          <span className="teacher-panel-x7k2-count">
                            {toPersianDigits(cls.student_count || 0)} نفر
                          </span>
                        </td>

                        <td>
                          <span className="teacher-panel-x7k2-time">
                            کد {cls.id}
                          </span>
                        </td>

                        <td>
                          {toPersianDigits(
                            sessions.filter(
                              (session) => session.classroom === cls.id,
                            ).length
                          )}{" "}
                          جلسه
                        </td>

                        <td>
                          <span className="teacher-panel-x7k2-capacity">
                            {getFullName(cls.teacher_detail)}
                          </span>
                        </td>

                        <td>
                          <Link
                            to={`/panel/teacher/attendance/${cls.id}`}
                            className="teacher-panel-x7k2-action-link"
                          >
                            <AnimatedButton variant="primary" size="small">
                              حضور و غیاب
                            </AnimatedButton>
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="teacher-panel-x7k2-section">
          <div className="teacher-panel-x7k2-section-head">
            <h3 className="teacher-panel-x7k2-section-title">آخرین آزمون‌ها</h3>
          </div>

          <div className="teacher-panel-x7k2-table-shell">
            <div className="teacher-panel-x7k2-table-scroll">
              <table className="teacher-panel-x7k2-table">
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>کلاس</th>
                    <th>تاریخ (شمسی)</th>
                    <th>شرکت‌کنندگان</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>

                <tbody>
                  {exams.map((exam) => {
                    const classItem = classes.find(
                      (item) => item.id === exam.classroom,
                    );
                    const examSubmissions = submissions.filter(
                      (item) => item.exam === exam.id,
                    );

                    return (
                      <tr key={exam.id}>
                        <td>
                          <strong className="teacher-panel-x7k2-exam-title">
                            {exam.title}
                          </strong>
                        </td>

                        <td>
                          <span className="teacher-panel-x7k2-class-tag">
                            {classItem?.name || exam.classroom}
                          </span>
                        </td>

                        <td>
                          <span className="teacher-panel-x7k2-count">
                            {toJalaliDateString(exam.date)}
                          </span>
                        </td>

                        <td>
                          {examSubmissions.length} /{" "}
                          {classItem?.student_count || 0}
                        </td>

                        <td>
                          <span
                            className={`teacher-panel-x7k2-status ${exam.statusClass}`}
                          >
                            ثبت‌شده
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default TeacherPanel;
