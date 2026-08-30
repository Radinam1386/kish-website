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

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

import "./TeacherExams.css";

export default function TeacherExams() {
  const [exams, setExams] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal 1: Inspected Exam & Class Roster
  const [inspectedExam, setInspectedExam] = useState(null);
  const [rosterTab, setRosterTab] = useState("all"); // 'all', 'submitted', 'missing'

  // Modal 2: Grading / Editing Student Answer Sheet
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [questionScores, setQuestionScores] = useState({});
  const [savingGrade, setSavingGrade] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [examsData, classroomsData, termsData, submissionsData, usersData] =
        await Promise.all([
          api.exams.list(),
          api.classrooms.list(),
          api.terms.list(),
          api.submissions.list(),
          api.users.list(),
        ]);

      const activeTermIds = (termsData || []).filter((t) => t.is_active).map((t) => t.id);
      const activeClasses = (classroomsData || []).filter(
        (c) => activeTermIds.length === 0 || activeTermIds.includes(c.term || c.term?.id),
      );
      const activeClassIds = activeClasses.map((c) => c.id);
      const activeExams = (examsData || []).filter((e) =>
        activeClassIds.includes(e.classroom || e.classroom?.id),
      );

      setExams(activeExams || []);
      setClassrooms(activeClasses || []);
      setSubmissions(submissionsData || []);
      setUsers(usersData || []);
    } catch (err) {
      setError(err.message || "خطا در دریافت اطلاعات امتحانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter exams belonging to this teacher
  const teacherExams = useMemo(() => {
    return exams.map((exam) => {
      const cls = classrooms.find(
        (c) => c.id === exam.classroom || c.id === exam.classroom?.id,
      );
      const examSubs = submissions.filter(
        (s) => s.exam === exam.id || s.exam?.id === exam.id,
      );
      const gradedSubs = examSubs.filter((s) => s.is_graded);
      const pendingSubs = examSubs.filter((s) => !s.is_graded);

      const totalScore = gradedSubs.reduce(
        (sum, s) => sum + (s.total_score || 0),
        0,
      );
      const avgScore =
        gradedSubs.length > 0 ? (totalScore / gradedSubs.length).toFixed(1) : "-";

      const maxExamScore =
        (exam.questions || []).reduce(
          (sum, q) => sum + (q.max_score || 1),
          0,
        ) || exam.questions?.length || 20;

      // Extract all enrolled students in this classroom
      const enrolledStudents = (cls?.enrollments || []).map((enr) => {
        const studentId = enr.student || enr.student?.id;
        const studentDetail =
          enr.student_detail || users.find((u) => u.id === studentId);
        const sub = examSubs.find(
          (s) => s.student === studentId || s.student?.id === studentId,
        );

        return {
          id: studentId,
          studentDetail,
          hasSubmitted: Boolean(sub),
          submission: sub,
        };
      });

      return {
        ...exam,
        classroomName: cls?.name || `کلاس ${exam.classroom}`,
        enrolledCount: enrolledStudents.length || cls?.student_count || 0,
        enrolledStudents,
        submissionsCount: examSubs.length,
        gradedCount: gradedSubs.length,
        pendingCount: pendingSubs.length,
        avgScore,
        maxScore: maxExamScore,
        submissionsList: examSubs,
      };
    });
  }, [exams, classrooms, submissions, users]);

  const filteredExams = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return teacherExams.filter((exam) => {
      const matchSearch =
        !q ||
        exam.title?.toLowerCase().includes(q) ||
        exam.classroomName?.toLowerCase().includes(q);

      const matchClass =
        selectedClass === "all" ||
        String(exam.classroom) === String(selectedClass) ||
        String(exam.classroom?.id) === String(selectedClass);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "graded" &&
          exam.pendingCount === 0 &&
          exam.submissionsCount > 0) ||
        (statusFilter === "pending" && exam.pendingCount > 0) ||
        (statusFilter === "no_subs" && exam.submissionsCount === 0);

      return matchSearch && matchClass && matchStatus;
    });
  }, [teacherExams, searchTerm, selectedClass, statusFilter]);

  const stats = useMemo(() => {
    const totalExams = teacherExams.length;
    const totalSubmissions = teacherExams.reduce(
      (sum, e) => sum + e.submissionsCount,
      0,
    );
    const totalGraded = teacherExams.reduce(
      (sum, e) => sum + e.gradedCount,
      0,
    );
    const totalPending = totalSubmissions - totalGraded;

    return { totalExams, totalSubmissions, totalGraded, totalPending };
  }, [teacherExams]);

  // Open grading modal for a submission
  const openGradingModal = (submission, examDetails) => {
    const initialScores = {};

    (examDetails?.questions || []).forEach((q) => {
      const ans = (submission.answers || []).find(
        (a) => a.question === q.id || a.question?.id === q.id,
      );

      if (ans) {
        if (ans.score !== null && ans.score !== undefined) {
          initialScores[ans.id] = ans.score;
        } else if (q.question_type === "multiple_choice") {
          const choice = (q.choices || []).find(
            (c) => c.id === ans.selected_choice || c.id === ans.selected_choice?.id,
          );
          initialScores[ans.id] =
            choice && choice.is_correct ? q.max_score || 1 : 0;
        } else {
          initialScores[ans.id] = "";
        }
      }
    });

    setQuestionScores(initialScores);
    setGradingSubmission({ ...submission, examDetails });
  };

  // Calculate live total score in grading modal
  const liveTotalScore = useMemo(() => {
    if (!gradingSubmission) return 0;
    return Object.values(questionScores).reduce((sum, val) => {
      const num = parseFloat(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [questionScores, gradingSubmission]);

  // Save / Update grades
  const handleSaveGrades = async () => {
    if (!gradingSubmission) return;

    setSavingGrade(true);
    try {
      const answers = gradingSubmission.answers || [];

      // Save each answer's score
      await Promise.all(
        answers.map((ans) => {
          const scoreVal = questionScores[ans.id];
          const parsedScore =
            scoreVal === "" || scoreVal === undefined || scoreVal === null
              ? 0
              : parseFloat(scoreVal);

          return api.answers.update(ans.id, {
            score: isNaN(parsedScore) ? 0 : parsedScore,
          });
        }),
      );

      // Trigger recalculation on submission
      await api.submissions.grade(gradingSubmission.id);

      setSuccessMsg("نمرات و تصحیح برگه با موفقیت ذخیره و ثبت گردید.");
      setTimeout(() => setSuccessMsg(""), 4000);

      // Close modal and reload data
      setGradingSubmission(null);
      await loadData();
    } catch (err) {
      alert(err.message || "خطا در ثبت نمرات");
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <DashboardLayout role="پنل استاد" title="مدیریت و تصحیح امتحانات" menuType="teacher">
      <div className="teacher-exams-page-container">
        {/* Banner */}
        <div className="teacher-exams-banner">
          <div className="banner-icon">
            <Award size={26} />
          </div>
          <div>
            <h3>میز تصحیح و نظارت بر آزمون‌های کلاسی</h3>
            <p>
              بررسی برگه‌های تحویل‌شده، نمره‌دهی به سوالات تشریحی، ویرایش نمرات و مشاهده
              لیست دانش‌آموزانی که هنوز آزمون نداده‌اند.
            </p>
          </div>
          <Link to="/panel/teacher/create-exam" style={{ marginRight: "auto" }}>
            <AnimatedButton variant="primary" icon={<Plus size={18} />}>
              طراحی آزمون جدید
            </AnimatedButton>
          </Link>
        </div>

        {successMsg && (
          <div className="teacher-exams-alert success">
            <Sparkles size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="teacher-exams-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="teacher-exams-stats-grid">
          <StatCard
            title="کل آزمون‌های شما"
            value={`${toPersianDigits(stats.totalExams)} آزمون`}
            icon={<FileText size={22} />}
            color="red"
          />
          <StatCard
            title="پاسخ‌برگ‌های دریافتی"
            value={`${toPersianDigits(stats.totalSubmissions)} برگه`}
            icon={<Users size={22} />}
            color="blue"
          />
          <StatCard
            title="برگه‌های تصحیح‌شده"
            value={`${toPersianDigits(stats.totalGraded)} برگه`}
            icon={<CheckCircle2 size={22} />}
            color="green"
          />
          <StatCard
            title="در انتظار تصحیح شما"
            value={`${toPersianDigits(stats.totalPending)} برگه`}
            icon={<Clock3 size={22} />}
            color="orange"
          />
        </div>

        {/* Main Section Container */}
        <section className="teacher-exams-main-section">
          <div className="teacher-exams-section-header">
            <div className="teacher-exams-heading">
              <h3 className="teacher-exams-section-title">لیست آزمون‌های برگزارشده</h3>
              <p className="teacher-exams-section-desc">
                برای تصحیح و نمره‌دهی برگه‌ها یا بررسی وضعیت شرکت‌کنندگان، روی دکمه «بررسی برگه‌ها و دانش‌آموزان» کلیک کنید.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="teacher-exams-filters-row">
            <div className="exams-search-wrapper">
              <Search size={18} className="exams-search-icon" />
              <input
                type="text"
                placeholder="جستجوی آزمون یا کلاس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="exams-search-input"
              />
            </div>

            <div className="exams-select-wrapper">
              <BookOpen size={16} className="exams-filter-icon" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="exams-select"
              >
                <option value="all">همه کلاس‌های من</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="exams-select-wrapper">
              <Filter size={16} className="exams-filter-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="exams-select"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">دارای برگه منتظر تصحیح</option>
                <option value="graded">کاملاً تصحیح‌شده</option>
                <option value="no_subs">بدون شرکت‌کننده</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "oklch(50% 0 0)" }}>
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
                            <strong>{exam.title}</strong>
                            <small>{toPersianDigits(exam.maxScore)} نمره کل</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="class-tag-badge">{exam.classroomName}</span>
                      </td>

                      <td>
                        <span className="shamsi-date-pill">
                          {exam.created_at ? toJalaliDateString(exam.created_at) : "-"}
                        </span>
                      </td>

                      <td>
                        <span className="questions-count-badge">
                          {toPersianDigits(exam.questions?.length || 0)} سوال
                        </span>
                      </td>

                      <td>
                        <div className="submissions-ratio-cell">
                          <strong className="subs-active">
                            {toPersianDigits(exam.submissionsCount)}
                          </strong>
                          <span>/ {toPersianDigits(exam.enrolledCount)} نفر</span>
                        </div>
                      </td>

                      <td>
                        <strong className="avg-score-text">
                          {exam.avgScore !== "-" ? `${toPersianDigits(exam.avgScore)}` : "-"}
                        </strong>
                      </td>

                      <td>
                        {exam.submissionsCount === 0 ? (
                          <span className="exam-status-pill no-subs">بدون شرکت‌کننده</span>
                        ) : exam.pendingCount === 0 ? (
                          <span className="exam-status-pill graded">تماماً تصحیح‌شده</span>
                        ) : (
                          <span className="exam-status-pill pending">
                            {toPersianDigits(exam.pendingCount)} برگه در انتظار تصحیح
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
                          <span>بررسی برگه‌ها و دانش‌آموزان</span>
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
              <h4>هیچ آزمونی یافت نشد</h4>
              <p>شما می‌توانید با استفاده از دکمه «طراحی آزمون جدید» امتحان جدیدی تعریف کنید.</p>
            </div>
          )}
        </section>

        {/* Modal 1: Exam Roster & Submissions Breakdown */}
        {inspectedExam && (
          <div className="exam-modal-backdrop" onClick={() => setInspectedExam(null)}>
            <div className="exam-modal-container large" onClick={(e) => e.stopPropagation()}>
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="exam-modal-icon-badge">
                    <Award size={22} />
                  </div>
                  <div>
                    <h4>بررسی وضعیت آزمون «{inspectedExam.title}»</h4>
                    <p>
                      کلاس: <strong>{inspectedExam.classroomName}</strong> | بارم کل:{" "}
                      <strong>{toPersianDigits(inspectedExam.maxScore)} نمره</strong> | تحویل:{" "}
                      <strong>
                        {toPersianDigits(inspectedExam.submissionsCount)} از{" "}
                        {toPersianDigits(inspectedExam.enrolledCount)} نفر
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setInspectedExam(null)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Roster Tabs */}
              <div className="modal-roster-tabs">
                <button
                  type="button"
                  className={`roster-tab-btn ${rosterTab === "all" ? "active" : ""}`}
                  onClick={() => setRosterTab("all")}
                >
                  همه دانش‌آموزان کلاس ({toPersianDigits(inspectedExam.enrolledStudents?.length || 0)})
                </button>
                <button
                  type="button"
                  className={`roster-tab-btn ${rosterTab === "submitted" ? "active" : ""}`}
                  onClick={() => setRosterTab("submitted")}
                >
                  تحویل داده‌ها ({toPersianDigits(inspectedExam.submissionsCount)})
                </button>
                <button
                  type="button"
                  className={`roster-tab-btn ${rosterTab === "missing" ? "active" : ""}`}
                  onClick={() => setRosterTab("missing")}
                >
                  هنوز شرکت نکرده‌اند (
                  {toPersianDigits(
                    (inspectedExam.enrolledStudents?.length || 0) - inspectedExam.submissionsCount,
                  )}
                  )
                </button>
              </div>

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
                      {(inspectedExam.enrolledStudents || [])
                        .filter((item) => {
                          if (rosterTab === "submitted") return item.hasSubmitted;
                          if (rosterTab === "missing") return !item.hasSubmitted;
                          return true;
                        })
                        .map((item) => {
                          const student = item.studentDetail;
                          const sub = item.submission;

                          return (
                            <tr key={item.id}>
                              <td>
                                <strong>{getFullName(student)}</strong>
                              </td>
                              <td>
                                <span className="user-code-tag">{student?.username}</span>
                              </td>
                              <td>
                                {item.hasSubmitted ? (
                                  <span className="exam-status-pill graded">
                                    <CheckCircle2 size={13} style={{ marginLeft: "3px" }} />
                                    پاسخ‌برگ ارسال شد
                                  </span>
                                ) : (
                                  <span className="exam-status-pill no-subs">
                                    <UserX size={13} style={{ marginLeft: "3px" }} />
                                    شرکت نکرده
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className="shamsi-date-pill">
                                  {sub?.submitted_at
                                    ? toJalaliDateString(sub.submitted_at)
                                    : "-"}
                                </span>
                              </td>
                              <td>
                                {sub?.is_graded ? (
                                  <strong className="score-highlight">
                                    {toPersianDigits(sub.total_score)} از{" "}
                                    {toPersianDigits(inspectedExam.maxScore)}
                                  </strong>
                                ) : (
                                  <span className="no-score-tag">-</span>
                                )}
                              </td>
                              <td>
                                {!item.hasSubmitted ? (
                                  <span className="no-score-tag">-</span>
                                ) : sub?.is_graded ? (
                                  <span className="exam-status-pill graded">تصحیح شده</span>
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
                                    onClick={() => openGradingModal(sub, inspectedExam)}
                                  >
                                    <Edit3 size={14} />
                                    <span>{sub?.is_graded ? "ویرایش نمره" : "تصحیح و نمره‌دهی"}</span>
                                  </button>
                                ) : (
                                  <span style={{ fontSize: "0.78rem", color: "#95a5a6" }}>
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

              <div className="exam-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setInspectedExam(null)}
                >
                  بستن پنجره
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Grading Student Submission */}
        {gradingSubmission && (
          <div className="exam-modal-backdrop grading-modal" onClick={() => setGradingSubmission(null)}>
            <div className="exam-modal-container large" onClick={(e) => e.stopPropagation()}>
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="exam-modal-icon-badge">
                    <Edit3 size={22} />
                  </div>
                  <div>
                    <h4>
                      تصحیح برگه: {getFullName(gradingSubmission.student_detail)} (
                      {gradingSubmission.student_detail?.username})
                    </h4>
                    <p>
                      آزمون: <strong>{gradingSubmission.examDetails?.title}</strong> | نمره محاسبه‌شده:{" "}
                      <strong style={{ color: "var(--primary)" }}>
                        {toPersianDigits(liveTotalScore)} از{" "}
                        {toPersianDigits(gradingSubmission.examDetails?.maxScore)}
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setGradingSubmission(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="exam-modal-body modal-scrollable">
                <div className="grading-questions-list">
                  {(gradingSubmission.examDetails?.questions || []).map((q, qIdx) => {
                    const ans = (gradingSubmission.answers || []).find(
                      (a) => a.question === q.id || a.question?.id === q.id,
                    );
                    const isMultiple = q.question_type === "multiple_choice";
                    const maxQScore = q.max_score || 1;

                    return (
                      <div key={q.id || qIdx} className="grading-q-card">
                        <div className="grading-q-header">
                          <span className="q-number-pill">سوال {toPersianDigits(qIdx + 1)}</span>
                          <span className="q-type-badge">
                            {isMultiple ? "تستی چهارگزینه‌ای" : "تشریحی"}
                          </span>
                          <span className="q-score-tag">
                            بارم این سوال: {toPersianDigits(maxQScore)} نمره
                          </span>
                        </div>

                        <p className="grading-q-text">{q.text}</p>

                        {/* Student Answer Box */}
                        <div className="student-ans-block">
                          <span className="ans-label">پاسخ ثبت‌شده دانش‌آموز:</span>
                          <div className="ans-content-box">
                            {ans ? (
                              isMultiple ? (
                                <div>
                                  <strong>گزینه انتخابی: </strong>
                                  <span>{ans.selected_choice_text || "گزینه " + ans.selected_choice}</span>
                                </div>
                              ) : (
                                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                                  {ans.text_response || (
                                    <span style={{ color: "#95a5a6", fontStyle: "italic" }}>
                                      پاسخی تایپ نشده است
                                    </span>
                                  )}
                                </p>
                              )
                            ) : (
                              <span style={{ color: "#95a5a6", fontStyle: "italic" }}>
                                پاسخی دریافت نشد
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Teacher Score Input */}
                        {ans && (
                          <div className="teacher-score-input-row">
                            <label>نمره ثبت‌شده برای این سوال:</label>
                            <input
                              type="number"
                              min="0"
                              max={maxQScore}
                              step="0.25"
                              value={questionScores[ans.id] !== undefined ? questionScores[ans.id] : ""}
                              onChange={(e) =>
                                setQuestionScores((prev) => ({
                                  ...prev,
                                  [ans.id]: e.target.value,
                                }))
                              }
                              className="q-score-input"
                              placeholder={`از ${maxQScore}`}
                            />
                            <span style={{ fontSize: "0.82rem", color: "#7f8c8d" }}>
                              (از حداکثر {toPersianDigits(maxQScore)} نمره)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="exam-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setGradingSubmission(null)}
                >
                  انصراف
                </button>

                <AnimatedButton
                  variant="primary"
                  icon={<Save size={18} />}
                  disabled={savingGrade}
                  onClick={handleSaveGrades}
                >
                  {savingGrade
                    ? "در حال ثبت نمرات..."
                    : `ثبت و تایید نمره نهایی (${toPersianDigits(liveTotalScore)} نمره)`}
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
