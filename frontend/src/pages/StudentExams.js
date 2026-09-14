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
  X,
  XCircle,
  Award,
} from "lucide-react";

import "./StudentExams.css";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { Link } from "react-router-dom";
import { api, getFullName, storage } from "../services/api";
import {
  toJalaliDateString,
  toPersianDigits,
} from "../utils/dateUtils";

function StudentExams() {
  const [activeTab, setActiveTab] = useState("active");

  const [exams, setExams] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentTime, setCurrentTime] = useState(new Date());

  const [showTimePopup, setShowTimePopup] = useState(false);
  const [selectedExamForPopup, setSelectedExamForPopup] =
    useState(null);

  const currentUser = storage.getUser();

  /* =====================================================
     تبدیل تاریخ + ساعت آزمون به Date
  ===================================================== */

  const getExamStartDate = (exam) => {
    if (!exam?.date || !exam?.time) {
      return null;
    }

    const rawDate = String(exam.date).trim();
    const rawTime = String(exam.time).trim();

    if (!rawDate || !rawTime) {
      return null;
    }

    let datePart = rawDate;

    if (datePart.includes("T")) {
      datePart = datePart.split("T")[0];
    }

    if (datePart.includes(" ")) {
      datePart = datePart.split(" ")[0];
    }

    const timeMatch = rawTime.match(
      /^(\d{1,2}):(\d{2})/,
    );

    if (!timeMatch) {
      return null;
    }

    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    const dateMatch = datePart.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    );

    if (!dateMatch) {
      return null;
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);

    const result = new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      0,
      0,
    );

    if (Number.isNaN(result.getTime())) {
      return null;
    }

    return result;
  };

  /* =====================================================
     فرمت ساعت
  ===================================================== */

  const formatExamTime = (exam) => {
    if (!exam?.time) {
      return "تعیین نشده";
    }

    const time = String(exam.time).trim();

    const match = time.match(
      /^(\d{1,2}):(\d{2})/,
    );

    if (!match) {
      return toPersianDigits(time);
    }

    const hours = String(match[1]).padStart(2, "0");
    const minutes = match[2];

    return toPersianDigits(
      `${hours}:${minutes}`,
    );
  };

  /* =====================================================
     محاسبه زمان باقی‌مانده
  ===================================================== */

  const getTimeUntilExam = (exam) => {
    const startDate = getExamStartDate(exam);

    if (!startDate) {
      return null;
    }

    const diff =
      startDate.getTime() -
      currentTime.getTime();

    if (diff <= 0) {
      return null;
    }

    const totalMinutes = Math.ceil(
      diff / 60000,
    );

    const days = Math.floor(
      totalMinutes / 1440,
    );

    const hours = Math.floor(
      (totalMinutes % 1440) / 60,
    );

    const minutes =
      totalMinutes % 60;

    return {
      days,
      hours,
      minutes,
      totalMinutes,
    };
  };

  /* =====================================================
     آیا آزمون شروع شده؟
  ===================================================== */

  const hasExamStarted = (exam) => {
    const startDate =
      getExamStartDate(exam);

    /*
     * برای آزمون‌های قدیمی که ساعت ندارند،
     * رفتار قبلی حفظ می‌شود.
     */
    if (!startDate) {
      return true;
    }

    return (
      currentTime.getTime() >=
      startDate.getTime()
    );
  };

  /* =====================================================
     بروزرسانی ساعت
  ===================================================== */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () =>
      clearInterval(timer);
  }, []);

  /* =====================================================
     دریافت اطلاعات
  ===================================================== */

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          examsData,
          classroomsData,
          termsData,
          submissionsData,
        ] = await Promise.all([
          api.exams.list(),
          api.classrooms.list(),
          api.terms.list(),
          api.submissions.list(),
        ]);

        if (!alive) {
          return;
        }

        setExams(examsData || []);
        setClassrooms(
          classroomsData || [],
        );
        setTerms(termsData || []);
        setSubmissions(
          submissionsData || [],
        );
      } catch (err) {
        if (alive) {
          setError(
            err?.message ||
              "دریافت آزمون‌ها ناموفق بود.",
          );
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

  /* =====================================================
     کلاس‌های فعال دانش‌آموز
  ===================================================== */

  const activeClassIds = useMemo(() => {
    const activeTermIds = terms
      .filter((term) => term.is_active)
      .map((term) => term.id);

    const enrolledActive =
      classrooms.filter((classroom) =>
        activeTermIds.includes(
          classroom.term ||
            classroom.term?.id,
        ),
      );

    if (enrolledActive.length > 0) {
      return enrolledActive.map(
        (classroom) => classroom.id,
      );
    }

    return classrooms.map(
      (classroom) => classroom.id,
    );
  }, [terms, classrooms]);

  /* =====================================================
     آماده‌سازی آزمون‌ها
  ===================================================== */

  const examsData = useMemo(
    () =>
      exams
        .filter((exam) =>
          activeClassIds.includes(
            exam.classroom ||
              exam.classroom?.id,
          ),
        )
        .map((exam) => {
          const classroom =
            classrooms.find(
              (item) =>
                item.id ===
                  exam.classroom ||
                item.id ===
                  exam.classroom?.id,
            );

          const submission =
            submissions.find(
              (item) =>
                (
                  item.exam === exam.id ||
                  item.exam?.id === exam.id
                ) &&
                (
                  item.student ===
                    currentUser?.id ||
                  item.student?.id ===
                    currentUser?.id
                ),
            );

          const maxScore =
            (exam.questions || []).reduce(
              (acc, question) =>
                acc +
                (question.max_score || 1),
              0,
            ) || 20;

          const examHasStarted =
            hasExamStarted(exam);

          let status = submission
            ? "completed"
            : "active";

          /* ---------------------------------------------
             آزمون در حال انجام
          --------------------------------------------- */

          if (
            !submission &&
            examHasStarted
          ) {
            const userId =
              currentUser?.id || "guest";

            const startTimeStr =
              localStorage.getItem(
                `kish_exam_start_time_${exam.id}_${userId}`,
              );

            if (startTimeStr) {
              const durMinutes =
                Number(
                  exam.duration_minutes,
                ) || 45;

              const durSeconds =
                durMinutes * 60;

              const elapsed =
                Math.floor(
                  (
                    Date.now() -
                    Number(startTimeStr)
                  ) / 1000,
                );

              if (
                elapsed <
                durSeconds
              ) {
                status = "in_progress";
              }
            }
          }

          /* ---------------------------------------------
             آزمون زمان‌بندی‌شده
          --------------------------------------------- */

          if (
            !submission &&
            !examHasStarted
          ) {
            status = "scheduled";
          }

          return {
            ...exam,

            subject:
              classroom?.name ||
              `کلاس ${exam.classroom}`,

            teacher:
              getFullName(
                classroom?.teacher_detail,
              ) ||
              "استاد آکادمی",

            questionsCount:
              exam.questions?.length ||
              0,

            status,

            isGraded:
              submission?.is_graded,

            maxScore,

            score:
              submission?.total_score !==
                null &&
              submission?.total_score !==
                undefined
                ? `${toPersianDigits(
                    submission.total_score,
                  )} از ${toPersianDigits(
                    maxScore,
                  )}`
                : submission
                  ? "در انتظار تصحیح"
                  : "",

            description:
              `${exam.title} - ${
                classroom?.name ||
                "کلاس"
              }`,

            examStartDate:
              getExamStartDate(exam),

            formattedTime:
              formatExamTime(exam),

            timeUntilExam:
              getTimeUntilExam(exam),
          };
        }),
    [
      exams,
      classrooms,
      submissions,
      activeClassIds,
      currentUser,
      currentTime,
    ],
  );

  /* =====================================================
     آزمون‌های فعال
  ===================================================== */

  const activeExams = useMemo(
    () =>
      examsData.filter(
        (exam) =>
          exam.status === "active" ||
          exam.status === "scheduled" ||
          exam.status === "in_progress",
      ),
    [examsData],
  );

  /* =====================================================
     آزمون‌های تکمیل‌شده
  ===================================================== */

  const completedExams = useMemo(
    () =>
      examsData.filter(
        (exam) =>
          exam.status === "completed",
      ),
    [examsData],
  );

  const currentExams =
    activeTab === "active"
      ? activeExams
      : completedExams;

  /* =====================================================
     کنترل شروع آزمون
  ===================================================== */

  const handleExamStartClick = (
    event,
    exam,
  ) => {
    if (!hasExamStarted(exam)) {
      event.preventDefault();

      setSelectedExamForPopup(exam);
      setShowTimePopup(true);
    }
  };

  /* =====================================================
     بستن Popup
  ===================================================== */

  const closeTimePopup = () => {
    setShowTimePopup(false);
    setSelectedExamForPopup(null);
  };

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title="آزمون‌ها"
      menuType="student"
    >
      <div className="student-exams-page">

        {/* =================================================
            آمار
        ================================================= */}

        <div className="student-exams-stats">
          <StatCard
            title="آزمون‌های فعال"
            value={`${toPersianDigits(
              activeExams.length,
            )} آزمون`}
            icon={<Timer size={22} />}
            color="red"
          />

          <StatCard
            title="کل آزمون‌های کلاس"
            value={`${toPersianDigits(
              examsData.length,
            )} آزمون`}
            icon={
              <FileQuestion size={22} />
            }
            color="blue"
          />

          <StatCard
            title="آزمون‌های داده‌شده"
            value={`${toPersianDigits(
              completedExams.length,
            )} آزمون`}
            icon={
              <CheckCircle2 size={22} />
            }
            color="green"
          />

          <StatCard
            title="آخرین نتیجه"
            value={
              completedExams[0]?.score ||
              "هنوز ثبت نشده"
            }
            icon={<Trophy size={22} />}
            color="orange"
          />
        </div>

        {/* =================================================
            بخش آزمون‌ها
        ================================================= */}

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
                  ? "آزمون‌های کلاس جاری که در زمان تعیین‌شده امکان شرکت در آن‌ها وجود دارد."
                  : "لیست آزمون‌های کلاس فعال که قبلاً در آن‌ها شرکت کرده‌اید."}
              </p>

            </div>
          </div>

          {/* =================================================
              Tabs
          ================================================= */}

          <div className="student-exams-tabs">

            <button
              type="button"
              className={`student-exams-tab ${
                activeTab === "active"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("active")
              }
            >
              <Timer size={17} />

              آزمون‌های فعال

              <span>
                {toPersianDigits(
                  activeExams.length,
                )}
              </span>
            </button>

            <button
              type="button"
              className={`student-exams-tab ${
                activeTab === "completed"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab("completed")
              }
            >
              <CheckCircle2 size={17} />

              آزمون‌های داده‌شده

              <span>
                {toPersianDigits(
                  completedExams.length,
                )}
              </span>
            </button>

          </div>

          {/* =================================================
              Loading / Error / Content
          ================================================= */}

          {loading ? (
            <div className="student-exams-empty">
              <strong>
                در حال دریافت آزمون‌ها...
              </strong>
            </div>
          ) : error ? (
            <div className="student-exams-empty">
              <XCircle size={30} />

              <strong>
                {error}
              </strong>
            </div>
          ) : currentExams.length > 0 ? (

            <div className="student-exams-grid">

              {currentExams.map((exam) => {
                const timeUntil =
                  exam.timeUntilExam;

                return (
                  <article
                    className="student-exams-card"
                    key={exam.id}
                  >

                    {/* =================================================
                        Card Top
                    ================================================= */}

                    <div className="student-exams-card-top">

                      <div className="student-exams-card-subject">
                        {exam.subject}
                      </div>

                      {exam.status ===
                      "in_progress" ? (
                        <span className="student-exams-status in-progress">
                          <span className="student-exams-status-dot in-progress" />
                          در حال برگزاری
                        </span>
                      ) : exam.status ===
                        "scheduled" ? (
                        <span className="student-exams-status active">
                          <span className="student-exams-status-dot" />
                          زمان‌بندی‌شده
                        </span>
                      ) : exam.status ===
                        "active" ? (
                        <span className="student-exams-status active">
                          <span className="student-exams-status-dot" />
                          آماده شروع
                        </span>
                      ) : (
                        <span className="student-exams-status completed">
                          <CheckCircle2
                            size={13}
                          />
                          انجام شده
                        </span>
                      )}

                    </div>

                    {/* =================================================
                        Title
                    ================================================= */}

                    <div className="student-exams-card-title">

                      <div className="student-exams-card-icon">
                        <FileQuestion
                          size={21}
                        />
                      </div>

                      <div>
                        <h3>
                          {exam.title}
                        </h3>

                        <p>
                          {exam.description}
                        </p>
                      </div>

                    </div>

                    {/* =================================================
                        Teacher
                    ================================================= */}

                    <div className="student-exams-teacher">

                      <UserRound size={15} />

                      <span>
                        مدرس:
                      </span>

                      <strong>
                        {exam.teacher}
                      </strong>

                    </div>

                    {/* =================================================
                        Details
                    ================================================= */}

                    <div className="student-exams-details">

                      {/* تعداد سؤال */}

                      <div className="student-exams-detail">
                        <FileQuestion
                          size={15}
                        />

                        <div>
                          <span>
                            تعداد سوال
                          </span>

                          <strong>
                            {toPersianDigits(
                              exam.questionsCount,
                            )}{" "}
                            سوال
                          </strong>
                        </div>
                      </div>

                      {/* مدت زمان */}

                      <div className="student-exams-detail">
                        <Timer size={15} />

                        <div>
                          <span>
                            مدت زمان
                          </span>

                          <strong>
                            {toPersianDigits(
                              exam.duration_minutes ||
                                45,
                            )}{" "}
                            دقیقه
                          </strong>
                        </div>
                      </div>

                      {/* بارم */}

                      <div className="student-exams-detail">
                        <Award size={15} />

                        <div>
                          <span>
                            بارم کل
                          </span>

                          <strong>
                            {toPersianDigits(
                              exam.maxScore,
                            )}{" "}
                            نمره
                          </strong>
                        </div>
                      </div>

                      {/* تاریخ */}

                      <div className="student-exams-detail">
                        <CalendarDays
                          size={15}
                        />

                        <div>
                          <span>
                            تاریخ برگزاری
                          </span>

                          <strong>
                            {toJalaliDateString(
                              exam.date,
                            )}
                          </strong>
                        </div>
                      </div>

                      {/* =================================================
                          ساعت شروع آزمون
                      ================================================= */}

                      <div className="student-exams-detail student-exams-detail-time">

                        <Clock3 size={15} />

                        <div>
                          <span>
                            ساعت شروع
                          </span>

                          <strong
                            className="student-exams-time-value"
                            dir="ltr"
                          >
                            {exam.formattedTime}
                          </strong>
                        </div>

                      </div>

                      {/* وضعیت */}

                      <div className="student-exams-detail">
                        <CheckCircle2
                          size={15}
                        />

                        <div>
                          <span>
                            وضعیت
                          </span>

                          <strong>
                            {exam.status ===
                            "in_progress"
                              ? "در حال برگزاری"
                              : exam.status ===
                                "scheduled"
                                ? "زمان شروع نرسیده"
                                : exam.status ===
                                  "active"
                                  ? "آماده شروع"
                                  : exam.isGraded
                                    ? "تصحیح نهایی"
                                    : "منتظر نمره"}
                          </strong>
                        </div>

                      </div>

                    </div>

                    {/* =================================================
                        Countdown
                    ================================================= */}

                    {exam.status ===
                      "scheduled" &&
                      timeUntil && (

                        <div className="student-exams-countdown">

                          <div className="student-exams-countdown-icon">
                            <Timer size={19} />
                          </div>

                          <div className="student-exams-countdown-content">

                            <span>
                              زمان باقی‌مانده
                            </span>

                            <strong>
                              {timeUntil.days >
                              0
                                ? `${toPersianDigits(
                                    timeUntil.days,
                                  )} روز و `
                                : ""}

                              {timeUntil.hours >
                              0
                                ? `${toPersianDigits(
                                    timeUntil.hours,
                                  )} ساعت و `
                                : ""}

                              {toPersianDigits(
                                timeUntil.minutes,
                              )}{" "}
                              دقیقه
                            </strong>

                          </div>

                        </div>
                      )}

                    {/* =================================================
                        Result
                    ================================================= */}

                    {exam.status ===
                      "completed" && (

                      <div className="student-exams-result">

                        <div className="student-exams-result-icon">
                          <Trophy size={17} />
                        </div>

                        <div>
                          <span>
                            نتیجه آزمون
                          </span>

                          <strong>
                            {exam.score}
                          </strong>
                        </div>

                      </div>
                    )}

                    {/* =================================================
                        Footer
                    ================================================= */}

                    <div className="student-exams-card-footer">

                      {/* در حال برگزاری */}

                      {exam.status ===
                      "in_progress" ? (

                        <Link
                          to={`/panel/student/exam/${exam.id}`}
                          onClick={(event) =>
                            handleExamStartClick(
                              event,
                              exam,
                            )
                          }
                          className="student-exams-action-link"
                        >
                          <button
                            type="button"
                            className="student-exams-start-btn student-exams-continue-btn"
                          >
                            <Play size={17} />
                            ادامه آزمون
                          </button>
                        </Link>

                      ) : exam.status ===
                        "active" ? (

                        /* آماده شروع */

                        <Link
                          to={`/panel/student/exam/${exam.id}`}
                          onClick={(event) =>
                            handleExamStartClick(
                              event,
                              exam,
                            )
                          }
                          className="student-exams-action-link"
                        >
                          <button
                            type="button"
                            className="student-exams-start-btn"
                          >
                            <Play size={17} />
                            شروع آزمون
                          </button>
                        </Link>

                      ) : exam.status ===
                        "scheduled" ? (

                        /* هنوز زمان نرسیده */

                        <button
                          type="button"
                          className="student-exams-start-btn student-exams-scheduled-btn"
                          onClick={(event) =>
                            handleExamStartClick(
                              event,
                              exam,
                            )
                          }
                        >
                          <Clock3 size={17} />
                          هنوز زمان آزمون نرسیده
                        </button>

                      ) : (

                        /* تکمیل‌شده */

                        <Link
                          to={`/panel/student/examresult/${exam.id}`}
                          className="student-exams-action-link"
                        >
                          <button
                            type="button"
                            className="student-exams-review-btn"
                          >
                            <History size={16} />
                            مشاهده کارنامه و
                            پاسخ‌برگ
                          </button>
                        </Link>

                      )}

                    </div>

                  </article>
                );
              })}

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

      {/* =====================================================
          Popup زمان نرسیده
      ===================================================== */}

      {showTimePopup &&
        selectedExamForPopup && (

          <div
            className="student-exams-time-popup-overlay"
            onClick={closeTimePopup}
          >

            <div
              className="student-exams-time-popup"
              onClick={(event) =>
                event.stopPropagation()
              }
              role="dialog"
              aria-modal="true"
              aria-labelledby="student-exam-time-popup-title"
            >

              {/* بستن */}

              <button
                type="button"
                className="student-exams-time-popup-close"
                onClick={closeTimePopup}
                aria-label="بستن"
              >
                <X size={19} />
              </button>

              {/* آیکون */}

              <div className="student-exams-time-popup-icon">
                <Clock3 size={32} />
              </div>

              {/* محتوا */}

              <div className="student-exams-time-popup-content">

                <h3 id="student-exam-time-popup-title">
                  زمان امتحان نرسیده است
                </h3>

                <p>
                  هنوز زمان شروع آزمون
                  <strong>
                    {" "}
                    {selectedExamForPopup.title}
                  </strong>{" "}
                  فرا نرسیده است.
                </p>

              </div>

              {/* ساعت */}

              <div className="student-exams-time-popup-time-box">

                <span>
                  ساعت شروع آزمون
                </span>

                <strong dir="ltr">
                  {formatExamTime(
                    selectedExamForPopup,
                  )}
                </strong>

              </div>

              {/* تاریخ */}

              <div className="student-exams-time-popup-date-box">

                <CalendarDays size={17} />

                <span>
                  {toJalaliDateString(
                    selectedExamForPopup.date,
                  )}
                </span>

              </div>

              {/* توضیح */}

              <p className="student-exams-time-popup-hint">
                لطفاً در زمان تعیین‌شده وارد
                آزمون شوید. با رسیدن زمان شروع،
                امکان ورود به آزمون برای شما
                فعال خواهد شد.
              </p>

              {/* دکمه */}

              <button
                type="button"
                className="student-exams-time-popup-button"
                onClick={closeTimePopup}
              >
                متوجه شدم
              </button>

            </div>

          </div>
        )}

    </DashboardLayout>
  );
}

export default StudentExams;