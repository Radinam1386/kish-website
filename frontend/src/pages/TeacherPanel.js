import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  UsersRound,
  PlusCircle,
  Award,
  ChevronLeft,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

import "./TeacherPanel.css";

function getEntityId(value) {
  if (value && typeof value === "object") {
    return value.id;
  }

  return value;
}

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
        setError("");

        const [
          classroomsData,
          termsData,
          examsData,
          sessionsData,
          submissionsData,
        ] = await Promise.all([
          api.classrooms.list(),
          api.terms.list(),
          api.exams.list(),
          api.sessions.list(),
          api.submissions.list(),
        ]);

        if (!alive) return;

        const allTerms = termsData || [];
        const classrooms = classroomsData || [];
        const allExams = examsData || [];
        const allSessions = sessionsData || [];
        const allSubmissions = submissionsData || [];

        const activeTermIds = new Set(
          allTerms.filter((term) => term.is_active).map((term) => term.id),
        );

        const activeClasses =
          activeTermIds.size > 0
            ? classrooms.filter((classroom) =>
                activeTermIds.has(getEntityId(classroom.term)),
              )
            : classrooms;

        const activeClassIds = new Set(
          activeClasses.map((classroom) => classroom.id),
        );

        const activeExams = allExams.filter((exam) =>
          activeClassIds.has(getEntityId(exam.classroom)),
        );

        const activeSessions = allSessions.filter((session) =>
          activeClassIds.has(getEntityId(session.classroom)),
        );

        setTerms(allTerms);
        setClasses(activeClasses);
        setExams(activeExams);
        setSessions(activeSessions);
        setSubmissions(allSubmissions);
      } catch (err) {
        if (alive) {
          setError(err?.message || "دریافت اطلاعات پنل ناموفق بود.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const activeTerm = useMemo(
    () => terms.find((term) => term.is_active),
    [terms],
  );

  const totalStudents = useMemo(
    () =>
      classes.reduce(
        (total, classroom) => total + Number(classroom.student_count || 0),
        0,
      ),
    [classes],
  );

  const sessionsByClass = useMemo(() => {
    const result = {};

    sessions.forEach((session) => {
      const classroomId = getEntityId(session.classroom);

      if (!classroomId) return;

      result[classroomId] = (result[classroomId] || 0) + 1;
    });

    return result;
  }, [sessions]);

  const submissionsByExam = useMemo(() => {
    const result = {};

    submissions.forEach((submission) => {
      const examId = getEntityId(submission.exam);

      if (!examId) return;

      result[examId] = (result[examId] || 0) + 1;
    });

    return result;
  }, [submissions]);

  const getClassByExam = (exam) => {
    const classroomId = getEntityId(exam.classroom);

    return classes.find((classroom) => classroom.id === classroomId);
  };

  return (
    <DashboardLayout role="پنل استاد" title="پنل استاد" menuType="teacher">
      <div className="teacher-panel-x7k2-root">
        {/* =========================
            Statistics
        ========================== */}

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

        {/* =========================
            Classes
        ========================== */}

        <section className="teacher-panel-x7k2-section">
          <div className="teacher-panel-x7k2-section-head">
            <div className="teacher-panel-x7k2-section-heading">
              <h3 className="teacher-panel-x7k2-section-title">
                کلاس‌های من در{" "}
                {activeTerm?.name ? `«${activeTerm.name}»` : "ترم جاری"}
              </h3>

              <p className="teacher-panel-x7k2-section-description">
                تنها کلاس‌های مربوط به ترم‌های فعال در این بخش نمایش داده
                می‌شوند.
              </p>
            </div>

            <div className="teacher-panel-x7k2-actions">
              <Link
                to="/panel/teacher/exams"
                className="teacher-panel-x7k2-action-link"
              >
                <AnimatedButton
                  variant="secondary"
                  icon={<Award size={17} />}
                  size="small"
                >
                  میز نمره‌دهی و تصحیح
                </AnimatedButton>
              </Link>

              <Link
                to="/panel/teacher/create-exam"
                className="teacher-panel-x7k2-action-link"
              >
                <AnimatedButton
                  variant="danger"
                  icon={<PlusCircle size={18} />}
                  size="small"
                >
                  ایجاد آزمون جدید
                </AnimatedButton>
              </Link>
            </div>
          </div>

          <div className="teacher-panel-x7k2-table-shell">
            <div className="teacher-panel-x7k2-table-scroll">
              <table className="teacher-panel-x7k2-table teacher-panel-x7k2-table--classes">
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
                    <tr className="teacher-panel-x7k2-state-row">
                      <td colSpan="6">
                        <div className="teacher-panel-x7k2-loading">
                          <span className="teacher-panel-x7k2-spinner" />
                          <span>در حال دریافت اطلاعات...</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr className="teacher-panel-x7k2-state-row">
                      <td colSpan="6">
                        <div className="teacher-panel-x7k2-error">{error}</div>
                      </td>
                    </tr>
                  )}

                  {!loading && !error && classes.length === 0 && (
                    <tr className="teacher-panel-x7k2-state-row">
                      <td colSpan="6">
                        <div className="teacher-panel-x7k2-empty">
                          <BookOpen size={24} />
                          <span>
                            در حال حاضر کلاس فعالی برای شما در ترم جاری ثبت نشده
                            است.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    classes.map((classroom) => {
                      const classSessions = sessionsByClass[classroom.id] || 0;

                      return (
                        <tr key={classroom.id}>
                          <td data-label="کلاس">
                            <span className="teacher-panel-x7k2-class-tag teacher-panel-x7k2-class-tag--highlight">
                              {classroom.name}
                            </span>
                          </td>

                          <td data-label="تعداد">
                            <span className="teacher-panel-x7k2-count">
                              {toPersianDigits(classroom.student_count || 0)}{" "}
                              نفر
                            </span>
                          </td>

                          <td data-label="استاد">
                            <span className="teacher-panel-x7k2-capacity">
                              {getFullName(classroom.teacher_detail)}
                            </span>
                          </td>

                          <td data-label="جلسات">
                            <span className="teacher-panel-x7k2-count">
                              {toPersianDigits(classSessions)} جلسه
                            </span>
                          </td>

                          <td data-label="وضعیت">
                            <span className="teacher-panel-x7k2-status teacher-panel-x7k2-status--active">
                              <span className="teacher-panel-x7k2-status-dot" />
                              ترم فعال
                            </span>
                          </td>

                          <td data-label="عملیات">
                            <Link
                              to={`/panel/teacher/attendance/${classroom.id}`}
                              className="teacher-panel-x7k2-operation-link"
                            >
                              <AnimatedButton variant="primary" size="small">
                                حضور و غیاب
                              </AnimatedButton>

                              <ChevronLeft
                                size={15}
                                className="teacher-panel-x7k2-operation-arrow"
                              />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <section className="teacher-panel-x7k2-section">
          <div className="teacher-panel-x7k2-section-head">
            <div className="teacher-panel-x7k2-section-heading">
              <h3 className="teacher-panel-x7k2-section-title">
                آزمون‌های ترم فعال
              </h3>

              <p className="teacher-panel-x7k2-section-description">
                آزمون‌های تعریف‌شده برای کلاس‌های ترم جاری
              </p>
            </div>

            <Link
              to="/panel/teacher/exams"
              className="teacher-panel-x7k2-view-all"
            >
              <span>مشاهده همه و تصحیح</span>
              <ChevronLeft size={15} />
            </Link>
          </div>

          <div className="teacher-panel-x7k2-table-shell">
            <div className="teacher-panel-x7k2-table-scroll">
              <table className="teacher-panel-x7k2-table teacher-panel-x7k2-table--exams">
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>کلاس</th>
                    <th>تاریخ</th>
                    <th>پاسخ‌برگ‌های دریافتی</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>

                <tbody>
                  {exams.length === 0 ? (
                    <tr className="teacher-panel-x7k2-state-row">
                      <td colSpan="5">
                        <div className="teacher-panel-x7k2-empty">
                          <FileText size={24} />
                          <span>
                            هنوز آزمونی در ترم فعال جاری تعریف نشده است.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    exams.map((exam) => {
                      const classItem = getClassByExam(exam);

                      const received = submissionsByExam[exam.id] || 0;

                      const total = classItem?.student_count || 0;

                      return (
                        <tr key={exam.id}>
                          <td data-label="عنوان">
                            <strong className="teacher-panel-x7k2-exam-title">
                              {exam.title}
                            </strong>
                          </td>

                          <td data-label="کلاس">
                            <span className="teacher-panel-x7k2-class-tag">
                              {classItem?.name || getEntityId(exam.classroom)}
                            </span>
                          </td>

                          <td data-label="تاریخ">
                            <span className="teacher-panel-x7k2-date">
                              {toJalaliDateString(exam.date)}
                            </span>
                          </td>

                          <td data-label="شرکت‌کنندگان">
                            <span className="teacher-panel-x7k2-submission-count">
                              <strong>{toPersianDigits(received)}</strong>

                              <span>/</span>

                              <span>{toPersianDigits(total)}</span>

                              <small>نفر</small>
                            </span>
                          </td>

                          <td data-label="وضعیت">
                            <span className="teacher-panel-x7k2-status teacher-panel-x7k2-status--exam">
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
