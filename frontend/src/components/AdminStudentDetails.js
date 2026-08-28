import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  User,
  Phone,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ArrowRight,
  Edit3,
  CheckCircle2,
  Clock3,
  Users,
  CreditCard,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

import "./AdminStudentDetails.css";

function AdminStudentDetails() {
  const { id } = useParams();
  const location = useLocation();
  const isSecretary = location.pathname.includes("/secretary/");

  const [studentUser, setStudentUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Modal / Form state for new enrollment
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedClassToAdd, setSelectedClassToAdd] = useState("");
  const [initialPaidStatus, setInitialPaidStatus] = useState(false);
  const [enrollingLoading, setEnrollingLoading] = useState(false);

  // Modal for payment editing
  const [paymentModalEnrollment, setPaymentModalEnrollment] = useState(null);
  const [paymentNotesInput, setPaymentNotesInput] = useState("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        setError("");
        const [
          userData,
          enrollmentsData,
          classroomsData,
          termsData,
          attendanceData,
        ] = await Promise.all([
          api.users.get(id),
          api.enrollments.list(),
          api.classrooms.list(),
          api.terms.list(),
          api.attendance.list(),
        ]);

        if (!alive) return;

        setStudentUser(userData);
        setClassrooms(classroomsData || []);
        setTerms(termsData || []);

        const studentEnrollments = (enrollmentsData || []).filter(
          (enr) => enr.student === Number(id) || enr.student?.id === Number(id),
        );
        setEnrollments(studentEnrollments);

        const studentRecords = (attendanceData || []).filter(
          (rec) => rec.student === Number(id) || rec.student?.id === Number(id),
        );
        setAttendanceRecords(studentRecords);
      } catch (err) {
        if (alive) setError(err.message || "دریافت اطلاعات دانش‌آموز ناموفق بود.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, [id]);

  // Toggle or Update Payment Status
  const handleTogglePayment = async (enrollment, targetStatus, notes = "") => {
    try {
      setUpdatingPayment(true);
      const updated = await api.enrollments.update(enrollment.id, {
        is_paid: targetStatus,
        payment_notes: notes || enrollment.payment_notes || "",
      });

      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollment.id ? { ...e, ...updated } : e)),
      );

      setActionSuccess(
        targetStatus
          ? "شهریه کلاس با موفقیت به عنوان «پرداخت‌شده و تسویه» ثبت شد."
          : "وضعیت شهریه به «در انتظار پرداخت» تغییر یافت.",
      );
      setPaymentModalEnrollment(null);
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      alert(err.message || "خطا در تغییر وضعیت شهریه");
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Add Student to a new Classroom
  const handleAddEnrollment = async (e) => {
    e.preventDefault();
    if (!selectedClassToAdd) return;

    try {
      setEnrollingLoading(true);
      const newEnr = await api.enrollments.create({
        student: Number(id),
        classroom: Number(selectedClassToAdd),
        is_paid: initialPaidStatus,
      });

      setEnrollments((prev) => [...prev, newEnr]);
      setShowEnrollModal(false);
      setSelectedClassToAdd("");
      setInitialPaidStatus(false);
      setActionSuccess("دانش‌آموز با موفقیت در کلاس جدید ثبت‌نام شد.");
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      alert(err.message || "خطا در ثبت‌نام در کلاس");
    } finally {
      setEnrollingLoading(false);
    }
  };

  // Remove Student from Classroom
  const handleRemoveEnrollment = async (enrollmentId, className) => {
    if (
      !window.confirm(
        `آیا از حذف ثبت‌نام دانش‌آموز از کلاس «${className}» اطمینان دارید؟`,
      )
    ) {
      return;
    }

    try {
      await api.enrollments.delete(enrollmentId);
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      setActionSuccess(`دانش‌آموز از کلاس «${className}» حذف شد.`);
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      alert(err.message || "خطا در حذف ثبت‌نام");
    }
  };

  const attendanceStats = useMemo(() => {
    const present = attendanceRecords.filter((rec) => rec.status === "present").length;
    const late = attendanceRecords.filter((rec) => rec.status === "late").length;
    const absent = attendanceRecords.filter((rec) => rec.status === "absent").length;
    const total = attendanceRecords.length;
    const percent = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

    return { total, present, late, absent, percent };
  }, [attendanceRecords]);

  // Rich Enrolled Classes list
  const enrichedEnrollments = useMemo(() => {
    return enrollments.map((enr) => {
      const cls = classrooms.find((c) => c.id === (enr.classroom || enr.classroom?.id));
      const term = terms.find((t) => t.id === (cls?.term || cls?.term?.id));

      const tuitionFee = cls?.tuition_fee !== undefined ? cls.tuition_fee : 2500000;

      return {
        ...enr,
        classroomObj: cls,
        className: cls?.name || enr.classroom_name || `کلاس کد ${enr.classroom}`,
        teacherName: getFullName(cls?.teacher_detail) || "استاد نامشخص",
        termName: term?.name || enr.term_name || "ترم نامشخص",
        isTermActive: term ? term.is_active : enr.is_term_active,
        tuitionFee,
      };
    });
  }, [enrollments, classrooms, terms]);

  const totalTuition = useMemo(
    () => enrichedEnrollments.reduce((sum, e) => sum + e.tuitionFee, 0),
    [enrichedEnrollments],
  );

  const totalPaid = useMemo(
    () =>
      enrichedEnrollments
        .filter((e) => e.is_paid)
        .reduce((sum, e) => sum + e.tuitionFee, 0),
    [enrichedEnrollments],
  );

  const totalRemaining = totalTuition - totalPaid;

  const backUrl = isSecretary ? "/panel/secretary/students" : "/panel/admin/students";
  const editUrl = isSecretary
    ? `/panel/secretary/students/${id}/edit`
    : `/panel/admin/students/${id}/edit`;
  const menuType = isSecretary ? "secretary" : "admin";
  const roleName = isSecretary ? "پنل منشی" : "پنل مدیریت";

  const studentName = getFullName(studentUser);

  // Available classes for enrollment modal (classes student is not currently in)
  const availableClassesToEnroll = useMemo(() => {
    const currentClassIds = enrollments.map(
      (e) => e.classroom || e.classroom?.id,
    );
    return classrooms.filter((c) => !currentClassIds.includes(c.id));
  }, [classrooms, enrollments]);

  if (loading) {
    return (
      <DashboardLayout role={roleName} title="جزئیات دانش‌آموز" menuType={menuType}>
        <div style={{ padding: "3rem", textAlign: "center" }}>
          در حال بارگذاری اطلاعات پرونده دانش‌آموز...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !studentUser) {
    return (
      <DashboardLayout role={roleName} title="جزئیات دانش‌آموز" menuType={menuType}>
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--danger, #ef4444)", marginBottom: "1rem" }}>
            {error || "دانش‌آموز یافت نشد."}
          </p>
          <Link to={backUrl}>
            <AnimatedButton variant="primary">بازگشت به لیست</AnimatedButton>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={roleName} title="جزئیات دانش‌آموز" menuType={menuType}>
      <div className="admin-student-details-x9p4-root">
        {actionSuccess && (
          <div className="class-form-alert success" style={{ marginBottom: "1.5rem" }}>
            <Sparkles size={18} />
            <span>{actionSuccess}</span>
          </div>
        )}

        <div className="admin-student-details-x9p4-page-header">
          <div className="admin-student-details-x9p4-header-content">
            <Link to={backUrl} className="admin-student-details-x9p4-back-link">
              <ArrowRight size={18} />
              بازگشت به لیست دانش‌آموزان
            </Link>

            <div className="admin-student-details-x9p4-heading">
              <div className="admin-student-details-x9p4-avatar">
                {studentName.charAt(0)}
              </div>

              <div>
                <h2>{studentName}</h2>
                <div className="admin-student-details-x9p4-subtitle">
                  <span>نام کاربری: {studentUser.username}</span>
                  <span className="admin-student-details-x9p4-dot">•</span>
                  <span>
                    {enrichedEnrollments.length > 0
                      ? `${toPersianDigits(enrichedEnrollments.length)} کلاس ثبت‌نامی`
                      : "بدون کلاس"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link to={editUrl}>
              <AnimatedButton variant="secondary" icon={<Edit3 size={17} />}>
                ویرایش مشخصات
              </AnimatedButton>
            </Link>

            <AnimatedButton
              variant="primary"
              icon={<Plus size={17} />}
              onClick={() => setShowEnrollModal(true)}
            >
              ثبت‌نام در کلاس جدید
            </AnimatedButton>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="admin-student-details-x9p4-stats">
          <StatCard
            title="کل شهریه ثبت‌نامی"
            value={`${toPersianDigits(totalTuition.toLocaleString("fa-IR"))} تومان`}
            hint={`${toPersianDigits(enrichedEnrollments.length)} کلاس`}
            icon={<CreditCard />}
            color="blue"
          />

          <StatCard
            title="مبلغ تسویه‌شده"
            value={`${toPersianDigits(totalPaid.toLocaleString("fa-IR"))} تومان`}
            hint="پرداخت شده به منشی"
            icon={<CheckCircle2 />}
            color="green"
          />

          <StatCard
            title="مانده شهریه"
            value={`${toPersianDigits(totalRemaining.toLocaleString("fa-IR"))} تومان`}
            hint={totalRemaining === 0 ? "تسویه کامل" : "بدهکار"}
            icon={<Clock3 />}
            color={totalRemaining === 0 ? "green" : "red"}
          />

          <StatCard
            title="درصد حضور کلاسی"
            value={`${toPersianDigits(attendanceStats.percent)}٪`}
            hint={`${toPersianDigits(attendanceStats.present)} حضور از ${toPersianDigits(attendanceStats.total)} جلسه`}
            icon={<ClipboardCheck />}
            color="light-blue"
          />
        </div>

        {/* Enrolled Classes & Tuition Management Section */}
        <section className="admin-student-details-x9p4-section">
          <div className="admin-student-details-x9p4-section-header">
            <div>
              <h3 className="admin-student-details-x9p4-title">
                کلاس‌ها و وضعیت پرداخت شهریه
              </h3>
              <p className="admin-student-details-x9p4-description">
                مشاهده شهریه مصوب هر کلاس، تعیین کلاس و تغییر وضعیت پرداخت توسط منشی یا مدیر
              </p>
            </div>

            <AnimatedButton
              variant="secondary"
              icon={<Plus size={16} />}
              onClick={() => setShowEnrollModal(true)}
            >
              افزودن کلاس برای دانش‌آموز
            </AnimatedButton>
          </div>

          <div className="admin-student-details-x9p4-table-wrapper">
            <table className="admin-student-details-x9p4-table">
              <thead>
                <tr>
                  <th>نام کلاس و ترم</th>
                  <th>مدرس دوره</th>
                  <th>مبلغ مصوب شهریه</th>
                  <th>وضعیت پرداخت</th>
                  <th>تاریخ پرداخت</th>
                  <th>یادداشت پرداخت</th>
                  <th>عملیات منشی / مدیر</th>
                </tr>
              </thead>
              <tbody>
                {enrichedEnrollments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{ textAlign: "center", padding: "2.5rem", color: "oklch(55% 0 0)" }}
                    >
                      این دانش‌آموز هنوز در هیچ کلاسی ثبت‌نام نشده است. با دکمه «افزودن کلاس» می‌توانید کلاس مورد نظر را تعیین کنید.
                    </td>
                  </tr>
                ) : (
                  enrichedEnrollments.map((enr) => (
                    <tr key={enr.id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          <strong>{enr.className}</strong>
                          <small style={{ color: "oklch(55% 0 0)" }}>
                            {enr.termName} {enr.isTermActive ? "(ترم جاری)" : "(بایگانی)"}
                          </small>
                        </div>
                      </td>

                      <td>{enr.teacherName}</td>

                      <td>
                        <strong style={{ color: "var(--primary)" }}>
                          {toPersianDigits(enr.tuitionFee.toLocaleString("fa-IR"))} تومان
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${enr.is_paid ? "present" : "absent"}`}
                          style={{ fontWeight: "800" }}
                        >
                          {enr.is_paid ? "پرداخت شده (تسویه)" : "در انتظار پرداخت"}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.85rem" }}>
                          {enr.paid_at ? toJalaliDateString(enr.paid_at) : "-"}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.82rem", color: "oklch(50% 0 0)" }}>
                          {enr.payment_notes || "-"}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          {enr.is_paid ? (
                            <button
                              type="button"
                              className="tuition-action-btn revert"
                              onClick={() => handleTogglePayment(enr, false)}
                              title="لغو وضعیت پرداخت"
                            >
                              <X size={14} />
                              لغو تسویه
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="tuition-action-btn pay"
                              onClick={() => {
                                setPaymentModalEnrollment(enr);
                                setPaymentNotesInput(enr.payment_notes || "");
                              }}
                              title="ثبت دریافت شهریه"
                            >
                              <Check size={14} />
                              ثبت دریافت وجه
                            </button>
                          )}

                          <button
                            type="button"
                            className="tuition-action-btn delete"
                            onClick={() => handleRemoveEnrollment(enr.id, enr.className)}
                            title="حذف از این کلاس"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Student Personal Info */}
        <section className="admin-student-details-x9p4-section">
          <div className="admin-student-details-x9p4-section-header">
            <div>
              <h3 className="admin-student-details-x9p4-title">اطلاعات پرونده</h3>
              <p className="admin-student-details-x9p4-description">
                مشخصات هویتی و اطلاعات تماس ثبت‌شده دانش‌آموز
              </p>
            </div>
          </div>

          <div className="admin-student-details-x9p4-info-grid">
            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <User size={19} />
              </div>
              <div>
                <span>نام و نام خانوادگی</span>
                <strong>{studentName}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <Phone size={19} />
              </div>
              <div>
                <span>شماره تماس</span>
                <strong className="admin-student-details-x9p4-phone">
                  {studentUser.phone_number || "-"}
                </strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <Users size={19} />
              </div>
              <div>
                <span>نام کاربری</span>
                <strong>{studentUser.username}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <CalendarDays size={19} />
              </div>
              <div>
                <span>ایمیل</span>
                <strong>{studentUser.email || "-"}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Modal: Enroll in new Class */}
        {showEnrollModal && (
          <div
            className="exam-modal-backdrop"
            onClick={() => setShowEnrollModal(false)}
          >
            <div
              className="exam-modal-container"
              style={{ maxWidth: "520px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="exam-icon-circle">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h4>تعیین و ثبت‌نام در کلاس جدید</h4>
                    <p>دانش‌آموز: {studentName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowEnrollModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddEnrollment}>
                <div className="exam-modal-body" style={{ padding: "1.5rem" }}>
                  <div className="class-form-group full-width" style={{ marginBottom: "1.25rem" }}>
                    <label style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block" }}>
                      انتخاب کلاس آموزشی <span style={{ color: "red" }}>*</span>
                    </label>
                    <select
                      value={selectedClassToAdd}
                      onChange={(e) => setSelectedClassToAdd(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "10px",
                        border: "1px solid oklch(85% 0 0)",
                      }}
                    >
                      <option value="">انتخاب کلاس...</option>
                      {availableClassesToEnroll.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (شهریه: {toPersianDigits((c.tuition_fee || 2500000).toLocaleString("fa-IR"))} تومان)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="class-form-group full-width">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={initialPaidStatus}
                        onChange={(e) => setInitialPaidStatus(e.target.checked)}
                      />
                      <span>شهریه این کلاس هم‌اکنون نقداً دریافت و تسویه شد.</span>
                    </label>
                  </div>
                </div>

                <div className="exam-modal-footer">
                  <AnimatedButton
                    variant="secondary"
                    type="button"
                    onClick={() => setShowEnrollModal(false)}
                  >
                    انصراف
                  </AnimatedButton>
                  <AnimatedButton
                    variant="primary"
                    type="submit"
                    disabled={enrollingLoading || !selectedClassToAdd}
                  >
                    {enrollingLoading ? "در حال ثبت‌نام..." : "ثبت‌نام در کلاس"}
                  </AnimatedButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Confirm / Record Payment */}
        {paymentModalEnrollment && (
          <div
            className="exam-modal-backdrop"
            onClick={() => setPaymentModalEnrollment(null)}
          >
            <div
              className="exam-modal-container"
              style={{ maxWidth: "480px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="exam-icon-circle" style={{ background: "var(--green-5, #10b981)" }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4>ثبت دریافت شهریه کلاس</h4>
                    <p>{paymentModalEnrollment.className}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setPaymentModalEnrollment(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="exam-modal-body" style={{ padding: "1.5rem" }}>
                <div style={{ background: "oklch(97% 0 0)", padding: "1rem", borderRadius: "12px", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span>دانش‌آموز:</span>
                    <strong>{studentName}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>مبلغ مصوب شهریه:</span>
                    <strong style={{ color: "var(--primary)" }}>
                      {toPersianDigits(paymentModalEnrollment.tuitionFee.toLocaleString("fa-IR"))} تومان
                    </strong>
                  </div>
                </div>

                <div className="class-form-group full-width">
                  <label style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block" }}>
                    توضیحات و شماره پیگیری / رسید (اختیاری):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: پرداخت نقدی / کارتخوان آموزشگاه - شماره فیش ۱۲۳"
                    value={paymentNotesInput}
                    onChange={(e) => setPaymentNotesInput(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      border: "1px solid oklch(85% 0 0)",
                    }}
                  />
                </div>
              </div>

              <div className="exam-modal-footer">
                <AnimatedButton
                  variant="secondary"
                  type="button"
                  onClick={() => setPaymentModalEnrollment(null)}
                >
                  انصراف
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  type="button"
                  disabled={updatingPayment}
                  onClick={() => handleTogglePayment(paymentModalEnrollment, true, paymentNotesInput)}
                >
                  {updatingPayment ? "در حال ثبت..." : "تایید و ثبت تسویه"}
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AdminStudentDetails;
