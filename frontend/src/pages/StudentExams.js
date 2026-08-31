import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileQuestion,
  History,
  Play,
  Timer,
  Trophy,
  UserRound,
  XCircle,
  Award,
} from "lucide-react";

import "./StudentExams.css";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { Link } from "react-router-dom";
import { api, getFullName, storage } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

function StudentExams() {
  const [activeTab, setActiveTab] = useState("active");
  const [exams, setExams] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = storage.getUser();

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [examsData, classroomsData, termsData, submissionsData] =
          await Promise.all([
            api.exams.list(),
            api.classrooms.list(),
            api.terms.list(),
            api.submissions.list(),
          ]);

        if (!alive) return;
        setExams(examsData || []);
        setClassrooms(classroomsData || []);
        setTerms(termsData || []);
        setSubmissions(submissionsData || []);
      } catch (err) {
        if (alive) setError(err.message || "دریافت آزمون‌ها ناموفق بود.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  // Active term and class filtering
  const activeClassIds = useMemo(() => {
    const activeTermIds = terms.filter((t) => t.is_active).map((t) => t.id);
    const enrolledActive = classrooms.filter((c) =>
      activeTermIds.includes(c.term || c.term?.id),
    );

    if (enrolledActive.length > 0) {
      return enrolledActive.map((c) => c.id);
    }
    return classrooms.map((c) => c.id);
  }, [terms, classrooms]);

  const examsData = useMemo(
    () =>
      exams
        .filter((exam) => activeClassIds.includes(exam.classroom || exam.classroom?.id))
        .map((exam) => {
          const classroom = classrooms.find(
            (item) => item.id === exam.classroom || item.id === exam.classroom?.id,
          );
          const submission = submissions.find(
            (item) =>
              (item.exam === exam.id || item.exam?.id === exam.id) &&
              (item.student === currentUser?.id || item.student?.id === currentUser?.id),
          );

          const maxScore = (exam.questions || []).reduce(
            (acc, q) => acc + (q.max_score || 1),
            0,
          ) || 20;

          let status = submission ? "completed" : "active";
          if (!submission) {
            const userId = currentUser?.id || "guest";
            const startTimeStr = localStorage.getItem(`kish_exam_start_time_${exam.id}_${userId}`);
            if (startTimeStr) {
              const durMinutes = Number(exam.duration_minutes) || 45;
              const durSeconds = durMinutes * 60;
              const elapsed = Math.floor((Date.now() - Number(startTimeStr)) / 1000);
              if (elapsed < durSeconds) {
                status = "in_progress";
              }
            }
          }

          return {
            ...exam,
            subject: classroom?.name || `کلاس ${exam.classroom}`,
            teacher: getFullName(classroom?.teacher_detail) || "استاد آکادمی",
            questionsCount: exam.questions?.length || 0,
            status,
            isGraded: submission?.is_graded,
            maxScore,
            score:
              submission?.total_score !== null && submission?.total_score !== undefined
                ? `${toPersianDigits(submission.total_score)} از ${toPersianDigits(maxScore)}`
                : submission
                  ? "در انتظار تصحیح"
                  : "",
            description: `${exam.title} - ${classroom?.name || "کلاس"}`,
          };
        }),
    [exams, classrooms, submissions, activeClassIds, currentUser],
  );

  const activeExams = useMemo(
    () => examsData.filter((exam) => exam.status === "active" || exam.status === "in_progress"),
    [examsData],
  );

  const completedExams = useMemo(
    () => examsData.filter((exam) => exam.status === "completed"),
    [examsData],
  );

  const currentExams = activeTab === "active" ? activeExams : completedExams;

  return (
    <DashboardLayout role="پنل دانش‌آموز" title="آزمون‌ها" menuType="student">
      <div className="student-exams-page">
        <div className="student-exams-stats">
          <StatCard
            title="آزمون‌های فعال"
            value={`${toPersianDigits(activeExams.length)} آزمون`}
            icon={<Timer size={22} />}
            color="red"
          />
          <StatCard
            title="کل آزمون‌های کلاس"
            value={`${toPersianDigits(examsData.length)} آزمون`}
            icon={<FileQuestion size={22} />}
            color="blue"
          />
          <StatCard
            title="آزمون‌های داده‌شده"
            value={`${toPersianDigits(completedExams.length)} آزمون`}
            icon={<CheckCircle2 size={22} />}
            color="green"
          />
          <StatCard
            title="آخرین نتیجه"
            value={completedExams[0]?.score || "هنوز ثبت نشده"}
            icon={<Trophy size={22} />}
            color="orange"
          />
        </div>

        <section className="student-exams-section">
          <div className="student-exams-section-header">
            <div className="student-exams-heading">
              <span className="student-exams-section-kicker">
                <History size={14} />
                مدیریت آزمون‌ها
              </span>

              <h2>
                {activeTab === "active"
                  ? "آزمون‌های فعال کلاس"
                  : "آزمون‌های داده‌شده"}
              </h2>

              <p>
                {activeTab === "active"
                  ? "آزمون‌های کلاس جاری که در حال حاضر امکان شرکت در آن‌ها وجود دارد."
                  : "لیست آزمون‌های کلاس فعال که قبلاً در آن‌ها شرکت کرده‌اید."}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="student-exams-tabs">
            <button
              type="button"
              className={`student-exams-tab ${
                activeTab === "active" ? "active" : ""
              }`}
              onClick={() => setActiveTab("active")}
            >
              <Timer size={17} />
              آزمون‌های فعال
              <span>{toPersianDigits(activeExams.length)}</span>
            </button>

            <button
              type="button"
              className={`student-exams-tab ${
                activeTab === "completed" ? "active" : ""
              }`}
              onClick={() => setActiveTab("completed")}
            >
              <CheckCircle2 size={17} />
              آزمون‌های داده‌شده
              <span>{toPersianDigits(completedExams.length)}</span>
            </button>
          </div>

          {/* Exams Grid */}
          {loading ? (
            <div className="student-exams-empty">
              <strong>در حال دریافت آزمون‌ها...</strong>
            </div>
          ) : error ? (
            <div className="student-exams-empty">
              <XCircle size={30} />
              <strong>{error}</strong>
            </div>
          ) : currentExams.length > 0 ? (
            <div className="student-exams-grid">
              {currentExams.map((exam) => (
                <article className="student-exams-card" key={exam.id}>
                  {/* Card Top */}
                  <div className="student-exams-card-top">
                    <div className="student-exams-card-subject">
                      {exam.subject}
                    </div>

                    {exam.status === "in_progress" ? (
                      <span className="student-exams-status in-progress">
                        <span className="student-exams-status-dot in-progress" />
                        در حال برگزاری
                      </span>
                    ) : exam.status === "active" ? (
                      <span className="student-exams-status active">
                        <span className="student-exams-status-dot" />
                        آماده شروع
                      </span>
                    ) : (
                      <span className="student-exams-status completed">
                        <CheckCircle2 size={13} />
                        انجام شده
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div className="student-exams-card-title">
                    <div className="student-exams-card-icon">
                      <FileQuestion size={21} />
                    </div>

                    <div>
                      <h3>{exam.title}</h3>
                      <p>{exam.description}</p>
                    </div>
                  </div>

                  {/* Teacher */}
                  <div className="student-exams-teacher">
                    <UserRound size={15} />
                    <span>مدرس:</span>
                    <strong>{exam.teacher}</strong>
                  </div>

                  {/* Details */}
                  <div className="student-exams-details">
                    <div className="student-exams-detail">
                      <FileQuestion size={15} />
                      <div>
                        <span>تعداد سوال</span>
                        <strong>{toPersianDigits(exam.questionsCount)} سوال</strong>
                      </div>
                    </div>

                    <div className="student-exams-detail">
                      <Timer size={15} />
                      <div>
                        <span>مدت زمان</span>
                        <strong>{toPersianDigits(exam.duration_minutes || 45)} دقیقه</strong>
                      </div>
                    </div>

                    <div className="student-exams-detail">
                      <Clock3 size={15} />
                      <div>
                        <span>بارم کل</span>
                        <strong>{toPersianDigits(exam.maxScore)} نمره</strong>
                      </div>
                    </div>

                    <div className="student-exams-detail">
                      <CalendarDays size={15} />
                      <div>
                        <span>تاریخ برگزاری</span>
                        <strong>{toJalaliDateString(exam.date)}</strong>
                      </div>
                    </div>

                    <div className="student-exams-detail">
                      <Award size={15} />
                      <div>
                        <span>وضعیت</span>
                        <strong>
                          {exam.status === "in_progress"
                            ? "در حال برگزاری"
                            : exam.status === "active"
                              ? "شروع نشده"
                              : exam.isGraded
                                ? "تصحیح نهایی"
                                : "منتظر نمره"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Result */}
                  {exam.status === "completed" && (
                    <div className="student-exams-result">
                      <div className="student-exams-result-icon">
                        <Trophy size={17} />
                      </div>

                      <div>
                        <span>نتیجه آزمون</span>
                        <strong>{exam.score}</strong>
                      </div>
                    </div>
                  )}

                  <div className="student-exams-card-footer">
                    {exam.status === "in_progress" ? (
                      <Link to={`/panel/student/exam/${exam.id}`}>
                        <button
                          type="button"
                          className="student-exams-start-btn"
                          style={{ background: "linear-gradient(135deg, #f39c12, #e67e22)" }}
                        >
                          <Play size={17} />
                          ادامه آزمون
                        </button>
                      </Link>
                    ) : exam.status === "active" ? (
                      <Link to={`/panel/student/exam/${exam.id}`}>
                        <button
                          type="button"
                          className="student-exams-start-btn"
                        >
                          <Play size={17} />
                          شروع آزمون
                        </button>
                      </Link>
                    ) : (
                      <Link to={`/panel/student/examresult/${exam.id}`}>
                        <button
                          type="button"
                          className="student-exams-review-btn"
                        >
                          <History size={16} />
                          مشاهده کارنامه و پاسخ‌برگ
                        </button>
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="student-exams-empty">
              <div className="student-exams-empty-icon">
                <XCircle size={30} />
              </div>

              <strong>
                {activeTab === "active"
                  ? "آزمون فعالی در این کلاس وجود ندارد"
                  : "هنوز در آزمونی شرکت نکرده‌اید"}
              </strong>

              <span>
                {activeTab === "active"
                  ? "در حال حاضر آزمون جدیدی برای کلاس فعال شما ثبت نشده است."
                  : "آزمون‌هایی که در آن‌ها شرکت کنید در این قسمت نمایش داده می‌شوند."}
              </span>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default StudentExams;
