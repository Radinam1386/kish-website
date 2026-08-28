import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  UsersRound,
  PlusCircle,
  Award,
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
  const [terms, setTerms] = useState([]);
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        const [classroomsData, termsData, examsData, sessionsData, submissionsData] =
          await Promise.all([
            api.classrooms.list(),
            api.terms.list(),
            api.exams.list(),
            api.sessions.list(),
            api.submissions.list(),
          ]);

        if (!alive) return;

        const allTerms = termsData || [];
        const activeTermIds = allTerms.filter((t) => t.is_active).map((t) => t.id);

        // Filter ONLY classes belonging to active terms
        const activeClasses = (classroomsData || []).filter((c) =>
          activeTermIds.length > 0
            ? activeTermIds.includes(c.term || c.term?.id)
            : true,
        );

        const activeClassIds = activeClasses.map((c) => c.id);

        // Filter exams and sessions to active classes only
        const activeExams = (examsData || []).filter((e) =>
          activeClassIds.includes(e.classroom || e.classroom?.id),
        );

        const activeSessions = (sessionsData || []).filter((s) =>
          activeClassIds.includes(s.classroom || s.classroom?.id),
        );

        setTerms(allTerms);
        setClasses(activeClasses);
        setExams(activeExams);
        setSessions(activeSessions);
        setSubmissions(submissionsData || []);
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

  const activeTerm = useMemo(() => {
    return terms.find((t) => t.is_active);
  }, [terms]);

  const totalStudents = useMemo(
    () => classes.reduce((total, cls) => total + (cls.student_count || 0), 0),
    [classes],
  );

  return (
    <DashboardLayout role="پنل استاد" title="پنل استاد" menuType="teacher">
      <div className="teacher-panel-x7k2-root">
        <div className="teacher-panel-x7k2-stat-grid">
          <StatCard
            title="کلاس‌های فعال"
            value={`${toPersianDigits(classes.length)} کلاس`}
            hint={activeTerm?.name || "ترم جاری"}
            icon={<BookOpen />}
            color="light-green"
          />

          <StatCard
            title="کل دانش‌آموزان"
            value={`${toPersianDigits(totalStudents)} نفر`}
            hint="در کلاس‌های ترم فعال"
            icon={<UsersRound />}
            color="red"
          />

          <StatCard
            title="جلسات برگزارشده"
            value={`${toPersianDigits(sessions.length)} جلسه`}
            hint={activeTerm?.name || "این ترم"}
            icon={<ClipboardCheck />}
            color="blue"
          />

          <StatCard
            title="آزمون‌های فعال"
            value={`${toPersianDigits(exams.length)} آزمون`}
            hint="این ترم"
            icon={<FileText />}
            color="light-orange"
          />
        </div>

        <section className="teacher-panel-x7k2-section">
          <div className="teacher-panel-x7k2-section-head">
            <div>
              <h3 className="teacher-panel-x7k2-section-title">
                کلاس‌های من در {activeTerm?.name ? `«${activeTerm.name}»` : "ترم جاری"}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "oklch(55% 0 0)", margin: "0.2rem 0 0" }}>
                تنها کلاس‌های مربوط به ترم‌های فعال در این بخش نمایش داده می‌شوند.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link
                to="/panel/teacher/exams"
                className="teacher-panel-x7k2-action-link"
              >
                <AnimatedButton variant="secondary" icon={<Award size={17} />}>
                  میز نمره‌دهی و تصحیح
                </AnimatedButton>
              </Link>

              <Link
                to="/panel/teacher/create-exam"
                className="teacher-panel-x7k2-action-link"
              >
                <AnimatedButton variant="danger" icon={<PlusCircle size={18} />}>
                  ایجاد آزمون جدید
                </AnimatedButton>
              </Link>
            </div>
          </div>

          <div className="teacher-panel-x7k2-table-shell">
            <div className="teacher-panel-x7k2-table-scroll">
              <table className="teacher-panel-x7k2-table">
                <thead>
                  <tr>
                    <th>نام کلاس</th>
                    <th>تعداد دانش‌آموزان</th>
                    <th>استاد</th>
                    <th>جلسات ثبت‌شده</th>
                    <th>وضعیت ترم</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                        در حال دریافت اطلاعات...
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", color: "var(--danger)" }}>
                        {error}
                      </td>
                    </tr>
                  )}

                  {!loading && !error && classes.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "2.5rem", color: "oklch(55% 0 0)" }}>
                        در حال حاضر کلاس فعالی برای شما در ترم جاری ثبت نشده است.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    classes.map((cls) => (
                      <tr key={cls.id}>
                        <td>
                          <span className="teacher-panel-x7k2-class-tag teacher-panel-x7k2-class-tag--highlight">
                            {cls.name}
                          </span>
                        </td>

                        <td>
                          <span className="teacher-panel-x7k2-count">
                            {toPersianDigits(cls.student_count || 0)} نفر
                          </span>
                        </td>

                        <td>
                          <span className="teacher-panel-x7k2-capacity">
                            {getFullName(cls.teacher_detail)}
                          </span>
                        </td>

                        <td>
                          {toPersianDigits(
                            sessions.filter(
                              (session) => session.classroom === cls.id || session.classroom?.id === cls.id,
                            ).length
                          )}{" "}
                          جلسه
                        </td>

                        <td>
                          <span style={{
                            background: "oklch(95% 0.05 145 / 0.9)",
                            color: "oklch(35% 0.15 145)",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "8px",
                            fontSize: "0.76rem",
                            fontWeight: "800"
                          }}>
                            ترم فعال
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

        {/* Exams Section */}
        <section className="teacher-panel-x7k2-section">
          <div className="teacher-panel-x7k2-section-head">
            <h3 className="teacher-panel-x7k2-section-title">آزمون‌های ترم فعال</h3>
            <Link to="/panel/teacher/exams">
              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--primary)" }}>
                مشاهده همه و تصحیح ←
              </span>
            </Link>
          </div>

          <div className="teacher-panel-x7k2-table-shell">
            <div className="teacher-panel-x7k2-table-scroll">
              <table className="teacher-panel-x7k2-table">
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>کلاس</th>
                    <th>تاریخ (شمسی)</th>
                    <th>پاسخ‌برگ‌های دریافتی</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>

                <tbody>
                  {exams.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "oklch(55% 0 0)" }}>
                        هنوز آزمونی در ترم فعال جاری تعریف نشده است.
                      </td>
                    </tr>
                  ) : (
                    exams.map((exam) => {
                      const classItem = classes.find(
                        (item) => item.id === exam.classroom || item.id === exam.classroom?.id,
                      );
                      const examSubmissions = submissions.filter(
                        (item) => item.exam === exam.id || item.exam?.id === exam.id,
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
                            {toPersianDigits(examSubmissions.length)} /{" "}
                            {toPersianDigits(classItem?.student_count || 0)} نفر
                          </td>

                          <td>
                            <span
                              className="teacher-panel-x7k2-status"
                              style={{
                                background: "oklch(96% 0.02 29)",
                                color: "var(--primary)",
                                padding: "0.2rem 0.55rem",
                                borderRadius: "8px",
                                fontSize: "0.76rem",
                                fontWeight: "700",
                              }}
                            >
                              فعال در ترم
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
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
