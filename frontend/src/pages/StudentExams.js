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
} from "lucide-react";

import "./StudentExams.css";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { Link } from "react-router-dom";
import { api, getFullName } from "../services/api";
import { toJalaliDateString } from "../utils/dateUtils";

function StudentExams() {
  const [activeTab, setActiveTab] = useState("active");
  const [exams, setExams] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        const [examsData, classroomsData, submissionsData] = await Promise.all([
          api.exams.list(),
          api.classrooms.list(),
          api.submissions.list(),
        ]);

        if (!alive) return;
        setExams(examsData);
        setClassrooms(classroomsData);
        setSubmissions(submissionsData);
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

  const examsData = useMemo(
    () =>
      exams.map((exam) => {
        const classroom = classrooms.find((item) => item.id === exam.classroom);
        const submission = submissions.find((item) => item.exam === exam.id);

        return {
          ...exam,
          subject: classroom?.name || `کلاس ${exam.classroom}`,
          teacher: getFullName(classroom?.teacher_detail),
          questionsCount: exam.questions?.length || 0,
          status: submission ? "completed" : "active",
          score:
            submission?.total_score !== null && submission?.total_score !== undefined
              ? `${submission.total_score}`
              : submission
                ? "در انتظار تصحیح"
                : "",
          description: `${exam.title} - ${classroom?.name || "کلاس"}`,
        };
      }),
    [exams, classrooms, submissions],
  );

  const activeExams = useMemo(
    () => examsData.filter((exam) => exam.status === "active"),
    [examsData],
  );

  const completedExams = useMemo(
    () => examsData.filter((exam) => exam.status === "completed"),
    [examsData],
  );

  const currentExams = activeTab === "active" ? activeExams : completedExams;

  return (
    <DashboardLayout role="پنل دانش‌آموز" title="آزمون ها" menuType="student">
      <div className="student-exams-page">
        <div className="student-exams-stats">
          <StatCard
            title="آزمون‌های فعال"
            value={activeExams.length}
            icon={<Timer />}
            color="red"
          />
          <StatCard
            title="کل آزمون‌ها"
            value={examsData.length}
            icon={<FileQuestion />}
            color="blue"
          />
          <StatCard
            title="آزمون‌های داده‌شده"
            value={completedExams.length}
            icon={<CheckCircle2 />}
            color="green"
          />
          <StatCard
            title="آخرین نتیجه"
            value={completedExams[0]?.score || "-"}
            icon={<Trophy />}
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
                  ? "آزمون‌های فعال"
                  : "آزمون‌های داده‌شده"}
              </h2>

              <p>
                {activeTab === "active"
                  ? "آزمون‌هایی که در حال حاضر امکان شرکت در آن‌ها وجود دارد."
                  : "لیست آزمون‌هایی که قبلاً در آن‌ها شرکت کرده‌اید."}
              </p>
            </div>
          </div>

          {/* =====================================================
            Tabs
        ===================================================== */}

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
              <span>{activeExams.length}</span>
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
              <span>{completedExams.length}</span>
            </button>
          </div>

          {/* =====================================================
            Exams Grid
        ===================================================== */}

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

                    {exam.status === "active" ? (
                      <span className="student-exams-status active">
                        <span className="student-exams-status-dot" />
                        فعال
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
                        <strong>{exam.questionsCount} سوال</strong>
                      </div>
                    </div>

                    <div className="student-exams-detail">
                      <Clock3 size={15} />

                      <div>
                        <span>زمان آزمون</span>
                        <strong>طبق اعلام مدرس</strong>
                      </div>
                    </div>

                    <div className="student-exams-detail">
                      <CalendarDays size={15} />

                      <div>
                        <span>تاریخ (شمسی)</span>
                        <strong>{toJalaliDateString(exam.date)}</strong>
                      </div>
                    </div>

                    <div className="student-exams-detail">
                      <Timer size={15} />

                      <div>
                        <span>ساعت</span>
                        <strong>-</strong>
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
                    {exam.status === "active" ? (
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
                          مشاهده نتیجه
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
                  ? "آزمون فعالی وجود ندارد"
                  : "هنوز آزمونی داده نشده است"}
              </strong>

              <span>
                {activeTab === "active"
                  ? "در حال حاضر آزمون جدیدی برای شما فعال نشده است."
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
