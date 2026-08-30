import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock3,
  Users,
  Eye,
  AlertCircle,
  Award,
  X,
  BookOpen,
  Info,
  Check,
  Layers,
  Sparkles,
  CalendarDays,
  GraduationCap,
  ClipboardCheck,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { api, getFullName } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

import "./SecretaryExams.css";

export default function SecretaryExams() {
  const location = useLocation();

  const isSecretary = location.pathname.includes("/secretary");
  const roleTitle = isSecretary ? "پنل منشی" : "پنل مدیریت";
  const menuType = isSecretary ? "secretary" : "admin";

  const [exams, setExams] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     FILTERS
  ========================= */

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  /* =========================
     MODALS
  ========================= */

  const [inspectedExam, setInspectedExam] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  /* =========================
     LOAD DATA
  ========================= */

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

        if (!alive) return;

        const allTerms = termsData || [];

        setExams(examsData || []);
        setClassrooms(classroomsData || []);
        setTerms(allTerms);
        setSubmissions(submissionsData || []);

        const activeTerm = allTerms.find((term) => term.is_active);

        if (activeTerm) {
          setSelectedTermId(String(activeTerm.id));
        } else if (allTerms.length > 0) {
          setSelectedTermId(String(allTerms[0].id));
        } else {
          setSelectedTermId("all");
        }
      } catch (err) {
        if (alive) {
          setError(
            err?.message || "خطا در دریافت اطلاعات امتحانات"
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

  /* =========================
     ACTIVE TERM
  ========================= */

  const activeTermObj = useMemo(() => {
    if (selectedTermId === "all") {
      return null;
    }

    return terms.find(
      (term) => String(term.id) === String(selectedTermId)
    );
  }, [terms, selectedTermId]);

  /* =========================
     CLASSROOMS OF TERM
  ========================= */

  const termClassrooms = useMemo(() => {
    if (selectedTermId === "all") {
      return classrooms;
    }

    return classrooms.filter((classroom) => {
      const classroomTermId =
        classroom.term?.id ?? classroom.term;

      return (
        String(classroomTermId) ===
        String(selectedTermId)
      );
    });
  }, [classrooms, selectedTermId]);

  /* =========================
     EXAMS + STATISTICS
  ========================= */

  const examsWithStats = useMemo(() => {
    const termClassIds = termClassrooms.map(
      (classroom) => classroom.id
    );

    return exams
      .filter((exam) => {
        if (selectedTermId === "all") {
          return true;
        }

        const examClassId =
          exam.classroom_detail?.id ??
          exam.classroom;

        return termClassIds.includes(examClassId);
      })
      .map((exam) => {
        const examClassId =
          exam.classroom_detail?.id ??
          exam.classroom;

        const classroom = classrooms.find(
          (classroom) =>
            classroom.id === examClassId
        );

        const examSubmissions = submissions.filter(
          (submission) =>
            submission.exam === exam.id ||
            submission.exam?.id === exam.id
        );

        const gradedSubmissions =
          examSubmissions.filter(
            (submission) =>
              submission.score !== null &&
              submission.score !== undefined
          );

        const pendingSubmissions =
          examSubmissions.filter(
            (submission) =>
              submission.score === null ||
              submission.score === undefined
          );

        let averageScore = "-";

        if (gradedSubmissions.length > 0) {
          const totalScore =
            gradedSubmissions.reduce(
              (sum, submission) =>
                sum + Number(submission.score || 0),
              0
            );

          averageScore = (
            totalScore / gradedSubmissions.length
          ).toFixed(1);
        }

        const enrolledCount =
          classroom?.enrollments?.length ||
          classroom?.student_count ||
          0;

        return {
          ...exam,

          classroomName:
            classroom?.name ||
            "کلاس نامشخص",

          teacherName:
            getFullName(classroom?.teacher_detail) ||
            "استاد نامشخص",

          enrolledCount,

          submissionsCount:
            examSubmissions.length,

          gradedCount:
            gradedSubmissions.length,

          pendingCount:
            pendingSubmissions.length,

          avgScore: averageScore,

          submissionsList: examSubmissions,
        };
      });
  }, [
    exams,
    termClassrooms,
    selectedTermId,
    classrooms,
    submissions,
  ]);

  /* =========================
     FILTERED EXAMS
  ========================= */

  const filteredExams = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    return examsWithStats.filter((exam) => {
      const title =
        String(exam.title || "").toLowerCase();

      const classroom =
        String(
          exam.classroomName || ""
        ).toLowerCase();

      const teacher =
        String(
          exam.teacherName || ""
        ).toLowerCase();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        classroom.includes(query) ||
        teacher.includes(query);

      const examClassId =
        exam.classroom_detail?.id ??
        exam.classroom;

      const matchesClass =
        selectedClass === "all" ||
        String(examClassId) ===
          String(selectedClass);

      let matchesStatus = true;

      if (statusFilter === "pending") {
        matchesStatus =
          exam.pendingCount > 0;
      }

      if (statusFilter === "graded") {
        matchesStatus =
          exam.submissionsCount > 0 &&
          exam.pendingCount === 0;
      }

      if (statusFilter === "no_subs") {
        matchesStatus =
          exam.submissionsCount === 0;
      }

      return (
        matchesSearch &&
        matchesClass &&
        matchesStatus
      );
    });
  }, [
    examsWithStats,
    searchTerm,
    selectedClass,
    statusFilter,
  ]);

  /* =========================
     OVERALL STATISTICS
  ========================= */

  const stats = useMemo(() => {
    const totalExams =
      examsWithStats.length;

    const totalSubmissions =
      examsWithStats.reduce(
        (total, exam) =>
          total + exam.submissionsCount,
        0
      );

    const totalGraded =
      examsWithStats.reduce(
        (total, exam) =>
          total + exam.gradedCount,
        0
      );

    const totalPending =
      examsWithStats.reduce(
        (total, exam) =>
          total + exam.pendingCount,
        0
      );

    return {
      totalExams,
      totalSubmissions,
      totalGraded,
      totalPending,
    };
  }, [examsWithStats]);

  /* =========================
     EXAM STATUS
  ========================= */

  const getExamStatus = (exam) => {
    if (exam.submissionsCount === 0) {
      return {
        type: "no-subs",
        label: "بدون پاسخ‌برگ",
      };
    }

    if (exam.pendingCount === 0) {
      return {
        type: "graded",
        label: "تصحیح شده",
      };
    }

    return {
      type: "pending",
      label: `${toPersianDigits(
        exam.pendingCount
      )} برگه در انتظار نمره`,
    };
  };

  /* =========================
     OPEN / CLOSE MODALS
  ========================= */

  const openExamSubmissions = (exam) => {
    setInspectedExam(exam);
  };

  const closeExamSubmissions = () => {
    setSelectedSubmission(null);
    setInspectedExam(null);
  };

  const openSubmission = (submission) => {
    setSelectedSubmission(submission);
  };

  const closeSubmission = () => {
    setSelectedSubmission(null);
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <DashboardLayout
      role={roleTitle}
      title="نظارت بر امتحانات"
      menuType={menuType}
    >
      <div className="secretary-exams-page-container">

        {/* =========================================
            TERM HEADER
        ========================================= */}

        <section className="term-selector-banner">
          <div className="term-banner-info">

            <div className="term-icon-circle">
              <Layers size={22} />
            </div>

            <div className="term-banner-text">
              <h3>
                ترم تحصیلی انتخابی:{" "}
                <span className="term-highlight-text">
                  {activeTermObj
                    ? activeTermObj.name
                    : selectedTermId === "all"
                    ? "همه ترم‌ها"
                    : "ترم نامشخص"}
                </span>
              </h3>

              <p>
                {activeTermObj?.is_active
                  ? "آزمون‌ها و نتایج مربوط به ترم فعال جاری در حال نمایش است."
                  : activeTermObj
                  ? "آزمون‌ها و نتایج مربوط به این ترم بایگانی‌شده در حال نمایش است."
                  : "نمایش آزمون‌های تمامی دوره‌ها"}
              </p>
            </div>
          </div>

          <div className="term-dropdown-wrapper">

            <label htmlFor="term-select">
              انتخاب ترم
            </label>

            <select
              id="term-select"
              value={selectedTermId}
              onChange={(event) =>
                setSelectedTermId(
                  event.target.value
                )
              }
              className="term-select-input"
            >
              {terms.map((term) => (
                <option
                  key={term.id}
                  value={term.id}
                >
                  {term.name}{" "}
                  {term.is_active
                    ? "(ترم فعال جاری)"
                    : "(به پایان رسیده)"}
                </option>
              ))}

              <option value="all">
                همه ترم‌ها (مشاهده کامل)
              </option>
            </select>
          </div>
        </section>

        {/* =========================================
            ERROR
        ========================================= */}

        {error && (
          <div className="secretary-exams-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================
            STATS
        ========================================= */}

        <div className="secretary-exams-stats-grid">

          <StatCard
            title="آزمون‌های ترم"
            value={`${toPersianDigits(
              stats.totalExams
            )} آزمون`}
            hint={
              activeTermObj?.name ||
              "ترم انتخابی"
            }
            icon={<FileText size={22} />}
            color="red"
          />

          <StatCard
            title="پاسخ‌برگ‌های دریافتی"
            value={`${toPersianDigits(
              stats.totalSubmissions
            )} برگه`}
            hint="تحویل داده شده"
            icon={<Users size={22} />}
            color="blue"
          />

          <StatCard
            title="برگه‌های تصحیح‌شده"
            value={`${toPersianDigits(
              stats.totalGraded
            )} برگه`}
            hint="نمره‌دهی قطعی"
            icon={<CheckCircle2 size={22} />}
            color="green"
          />

          <StatCard
            title="در انتظار تصحیح استاد"
            value={`${toPersianDigits(
              stats.totalPending
            )} برگه`}
            hint="نیازمند نمره مدرس"
            icon={<Clock3 size={22} />}
            color="orange"
          />

        </div>

        {/* =========================================
            MAIN SECTION
        ========================================= */}

        <section className="secretary-exams-main-section">

          <div className="secretary-exams-section-header">

            <div className="secretary-exams-heading">

              <h3 className="secretary-exams-section-title">
                لیست آزمون‌های{" "}
                {activeTermObj
                  ? `«${activeTermObj.name}»`
                  : "آموزشگاه"}
              </h3>

              <p className="secretary-exams-section-desc">
                نظارت بر روند برگزاری امتحانات،
                تعداد پاسخ‌برگ‌ها و نمرات ثبت‌شده
                توسط مدرسین
              </p>

            </div>

            <div className="exams-count-badge">
              {toPersianDigits(
                filteredExams.length
              )} آزمون
            </div>

          </div>

          {/* =========================================
              FILTERS
          ========================================= */}

          <div className="secretary-exams-filters-row">

            <div className="exams-search-wrapper">

              <Search
                size={18}
                className="exams-search-icon"
              />

              <input
                type="text"
                placeholder="جستجو بر اساس عنوان آزمون، کلاس یا مدرس..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                className="exams-search-input"
              />

              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  aria-label="پاک کردن جستجو"
                >
                  <X size={15} />
                </button>
              )}

            </div>

            <div className="exams-select-wrapper">

              <BookOpen
                size={16}
                className="exams-filter-icon"
              />

              <select
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(
                    event.target.value
                  )
                }
                className="exams-select"
              >
                <option value="all">
                  همه کلاس‌های ترم
                </option>

                {termClassrooms.map(
                  (classroom) => (
                    <option
                      key={classroom.id}
                      value={classroom.id}
                    >
                      {classroom.name}
                    </option>
                  )
                )}
              </select>

            </div>

            <div className="exams-select-wrapper">

              <Filter
                size={16}
                className="exams-filter-icon"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="exams-select"
              >
                <option value="all">
                  همه وضعیت‌ها
                </option>

                <option value="pending">
                  دارای برگه منتظر تصحیح
                </option>

                <option value="graded">
                  کاملاً تصحیح‌شده
                </option>

                <option value="no_subs">
                  بدون شرکت‌کننده
                </option>
              </select>

            </div>

          </div>

          {/* =========================================
              LOADING
          ========================================= */}

          {loading ? (
            <div className="exams-loading-state">

              <div className="exams-loading-spinner" />

              <span>
                در حال دریافت اطلاعات آزمون‌ها...
              </span>

            </div>
          ) : filteredExams.length > 0 ? (

            <>
              {/* =====================================
                  DESKTOP TABLE
              ===================================== */}

              <div className="secretary-exams-desktop-table">

                <div className="secretary-exams-table-wrapper">

                  <table className="secretary-exams-table">

                    <thead>
                      <tr>
                        <th>عنوان آزمون</th>
                        <th>کلاس مربوطه</th>
                        <th>مدرس دوره</th>
                        <th>تاریخ برگزاری</th>
                        <th>بارم کل</th>
                        <th>نسبت تحویل</th>
                        <th>میانگین نمرات</th>
                        <th>وضعیت تصحیح</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredExams.map(
                        (exam) => {
                          const status =
                            getExamStatus(
                              exam
                            );

                          return (
                            <tr key={exam.id}>

                              <td>
                                <div className="exam-title-cell">

                                  <div className="exam-icon-circle">
                                    <FileText size={18} />
                                  </div>

                                  <div className="exam-title-content">

                                    <strong>
                                      {exam.title}
                                    </strong>

                                    <small>
                                      {toPersianDigits(
                                        exam.questions
                                          ?.length || 0
                                      )}{" "}
                                      سوال
                                    </small>

                                  </div>
                                </div>
                              </td>

                              <td>
                                <span className="class-tag-badge">
                                  {exam.classroomName}
                                </span>
                              </td>

                              <td>
                                <strong className="teacher-name-text">
                                  {exam.teacherName}
                                </strong>
                              </td>

                              <td>
                                <span className="shamsi-date-pill">
                                  {toJalaliDateString(
                                    exam.date
                                  )}
                                </span>
                              </td>

                              <td>
                                <span className="max-score-badge">
                                  {toPersianDigits(
                                    exam.maxScore
                                  )}{" "}
                                  نمره
                                </span>
                              </td>

                              <td>
                                <div className="submissions-ratio-cell">

                                  <strong className="subs-active">
                                    {toPersianDigits(
                                      exam.submissionsCount
                                    )}
                                  </strong>

                                  <span>
                                    /{" "}
                                    {toPersianDigits(
                                      exam.enrolledCount
                                    )}{" "}
                                    نفر
                                  </span>

                                </div>
                              </td>

                              <td>
                                <strong className="avg-score-text">
                                  {exam.avgScore !==
                                  "-"
                                    ? toPersianDigits(
                                        exam.avgScore
                                      )
                                    : "-"}
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={`exam-status-pill ${status.type}`}
                                >
                                  {status.label}
                                </span>
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="exam-action-btn view"
                                  onClick={() =>
                                    openExamSubmissions(
                                      exam
                                    )
                                  }
                                >
                                  <Eye size={15} />
                                  <span>
                                    مشاهده برگه‌ها
                                  </span>
                                </button>
                              </td>

                            </tr>
                          );
                        }
                      )}
                    </tbody>

                  </table>

                </div>

              </div>

              {/* =====================================
                  MOBILE CARDS
              ===================================== */}

              <div className="secretary-exams-mobile-list">

                {filteredExams.map((exam) => {
                  const status =
                    getExamStatus(exam);

                  return (
                    <article
                      className="exam-mobile-card"
                      key={exam.id}
                    >

                      {/* Card Header */}

                      <div className="exam-mobile-card-header">

                        <div className="exam-mobile-title-area">

                          <div className="exam-mobile-icon">
                            <FileText size={19} />
                          </div>

                          <div className="exam-mobile-title">

                            <h4>
                              {exam.title}
                            </h4>

                            <span>
                              {toPersianDigits(
                                exam.questions
                                  ?.length || 0
                              )}{" "}
                              سوال
                            </span>

                          </div>

                        </div>

                        <span
                          className={`exam-status-pill ${status.type}`}
                        >
                          {status.label}
                        </span>

                      </div>

                      {/* Card Info */}

                      <div className="exam-mobile-info-grid">

                        <div className="exam-mobile-info-item">

                          <span>
                            <GraduationCap size={15} />
                            کلاس
                          </span>

                          <strong>
                            {exam.classroomName}
                          </strong>

                        </div>

                        <div className="exam-mobile-info-item">

                          <span>
                            <Users size={15} />
                            مدرس
                          </span>

                          <strong>
                            {exam.teacherName}
                          </strong>

                        </div>

                        <div className="exam-mobile-info-item">

                          <span>
                            <CalendarDays size={15} />
                            تاریخ
                          </span>

                          <strong>
                            {toJalaliDateString(
                              exam.date
                            )}
                          </strong>

                        </div>

                        <div className="exam-mobile-info-item">

                          <span>
                            <Award size={15} />
                            بارم
                          </span>

                          <strong>
                            {toPersianDigits(
                              exam.maxScore
                            )}{" "}
                            نمره
                          </strong>

                        </div>

                      </div>

                      {/* Statistics */}

                      <div className="exam-mobile-stats">

                        <div className="exam-mobile-stat">

                          <span>
                            پاسخ‌برگ
                          </span>

                          <strong>
                            {toPersianDigits(
                              exam.submissionsCount
                            )}
                            <small>
                              {" "}
                              /{" "}
                              {toPersianDigits(
                                exam.enrolledCount
                              )}
                            </small>
                          </strong>

                        </div>

                        <div className="exam-mobile-stat">

                          <span>
                            میانگین
                          </span>

                          <strong>
                            {exam.avgScore !==
                            "-"
                              ? toPersianDigits(
                                  exam.avgScore
                                )
                              : "-"}
                          </strong>

                        </div>

                        <div className="exam-mobile-stat">

                          <span>
                            تصحیح‌شده
                          </span>

                          <strong>
                            {toPersianDigits(
                              exam.gradedCount
                            )}
                          </strong>

                        </div>

                      </div>

                      {/* Action */}

                      <button
                        type="button"
                        className="exam-mobile-action"
                        onClick={() =>
                          openExamSubmissions(
                            exam
                          )
                        }
                      >
                        <Eye size={17} />
                        <span>
                          مشاهده پاسخ‌برگ‌ها
                        </span>
                      </button>

                    </article>
                  );
                })}

              </div>
            </>
          ) : (

            /* =====================================
               EMPTY
            ===================================== */

            <div className="exams-empty-state">

              <div className="exams-empty-icon">
                <ClipboardCheck size={38} />
              </div>

              <h4>
                آزمونی در این ترم یافت نشد
              </h4>

              <p>
                در حال حاضر برای این ترم
                آزمونی تعریف نشده است.
              </p>

            </div>
          )}

        </section>

        {/* =========================================
            MODAL 1 — SUBMISSIONS
        ========================================= */}

        {inspectedExam && (
          <div
            className="exam-modal-backdrop"
            onClick={closeExamSubmissions}
          >

            <div
              className="exam-modal-container"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* Header */}

              <div className="exam-modal-header">

                <div className="modal-header-info">

                  <div className="exam-modal-icon-badge">
                    <Award size={22} />
                  </div>

                  <div>

                    <h4>
                      پاسخ‌برگ‌های آزمون «
                      {inspectedExam.title}
                      »
                    </h4>

                    <p>
                      کلاس:{" "}
                      <strong>
                        {inspectedExam.classroomName}
                      </strong>

                      <span className="modal-separator">
                        |
                      </span>

                      مدرس:{" "}
                      <strong>
                        {inspectedExam.teacherName}
                      </strong>

                      <span className="modal-separator">
                        |
                      </span>

                      بارم کل:{" "}
                      <strong>
                        {toPersianDigits(
                          inspectedExam.maxScore
                        )}{" "}
                        نمره
                      </strong>
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={closeExamSubmissions}
                  aria-label="بستن"
                >
                  <X size={20} />
                </button>

              </div>

              {/* Body */}

              <div className="exam-modal-body">

                {inspectedExam
                  .submissionsList
                  ?.length > 0 ? (

                  <>

                    {/* Desktop */}

                    <div className="secretary-exams-desktop-table">

                      <div className="secretary-exams-table-wrapper">

                        <table className="secretary-exams-table modal-table">

                          <thead>
                            <tr>
                              <th>
                                نام دانش‌آموز
                              </th>
                              <th>
                                شماره کاربری
                              </th>
                              <th>
                                زمان تحویل
                              </th>
                              <th>
                                نمره ثبت‌شده
                              </th>
                              <th>
                                وضعیت تصحیح
                              </th>
                              <th>
                                بررسی برگه
                              </th>
                            </tr>
                          </thead>

                          <tbody>

                            {inspectedExam.submissionsList.map(
                              (submission) => {
                                const student =
                                  submission.student_detail;

                                const hasScore =
                                  submission.score !==
                                    null &&
                                  submission.score !==
                                    undefined;

                                return (
                                  <tr
                                    key={
                                      submission.id
                                    }
                                  >

                                    <td>
                                      <strong>
                                        {getFullName(
                                          student
                                        )}
                                      </strong>
                                    </td>

                                    <td>
                                      <span className="user-code-tag">
                                        {
                                          student?.username
                                        }
                                      </span>
                                    </td>

                                    <td>
                                      <span className="shamsi-date-pill">
                                        {submission.submitted_at
                                          ? toJalaliDateString(
                                              submission.submitted_at
                                            )
                                          : "نامشخص"}
                                      </span>
                                    </td>

                                    <td>
                                      {hasScore ? (
                                        <strong className="score-highlight">
                                          {toPersianDigits(
                                            submission.score
                                          )}{" "}
                                          از{" "}
                                          {toPersianDigits(
                                            inspectedExam.maxScore
                                          )}
                                        </strong>
                                      ) : (
                                        <span className="no-score-tag">
                                          ثبت نشده
                                        </span>
                                      )}
                                    </td>

                                    <td>
                                      {hasScore ? (
                                        <span className="exam-status-pill graded">
                                          <Check size={13} />
                                          نمره داده شد
                                        </span>
                                      ) : (
                                        <span className="exam-status-pill pending">
                                          <Clock3 size={13} />
                                          منتظر تصحیح استاد
                                        </span>
                                      )}
                                    </td>

                                    <td>
                                      <button
                                        type="button"
                                        className="exam-action-btn view"
                                        onClick={() =>
                                          openSubmission(
                                            submission
                                          )
                                        }
                                      >
                                        <Eye size={14} />
                                        <span>
                                          بررسی پاسخ‌ها
                                        </span>
                                      </button>
                                    </td>

                                  </tr>
                                );
                              }
                            )}

                          </tbody>

                        </table>

                      </div>

                    </div>

                    {/* Mobile */}

                    <div className="submissions-mobile-list">

                      {inspectedExam.submissionsList.map(
                        (submission) => {
                          const student =
                            submission.student_detail;

                          const hasScore =
                            submission.score !==
                              null &&
                            submission.score !==
                              undefined;

                          return (
                            <article
                              className="submission-mobile-card"
                              key={
                                submission.id
                              }
                            >

                              <div className="submission-mobile-header">

                                <div className="submission-student-avatar">
                                  <Users size={18} />
                                </div>

                                <div>

                                  <strong>
                                    {getFullName(
                                      student
                                    )}
                                  </strong>

                                  <span>
                                    {
                                      student?.username
                                    }
                                  </span>

                                </div>

                              </div>

                              <div className="submission-mobile-details">

                                <div>
                                  <span>
                                    زمان تحویل
                                  </span>

                                  <strong>
                                    {submission.submitted_at
                                      ? toJalaliDateString(
                                          submission.submitted_at
                                        )
                                      : "نامشخص"}
                                  </strong>
                                </div>

                                <div>
                                  <span>
                                    نمره
                                  </span>

                                  <strong className="score-highlight">
                                    {hasScore
                                      ? `${toPersianDigits(
                                          submission.score
                                        )} از ${toPersianDigits(
                                          inspectedExam.maxScore
                                        )}`
                                      : "ثبت نشده"}
                                  </strong>
                                </div>

                              </div>

                              <div className="submission-mobile-status">

                                {hasScore ? (
                                  <span className="exam-status-pill graded">
                                    <Check size={13} />
                                    نمره داده شد
                                  </span>
                                ) : (
                                  <span className="exam-status-pill pending">
                                    <Clock3 size={13} />
                                    منتظر تصحیح استاد
                                  </span>
                                )}

                              </div>

                              <button
                                type="button"
                                className="exam-mobile-action"
                                onClick={() =>
                                  openSubmission(
                                    submission
                                  )
                                }
                              >
                                <Eye size={16} />
                                بررسی پاسخ‌ها
                              </button>

                            </article>
                          );
                        }
                      )}

                    </div>

                  </>
                ) : (

                  <div className="exams-empty-state">

                    <div className="exams-empty-icon">
                      <Users size={34} />
                    </div>

                    <h4>
                      هیچ پاسخ‌برگی تحویل داده نشده است
                    </h4>

                    <p>
                      دانش‌آموزان هنوز در این آزمون
                      شرکت نکرده‌اند.
                    </p>

                  </div>
                )}

              </div>

              {/* Footer */}

              <div className="exam-modal-footer">

                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={closeExamSubmissions}
                >
                  بستن پنجره
                </button>

              </div>

            </div>
          </div>
        )}

        {/* =========================================
            MODAL 2 — ANSWER SHEET
        ========================================= */}

        {selectedSubmission &&
          inspectedExam && (
            <div
              className="exam-modal-backdrop sub-modal"
              onClick={closeSubmission}
            >

              <div
                className="exam-modal-container large"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >

                {/* Header */}

                <div className="exam-modal-header">

                  <div className="modal-header-info">

                    <div
                      className="exam-modal-icon-badge"
                      style={{
                        background:
                          "linear-gradient(135deg, #3578c8, #205493)",
                      }}
                    >
                      <Info size={22} />
                    </div>

                    <div>

                      <h4>
                        پاسخ‌برگ:{" "}
                        {getFullName(
                          selectedSubmission.student_detail
                        )}{" "}
                        (
                        {
                          selectedSubmission
                            .student_detail
                            ?.username
                        }
                        )
                      </h4>

                      <p>
                        آزمون:{" "}
                        <strong>
                          {inspectedExam.title}
                        </strong>

                        <span className="modal-separator">
                          |
                        </span>

                        نمره نهایی:{" "}
                        <strong>
                          {selectedSubmission.score !==
                            null &&
                          selectedSubmission.score !==
                            undefined
                            ? `${toPersianDigits(
                                selectedSubmission.score
                              )} از ${toPersianDigits(
                                inspectedExam.maxScore
                              )}`
                            : "هنوز نمره‌دهی نشده"}
                        </strong>
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={closeSubmission}
                    aria-label="بستن"
                  >
                    <X size={20} />
                  </button>

                </div>

                {/* Body */}

                <div className="exam-modal-body modal-scrollable">

                  {/* Feedback */}

                  {selectedSubmission.feedback && (
                    <div className="submission-feedback-box">

                      <strong>
                        <Sparkles size={16} />
                        توضیحات و بازخورد استاد:
                      </strong>

                      <p>
                        {selectedSubmission.feedback}
                      </p>

                    </div>
                  )}

                  {/* Questions */}

                  <div className="submission-questions-list">

                    {(inspectedExam.questions ||
                      []).map(
                      (question, index) => {
                        const studentAnswer =
                          selectedSubmission
                            .answers?.[
                            question.id
                          ];

                        const hasAnswer =
                          studentAnswer !==
                            undefined &&
                          studentAnswer !==
                            null &&
                          studentAnswer !== "";

                        return (
                          <article
                            key={
                              question.id ||
                              index
                            }
                            className="submission-q-card"
                          >

                            <div className="submission-q-header">

                              <span className="q-number-pill">
                                سوال{" "}
                                {toPersianDigits(
                                  index + 1
                                )}
                              </span>

                              <span className="q-score-tag">
                                بارم:{" "}
                                {toPersianDigits(
                                  question.score ||
                                    1
                                )}{" "}
                                نمره
                              </span>

                            </div>

                            <p className="submission-q-text">
                              {question.text}
                            </p>

                            <div className="student-ans-block">

                              <span className="ans-label">
                                پاسخ ثبت‌شده دانش‌آموز:
                              </span>

                              <div className="ans-content-box">

                                {hasAnswer ? (
                                  question.type ===
                                  "multiple_choice" ? (
                                    <strong>
                                      گزینه انتخابی:{" "}
                                      {
                                        studentAnswer
                                      }
                                    </strong>
                                  ) : (
                                    <p>
                                      {
                                        studentAnswer
                                      }
                                    </p>
                                  )
                                ) : (
                                  <span className="empty-answer">
                                    پاسخی ثبت نشده است
                                    (سفید)
                                  </span>
                                )}

                              </div>

                            </div>

                          </article>
                        );
                      }
                    )}

                  </div>

                </div>

                {/* Footer */}

                <div className="exam-modal-footer">

                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={closeSubmission}
                  >
                    بازگشت به لیست برگه‌ها
                  </button>

                </div>

              </div>

            </div>
          )}

      </div>
    </DashboardLayout>
  );
}