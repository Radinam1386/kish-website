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
  BarChart3,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
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
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Exam for Submissions Inspection
  const [inspectedExam, setInspectedExam] = useState(null);

  // Selected Submission for Detailed Answer Sheet Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [examsData, classroomsData, submissionsData] = await Promise.all([
          api.exams.list(),
          api.classrooms.list(),
          api.submissions.list(),
        ]);

        if (!alive) return;

        setExams(examsData || []);
        setClassrooms(classroomsData || []);
        setSubmissions(submissionsData || []);
      } catch (err) {
        if (alive) setError(err.message || "خطا در دریافت اطلاعات امتحانات");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const processedExams = useMemo(() => {
    return exams.map((exam) => {
      const cls = classrooms.find((c) => c.id === exam.classroom || c.id === exam.classroom?.id);
      const examSubs = submissions.filter((s) => s.exam === exam.id || s.exam?.id === exam.id);
      const gradedSubs = examSubs.filter((s) => s.is_graded);
      const pendingSubs = examSubs.filter((s) => !s.is_graded);

      const totalScore = examSubs.reduce((sum, s) => sum + (s.total_score || 0), 0);
      const avgScore = gradedSubs.length > 0 ? (totalScore / gradedSubs.length).toFixed(1) : "-";

      const maxExamScore = (exam.questions || []).reduce(
        (sum, q) => sum + (q.max_score || 1),
        0,
      );

      return {
        ...exam,
        classroomName: cls?.name || `کلاس ${exam.classroom}`,
        teacherName: getFullName(cls?.teacher_detail) || "استاد نامشخص",
        enrolledCount: cls?.student_count || cls?.enrollments?.length || 0,
        submissionsCount: examSubs.length,
        gradedCount: gradedSubs.length,
        pendingCount: pendingSubs.length,
        avgScore,
        maxScore: maxExamScore || exam.questions?.length || 0,
        submissionsList: examSubs,
      };
    });
  }, [exams, classrooms, submissions]);

  const filteredExams = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return processedExams.filter((exam) => {
      const matchSearch =
        !q ||
        exam.title?.toLowerCase().includes(q) ||
        exam.classroomName?.toLowerCase().includes(q) ||
        exam.teacherName?.toLowerCase().includes(q);

      const matchClass = selectedClass === "all" || String(exam.classroom) === String(selectedClass);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "graded" && exam.pendingCount === 0 && exam.submissionsCount > 0) ||
        (statusFilter === "pending" && exam.pendingCount > 0) ||
        (statusFilter === "no_subs" && exam.submissionsCount === 0);

      return matchSearch && matchClass && matchStatus;
    });
  }, [processedExams, searchTerm, selectedClass, statusFilter]);

  const stats = useMemo(() => {
    const totalExams = exams.length;
    const totalSubmissions = submissions.length;
    const totalGraded = submissions.filter((s) => s.is_graded).length;
    const totalPending = totalSubmissions - totalGraded;

    return { totalExams, totalSubmissions, totalGraded, totalPending };
  }, [exams, submissions]);

  return (
    <DashboardLayout role={roleTitle} title="نظارت بر امتحانات" menuType={menuType}>
      <div className="secretary-exams-page">
        {/* Banner */}
        <div className="exams-monitoring-banner">
          <div className="banner-icon">
            <BarChart3 size={24} />
          </div>
          <div>
            <h4>داشبورد نظارت بر امتحانات و نمرات</h4>
            <p>
              مشاهده وضعیت برگزاری آزمون‌ها، نمرات ثبت‌شده توسط اساتید و بررسی پاسخ‌برگ‌های
              دانش‌آموزان به صورت نظارتی.
            </p>
          </div>
        </div>

        {error && (
          <div className="exams-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="secretary-exams-stats-grid">
          <StatCard
            title="کل آزمون‌های برگزارشده"
            value={`${toPersianDigits(stats.totalExams)} آزمون`}
            icon={<FileText size={20} />}
            color="blue"
          />
          <StatCard
            title="کل پاسخ‌برگ‌های دریافتی"
            value={`${toPersianDigits(stats.totalSubmissions)} برگه`}
            icon={<Users size={20} />}
            color="orange"
          />
          <StatCard
            title="پاسخ‌برگ‌های تصحیح‌شده"
            value={`${toPersianDigits(stats.totalGraded)} برگه`}
            icon={<CheckCircle2 size={20} />}
            color="green"
          />
          <StatCard
            title="در انتظار تصحیح مدرس"
            value={`${toPersianDigits(stats.totalPending)} برگه`}
            icon={<Clock3 size={20} />}
            color="red"
          />
        </div>

        {/* Filters */}
        <div className="secretary-exams-filters-bar">
          <div className="search-field-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="جستجوی آزمون، نام کلاس یا مدرس..."
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
              <option value="all">همه کلاس‌ها</option>
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
              <option value="graded">کاملاً تصحیح‌شده</option>
              <option value="pending">دارای برگه در انتظار تصحیح</option>
              <option value="no_subs">بدون شرکت‌کننده</option>
            </select>
          </div>
        </div>

        {/* Exams Table */}
        <div className="secretary-exams-card">
          <div className="card-header">
            <h3>لیست آزمون‌های آموزشگاه</h3>
            <span className="count-badge">
              {toPersianDigits(filteredExams.length)} آزمون
            </span>
          </div>

          {loading ? (
            <div className="exams-empty-state">در حال دریافت لیست امتحانات...</div>
          ) : filteredExams.length > 0 ? (
            <div className="table-responsive">
              <table className="exams-table">
                <thead>
                  <tr>
                    <th>عنوان آزمون</th>
                    <th>کلاس</th>
                    <th>مدرس</th>
                    <th>تاریخ (شمسی)</th>
                    <th>تعداد سوال</th>
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
                            <small>بارم کل: {toPersianDigits(exam.maxScore)} نمره</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="class-tag-badge">{exam.classroomName}</span>
                      </td>

                      <td>
                        <span className="teacher-name-tag">{exam.teacherName}</span>
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
                        <div className="submissions-count-cell">
                          <strong>{toPersianDigits(exam.submissionsCount)}</strong>
                          <span>/ {toPersianDigits(exam.enrolledCount)} نفر</span>
                        </div>
                      </td>

                      <td>
                        <span className="avg-score-badge">
                          {exam.avgScore !== "-" ? toPersianDigits(exam.avgScore) : "-"}
                        </span>
                      </td>

                      <td>
                        {exam.submissionsCount === 0 ? (
                          <span className="exam-status-pill no-subs">بدون شرکت‌کننده</span>
                        ) : exam.pendingCount === 0 ? (
                          <span className="exam-status-pill graded">تصحیح شده</span>
                        ) : (
                          <span className="exam-status-pill pending">
                            {toPersianDigits(exam.pendingCount)} برگه منتظر تصحیح
                          </span>
                        )}
                      </td>

                      <td>
                        <AnimatedButton
                          size="small"
                          variant="primary"
                          icon={<Eye size={15} />}
                          onClick={() => setInspectedExam(exam)}
                        >
                          نظارت بر نتایج
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
              <p>آزمونی با این مشخصات یافت نشد.</p>
            </div>
          )}
        </div>

        {/* Modal 1: Inspected Exam Submissions List */}
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
                    <h4>نتایج و پاسخ‌برگ‌های «{inspectedExam.title}»</h4>
                    <p>
                      کلاس: <strong>{inspectedExam.classroomName}</strong> | مدرس:{" "}
                      <strong>{inspectedExam.teacherName}</strong> | تاریخ:{" "}
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
                {/* Quick stats row in modal */}
                <div className="modal-stats-bar">
                  <div className="modal-stat-box">
                    <span>کل برگه‌ها</span>
                    <strong>{toPersianDigits(inspectedExam.submissionsCount)}</strong>
                  </div>
                  <div className="modal-stat-box">
                    <span>تصحیح شده</span>
                    <strong>{toPersianDigits(inspectedExam.gradedCount)}</strong>
                  </div>
                  <div className="modal-stat-box">
                    <span>در انتظار تصحیح</span>
                    <strong>{toPersianDigits(inspectedExam.pendingCount)}</strong>
                  </div>
                  <div className="modal-stat-box">
                    <span>میانگین نمرات</span>
                    <strong>{toPersianDigits(inspectedExam.avgScore)}</strong>
                  </div>
                </div>

                {/* Submissions List Table */}
                {inspectedExam.submissionsList.length > 0 ? (
                  <div className="table-responsive">
                    <table className="modal-submissions-table">
                      <thead>
                        <tr>
                          <th>دانش‌آموز</th>
                          <th>زمان تحویل (شمسی)</th>
                          <th>نمره کل</th>
                          <th>وضعیت تصحیح</th>
                          <th>پاسخ‌برگ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectedExam.submissionsList.map((sub) => (
                          <tr key={sub.id}>
                            <td>
                              <div className="student-modal-cell">
                                <div className="student-avatar-small">
                                  {getFullName(sub.student_detail).charAt(0) || "د"}
                                </div>
                                <div>
                                  <strong>{getFullName(sub.student_detail)}</strong>
                                  <small>{sub.student_detail?.username}</small>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className="date-sub-text">
                                {toJalaliDateString(sub.submitted_at?.split("T")[0])}
                              </span>
                            </td>

                            <td>
                              <strong className="score-highlight">
                                {sub.total_score !== null && sub.total_score !== undefined
                                  ? `${toPersianDigits(sub.total_score)} / ${toPersianDigits(
                                      inspectedExam.maxScore,
                                    )}`
                                  : "ثبت نشده"}
                              </strong>
                            </td>

                            <td>
                              <span
                                className={`sub-status-tag ${
                                  sub.is_graded ? "graded" : "pending"
                                }`}
                              >
                                {sub.is_graded ? "تصحیح نهایی" : "منتظر نمره معلم"}
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="view-answers-btn"
                                onClick={() => setSelectedSubmission({ ...sub, examDetails: inspectedExam })}
                              >
                                <Eye size={14} />
                                <span>مشاهده برگه</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-modal-state">
                    <Users size={32} />
                    <p>هنوز دانش‌آموزی در این آزمون شرکت نکرده است.</p>
                  </div>
                )}
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

        {/* Modal 2: Student Detailed Answer Sheet (پاسخ‌برگ تشریحی و تستی) */}
        {selectedSubmission && (
          <div
            className="exam-modal-backdrop secondary-backdrop"
            onClick={() => setSelectedSubmission(null)}
          >
            <div
              className="exam-modal-container answer-sheet-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="student-avatar-small">
                    {getFullName(selectedSubmission.student_detail).charAt(0) || "د"}
                  </div>
                  <div>
                    <h4>
                      پاسخ‌برگ {getFullName(selectedSubmission.student_detail)}
                    </h4>
                    <p>
                      آزمون: <strong>{selectedSubmission.examDetails?.title}</strong> |
                      نمره کل:{" "}
                      <strong>
                        {selectedSubmission.total_score !== null &&
                        selectedSubmission.total_score !== undefined
                          ? toPersianDigits(selectedSubmission.total_score)
                          : "در انتظار تصحیح"}
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedSubmission(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="exam-modal-body answer-sheet-body">
                <div className="sheet-monitoring-notice">
                  <Info size={16} />
                  <span>
                    این صفحه صرفاً جهت نظارت منشی بر پاسخ‌های ارسال‌شده دانش‌آموز و نمرات
                    معلم می‌باشد.
                  </span>
                </div>

                <div className="answers-list">
                  {(selectedSubmission.examDetails?.questions || []).map((q, idx) => {
                    const ans = (selectedSubmission.answers || []).find(
                      (a) => a.question === q.id || a.question?.id === q.id,
                    );

                    const isMultiple = q.question_type === "multiple_choice";

                    return (
                      <div key={q.id || idx} className="question-answer-card">
                        <div className="question-card-head">
                          <span className="q-number">سوال {toPersianDigits(idx + 1)}</span>
                          <span className="q-type-badge">
                            {isMultiple ? "چهار گزینه‌ای (تستی)" : "تشریحی"}
                          </span>
                          <span className="q-score-badge">
                            بارم: {toPersianDigits(q.max_score || 1)} نمره
                          </span>
                        </div>

                        <p className="q-text">{q.text}</p>

                        {/* Multiple Choice inspection */}
                        {isMultiple && (
                          <div className="choices-review-grid">
                            {(q.choices || []).map((choice) => {
                              const isSelected =
                                ans?.selected_choice === choice.id ||
                                ans?.selected_choice?.id === choice.id;
                              const isCorrect = choice.is_correct;

                              let choiceClass = "choice-item";
                              if (isSelected && isCorrect) choiceClass += " correct-selected";
                              else if (isSelected && !isCorrect) choiceClass += " wrong-selected";
                              else if (isCorrect) choiceClass += " correct-target";

                              return (
                                <div key={choice.id} className={choiceClass}>
                                  <div className="choice-indicator">
                                    {isSelected && <Check size={14} />}
                                  </div>
                                  <span className="choice-text">{choice.text}</span>
                                  {isCorrect && (
                                    <span className="correct-label">(پاسخ صحیح)</span>
                                  )}
                                  {isSelected && (
                                    <span className="user-selected-label">
                                      [انتخاب دانش‌آموز]
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Essay inspection */}
                        {!isMultiple && (
                          <div className="essay-review-box">
                            <label>پاسخ ثبت‌شده دانش‌آموز:</label>
                            <div className="essay-content">
                              {ans?.essay_text || "بدون پاسخ"}
                            </div>
                            <div className="essay-score-row">
                              <span>نمره اختصاص‌داده‌شده توسط معلم:</span>
                              <strong>
                                {ans?.score !== null && ans?.score !== undefined
                                  ? `${toPersianDigits(ans.score)} نمره`
                                  : "هنوز تصحیح نشده"}
                              </strong>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="exam-modal-footer">
                <AnimatedButton
                  variant="primary"
                  onClick={() => setSelectedSubmission(null)}
                >
                  بازگشت به لیست نتایج
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
