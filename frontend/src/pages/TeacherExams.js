import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock3,
  Users,
  AlertCircle,
  Award,
  X,
  BookOpen,
  Edit3,
  Save,
  Plus,
  UserX,
  Sparkles,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import {
  toJalaliDateString,
  toPersianDigits,
} from "../utils/dateUtils";

import "./TeacherExams.css";

/* =========================================================
   PORTAL
   همه Modal ها مستقیماً داخل body رندر می‌شوند
   تا Sidebar / Dashboard روی آن‌ها اثر نگذارد.
========================================================= */

function ExamModalPortal({ children, type = "default" }) {
  useEffect(() => {
    document.body.classList.add("teacher-exams-modal-open");

    return () => {
      document.body.classList.remove("teacher-exams-modal-open");
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={`teacher-exams-modal-root teacher-exams-modal-root--${type}`}
    >
      {children}
    </div>,
    document.body
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function TeacherExams() {
  /* -------------------------------------------------------
     DATA
  ------------------------------------------------------- */

  const [exams, setExams] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /* -------------------------------------------------------
     FILTERS
  ------------------------------------------------------- */

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  /* -------------------------------------------------------
     EXAM MODAL
  ------------------------------------------------------- */

  const [inspectedExam, setInspectedExam] = useState(null);
  const [rosterTab, setRosterTab] = useState("all");

  /* -------------------------------------------------------
     GRADING MODAL
  ------------------------------------------------------- */

  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [questionScores, setQuestionScores] = useState({});
  const [savingGrade, setSavingGrade] = useState(false);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        examsData,
        classroomsData,
        termsData,
        submissionsData,
        usersData,
      ] = await Promise.all([
        api.exams.list(),
        api.classrooms.list(),
        api.terms.list(),
        api.submissions.list(),
        api.users.list(),
      ]);

      const safeExams = examsData || [];
      const safeClassrooms = classroomsData || [];
      const safeTerms = termsData || [];
      const safeSubmissions = submissionsData || [];
      const safeUsers = usersData || [];

      /* ---------------------------------------------------
         Active Terms
      --------------------------------------------------- */

      const activeTermIds = safeTerms
        .filter((term) => term.is_active)
        .map((term) => term.id);

      /* ---------------------------------------------------
         Active Classrooms
      --------------------------------------------------- */

      const activeClasses = safeClassrooms.filter((classroom) => {
        const classroomTermId =
          typeof classroom.term === "object"
            ? classroom.term?.id
            : classroom.term;

        return (
          activeTermIds.length === 0 ||
          activeTermIds.includes(classroomTermId)
        );
      });

      /* ---------------------------------------------------
         Active Exams
      --------------------------------------------------- */

      const activeClassIds = activeClasses.map(
        (classroom) => classroom.id
      );

      const activeExams = safeExams.filter((exam) => {
        const examClassroomId =
          typeof exam.classroom === "object"
            ? exam.classroom?.id
            : exam.classroom;

        return activeClassIds.includes(examClassroomId);
      });

      setExams(activeExams);
      setClassrooms(activeClasses);
      setSubmissions(safeSubmissions);
      setUsers(safeUsers);
    } catch (err) {
      console.error("TeacherExams load error:", err);

      setError(
        err?.message || "خطا در دریافت اطلاعات امتحانات"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      if (gradingSubmission) {
        setGradingSubmission(null);
        return;
      }

      if (inspectedExam) {
        setInspectedExam(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [gradingSubmission, inspectedExam]);

  /* =======================================================
     PREPARE EXAMS
  ======================================================= */

  const teacherExams = useMemo(() => {
    return exams.map((exam) => {
      /* ---------------------------------------------------
         Find classroom
      --------------------------------------------------- */

      const classroomId =
        typeof exam.classroom === "object"
          ? exam.classroom?.id
          : exam.classroom;

      const classroom = classrooms.find(
        (item) => String(item.id) === String(classroomId)
      );

      /* ---------------------------------------------------
         Exam submissions
      --------------------------------------------------- */

      const examSubs = submissions.filter((submission) => {
        const submissionExamId =
          typeof submission.exam === "object"
            ? submission.exam?.id
            : submission.exam;

        return String(submissionExamId) === String(exam.id);
      });

      const gradedSubs = examSubs.filter(
        (submission) => submission.is_graded
      );

      const pendingSubs = examSubs.filter(
        (submission) => !submission.is_graded
      );

      /* ---------------------------------------------------
         Average score
      --------------------------------------------------- */

      const totalScore = gradedSubs.reduce(
        (sum, submission) =>
          sum + Number(submission.total_score || 0),
        0
      );

      const avgScore =
        gradedSubs.length > 0
          ? (totalScore / gradedSubs.length).toFixed(1)
          : "-";

      /* ---------------------------------------------------
         Max exam score
      --------------------------------------------------- */

      const questions = exam.questions || [];

      const calculatedMaxScore = questions.reduce(
        (sum, question) =>
          sum + Number(question.max_score || 1),
        0
      );

      const maxExamScore =
        calculatedMaxScore ||
        questions.length ||
        20;

      /* ---------------------------------------------------
         Enrolled students
      --------------------------------------------------- */

      const enrolledStudents = (
        classroom?.enrollments || []
      ).map((enrollment) => {
        const studentId =
          typeof enrollment.student === "object"
            ? enrollment.student?.id
            : enrollment.student;

        const studentDetail =
          enrollment.student_detail ||
          users.find(
            (user) =>
              String(user.id) === String(studentId)
          );

        const submission = examSubs.find((item) => {
          const submissionStudentId =
            typeof item.student === "object"
              ? item.student?.id
              : item.student;

          return (
            String(submissionStudentId) ===
            String(studentId)
          );
        });

        return {
          id: studentId,
          studentDetail,
          hasSubmitted: Boolean(submission),
          submission,
        };
      });

      return {
        ...exam,

        classroomName:
          classroom?.name ||
          `کلاس ${classroomId}`,

        enrolledCount:
          enrolledStudents.length ||
          classroom?.student_count ||
          0,

        enrolledStudents,

        submissionsCount: examSubs.length,
        gradedCount: gradedSubs.length,
        pendingCount: pendingSubs.length,

        avgScore,
        maxScore: maxExamScore,

        submissionsList: examSubs,
      };
    });
  }, [
    exams,
    classrooms,
    submissions,
    users,
  ]);

  /* =======================================================
     FILTERED EXAMS
  ======================================================= */

  const filteredExams = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    return teacherExams.filter((exam) => {
      const title =
        exam.title?.toLowerCase() || "";

      const classroomName =
        exam.classroomName?.toLowerCase() || "";

      const matchSearch =
        !query ||
        title.includes(query) ||
        classroomName.includes(query);

      const matchClass =
        selectedClass === "all" ||
        String(exam.classroom) ===
          String(selectedClass) ||
        String(exam.classroom?.id) ===
          String(selectedClass);

      let matchStatus = true;

      if (statusFilter === "graded") {
        matchStatus =
          exam.pendingCount === 0 &&
          exam.submissionsCount > 0;
      }

      if (statusFilter === "pending") {
        matchStatus =
          exam.pendingCount > 0;
      }

      if (statusFilter === "no_subs") {
        matchStatus =
          exam.submissionsCount === 0;
      }

      return (
        matchSearch &&
        matchClass &&
        matchStatus
      );
    });
  }, [
    teacherExams,
    searchTerm,
    selectedClass,
    statusFilter,
  ]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    const totalExams =
      teacherExams.length;

    const totalSubmissions =
      teacherExams.reduce(
        (sum, exam) =>
          sum + exam.submissionsCount,
        0
      );

    const totalGraded =
      teacherExams.reduce(
        (sum, exam) =>
          sum + exam.gradedCount,
        0
      );

    const totalPending =
      totalSubmissions - totalGraded;

    return {
      totalExams,
      totalSubmissions,
      totalGraded,
      totalPending,
    };
  }, [teacherExams]);

  /* =======================================================
     OPEN GRADING MODAL
  ======================================================= */

  const openGradingModal = (
    submission,
    examDetails
  ) => {
    const initialScores = {};

    const questions =
      examDetails?.questions || [];

    const answers =
      submission?.answers || [];

    questions.forEach((question) => {
      const answer = answers.find((item) => {
        const answerQuestionId =
          typeof item.question === "object"
            ? item.question?.id
            : item.question;

        return (
          String(answerQuestionId) ===
          String(question.id)
        );
      });

      if (!answer) return;

      /* ---------------------------------------------------
         Existing score
      --------------------------------------------------- */

      if (
        answer.score !== null &&
        answer.score !== undefined
      ) {
        initialScores[answer.id] =
          answer.score;

        return;
      }

      /* ---------------------------------------------------
         Multiple choice automatic score
      --------------------------------------------------- */

      if (
        question.question_type ===
        "multiple_choice"
      ) {
        const selectedChoiceId =
          typeof answer.selected_choice ===
          "object"
            ? answer.selected_choice?.id
            : answer.selected_choice;

        const choice = (
          question.choices || []
        ).find(
          (item) =>
            String(item.id) ===
            String(selectedChoiceId)
        );

        initialScores[answer.id] =
          choice?.is_correct
            ? Number(question.max_score || 1)
            : 0;

        return;
      }

      /* ---------------------------------------------------
         Essay / descriptive answer
      --------------------------------------------------- */

      initialScores[answer.id] = "";
    });

    setQuestionScores(initialScores);

    setGradingSubmission({
      ...submission,
      examDetails,
    });
  };

  /* =======================================================
     LIVE TOTAL SCORE
  ======================================================= */

  const liveTotalScore = useMemo(() => {
    if (!gradingSubmission) {
      return 0;
    }

    return Object.values(
      questionScores
    ).reduce((sum, value) => {
      const number = parseFloat(value);

      if (Number.isNaN(number)) {
        return sum;
      }

      return sum + number;
    }, 0);
  }, [
    questionScores,
    gradingSubmission,
  ]);

  /* =======================================================
     UPDATE QUESTION SCORE
  ======================================================= */

  const updateQuestionScore = (
    answerId,
    value
  ) => {
    setQuestionScores((previous) => ({
      ...previous,
      [answerId]: value,
    }));
  };

  /* =======================================================
     SAVE GRADES
  ======================================================= */

  const handleSaveGrades = async () => {
    if (!gradingSubmission || savingGrade) {
      return;
    }

    try {
      setSavingGrade(true);

      const answers =
        gradingSubmission.answers || [];

      await Promise.all(
        answers.map((answer) => {
          const scoreValue =
            questionScores[answer.id];

          const parsedScore =
            scoreValue === "" ||
            scoreValue === undefined ||
            scoreValue === null
              ? 0
              : parseFloat(scoreValue);

          return api.answers.update(
            answer.id,
            {
              score: Number.isNaN(parsedScore)
                ? 0
                : parsedScore,
            }
          );
        })
      );

      await api.submissions.grade(
        gradingSubmission.id
      );

      setSuccessMsg(
        "نمرات و تصحیح برگه با موفقیت ذخیره و ثبت گردید."
      );

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);

      setGradingSubmission(null);

      await loadData();
    } catch (err) {
      console.error(
        "Save grades error:",
        err
      );

      setError(
        err?.message ||
          "خطا در ثبت نمرات"
      );
    } finally {
      setSavingGrade(false);
    }
  };

  /* =======================================================
     CLOSE ALL MODALS
  ======================================================= */

  const closeAllModals = () => {
    setGradingSubmission(null);
    setInspectedExam(null);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardLayout
      role="پنل استاد"
      title="مدیریت و تصحیح امتحانات"
      menuType="teacher"
    >
      <div className="teacher-exams-page-container">

        {/* =================================================
            BANNER
        ================================================= */}

        <div className="teacher-exams-banner">
          <div className="banner-icon">
            <Award size={26} />
          </div>

          <div>
            <h3>
              میز تصحیح و نظارت بر آزمون‌های کلاسی
            </h3>

            <p>
              بررسی برگه‌های تحویل‌شده،
              نمره‌دهی به سوالات تشریحی،
              ویرایش نمرات و مشاهده لیست
              دانش‌آموزانی که هنوز آزمون
              نداده‌اند.
            </p>
          </div>

          <Link
            to="/panel/teacher/create-exam"
            style={{ marginRight: "auto" }}
          >
            <AnimatedButton
              variant="primary"
              icon={<Plus size={18} />}
            >
              طراحی آزمون جدید
            </AnimatedButton>
          </Link>
        </div>

        {/* =================================================
            SUCCESS
        ================================================= */}

        {successMsg && (
          <div className="teacher-exams-alert success">
            <Sparkles size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="teacher-exams-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <div className="teacher-exams-stats-grid">
          <StatCard
            title="کل آزمون‌های شما"
            value={`${toPersianDigits(
              stats.totalExams
            )} آزمون`}
            icon={<FileText size={22} />}
            color="red"
          />

          <StatCard
            title="پاسخ‌برگ‌های دریافتی"
            value={`${toPersianDigits(
              stats.totalSubmissions
            )} برگه`}
            icon={<Users size={22} />}
            color="blue"
          />

          <StatCard
            title="برگه‌های تصحیح‌شده"
            value={`${toPersianDigits(
              stats.totalGraded
            )} برگه`}
            icon={<CheckCircle2 size={22} />}
            color="green"
          />

          <StatCard
            title="در انتظار تصحیح شما"
            value={`${toPersianDigits(
              stats.totalPending
            )} برگه`}
            icon={<Clock3 size={22} />}
            color="orange"
          />
        </div>

        {/* =================================================
            MAIN SECTION
        ================================================= */}

        <section className="teacher-exams-main-section">

          <div className="teacher-exams-section-header">
            <div className="teacher-exams-heading">
              <h3 className="teacher-exams-section-title">
                لیست آزمون‌های برگزارشده
              </h3>

              <p className="teacher-exams-section-desc">
                برای تصحیح و نمره‌دهی برگه‌ها
                یا بررسی وضعیت شرکت‌کنندگان،
                روی دکمه «بررسی برگه‌ها و
                دانش‌آموزان» کلیک کنید.
              </p>
            </div>
          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="teacher-exams-filters-row">

            <div className="exams-search-wrapper">
              <Search
                size={18}
                className="exams-search-icon"
              />

              <input
                type="text"
                placeholder="جستجوی آزمون یا کلاس..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                className="exams-search-input"
              />
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
                  همه کلاس‌های من
                </option>

                {classrooms.map((classroom) => (
                  <option
                    key={classroom.id}
                    value={classroom.id}
                  >
                    {classroom.name}
                  </option>
                ))}
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

          {/* =================================================
              TABLE
          ================================================= */}

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "oklch(50% 0 0)",
              }}
            >
              در حال بارگذاری لیست آزمون‌ها...
            </div>
          ) : filteredExams.length > 0 ? (
            <div className="teacher-exams-table-wrapper">

              <table className="teacher-exams-table">

                <thead>
                  <tr>
                    <th>عنوان آزمون</th>
                    <th>کلاس مربوطه</th>
                    <th>تاریخ (شمسی)</th>
                    <th>تعداد سوالات</th>
                    <th>پاسخ‌برگ‌ها</th>
                    <th>میانگین نمرات</th>
                    <th>وضعیت تصحیح</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredExams.map((exam) => (
                    <tr key={exam.id}>

                      <td>
                        <div className="exam-title-cell">

                          <div className="exam-icon-circle">
                            <FileText size={18} />
                          </div>

                          <div>
                            <strong>
                              {exam.title}
                            </strong>

                            <small>
                              {toPersianDigits(
                                exam.maxScore
                              )}{" "}
                              نمره کل
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
                        <span className="shamsi-date-pill">
                          {exam.created_at
                            ? toJalaliDateString(
                                exam.created_at
                              )
                            : "-"}
                        </span>
                      </td>

                      <td>
                        <span className="questions-count-badge">
                          {toPersianDigits(
                            exam.questions?.length ||
                              0
                          )}{" "}
                          سوال
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
                            {" "}
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
                          {exam.avgScore !== "-"
                            ? toPersianDigits(
                                exam.avgScore
                              )
                            : "-"}
                        </strong>
                      </td>

                      <td>
                        {exam.submissionsCount ===
                        0 ? (
                          <span className="exam-status-pill no-subs">
                            بدون شرکت‌کننده
                          </span>
                        ) : exam.pendingCount ===
                          0 ? (
                          <span className="exam-status-pill graded">
                            تماماً تصحیح‌شده
                          </span>
                        ) : (
                          <span className="exam-status-pill pending">
                            {toPersianDigits(
                              exam.pendingCount
                            )}{" "}
                            برگه در انتظار تصحیح
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="exam-action-btn view"
                          onClick={() => {
                            setInspectedExam(exam);
                            setRosterTab("all");
                          }}
                        >
                          <Eye size={15} />

                          <span>
                            بررسی برگه‌ها و دانش‌آموزان
                          </span>
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          ) : (
            <div className="exams-empty-state">
              <FileText size={44} />

              <h4>
                هیچ آزمونی یافت نشد
              </h4>

              <p>
                شما می‌توانید با استفاده از
                دکمه «طراحی آزمون جدید»
                امتحان جدیدی تعریف کنید.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          MODAL 1
          Exam Roster
      ===================================================== */}

      {inspectedExam && (
        <ExamModalPortal type="roster">

          <div
            className="exam-modal-backdrop"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setInspectedExam(null);
              }
            }}
          >

            <div
              className="exam-modal-container large"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="exam-modal-header">

                <div className="modal-header-info">

                  <div className="exam-modal-icon-badge">
                    <Award size={22} />
                  </div>

                  <div>
                    <h4>
                      بررسی وضعیت آزمون «
                      {inspectedExam.title}
                      »
                    </h4>

                    <p>
                      کلاس:{" "}
                      <strong>
                        {inspectedExam.classroomName}
                      </strong>

                      {" | "}

                      بارم کل:{" "}
                      <strong>
                        {toPersianDigits(
                          inspectedExam.maxScore
                        )}{" "}
                        نمره
                      </strong>

                      {" | "}

                      تحویل:{" "}
                      <strong>
                        {toPersianDigits(
                          inspectedExam.submissionsCount
                        )}{" "}
                        از{" "}
                        {toPersianDigits(
                          inspectedExam.enrolledCount
                        )}{" "}
                        نفر
                      </strong>
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() =>
                    setInspectedExam(null)
                  }
                >
                  <X size={20} />
                </button>

              </div>

              {/* TABS */}

              <div className="modal-roster-tabs">

                <button
                  type="button"
                  className={`roster-tab-btn ${
                    rosterTab === "all"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setRosterTab("all")
                  }
                >
                  همه دانش‌آموزان کلاس (
                  {toPersianDigits(
                    inspectedExam
                      .enrolledStudents
                      ?.length || 0
                  )}
                  )
                </button>

                <button
                  type="button"
                  className={`roster-tab-btn ${
                    rosterTab === "submitted"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setRosterTab("submitted")
                  }
                >
                  تحویل داده‌ها (
                  {toPersianDigits(
                    inspectedExam.submissionsCount
                  )}
                  )
                </button>

                <button
                  type="button"
                  className={`roster-tab-btn ${
                    rosterTab === "missing"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setRosterTab("missing")
                  }
                >
                  هنوز شرکت نکرده‌اند (
                  {toPersianDigits(
                    Math.max(
                      0,
                      (inspectedExam
                        .enrolledStudents
                        ?.length || 0) -
                        inspectedExam.submissionsCount
                    )
                  )}
                  )
                </button>

              </div>

              {/* BODY */}

              <div className="exam-modal-body">

                <div className="teacher-exams-table-wrapper">

                  <table className="teacher-exams-table modal-table">

                    <thead>
                      <tr>
                        <th>نام دانش‌آموز</th>
                        <th>نام کاربری</th>
                        <th>وضعیت شرکت</th>
                        <th>زمان تحویل (شمسی)</th>
                        <th>نمره نهایی</th>
                        <th>وضعیت تصحیح</th>
                        <th>عملیات تصحیح</th>
                      </tr>
                    </thead>

                    <tbody>

                      {(
                        inspectedExam.enrolledStudents ||
                        []
                      )
                        .filter((student) => {

                          if (
                            rosterTab ===
                            "submitted"
                          ) {
                            return student.hasSubmitted;
                          }

                          if (
                            rosterTab ===
                            "missing"
                          ) {
                            return !student.hasSubmitted;
                          }

                          return true;
                        })
                        .map((item) => {

                          const student =
                            item.studentDetail;

                          const submission =
                            item.submission;

                          return (
                            <tr
                              key={item.id}
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
                                  {student?.username ||
                                    "-"}
                                </span>
                              </td>

                              <td>
                                {item.hasSubmitted ? (
                                  <span className="exam-status-pill graded">
                                    <CheckCircle2
                                      size={13}
                                    />
                                    پاسخ‌برگ ارسال شد
                                  </span>
                                ) : (
                                  <span className="exam-status-pill no-subs">
                                    <UserX
                                      size={13}
                                    />
                                    شرکت نکرده
                                  </span>
                                )}
                              </td>

                              <td>
                                <span className="shamsi-date-pill">
                                  {submission?.submitted_at
                                    ? toJalaliDateString(
                                        submission.submitted_at
                                      )
                                    : "-"}
                                </span>
                              </td>

                              <td>
                                {submission?.is_graded ? (
                                  <strong className="score-highlight">
                                    {toPersianDigits(
                                      submission.total_score
                                    )}{" "}
                                    از{" "}
                                    {toPersianDigits(
                                      inspectedExam.maxScore
                                    )}
                                  </strong>
                                ) : (
                                  <span className="no-score-tag">
                                    -
                                  </span>
                                )}
                              </td>

                              <td>
                                {!item.hasSubmitted ? (
                                  <span className="no-score-tag">
                                    -
                                  </span>
                                ) : submission?.is_graded ? (
                                  <span className="exam-status-pill graded">
                                    تصحیح شده
                                  </span>
                                ) : (
                                  <span className="exam-status-pill pending">
                                    در انتظار تصحیح
                                  </span>
                                )}
                              </td>

                              <td>
                                {item.hasSubmitted ? (
                                  <button
                                    type="button"
                                    className="exam-action-btn edit"
                                    onClick={() =>
                                      openGradingModal(
                                        submission,
                                        inspectedExam
                                      )
                                    }
                                  >
                                    <Edit3 size={14} />

                                    <span>
                                      {submission?.is_graded
                                        ? "ویرایش نمره"
                                        : "تصحیح و نمره‌دهی"}
                                    </span>
                                  </button>
                                ) : (
                                  <span
                                    style={{
                                      fontSize:
                                        "0.78rem",
                                      color:
                                        "#95a5a6",
                                    }}
                                  >
                                    امکان نمره‌دهی نیست
                                  </span>
                                )}
                              </td>

                            </tr>
                          );
                        })}

                    </tbody>

                  </table>

                </div>

              </div>

              {/* FOOTER */}

              <div className="exam-modal-footer">

                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() =>
                    setInspectedExam(null)
                  }
                >
                  بستن پنجره
                </button>

              </div>

            </div>

          </div>

        </ExamModalPortal>
      )}

      {/* =====================================================
          MODAL 2
          GRADING
          این Modal هم Portal مستقل دارد
          و بالاتر از Modal اول قرار می‌گیرد.
      ===================================================== */}

      {gradingSubmission && (
        <ExamModalPortal type="grading">

          <div
            className="exam-modal-backdrop grading-modal"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setGradingSubmission(null);
              }
            }}
          >

            <div
              className="exam-modal-container large"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="exam-modal-header">

                <div className="modal-header-info">

                  <div className="exam-modal-icon-badge">
                    <Edit3 size={22} />
                  </div>

                  <div>

                    <h4>
                      تصحیح برگه:
                      {getFullName(
                        gradingSubmission.student_detail
                      )}

                      {gradingSubmission
                        .student_detail
                        ?.username && (
                        <>
                          {" "}
                          (
                          {
                            gradingSubmission
                              .student_detail
                              .username
                          }
                          )
                        </>
                      )}
                    </h4>

                    <p>
                      آزمون:{" "}
                      <strong>
                        {
                          gradingSubmission
                            .examDetails?.title
                        }
                      </strong>

                      {" | "}

                      نمره محاسبه‌شده:{" "}

                      <strong className="grading-live-score">
                        {toPersianDigits(
                          liveTotalScore
                        )}{" "}
                        از{" "}
                        {toPersianDigits(
                          gradingSubmission
                            .examDetails
                            ?.maxScore
                        )}
                      </strong>
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() =>
                    setGradingSubmission(null)
                  }
                >
                  <X size={20} />
                </button>

              </div>

              {/* BODY */}

              <div className="exam-modal-body modal-scrollable">

                <div className="grading-questions-list">

                  {(
                    gradingSubmission
                      .examDetails
                      ?.questions || []
                  ).map(
                    (question, index) => {

                      const answer =
                        (
                          gradingSubmission
                            .answers || []
                        ).find((item) => {

                          const questionId =
                            typeof item.question ===
                            "object"
                              ? item.question?.id
                              : item.question;

                          return (
                            String(
                              questionId
                            ) ===
                            String(
                              question.id
                            )
                          );
                        });

                      const isMultiple =
                        question.question_type ===
                        "multiple_choice";

                      const maxQuestionScore =
                        Number(
                          question.max_score || 1
                        );

                      return (
                        <div
                          key={
                            question.id ||
                            index
                          }
                          className="grading-q-card"
                        >

                          {/* QUESTION HEADER */}

                          <div className="grading-q-header">

                            <span className="q-number-pill">
                              سوال{" "}
                              {toPersianDigits(
                                index + 1
                              )}
                            </span>

                            <span className="q-type-badge">
                              {isMultiple
                                ? "تستی چهارگزینه‌ای"
                                : "تشریحی"}
                            </span>

                            <span className="q-score-tag">
                              بارم این سوال:{" "}
                              {toPersianDigits(
                                maxQuestionScore
                              )}{" "}
                              نمره
                            </span>

                          </div>

                          {/* QUESTION */}

                          <p className="grading-q-text">
                            {question.text}
                          </p>

                          {/* ANSWER */}

                          <div className="student-ans-block">

                            <span className="ans-label">
                              پاسخ ثبت‌شده دانش‌آموز:
                            </span>

                            <div className="ans-content-box">

                              {answer ? (

                                isMultiple ? (

                                  <div>
                                    <strong>
                                      گزینه انتخابی:
                                    </strong>{" "}

                                    <span>
                                      {answer.selected_choice_text ||
                                        `گزینه ${
                                          answer.selected_choice ??
                                          "-"
                                        }`}
                                    </span>
                                  </div>

                                ) : (

                                  <p
                                    style={{
                                      margin: 0,
                                      whiteSpace:
                                        "pre-wrap",
                                    }}
                                  >
                                    {answer.text_response ? (
                                      answer.text_response
                                    ) : (
                                      <span
                                        style={{
                                          color:
                                            "#95a5a6",
                                          fontStyle:
                                            "italic",
                                        }}
                                      >
                                        پاسخی تایپ نشده است
                                      </span>
                                    )}
                                  </p>

                                )

                              ) : (

                                <span
                                  style={{
                                    color:
                                      "#95a5a6",
                                    fontStyle:
                                      "italic",
                                  }}
                                >
                                  پاسخی دریافت نشد
                                </span>

                              )}

                            </div>

                          </div>

                          {/* SCORE */}

                          {answer && (
                            <div className="teacher-score-input-row">

                              <label>
                                نمره ثبت‌شده برای این سوال:
                              </label>

                              <input
                                type="number"
                                min="0"
                                max={
                                  maxQuestionScore
                                }
                                step="0.25"
                                value={
                                  questionScores[
                                    answer.id
                                  ] ??
                                  ""
                                }
                                onChange={(event) =>
                                  updateQuestionScore(
                                    answer.id,
                                    event.target.value
                                  )
                                }
                                className="q-score-input"
                                placeholder={`از ${maxQuestionScore}`}
                              />

                              <span
                                style={{
                                  fontSize:
                                    "0.82rem",
                                  color:
                                    "#7f8c8d",
                                }}
                              >
                                (از حداکثر{" "}
                                {toPersianDigits(
                                  maxQuestionScore
                                )}{" "}
                                نمره)
                              </span>

                            </div>
                          )}

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

              {/* FOOTER */}

              <div className="exam-modal-footer">

                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() =>
                    setGradingSubmission(null)
                  }
                  disabled={savingGrade}
                >
                  انصراف
                </button>

                <AnimatedButton
                  variant="primary"
                  icon={
                    <Save size={18} />
                  }
                  disabled={savingGrade}
                  onClick={handleSaveGrades}
                >
                  {savingGrade
                    ? "در حال ثبت نمرات..."
                    : `ثبت و تایید نمره نهایی (${toPersianDigits(
                        liveTotalScore
                      )} نمره)`}
                </AnimatedButton>

              </div>

            </div>

          </div>

        </ExamModalPortal>
      )}

    </DashboardLayout>
  );
}