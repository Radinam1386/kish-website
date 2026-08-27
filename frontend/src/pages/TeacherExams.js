import { useEffect, useMemo, useState } from "react";
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
  Info,
  Check,
  Edit3,
  Save,
  Plus,
  UserX,
  Sparkles,
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

      const [examsData, classroomsData, submissionsData, usersData] =
        await Promise.all([
          api.exams.list(),
          api.classrooms.list(),
          api.submissions.list(),
          api.users.list(),
        ]);

      setExams(examsData || []);
      setClassrooms(classroomsData || []);
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
      await api.submissions.grade(gradingSubmission.id).catch(() => {});

      // Refresh data
      await loadData();

      setSuccessMsg(
        `نمرات برگه دانش‌آموز «${getFullName(
          gradingSubmission.student_detail,
        )}» با موفقیت ذخیره و به‌روزرسانی شد.`,
      );
      setTimeout(() => setSuccessMsg(""), 4000);

      setGradingSubmission(null);
    } catch (err) {
      alert(err.message || "خطا در ثبت نمرات برگه");
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <DashboardLayout role="پنل استاد" title="مدیریت و تصحیح امتحانات" menuType="teacher">
      <div className="teacher-exams-page">
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
            color="blue"
          />
          <StatCard
            title="پاسخ‌برگ‌های دریافتی"
            value={`${toPersianDigits(stats.totalSubmissions)} برگه`}
            icon={<Users size={22} />}
            color="orange"
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
            color="red"
          />
        </div>

        {/* Filters Bar */}
        <div className="teacher-exams-filters-bar">
          <div className="search-field-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="جستجوی آزمون یا کلاس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="select-field-box">
            <BookOpen size={16} />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">همه کلاس‌های من</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="select-field-box">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="pending">دارای برگه منتظر تصحیح</option>
              <option value="graded">کاملاً تصحیح‌شده</option>
              <option value="no_subs">بدون شرکت‌کننده</option>
            </select>
          </div>
        </div>

        {/* Exams Table Card */}
        <div className="teacher-exams-card">
          <div className="card-header">
            <h3>لیست آزمون‌های برگزارشده</h3>
            <span className="count-badge">
              {toPersianDigits(filteredExams.length)} آزمون
            </span>
          </div>

          {loading ? (
            <div className="exams-empty-state">در حال دریافت آزمون‌ها...</div>
          ) : filteredExams.length > 0 ? (
            <div className="table-responsive">
              <table className="teacher-exams-table">
                <thead>
                  <tr>
                    <th>عنوان آزمون</th>
                    <th>کلاس</th>
                    <th>تاریخ (شمسی)</th>
                    <th>تعداد سوالات</th>
                    <th>بارم کل</th>
                    <th>شرکت‌کنندگان</th>
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
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="class-tag-badge">{exam.classroomName}</span>
                      </td>

                      <td>
                        <span className="shamsi-date-pill">
                          {toJalaliDateString(exam.date)}
                        </span>
                      </td>

                      <td>
                        <strong>{toPersianDigits(exam.questions?.length || 0)} سوال</strong>
                      </td>

                      <td>
                        <span className="max-score-badge">
                          {toPersianDigits(exam.maxScore)} نمره
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
                          {exam.avgScore !== "-" ? toPersianDigits(exam.avgScore) : "-"}
                        </strong>
                      </td>

                      <td>
                        {exam.submissionsCount === 0 ? (
                          <span className="exam-status-pill no-subs">بدون شرکت‌کننده</span>
                        ) : exam.pendingCount === 0 ? (
                          <span className="exam-status-pill graded">تصحیح شده</span>
                        ) : (
                          <span className="exam-status-pill pending">
                            {toPersianDigits(exam.pendingCount)} برگه در انتظار تصحیح
                          </span>
                        )}
                      </td>

                      <td>
                        <AnimatedButton
                          size="small"
                          variant="primary"
                          icon={<Edit3 size={15} />}
                          onClick={() => {
                            setInspectedExam(exam);
                            setRosterTab("all");
                          }}
                        >
                          بررسی و نمره‌دهی
                        </AnimatedButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="exams-empty-state">
              <FileText size={36} />
              <p>آزمونی برای نمایش یافت نشد.</p>
            </div>
          )}
        </div>

        {/* Modal 1: Exam Roster & Submissions Management */}
        {inspectedExam && (
          <div className="exam-modal-backdrop" onClick={() => setInspectedExam(null)}>
            <div
              className="exam-modal-container large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="exam-icon-circle">
                    <Award size={22} />
                  </div>
                  <div>
                    <h4>مدیریت شرکت‌کنندگان و تصحیح «{inspectedExam.title}»</h4>
                    <p>
                      کلاس: <strong>{inspectedExam.classroomName}</strong> | بارم کل:{" "}
                      <strong>{toPersianDigits(inspectedExam.maxScore)} نمره</strong> | تاریخ:{" "}
                      <strong>{toJalaliDateString(inspectedExam.date)}</strong>
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

              <div className="exam-modal-body">
                {/* Roster Tabs */}
                <div className="roster-tabs-bar">
                  <button
                    type="button"
                    className={`roster-tab-btn ${rosterTab === "all" ? "active" : ""}`}
                    onClick={() => setRosterTab("all")}
                  >
                    <Users size={16} />
                    <span>کل دانش‌آموزان کلاس</span>
                    <span className="badge">
                      {toPersianDigits(inspectedExam.enrolledStudents.length)}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`roster-tab-btn ${rosterTab === "submitted" ? "active" : ""}`}
                    onClick={() => setRosterTab("submitted")}
                  >
                    <CheckCircle2 size={16} />
                    <span>شرکت کرده‌اند (پاسخ‌برگ)</span>
                    <span className="badge green">
                      {toPersianDigits(inspectedExam.submissionsCount)}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`roster-tab-btn ${rosterTab === "missing" ? "active" : ""}`}
                    onClick={() => setRosterTab("missing")}
                  >
                    <UserX size={16} />
                    <span>هنوز شرکت نکرده‌اند</span>
                    <span className="badge orange">
                      {toPersianDigits(
                        inspectedExam.enrolledStudents.length -
                          inspectedExam.submissionsCount,
                      )}
                    </span>
                  </button>
                </div>

                {/* Roster Table */}
                <div className="table-responsive">
                  <table className="modal-submissions-table">
                    <thead>
                      <tr>
                        <th>دانش‌آموز</th>
                        <th>وضعیت شرکت</th>
                        <th>زمان تحویل</th>
                        <th>نمره کل</th>
                        <th>وضعیت تصحیح</th>
                        <th>اقدام</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectedExam.enrolledStudents
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
                                <div className="student-modal-cell">
                                  <div className="student-avatar-small">
                                    {getFullName(student).charAt(0) || "د"}
                                  </div>
                                  <div>
                                    <strong>{getFullName(student)}</strong>
                                    <small>{student?.username}</small>
                                  </div>
                                </div>
                              </td>

                              <td>
                                {item.hasSubmitted ? (
                                  <span className="roster-status-pill submitted">
                                    <Check size={13} />
                                    شرکت کرده
                                  </span>
                                ) : (
                                  <span className="roster-status-pill missing">
                                    <UserX size={13} />
                                    عدم شرکت
                                  </span>
                                )}
                              </td>

                              <td>
                                {sub ? (
                                  <span className="date-sub-text">
                                    {toJalaliDateString(
                                      sub.submitted_at?.split("T")[0],
                                    )}
                                  </span>
                                ) : (
                                  <span className="date-sub-text muted">-</span>
                                )}
                              </td>

                              <td>
                                {sub ? (
                                  <strong className="score-highlight">
                                    {sub.total_score !== null &&
                                    sub.total_score !== undefined
                                      ? `${toPersianDigits(
                                          sub.total_score,
                                        )} / ${toPersianDigits(
                                          inspectedExam.maxScore,
                                        )}`
                                      : "در انتظار تصحیح"}
                                  </strong>
                                ) : (
                                  <span className="muted">-</span>
                                )}
                              </td>

                              <td>
                                {sub ? (
                                  <span
                                    className={`sub-status-tag ${
                                      sub.is_graded ? "graded" : "pending"
                                    }`}
                                  >
                                    {sub.is_graded
                                      ? "تصحیح نهایی"
                                      : "در انتظار نمره شما"}
                                  </span>
                                ) : (
                                  <span className="muted">-</span>
                                )}
                              </td>

                              <td>
                                {sub ? (
                                  <button
                                    type="button"
                                    className={`grade-action-btn ${
                                      sub.is_graded ? "edit" : "grade"
                                    }`}
                                    onClick={() =>
                                      openGradingModal(sub, inspectedExam)
                                    }
                                  >
                                    <Edit3 size={14} />
                                    <span>
                                      {sub.is_graded
                                        ? "ویرایش نمره"
                                        : "تصحیح و نمره‌دهی"}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="roster-note-text">
                                    پاسخ‌برگی ثبت نشده
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
                <AnimatedButton
                  variant="secondary"
                  onClick={() => setInspectedExam(null)}
                >
                  بستن پنجره
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Grading & Score Editing Modal */}
        {gradingSubmission && (
          <div
            className="exam-modal-backdrop secondary-backdrop"
            onClick={() => setGradingSubmission(null)}
          >
            <div
              className="exam-modal-container answer-sheet-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="student-avatar-small">
                    {getFullName(gradingSubmission.student_detail).charAt(0) ||
                      "د"}
                  </div>
                  <div>
                    <h4>
                      تصحیح و ویرایش نمره:{" "}
                      {getFullName(gradingSubmission.student_detail)}
                    </h4>
                    <p>
                      آزمون:{" "}
                      <strong>{gradingSubmission.examDetails?.title}</strong> |
                      بارم کل:{" "}
                      <strong>
                        {toPersianDigits(
                          gradingSubmission.examDetails?.maxScore,
                        )}{" "}
                        نمره
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="live-score-badge-header">
                  <span>نمره کل محاسبه‌شده:</span>
                  <strong>
                    {toPersianDigits(liveTotalScore)} /{" "}
                    {toPersianDigits(gradingSubmission.examDetails?.maxScore)}
                  </strong>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setGradingSubmission(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="exam-modal-body answer-sheet-body">
                <div className="grading-notice-box">
                  <Info size={16} />
                  <span>
                    برای سوالات تشریحی نمره مورد نظر خود را وارد کنید. برای سوالات
                    تستی نمره بر اساس پاسخ صحیح محاسبه شده اما در صورت نیاز می‌توانید
                    آن را ویرایش نمایید.
                  </span>
                </div>

                <div className="answers-list">
                  {(gradingSubmission.examDetails?.questions || []).map(
                    (q, idx) => {
                      const ans = (gradingSubmission.answers || []).find(
                        (a) => a.question === q.id || a.question?.id === q.id,
                      );
                      const isMultiple = q.question_type === "multiple_choice";
                      const maxQScore = q.max_score || 1;

                      return (
                        <div key={q.id || idx} className="grading-question-card">
                          <div className="question-card-head">
                            <span className="q-number">
                              سوال {toPersianDigits(idx + 1)}
                            </span>
                            <span className="q-type-badge">
                              {isMultiple ? "تستی (چهارگزینه‌ای)" : "تشریحی"}
                            </span>
                            <span className="q-score-badge">
                              بارم: {toPersianDigits(maxQScore)} نمره
                            </span>
                          </div>

                          <p className="q-text">{q.text}</p>

                          {/* Multiple Choice Review */}
                          {isMultiple && (
                            <div className="choices-review-grid">
                              {(q.choices || []).map((choice) => {
                                const isSelected =
                                  ans?.selected_choice === choice.id ||
                                  ans?.selected_choice?.id === choice.id;
                                const isCorrect = choice.is_correct;

                                let choiceClass = "choice-item";
                                if (isSelected && isCorrect)
                                  choiceClass += " correct-selected";
                                else if (isSelected && !isCorrect)
                                  choiceClass += " wrong-selected";
                                else if (isCorrect)
                                  choiceClass += " correct-target";

                                return (
                                  <div key={choice.id} className={choiceClass}>
                                    <div className="choice-indicator">
                                      {isSelected && <Check size={14} />}
                                    </div>
                                    <span className="choice-text">
                                      {choice.text}
                                    </span>
                                    {isCorrect && (
                                      <span className="correct-label">
                                        (پاسخ صحیح)
                                      </span>
                                    )}
                                    {isSelected && (
                                      <span className="user-selected-label">
                                        [پاسخ دانش‌آموز]
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Essay Review */}
                          {!isMultiple && (
                            <div className="essay-review-box">
                              <label>متن پاسخ ثبت‌شده دانش‌آموز:</label>
                              <div className="essay-content">
                                {ans?.essay_text || "بدون پاسخ"}
                              </div>
                            </div>
                          )}

                          {/* Teacher Score Input Row */}
                          <div className="teacher-score-input-row">
                            <div className="score-input-label">
                              <span>نمره این سوال:</span>
                              <small>(حداکثر {toPersianDigits(maxQScore)})</small>
                            </div>

                            {ans ? (
                              <div className="score-input-wrapper">
                                <input
                                  type="number"
                                  min="0"
                                  max={maxQScore}
                                  step="0.25"
                                  value={
                                    questionScores[ans.id] !== undefined
                                      ? questionScores[ans.id]
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setQuestionScores((prev) => ({
                                      ...prev,
                                      [ans.id]: val,
                                    }));
                                  }}
                                  className="score-number-input"
                                  placeholder="0"
                                />
                                <span className="score-denom-text">
                                  / {toPersianDigits(maxQScore)}
                                </span>

                                {/* Quick buttons */}
                                <button
                                  type="button"
                                  className="quick-score-btn"
                                  onClick={() =>
                                    setQuestionScores((prev) => ({
                                      ...prev,
                                      [ans.id]: maxQScore,
                                    }))
                                  }
                                >
                                  نمره کامل
                                </button>
                                <button
                                  type="button"
                                  className="quick-score-btn"
                                  onClick={() =>
                                    setQuestionScores((prev) => ({
                                      ...prev,
                                      [ans.id]: 0,
                                    }))
                                  }
                                >
                                  صفر
                                </button>
                              </div>
                            ) : (
                              <span className="muted">پاسخی ثبت نشده</span>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="exam-modal-footer grading-footer">
                <div className="footer-total-summary">
                  <span>جمع نمرات:</span>
                  <strong>
                    {toPersianDigits(liveTotalScore)} از{" "}
                    {toPersianDigits(gradingSubmission.examDetails?.maxScore)}
                  </strong>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <AnimatedButton
                    variant="secondary"
                    onClick={() => setGradingSubmission(null)}
                  >
                    انصراف
                  </AnimatedButton>

                  <AnimatedButton
                    variant="primary"
                    disabled={savingGrade}
                    onClick={handleSaveGrades}
                    icon={<Save size={16} />}
                  >
                    {savingGrade ? "در حال ثبت نمرات..." : "ثبت و نهایی‌سازی نمره"}
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
