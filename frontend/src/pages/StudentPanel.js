import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  FileText,
  Award,
  AlertCircle,
  Play,
  History,
  GraduationCap,
  Layers,
  ChevronLeft,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { api, getFullName, storage } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

import "./StudentPanel.css";

function StudentPanel() {
  const [classrooms, setClassrooms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [exams, setExams] = useState([]);
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

        const [
          classroomsData,
          termsData,
          sessionsData,
          attendancesData,
          examsData,
          submissionsData,
        ] = await Promise.all([
          api.classrooms.list(),
          api.terms.list(),
          api.sessions.list(),
          api.attendance.list(),
          api.exams.list(),
          api.submissions.list(),
        ]);

        if (!alive) return;

        setClassrooms(classroomsData || []);
        setTerms(termsData || []);
        setSessions(sessionsData || []);
        setAttendances(attendancesData || []);
        setExams(examsData || []);
        setSubmissions(submissionsData || []);
      } catch (err) {
        if (alive) setError(err.message || "دریافت اطلاعات داشبورد دانش‌آموز ناموفق بود.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  // 1. Identify ONLY the Active Class (کلاسی که ترم آن فعال است)
  const activeClassInfo = useMemo(() => {
    if (!classrooms.length) return null;

    // Filter enrolled classrooms belonging to an active term
    const activeTermIds = terms.filter((t) => t.is_active).map((t) => t.id);

    const activeClasses = classrooms.filter((c) =>
      activeTermIds.includes(c.term || c.term?.id),
    );

    // Pick the active class, or fallback to the most recent enrolled class
    const targetClass = activeClasses.length > 0 ? activeClasses[0] : classrooms[0];
    if (!targetClass) return null;

    const termObj = terms.find((t) => t.id === (targetClass.term || targetClass.term?.id));

    return {
      ...targetClass,
      termName: termObj?.name || "ترم جاری",
      isTermActive: termObj ? termObj.is_active : true,
      teacherName: getFullName(targetClass.teacher_detail) || "استاد آکادمی",
    };
  }, [classrooms, terms]);

  // 2. Attendance sessions for the Active Class ONLY
  const activeSessionsData = useMemo(() => {
    if (!activeClassInfo) return [];

    const classSessions = sessions
      .filter((s) => s.classroom === activeClassInfo.id || s.classroom?.id === activeClassInfo.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return classSessions.map((session, index) => {
      // Find record for this session
      const record =
        (session.records || []).find((r) => r.student === currentUser?.id || r.student?.id === currentUser?.id) ||
        attendances.find(
          (a) =>
            (a.session === session.id || a.session?.id === session.id) &&
            (a.student === currentUser?.id || a.student?.id === currentUser?.id),
        );

      let status = "pending";
      let statusLabel = "در انتظار برگزاری";
      let note = record?.note || "";

      if (record) {
        status = record.status;
        if (status === "present") statusLabel = "حاضر";
        else if (status === "absent") statusLabel = "غایب";
        else if (status === "late") statusLabel = "تاخیر";
        else if (status === "excused") statusLabel = "غیبت موجه";
      }

      return {
        id: session.id,
        sessionNumber: index + 1,
        date: session.date,
        shamsiDate: toJalaliDateString(session.date),
        status,
        statusLabel,
        note,
      };
    });
  }, [activeClassInfo, sessions, attendances, currentUser]);

  // Attendance summary metrics
  const attendanceStats = useMemo(() => {
    const total = activeSessionsData.length;
    const recorded = activeSessionsData.filter((s) => s.status !== "pending");
    const present = activeSessionsData.filter((s) => s.status === "present").length;
    const absent = activeSessionsData.filter((s) => s.status === "absent").length;
    const late = activeSessionsData.filter((s) => s.status === "late").length;
    const excused = activeSessionsData.filter((s) => s.status === "excused").length;

    const presentPercentage =
      recorded.length > 0
        ? Math.round(((present + late * 0.5 + excused * 0.5) / recorded.length) * 100)
        : 100;

    return {
      total,
      recorded: recorded.length,
      present,
      absent,
      late,
      excused,
      presentPercentage,
    };
  }, [activeSessionsData]);

  // 3. Exams & Grades for the Active Class ONLY
  const activeExamsData = useMemo(() => {
    if (!activeClassInfo) return [];

    const classExams = exams.filter(
      (e) => e.classroom === activeClassInfo.id || e.classroom?.id === activeClassInfo.id,
    );

    return classExams.map((exam) => {
      const submission = submissions.find(
        (s) =>
          (s.exam === exam.id || s.exam?.id === exam.id) &&
          (s.student === currentUser?.id || s.student?.id === currentUser?.id),
      );

      const maxScore = (exam.questions || []).reduce(
        (acc, q) => acc + (q.max_score || 1),
        0,
      ) || exam.questions?.length || 20;

      let status = "not_taken";
      let statusLabel = "شرکت در آزمون";
      let scoreDisplay = "-";

      if (submission) {
        if (submission.is_graded) {
          status = "graded";
          statusLabel = "تصحیح شده";
          scoreDisplay = `${submission.total_score} از ${maxScore}`;
        } else {
          status = "pending_grade";
          statusLabel = "در انتظار تصحیح";
          scoreDisplay = "در انتظار نمره";
        }
      }

      return {
        ...exam,
        submission,
        isCompleted: Boolean(submission),
        status,
        statusLabel,
        maxScore,
        scoreDisplay,
        questionsCount: exam.questions?.length || 0,
        shamsiDate: toJalaliDateString(exam.date),
      };
    });
  }, [activeClassInfo, exams, submissions, currentUser]);

  // Calculate average exam score in active class
  const examStats = useMemo(() => {
    const completed = activeExamsData.filter((e) => e.isCompleted);
    const graded = activeExamsData.filter((e) => e.status === "graded");

    const totalScore = graded.reduce(
      (sum, e) => sum + (e.submission?.total_score || 0),
      0,
    );
    const avgScore = graded.length > 0 ? (totalScore / graded.length).toFixed(1) : "-";

    return {
      totalExams: activeExamsData.length,
      completedCount: completed.length,
      gradedCount: graded.length,
      avgScore,
    };
  }, [activeExamsData]);

  return (
    <DashboardLayout role="پنل دانش‌آموز" title="داشبورد من" menuType="student">
      <div className="student-panel-page">
        {error && (
          <div className="student-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Active Class Highlight Banner */}
        {activeClassInfo ? (
          <div className="active-class-hero-banner">
            <div className="banner-badge-row">
              <span className="active-term-badge">
                <Layers size={15} />
                {activeClassInfo.termName}
              </span>
              <span className="active-class-live-pill">
                <span className="live-dot" />
                کلاس فعال شما
              </span>
            </div>

            <div className="banner-main-row">
              <div className="class-hero-icon">
                <GraduationCap size={32} />
              </div>
              <div className="class-hero-info">
                <h2>{activeClassInfo.name}</h2>
                <p>
                  مدرس دوره: <strong>{activeClassInfo.teacherName}</strong> | تاریخ
                  شروع: <strong>{toJalaliDateString(activeClassInfo.created_at?.split("T")[0])}</strong>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-active-class-box">
            <BookOpen size={36} />
            <h3>در حال حاضر کلاس فعالی برای شما ثبت نشده است</h3>
            <p>جهت ثبت‌نام در دوره‌ها یا فعال‌سازی کلاس با واحد آموزش و منشی تماس بگیرید.</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="student-panel-stats-grid">
          <StatCard
            title="کلاس فعال"
            value={activeClassInfo?.name || "فاقد کلاس"}
            hint={activeClassInfo?.termName || "ترم جاری"}
            icon={<BookOpen size={22} />}
            color="red"
          />

          <StatCard
            title="وضعیت حضور در کلاس"
            value={`${toPersianDigits(attendanceStats.presentPercentage)}٪`}
            hint={`${toPersianDigits(attendanceStats.present)} جلسه حاضر از ${toPersianDigits(
              attendanceStats.recorded,
            )}`}
            icon={<CheckCircle2 size={22} />}
            color="green"
          />

          <StatCard
            title="جلسات برگزارشده"
            value={`${toPersianDigits(attendanceStats.total)} جلسه`}
            hint={
              attendanceStats.absent > 0
                ? `${toPersianDigits(attendanceStats.absent)} غیبت ثبت‌شده`
                : "بدون غیبت"
            }
            icon={<CalendarDays size={22} />}
            color="blue"
          />

          <StatCard
            title="میانگین نمرات آزمون‌ها"
            value={
              examStats.avgScore !== "-"
                ? `${toPersianDigits(examStats.avgScore)}`
                : "در انتظار نمره"
            }
            hint={`${toPersianDigits(examStats.completedCount)} از ${toPersianDigits(
              examStats.totalExams,
            )} آزمون`}
            icon={<Award size={22} />}
            color="orange"
          />
        </div>

        {/* Content Grid: Attendance (Right/Top) & Exams/Grades (Left/Bottom) */}
        <div className="student-panel-main-grid">
          {/* ========================================================
              Section 1: All Attendance Sessions for Active Class
             ======================================================== */}
          <section className="student-panel-card">
            <div className="student-card-header">
              <div className="header-info">
                <h3>
                  <CalendarDays size={20} />
                  جلسات و وضعیت حضور و غیاب
                </h3>
                <p>مشاهده وضعیت حضور یا غیبت شما در تمامی جلسات کلاس جاری</p>
              </div>

              <span className="present-ratio-tag">
                {toPersianDigits(attendanceStats.present)} از {toPersianDigits(attendanceStats.total)} حاضر
              </span>
            </div>

            {loading ? (
              <div className="panel-loading-text">در حال دریافت جلسات...</div>
            ) : activeSessionsData.length > 0 ? (
              <div className="sessions-attendance-list">
                {activeSessionsData.map((session) => (
                  <div key={session.id} className="session-attendance-row">
                    <div className="session-number-col">
                      <span className="session-num-badge">
                        جلسه {toPersianDigits(session.sessionNumber)}
                      </span>
                      <span className="session-date-text">
                        {session.shamsiDate}
                      </span>
                    </div>

                    <div className="session-status-col">
                      <span className={`attendance-status-badge ${session.status}`}>
                        {session.status === "present" && <CheckCircle2 size={15} />}
                        {session.status === "absent" && <XCircle size={15} />}
                        {session.status === "late" && <Clock3 size={15} />}
                        {session.status === "excused" && <AlertCircle size={15} />}
                        {session.status === "pending" && <Clock3 size={15} />}
                        <span>{session.statusLabel}</span>
                      </span>

                      {session.note && (
                        <span className="session-teacher-note" title={session.note}>
                          توضیح: {session.note}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-empty-box">
                <CalendarDays size={32} />
                <p>هنوز جلسه‌ای برای این کلاس ثبت نشده است.</p>
              </div>
            )}
          </section>

          {/* ========================================================
              Section 2: Exams & Grades in Active Class
             ======================================================== */}
          <section className="student-panel-card">
            <div className="student-card-header">
              <div className="header-info">
                <h3>
                  <Award size={20} />
                  نمرات و آزمون‌های کلاس
                </h3>
                <p>کارنامه و نتایج امتحانات برگزارشده در کلاس فعال</p>
              </div>

              <Link to="/panel/student/exams" className="view-all-link">
                همه آزمون‌ها
                <ChevronLeft size={16} />
              </Link>
            </div>

            {loading ? (
              <div className="panel-loading-text">در حال بارگذاری نمرات...</div>
            ) : activeExamsData.length > 0 ? (
              <div className="active-exams-list">
                {activeExamsData.map((exam) => (
                  <div key={exam.id} className="active-exam-item-card">
                    <div className="exam-main-details">
                      <div className="exam-icon-box">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4>{exam.title}</h4>
                        <div className="exam-sub-info">
                          <span>تاریخ: {exam.shamsiDate}</span>
                          <span>•</span>
                          <span>{toPersianDigits(exam.questionsCount)} سوال</span>
                        </div>
                      </div>
                    </div>

                    <div className="exam-action-score-col">
                      <div className="score-badge-box">
                        {exam.status === "graded" ? (
                          <div className="score-final">
                            <span className="score-num">
                              {toPersianDigits(exam.submission?.total_score)}
                            </span>
                            <span className="score-denom">
                              / {toPersianDigits(exam.maxScore)}
                            </span>
                          </div>
                        ) : exam.status === "pending_grade" ? (
                          <span className="status-pill pending">منتظر تصحیح</span>
                        ) : (
                          <span className="status-pill open">شروع نشده</span>
                        )}
                      </div>

                      {exam.isCompleted ? (
                        <Link to={`/panel/student/examresult/${exam.id}`}>
                          <button type="button" className="btn-exam-action review">
                            <History size={14} />
                            <span>کارنامه</span>
                          </button>
                        </Link>
                      ) : (
                        <Link to={`/panel/student/exam/${exam.id}`}>
                          <button type="button" className="btn-exam-action start">
                            <Play size={14} />
                            <span>شروع</span>
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-empty-box">
                <FileText size={32} />
                <p>در حال حاضر آزمونی برای این کلاس تعریف نشده است.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentPanel;
