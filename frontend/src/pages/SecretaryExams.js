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

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
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

        const [examsData, classroomsData, termsData, submissionsData] = await Promise.all([
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

        const active = allTerms.find((t) => t.is_active);
        if (active) {
          setSelectedTermId(String(active.id));
        } else if (allTerms.length > 0) {
          setSelectedTermId(String(allTerms[0].id));
        } else {
          setSelectedTermId("all");
        }
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

  const activeTermObj = useMemo(() => {
    if (selectedTermId === "all") return null;
    return terms.find((t) => String(t.id) === String(selectedTermId));
  }, [terms, selectedTermId]);

  // Classrooms belonging to the selected term
  const termClassrooms = useMemo(() => {
    if (selectedTermId === "all") return classrooms;
    return classrooms.filter(
      (c) => String(c.term || c.term?.id) === String(selectedTermId),
    );
  }, [classrooms, selectedTermId]);

  // Map and calculate statistics for exams
  const examsWithStats = useMemo(() => {
    const termClassIds = termClassrooms.map((c) => c.id);

    return exams
      .filter((exam) => {
        if (selectedTermId === "all") return true;
        const examClassId = exam.classroom || exam.classroom_detail?.id;
        return termClassIds.includes(examClassId);
      })
      .map((exam) => {
        const cls = classrooms.find(
          (c) => c.id === (exam.classroom || exam.classroom_detail?.id),
        );
        const examSubs = submissions.filter(
          (s) => s.exam === exam.id || s.exam?.id === exam.id,
        );

        const gradedSubs = examSubs.filter((s) => s.score !== null && s.score !== undefined);
        const pendingSubs = examSubs.filter((s) => s.score === null || s.score === undefined);

        let avgScore = "-";
        if (gradedSubs.length > 0) {
          const sum = gradedSubs.reduce((acc, curr) => acc + Number(curr.score), 0);
          avgScore = (sum / gradedSubs.length).toFixed(1);
        }

        const enrolledCount = cls?.enrollments?.length || cls?.student_count || 0;

        return {
          ...exam,
          classroomName: cls?.name || "کلاس نامشخص",
          teacherName: getFullName(cls?.teacher_detail) || "استاد نامشخص",
          enrolledCount,
          submissionsCount: examSubs.length,
          gradedCount: gradedSubs.length,
          pendingCount: pendingSubs.length,
          avgScore,
          submissionsList: examSubs,
        };
      });
  }, [exams, termClassrooms, selectedTermId, classrooms, submissions]);

  // Filtered exams by search, class and status
  const filteredExams = useMemo(() => {
    return examsWithStats.filter((exam) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        exam.title.toLowerCase().includes(q) ||
        exam.classroomName.toLowerCase().includes(q) ||
        exam.teacherName.toLowerCase().includes(q);

      const examClassId = exam.classroom || exam.classroom_detail?.id;
      const matchesClass =
        selectedClass === "all" || String(examClassId) === String(selectedClass);

      let matchesStatus = true;
      if (statusFilter === "pending") {
        matchesStatus = exam.pendingCount > 0;
      } else if (statusFilter === "graded") {
        matchesStatus = exam.submissionsCount > 0 && exam.pendingCount === 0;
      } else if (statusFilter === "no_subs") {
        matchesStatus = exam.submissionsCount === 0;
      }

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [examsWithStats, searchTerm, selectedClass, statusFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalExams = examsWithStats.length;
    const totalSubmissions = examsWithStats.reduce((acc, e) => acc + e.submissionsCount, 0);
    const totalGraded = examsWithStats.reduce((acc, e) => acc + e.gradedCount, 0);
    const totalPending = examsWithStats.reduce((acc, e) => acc + e.pendingCount, 0);

    return { totalExams, totalSubmissions, totalGraded, totalPending };
  }, [examsWithStats]);

  return (
    <DashboardLayout role={roleTitle} title="نظارت بر امتحانات" menuType={menuType}>
      <div className="secretary-exams-page-container">
        {/* Term Selector Header Banner */}
        <div className="term-selector-banner" style={{ marginBottom: "1.75rem" }}>
          <div className="term-banner-info">
            <div className="term-icon-circle">
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: "800" }}>
                ترم تحصیلی انتخابی:{" "}
                <span className="term-highlight-text" style={{ color: "var(--primary)" }}>
                  {activeTermObj
                    ? activeTermObj.name
                    : selectedTermId === "all"
                    ? "همه ترم‌ها"
                    : "ترم نامشخص"}
                </span>
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "oklch(55% 0 0)" }}>
                {activeTermObj?.is_active
                  ? "آزمون‌ها و نتایج مربوط به ترم فعال جاری در حال نمایش است."
                  : activeTermObj
                  ? "آزمون‌ها و نتایج مربوط به این ترم بایگانی‌شده در حال نمایش است."
                  : "نمایش آزمون‌های تمامی دوره‌ها"}
              </p>
            </div>
          </div>

          <div className="term-dropdown-wrapper" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <label style={{ fontSize: "0.84rem", fontWeight: "700" }}>انتخاب ترم:</label>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="term-select-input"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_active ? "(ترم فعال جاری)" : "(به پایان رسیده)"}
                </option>
              ))}
              <option value="all">همه ترم‌ها (مشاهده کامل)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="secretary-exams-alert error" style={{ marginBottom: "1.5rem" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="secretary-exams-stats-grid">
          <StatCard
            title="آزمون‌های ترم"
            value={`${toPersianDigits(stats.totalExams)} آزمون`}
            hint={activeTermObj?.name || "ترم انتخابی"}
            icon={<FileText size={22} />}
            color="red"
          />
          <StatCard
            title="پاسخ‌برگ‌های دریافتی"
            value={`${toPersianDigits(stats.totalSubmissions)} برگه`}
            hint="تحویل داده شده"
            icon={<Users size={22} />}
            color="blue"
          />
          <StatCard
            title="برگه‌های تصحیح‌شده"
            value={`${toPersianDigits(stats.totalGraded)} برگه`}
            hint="نمره‌دهی قطعی"
            icon={<CheckCircle2 size={22} />}
            color="green"
          />
          <StatCard
            title="در انتظار تصحیح استاد"
            value={`${toPersianDigits(stats.totalPending)} برگه`}
            hint="نیازمند نمره مدرس"
            icon={<Clock3 size={22} />}
            color="orange"
          />
        </div>

        {/* Main Section */}
        <section className="secretary-exams-main-section">
          <div className="secretary-exams-section-header">
            <div className="secretary-exams-heading">
              <h3 className="secretary-exams-section-title">
                لیست آزمون‌های {activeTermObj ? `«${activeTermObj.name}»` : "آموزشگاه"}
              </h3>
              <p className="secretary-exams-section-desc">
                نظارت بر روند برگزاری امتحانات، تعداد پاسخ‌برگ‌ها و نمرات ثبت‌شده توسط مدرسین
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="secretary-exams-filters-row">
            <div className="exams-search-wrapper">
              <Search size={18} className="exams-search-icon" />
              <input
                type="text"
                placeholder="جستجو بر اساس عنوان آزمون، کلاس یا مدرس..."
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
                <option value="all">همه کلاس‌های ترم</option>
                {termClassrooms.map((c) => (
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

          {/* Exams Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "oklch(50% 0 0)" }}>
              در حال دریافت اطلاعات آزمون‌ها...
            </div>
          ) : filteredExams.length > 0 ? (
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
                  {filteredExams.map((exam) => (
                    <tr key={exam.id}>
                      <td>
                        <div className="exam-title-cell">
                          <div className="exam-icon-circle">
                            <FileText size={18} />
                          </div>
                          <div>
                            <strong>{exam.title}</strong>
                            <small>{toPersianDigits(exam.questions?.length || 0)} سوال</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="class-tag-badge">{exam.classroomName}</span>
                      </td>

                      <td>
                        <strong className="teacher-name-text">{exam.teacherName}</strong>
                      </td>

                      <td>
                        <span className="shamsi-date-pill">{toJalaliDateString(exam.date)}</span>
                      </td>

                      <td>
                        <span className="max-score-badge">{toPersianDigits(exam.maxScore)} نمره</span>
                      </td>

                      <td>
                        <div className="submissions-ratio-cell">
                          <strong className="subs-active">{toPersianDigits(exam.submissionsCount)}</strong>
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
                          <span className="exam-status-pill no-subs">بدون پاسخ‌برگ</span>
                        ) : exam.pendingCount === 0 ? (
                          <span className="exam-status-pill graded">تصحیح شده</span>
                        ) : (
                          <span className="exam-status-pill pending">
                            {toPersianDigits(exam.pendingCount)} برگه در انتظار نمره
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="exam-action-btn view"
                          onClick={() => setInspectedExam(exam)}
                        >
                          <Eye size={15} />
                          <span>مشاهده برگه‌ها</span>
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
              <h4>آزمونی در این ترم یافت نشد</h4>
              <p>در حال حاضر برای این ترم آزمونی تعریف نشده است.</p>
            </div>
          )}
        </section>

        {/* Modal 1: Submissions list for inspected Exam */}
        {inspectedExam && (
          <div className="exam-modal-backdrop" onClick={() => setInspectedExam(null)}>
            <div className="exam-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="exam-modal-icon-badge">
                    <Award size={22} />
                  </div>
                  <div>
                    <h4>پاسخ‌برگ‌های آزمون «{inspectedExam.title}»</h4>
                    <p>
                      کلاس: <strong>{inspectedExam.classroomName}</strong> | مدرس:{" "}
                      <strong>{inspectedExam.teacherName}</strong> | بارم کل:{" "}
                      <strong>{toPersianDigits(inspectedExam.maxScore)} نمره</strong>
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
                {inspectedExam.submissionsList?.length > 0 ? (
                  <div className="secretary-exams-table-wrapper">
                    <table className="secretary-exams-table modal-table">
                      <thead>
                        <tr>
                          <th>نام دانش‌آموز</th>
                          <th>شماره کاربری</th>
                          <th>زمان تحویل</th>
                          <th>نمره ثبت‌شده</th>
                          <th>وضعیت تصحیح</th>
                          <th>بررسی برگه</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectedExam.submissionsList.map((sub) => {
                          const student = sub.student_detail;
                          const hasScore = sub.score !== null && sub.score !== undefined;

                          return (
                            <tr key={sub.id}>
                              <td>
                                <strong>{getFullName(student)}</strong>
                              </td>
                              <td>
                                <span className="user-code-tag">{student?.username}</span>
                              </td>
                              <td>
                                <span className="shamsi-date-pill">
                                  {sub.submitted_at
                                    ? toJalaliDateString(sub.submitted_at)
                                    : "نامشخص"}
                                </span>
                              </td>
                              <td>
                                {hasScore ? (
                                  <strong className="score-highlight">
                                    {toPersianDigits(sub.score)} از{" "}
                                    {toPersianDigits(inspectedExam.maxScore)}
                                  </strong>
                                ) : (
                                  <span className="no-score-tag">ثبت نشده</span>
                                )}
                              </td>
                              <td>
                                {hasScore ? (
                                  <span className="exam-status-pill graded">
                                    <Check size={13} style={{ marginLeft: "3px" }} />
                                    نمره داده شد
                                  </span>
                                ) : (
                                  <span className="exam-status-pill pending">
                                    <Clock3 size={13} style={{ marginLeft: "3px" }} />
                                    منتظر تصحیح استاد
                                  </span>
                                )}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="exam-action-btn view"
                                  onClick={() => setSelectedSubmission(sub)}
                                >
                                  <Eye size={14} />
                                  <span>بررسی پاسخ‌ها</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="exams-empty-state">
                    <Users size={36} />
                    <h4>هیچ پاسخ‌برگی تحویل داده نشده است</h4>
                    <p>دانش‌آموزان هنوز در این آزمون شرکت نکرده‌اند.</p>
                  </div>
                )}
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

        {/* Modal 2: Single Submission Detailed Answer Sheet */}
        {selectedSubmission && inspectedExam && (
          <div className="exam-modal-backdrop sub-modal" onClick={() => setSelectedSubmission(null)}>
            <div className="exam-modal-container large" onClick={(e) => e.stopPropagation()}>
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="exam-modal-icon-badge" style={{ background: "linear-gradient(135deg, #3578c8, #205493)" }}>
                    <Info size={22} />
                  </div>
                  <div>
                    <h4>
                      پاسخ‌برگ: {getFullName(selectedSubmission.student_detail)} (
                      {selectedSubmission.student_detail?.username})
                    </h4>
                    <p>
                      آزمون: <strong>{inspectedExam.title}</strong> | نمره نهایی:{" "}
                      <strong>
                        {selectedSubmission.score !== null && selectedSubmission.score !== undefined
                          ? `${toPersianDigits(selectedSubmission.score)} از ${toPersianDigits(inspectedExam.maxScore)}`
                          : "هنوز نمره‌دهی نشده"}
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

              <div className="exam-modal-body modal-scrollable">
                {selectedSubmission.feedback && (
                  <div className="submission-feedback-box">
                    <strong>
                      <Sparkles size={16} style={{ marginLeft: "4px" }} />
                      توضیحات و بازخورد استاد:
                    </strong>
                    <p>{selectedSubmission.feedback}</p>
                  </div>
                )}

                <div className="submission-questions-list">
                  {(inspectedExam.questions || []).map((question, qIdx) => {
                    const studentAns = selectedSubmission.answers?.[question.id];

                    return (
                      <div key={question.id || qIdx} className="submission-q-card">
                        <div className="submission-q-header">
                          <span className="q-number-pill">سوال {toPersianDigits(qIdx + 1)}</span>
                          <span className="q-score-tag">
                            بارم: {toPersianDigits(question.score || 1)} نمره
                          </span>
                        </div>

                        <p className="submission-q-text">{question.text}</p>

                        <div className="student-ans-block">
                          <span className="ans-label">پاسخ ثبت‌شده دانش‌آموز:</span>
                          <div className="ans-content-box">
                            {studentAns !== undefined && studentAns !== "" ? (
                              question.type === "multiple_choice" ? (
                                <strong>گزینه انتخابی: {studentAns}</strong>
                              ) : (
                                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{studentAns}</p>
                              )
                            ) : (
                              <span style={{ color: "#95a5a6", fontStyle: "italic" }}>
                                پاسخی ثبت نشده است (سفید)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="exam-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setSelectedSubmission(null)}
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
