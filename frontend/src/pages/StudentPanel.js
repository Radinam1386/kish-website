
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
  Bell,
  Megaphone,
  X,
  CheckCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { api, getFullName, storage } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

import "./StudentPanel.css";

const ANNOUNCEMENTS_KEY = "kish_admin_announcements_v1";

function StudentPanel() {
  const currentUser = storage.getUser();

  const READ_ANNOUNCEMENTS_KEY = `kish_student_read_announcements_${currentUser?.id || "guest"}`;

  const [classrooms, setClassrooms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Announcements
  const [announcements, setAnnouncements] = useState(() => {
    try {
      const saved = localStorage.getItem(ANNOUNCEMENTS_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [readAnnouncementIds, setReadAnnouncementIds] = useState(() => {
    try {
      const saved = localStorage.getItem(READ_ANNOUNCEMENTS_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  });

  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);

  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(true);

  // Refresh announcements when returning to the page
  useEffect(() => {
    const loadAnnouncements = () => {
      try {
        const saved = localStorage.getItem(ANNOUNCEMENTS_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setAnnouncements(Array.isArray(parsed) ? parsed : []);
      } catch {
        setAnnouncements([]);
      }
    };

    loadAnnouncements();

    window.addEventListener("focus", loadAnnouncements);
    window.addEventListener("storage", loadAnnouncements);

    return () => {
      window.removeEventListener("focus", loadAnnouncements);
      window.removeEventListener("storage", loadAnnouncements);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        READ_ANNOUNCEMENTS_KEY,
        JSON.stringify(readAnnouncementIds),
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [readAnnouncementIds, READ_ANNOUNCEMENTS_KEY]);

  const markAnnouncementRead = (id) => {
    const normalizedId = String(id);

    setReadAnnouncementIds((previous) => {
      if (previous.includes(normalizedId)) return previous;
      return [...previous, normalizedId];
    });
  };

  const localToday = (() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  })();

  const visibleAnnouncements = useMemo(() => {
    return announcements
      .filter((item) => {
        const audience =
          item.audience === "all" || item.audience === "students";

        const started = !item.startDate || item.startDate <= localToday;
        const notExpired = !item.endDate || item.endDate >= localToday;

        return audience && started && notExpired;
      })
      .sort((a, b) => {
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      });
  }, [announcements, localToday]);

  const recentUnreadAnnouncements = useMemo(() => {
    const now = Date.now();
    const twoDays = 48 * 60 * 60 * 1000;

    return visibleAnnouncements.filter((item) => {
      const createdAt = new Date(item.createdAt).getTime();

      const isRecent =
        Number.isFinite(createdAt) &&
        createdAt <= now &&
        now - createdAt <= twoDays;

      const isUnread = !readAnnouncementIds.includes(String(item.id));

      return isRecent && isUnread;
    });
  }, [visibleAnnouncements, readAnnouncementIds]);

  const activePopupAnnouncement =
    showAnnouncementPopup && recentUnreadAnnouncements.length > 0
      ? recentUnreadAnnouncements[0]
      : null;

  const unreadAnnouncementsCount = visibleAnnouncements.filter(
    (item) => !readAnnouncementIds.includes(String(item.id)),
  ).length;

  const formatAnnouncementDate = (dateValue) => {
    if (!dateValue) return "";

    try {
      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) return "";

      return toJalaliDateString(date.toISOString().split("T")[0]);
    } catch {
      return "";
    }
  };

  // Load dashboard data
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
        if (alive) {
          setError(
            err.message || "دریافت اطلاعات داشبورد دانش‌آموز ناموفق بود.",
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  // Identify active class
  const activeClassInfo = useMemo(() => {
    if (!classrooms.length) return null;

    const activeTermIds = terms
      .filter((term) => term.is_active)
      .map((term) => term.id);

    const activeClasses = classrooms.filter((classroom) =>
      activeTermIds.includes(
        classroom.term?.id || classroom.term,
      ),
    );

    const targetClass =
      activeClasses.length > 0 ? activeClasses[0] : classrooms[0];

    if (!targetClass) return null;

    const termId = targetClass.term?.id || targetClass.term;

    const termObj = terms.find((term) => term.id === termId);

    return {
      ...targetClass,
      termName: termObj?.name || "ترم جاری",
      isTermActive: termObj ? termObj.is_active : true,
      teacherName:
        getFullName(targetClass.teacher_detail) || "استاد آکادمی",
    };
  }, [classrooms, terms]);

  // Attendance sessions for active class
  const activeSessionsData = useMemo(() => {
    if (!activeClassInfo) return [];

    const classSessions = sessions
      .filter(
        (session) =>
          session.classroom === activeClassInfo.id ||
          session.classroom?.id === activeClassInfo.id,
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return classSessions.map((session, index) => {
      const record =
        (session.records || []).find(
          (item) =>
            item.student === currentUser?.id ||
            item.student?.id === currentUser?.id,
        ) ||
        attendances.find(
          (item) =>
            (item.session === session.id ||
              item.session?.id === session.id) &&
            (item.student === currentUser?.id ||
              item.student?.id === currentUser?.id),
        );

      let status = "pending";
      let statusLabel = "در انتظار برگزاری";
      const note = record?.note || "";

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

  // Attendance summary
  const attendanceStats = useMemo(() => {
    const total = activeSessionsData.length;

    const recorded = activeSessionsData.filter(
      (session) => session.status !== "pending",
    );

    const present = activeSessionsData.filter(
      (session) => session.status === "present",
    ).length;

    const absent = activeSessionsData.filter(
      (session) => session.status === "absent",
    ).length;

    const late = activeSessionsData.filter(
      (session) => session.status === "late",
    ).length;

    const excused = activeSessionsData.filter(
      (session) => session.status === "excused",
    ).length;

    const presentPercentage =
      recorded.length > 0
        ? Math.round(
            ((present + late * 0.5 + excused * 0.5) /
              recorded.length) *
              100,
          )
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

  // Exams and grades
  const activeExamsData = useMemo(() => {
    if (!activeClassInfo) return [];

    const classExams = exams.filter(
      (exam) =>
        exam.classroom === activeClassInfo.id ||
        exam.classroom?.id === activeClassInfo.id,
    );

    return classExams.map((exam) => {
      const submission = submissions.find(
        (item) =>
          (item.exam === exam.id || item.exam?.id === exam.id) &&
          (item.student === currentUser?.id ||
            item.student?.id === currentUser?.id),
      );

      const maxScore =
        (exam.questions || []).reduce(
          (acc, question) => acc + (question.max_score || 1),
          0,
        ) ||
        exam.questions?.length ||
        20;

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
      } else {
        const userId = currentUser?.id || "guest";

        const startTimeStr = localStorage.getItem(
          `kish_exam_start_time_${exam.id}_${userId}`,
        );

        if (startTimeStr) {
          const durationMinutes =
            Number(exam.duration_minutes) || 45;

          const durationSeconds = durationMinutes * 60;

          const elapsed = Math.floor(
            (Date.now() - Number(startTimeStr)) / 1000,
          );

          if (elapsed < durationSeconds) {
            status = "in_progress";
            statusLabel = "در حال برگزاری";
            scoreDisplay = "در جریان";
          }
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

  // Exam statistics
  const examStats = useMemo(() => {
    const completed = activeExamsData.filter(
      (exam) => exam.isCompleted,
    );

    const graded = activeExamsData.filter(
      (exam) => exam.status === "graded",
    );

    const totalScore = graded.reduce(
      (sum, exam) => sum + (exam.submission?.total_score || 0),
      0,
    );

    const avgScore =
      graded.length > 0
        ? (totalScore / graded.length).toFixed(1)
        : "-";

    return {
      totalExams: activeExamsData.length,
      completedCount: completed.length,
      gradedCount: graded.length,
      avgScore,
    };
  }, [activeExamsData]);

  const displayedAnnouncements = showAllAnnouncements
    ? visibleAnnouncements
    : visibleAnnouncements.slice(0, 4);

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title="داشبورد من"
      menuType="student"
    >
      <div className="student-panel-page">
        {error && (
          <div className="student-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Announcements Section */}
        <section className="student-announcement-section">
          <div className="student-announcement-header">
            <div className="student-announcement-heading">
              <div className="student-announcement-icon">
                <Megaphone size={22} />
              </div>

              <div>
                <h3>اطلاعیه‌های آموزشگاه</h3>
                <p>آخرین اخبار و اطلاعیه‌های مربوط به کلاس‌ها</p>
              </div>
            </div>

            <div className="student-announcement-count">
              <Bell size={16} />
              <span>
                {toPersianDigits(unreadAnnouncementsCount)} اطلاعیه خوانده‌نشده
              </span>
            </div>
          </div>

          {visibleAnnouncements.length > 0 ? (
            <>
              <div className="student-announcement-list">
                {displayedAnnouncements.map((announcement) => {
                  const isRead = readAnnouncementIds.includes(
                    String(announcement.id),
                  );

                  const isImportant =
                    announcement.priority === "important";

                  return (
                    <article
                      key={announcement.id}
                      className={`student-announcement-item ${
                        isRead ? "is-read" : "is-unread"
                      }`}
                    >
                      <div className="student-announcement-item-top">
                        <div className="student-announcement-badges">
                          {isImportant && (
                            <span className="student-announcement-priority important">
                              مهم
                            </span>
                          )}

                          {!isRead && (
                            <span className="student-announcement-new">
                              جدید
                            </span>
                          )}
                        </div>

                        <span className="student-announcement-date">
                          <Clock3 size={14} />
                          {formatAnnouncementDate(
                            announcement.createdAt,
                          )}
                        </span>
                      </div>

                      <h4>{announcement.title}</h4>

                      <p className="student-announcement-content">
                        {announcement.content}
                      </p>

                      {!isRead && (
                        <button
                          type="button"
                          className="student-announcement-read-button"
                          onClick={() =>
                            markAnnouncementRead(announcement.id)
                          }
                        >
                          <CheckCheck size={16} />
                          علامت‌گذاری به‌عنوان خوانده‌شده
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>

              {visibleAnnouncements.length > 4 && (
                <button
                  type="button"
                  className="student-announcement-show-more"
                  onClick={() =>
                    setShowAllAnnouncements((previous) => !previous)
                  }
                >
                  {showAllAnnouncements
                    ? "نمایش کمتر"
                    : `مشاهده همه اطلاعیه‌ها (${toPersianDigits(
                        visibleAnnouncements.length,
                      )})`}
                  <ChevronLeft
                    size={17}
                    className={
                      showAllAnnouncements ? "is-rotated" : ""
                    }
                  />
                </button>
              )}
            </>
          ) : (
            <div className="student-announcement-empty">
              <Bell size={32} />
              <h4>اطلاعیه‌ای وجود ندارد</h4>
              <p>در حال حاضر اطلاعیه فعالی برای شما ثبت نشده است.</p>
            </div>
          )}
        </section>

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
                  مدرس دوره:{" "}
                  <strong>{activeClassInfo.teacherName}</strong>
                  {" | "}
                  تاریخ شروع:{" "}
                  <strong>
                    {toJalaliDateString(
                      activeClassInfo.created_at?.split("T")[0],
                    )}
                  </strong>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-active-class-box">
            <BookOpen size={36} />
            <h3>در حال حاضر کلاس فعالی برای شما ثبت نشده است</h3>
            <p>
              جهت ثبت‌نام در دوره‌ها یا فعال‌سازی کلاس با واحد آموزش و
              منشی تماس بگیرید.
            </p>
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
            value={`${toPersianDigits(
              attendanceStats.presentPercentage,
            )}٪`}
            hint={`${toPersianDigits(
              attendanceStats.present,
            )} جلسه حاضر از ${toPersianDigits(
              attendanceStats.recorded,
            )}`}
            icon={<CheckCircle2 size={22} />}
            color="green"
          />

          <StatCard
            title="جلسات برگزارشده"
            value={`${toPersianDigits(
              attendanceStats.total,
            )} جلسه`}
            hint={
              attendanceStats.absent > 0
                ? `${toPersianDigits(
                    attendanceStats.absent,
                  )} غیبت ثبت‌شده`
                : "بدون غیبت"
            }
            icon={<CalendarDays size={22} />}
            color="blue"
          />

          <StatCard
            title="میانگین نمرات آزمون‌ها"
            value={
              examStats.avgScore !== "-"
                ? toPersianDigits(examStats.avgScore)
                : "در انتظار نمره"
            }
            hint={`${toPersianDigits(
              examStats.completedCount,
            )} از ${toPersianDigits(
              examStats.totalExams,
            )} آزمون`}
            icon={<Award size={22} />}
            color="orange"
          />
        </div>

        {/* Attendance and Exams */}
        <div className="student-panel-main-grid">
          {/* Attendance */}
          <section className="student-panel-card">
            <div className="student-card-header">
              <div className="header-info">
                <h3>
                  <CalendarDays size={20} />
                  جلسات و وضعیت حضور و غیاب
                </h3>

                <p>
                  مشاهده وضعیت حضور یا غیبت شما در تمامی جلسات کلاس جاری
                </p>
              </div>

              <span className="present-ratio-tag">
                {toPersianDigits(attendanceStats.present)} از{" "}
                {toPersianDigits(attendanceStats.total)} حاضر
              </span>
            </div>

            {loading ? (
              <div className="panel-loading-text">
                در حال دریافت جلسات...
              </div>
            ) : activeSessionsData.length > 0 ? (
              <div className="sessions-attendance-list">
                {activeSessionsData.map((session) => (
                  <div
                    key={session.id}
                    className="session-attendance-row"
                  >
                    <div className="session-number-col">
                      <span className="session-num-badge">
                        جلسه{" "}
                        {toPersianDigits(session.sessionNumber)}
                      </span>

                      <span className="session-date-text">
                        {session.shamsiDate}
                      </span>
                    </div>

                    <div className="session-status-col">
                      <span
                        className={`attendance-status-badge ${session.status}`}
                      >
                        {session.status === "present" && (
                          <CheckCircle2 size={15} />
                        )}

                        {session.status === "absent" && (
                          <XCircle size={15} />
                        )}

                        {session.status === "late" && (
                          <Clock3 size={15} />
                        )}

                        {session.status === "excused" && (
                          <AlertCircle size={15} />
                        )}

                        {session.status === "pending" && (
                          <Clock3 size={15} />
                        )}

                        <span>{session.statusLabel}</span>
                      </span>

                      {session.note && (
                        <span
                          className="session-teacher-note"
                          title={session.note}
                        >
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

          {/* Exams and Grades */}
          <section className="student-panel-card">
            <div className="student-card-header">
              <div className="header-info">
                <h3>
                  <Award size={20} />
                  نمرات و آزمون‌های کلاس
                </h3>

                <p>
                  کارنامه و نتایج امتحانات برگزارشده در کلاس فعال
                </p>
              </div>

              <Link
                to="/panel/student/exams"
                className="view-all-link"
              >
                همه آزمون‌ها
                <ChevronLeft size={16} />
              </Link>
            </div>

            {loading ? (
              <div className="panel-loading-text">
                در حال بارگذاری نمرات...
              </div>
            ) : activeExamsData.length > 0 ? (
              <div className="active-exams-list">
                {activeExamsData.map((exam) => (
                  <div
                    key={exam.id}
                    className="active-exam-item-card"
                  >
                    <div className="exam-main-details">
                      <div className="exam-icon-box">
                        <FileText size={20} />
                      </div>

                      <div>
                        <h4>{exam.title}</h4>

                        <div className="exam-sub-info">
                          <span>
                            تاریخ: {exam.shamsiDate}
                          </span>

                          <span>•</span>

                          <span>
                            {toPersianDigits(
                              exam.questionsCount,
                            )}{" "}
                            سوال
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="exam-action-score-col">
                      <div className="score-badge-box">
                        {exam.status === "graded" ? (
                          <div className="score-final">
                            <span className="score-num">
                              {toPersianDigits(
                                exam.submission?.total_score,
                              )}
                            </span>

                            <span className="score-denom">
                              / {toPersianDigits(exam.maxScore)}
                            </span>
                          </div>
                        ) : exam.status === "pending_grade" ? (
                          <span className="status-pill pending">
                            منتظر تصحیح
                          </span>
                        ) : exam.status === "in_progress" ? (
                          <span className="status-pill in-progress">
                            در حال برگزاری
                          </span>
                        ) : (
                          <span className="status-pill open">
                            شروع نشده
                          </span>
                        )}
                      </div>

                      {exam.isCompleted ? (
                        <Link
                          to={`/panel/student/examresult/${exam.id}`}
                        >
                          <button
                            type="button"
                            className="btn-exam-action review"
                          >
                            <History size={14} />
                            <span>کارنامه</span>
                          </button>
                        </Link>
                      ) : exam.status === "in_progress" ? (
                        <Link to={`/panel/student/exam/${exam.id}`}>
                          <button
                            type="button"
                            className="btn-exam-action resume"
                          >
                            <Play size={14} />
                            <span>ادامه آزمون</span>
                          </button>
                        </Link>
                      ) : (
                        <Link to={`/panel/student/exam/${exam.id}`}>
                          <button
                            type="button"
                            className="btn-exam-action start"
                          >
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
                <p>
                  در حال حاضر آزمونی برای این کلاس تعریف نشده است.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* New Announcement Popup */}
        {activePopupAnnouncement && (
          <div
            className="student-announcement-popup-overlay"
            onClick={() => {
              markAnnouncementRead(activePopupAnnouncement.id);
              setShowAnnouncementPopup(false);
            }}
          >
            <div
              className="student-announcement-popup"
              role="dialog"
              aria-modal="true"
              aria-labelledby="student-announcement-popup-title"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="student-announcement-popup-close"
                aria-label="بستن"
                onClick={() => {
                  markAnnouncementRead(activePopupAnnouncement.id);
                  setShowAnnouncementPopup(false);
                }}
              >
                <X size={20} />
              </button>

              <div className="student-announcement-popup-icon">
                <Megaphone size={28} />
              </div>

              <span
                className={`student-announcement-popup-label ${
                  activePopupAnnouncement.priority === "important"
                    ? "important"
                    : ""
                }`}
              >
                {activePopupAnnouncement.priority === "important"
                  ? "اطلاعیه مهم"
                  : "اطلاعیه جدید"}
              </span>

              <h3 id="student-announcement-popup-title">
                {activePopupAnnouncement.title}
              </h3>

              <p className="student-announcement-popup-content">
                {activePopupAnnouncement.content}
              </p>

              <div className="student-announcement-popup-footer">
                <span>
                  {formatAnnouncementDate(
                    activePopupAnnouncement.createdAt,
                  )}
                </span>

                {recentUnreadAnnouncements.length > 1 && (
                  <span>
                    {toPersianDigits(1)} از{" "}
                    {toPersianDigits(
                      recentUnreadAnnouncements.length,
                    )}{" "}
                    اطلاعیه جدید
                  </span>
                )}
              </div>

              <button
                type="button"
                className="student-announcement-popup-confirm"
                onClick={() => {
                  markAnnouncementRead(activePopupAnnouncement.id);
                  setShowAnnouncementPopup(false);
                }}
              >
                متوجه شدم
                <CheckCheck size={17} />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StudentPanel;
