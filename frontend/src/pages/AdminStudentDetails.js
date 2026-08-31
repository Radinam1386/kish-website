import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  User,
  Phone,
  BookOpen,
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
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  RefreshCw,
  Lock,
  Mail,
  MapPin,
  Calendar,
  Award,
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

  // ========================================
  // Enrollment Modal
  // ========================================

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedClassToAdd, setSelectedClassToAdd] = useState("");
  const [initialPaidStatus, setInitialPaidStatus] = useState(false);
  const [enrollingLoading, setEnrollingLoading] = useState(false);

  // ========================================
  // Payment Modal
  // ========================================

  const [paymentModalEnrollment, setPaymentModalEnrollment] = useState(null);
  const [paymentNotesInput, setPaymentNotesInput] = useState("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // ========================================
  // Password
  // ========================================

  const [showPasswordState, setShowPasswordState] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [copiedPassword] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showNewPasswordInModal, setShowNewPasswordInModal] = useState(true);
  const [changingPasswordLoading, setChangingPasswordLoading] = useState(false);

  // ========================================
  // Load Data
  // ========================================

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

        const numericId = Number(id);

        const studentEnrollments = (enrollmentsData || []).filter(
          (enr) => enr.student === numericId || enr.student?.id === numericId,
        );

        const studentRecords = (attendanceData || []).filter(
          (rec) => rec.student === numericId || rec.student?.id === numericId,
        );

        setEnrollments(studentEnrollments);
        setAttendanceRecords(studentRecords);
      } catch (err) {
        if (alive) {
          setError(err.message || "دریافت اطلاعات دانش‌آموز ناموفق بود.");
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
  }, [id]);

  // ========================================
  // Success Message
  // ========================================

  const showSuccess = (message) => {
    setActionSuccess(message);

    window.setTimeout(() => {
      setActionSuccess("");
    }, 4000);
  };

  // ========================================
  // Payment
  // ========================================

  const handleTogglePayment = async (enrollment, targetStatus, notes = "") => {
    try {
      setUpdatingPayment(true);

      const updated = await api.enrollments.update(enrollment.id, {
        is_paid: targetStatus,
        payment_notes: notes || enrollment.payment_notes || "",
      });

      setEnrollments((prev) =>
        prev.map((item) =>
          item.id === enrollment.id ? { ...item, ...updated } : item,
        ),
      );

      showSuccess(
        targetStatus
          ? "شهریه کلاس با موفقیت به عنوان «پرداخت‌شده و تسویه» ثبت شد."
          : "وضعیت شهریه به «در انتظار پرداخت» تغییر یافت.",
      );

      setPaymentModalEnrollment(null);
    } catch (err) {
      alert(err.message || "خطا در تغییر وضعیت شهریه");
    } finally {
      setUpdatingPayment(false);
    }
  };

  // ========================================
  // Add Enrollment
  // ========================================

  const handleAddEnrollment = async (e) => {
    e.preventDefault();

    if (!selectedClassToAdd) return;

    try {
      setEnrollingLoading(true);

      const newEnrollment = await api.enrollments.create({
        student: Number(id),
        classroom: Number(selectedClassToAdd),
        is_paid: initialPaidStatus,
      });

      setEnrollments((prev) => [...prev, newEnrollment]);

      setShowEnrollModal(false);
      setSelectedClassToAdd("");
      setInitialPaidStatus(false);

      showSuccess("دانش‌آموز با موفقیت در کلاس جدید ثبت‌نام شد.");
    } catch (err) {
      alert(err.message || "خطا در ثبت‌نام در کلاس");
    } finally {
      setEnrollingLoading(false);
    }
  };

  // ========================================
  // Remove Enrollment
  // ========================================

  const handleRemoveEnrollment = async (enrollmentId, className) => {
    const confirmed = window.confirm(
      `آیا از حذف ثبت‌نام دانش‌آموز از کلاس «${className}» اطمینان دارید؟`,
    );

    if (!confirmed) return;

    try {
      await api.enrollments.delete(enrollmentId);

      setEnrollments((prev) => prev.filter((item) => item.id !== enrollmentId));

      showSuccess(`دانش‌آموز از کلاس «${className}» حذف شد.`);
    } catch (err) {
      alert(err.message || "خطا در حذف ثبت‌نام");
    }
  };

  // ========================================
  // Password Generator
  // ========================================

  const generatePassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%&*";

    const getRandom = (chars) =>
      chars[Math.floor(Math.random() * chars.length)];

    const allChars = upper + lower + numbers + symbols;

    let password =
      getRandom(upper) +
      getRandom(lower) +
      getRandom(numbers) +
      getRandom(symbols);

    for (let i = password.length; i < 12; i++) {
      password += getRandom(allChars);
    }

    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setNewPasswordInput(password);
    setShowNewPasswordInModal(true);
    setPasswordCopied(false);
  };

  const copyPassword = async () => {
    if (!newPasswordInput) return;

    try {
      await navigator.clipboard.writeText(newPasswordInput);

      setPasswordCopied(true);

      window.setTimeout(() => {
        setPasswordCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Password copy failed:", error);

      alert("کپی رمز عبور انجام نشد.");
    }
  };

  // ========================================
  // Change Password
  // ========================================

  const handleChangePassword = async (e) => {
    e.preventDefault();

    const password = newPasswordInput.trim();

    if (!password) {
      alert("لطفاً رمز عبور جدید را وارد کنید.");
      return;
    }

    if (password.length < 4) {
      alert("رمز عبور باید حداقل ۴ کاراکتر باشد.");
      return;
    }

    try {
      setChangingPasswordLoading(true);

      const updated = await api.users.update(id, {
        password,
      });

      setStudentUser((prev) => ({
        ...prev,
        ...updated,
        plain_password: password,
      }));

      showSuccess("رمز عبور دانش‌آموز با موفقیت تغییر یافت و ذخیره شد.");

      setShowChangePasswordModal(false);
      setNewPasswordInput("");
      setShowNewPasswordInModal(true);
      setPasswordCopied(false);
    } catch (err) {
      alert(err.message || "خطا در تغییر رمز عبور");
    } finally {
      setChangingPasswordLoading(false);
    }
  };

  // ========================================
  // Attendance Stats
  // ========================================

  const attendanceStats = useMemo(() => {
    const present = attendanceRecords.filter(
      (rec) => rec.status === "present",
    ).length;

    const late = attendanceRecords.filter(
      (rec) => rec.status === "late",
    ).length;

    const absent = attendanceRecords.filter(
      (rec) => rec.status === "absent",
    ).length;

    const total = attendanceRecords.length;

    const percent =
      total > 0 ? Math.round(((present + late) / total) * 100) : 100;

    return {
      total,
      present,
      late,
      absent,
      percent,
    };
  }, [attendanceRecords]);

  // ========================================
  // Enriched Enrollments
  // ========================================

  const enrichedEnrollments = useMemo(() => {
    return enrollments.map((enrollment) => {
      const classroomId = enrollment.classroom?.id || enrollment.classroom;

      const classroom = classrooms.find((item) => item.id === classroomId);

      const termId = classroom?.term?.id || classroom?.term;

      const term = terms.find((item) => item.id === termId);

      const tuitionFee =
        classroom?.tuition_fee !== undefined ? classroom.tuition_fee : 2500000;

      return {
        ...enrollment,
        classroomObj: classroom,
        className:
          classroom?.name ||
          enrollment.classroom_name ||
          `کلاس کد ${enrollment.classroom}`,
        teacherName: getFullName(classroom?.teacher_detail) || "استاد نامشخص",
        termName: term?.name || enrollment.term_name || "ترم نامشخص",
        isTermActive: term?.is_active ?? enrollment.is_term_active,
        tuitionFee,
      };
    });
  }, [enrollments, classrooms, terms]);

  // ========================================
  // Tuition
  // ========================================

  const totalTuition = useMemo(
    () => enrichedEnrollments.reduce((sum, item) => sum + item.tuitionFee, 0),
    [enrichedEnrollments],
  );

  const totalPaid = useMemo(
    () =>
      enrichedEnrollments
        .filter((item) => item.is_paid)
        .reduce((sum, item) => sum + item.tuitionFee, 0),
    [enrichedEnrollments],
  );

  const totalRemaining = totalTuition - totalPaid;

  // ========================================
  // Routes
  // ========================================

  const backUrl = isSecretary
    ? "/panel/secretary/students"
    : "/panel/admin/students";

  const editUrl = isSecretary
    ? `/panel/secretary/students/${id}/edit`
    : `/panel/admin/students/${id}/edit`;

  const menuType = isSecretary ? "secretary" : "admin";

  const roleName = isSecretary ? "پنل منشی" : "پنل مدیریت";

  const studentName = getFullName(studentUser);

  // ========================================
  // Available Classes
  // ========================================

  const availableClassesToEnroll = useMemo(() => {
    const currentClassIds = enrollments.map(
      (enrollment) => enrollment.classroom?.id || enrollment.classroom,
    );

    return classrooms.filter(
      (classroom) => !currentClassIds.includes(classroom.id),
    );
  }, [classrooms, enrollments]);

  // ========================================
  // Loading
  // ========================================

  if (loading) {
    return (
      <DashboardLayout
        role={roleName}
        title="جزئیات دانش‌آموز"
        menuType={menuType}
      >
        <div className="admin-student-details-x9p4-loading">
          <div className="admin-student-details-x9p4-loading-spinner" />
          <span>در حال بارگذاری اطلاعات پرونده دانش‌آموز...</span>
        </div>
      </DashboardLayout>
    );
  }

  // ========================================
  // Error
  // ========================================

  if (error || !studentUser) {
    return (
      <DashboardLayout
        role={roleName}
        title="جزئیات دانش‌آموز"
        menuType={menuType}
      >
        <div className="admin-student-details-x9p4-error">
          <div className="admin-student-details-x9p4-error-icon">!</div>

          <p>{error || "دانش‌آموز یافت نشد."}</p>

          <Link to={backUrl}>
            <AnimatedButton variant="primary">بازگشت به لیست</AnimatedButton>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // ========================================
  // Main
  // ========================================

  return (
    <DashboardLayout
      role={roleName}
      title="جزئیات دانش‌آموز"
      menuType={menuType}
    >
      <div className="admin-student-details-x9p4-root">
        {/* ======================================
            Success Alert
        ======================================= */}

        {actionSuccess && (
          <div className="class-form-alert success admin-student-details-x9p4-success-alert">
            <Sparkles size={18} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* ======================================
            Page Header
        ======================================= */}
        <div className="admin-teacher-details-x7k2-header">
          <div className="admin-student-details-x9p4-header-content">
            <div className="admin-student-details-x9p4-heading">
              <Link to={backUrl}>
                <AnimatedButton
                  variant="secondary"
                  size="small"
                  icon={<ArrowRight size={18} />}
                ></AnimatedButton>
              </Link>
              <div className="admin-student-details-x9p4-avatar">
                {studentName?.charAt(0) || "؟"}
              </div>

              <div className="admin-student-details-x9p4-heading-info">
                <h2>{studentName}</h2>

                <div className="admin-student-details-x9p4-subtitle">
                  <span>نام کاربری: {studentUser.username}</span>

                  <span className="admin-student-details-x9p4-dot">•</span>

                  <span>
                    {enrichedEnrollments.length > 0
                      ? `${toPersianDigits(
                          enrichedEnrollments.length,
                        )} کلاس ثبت‌نامی`
                      : "بدون کلاس"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-student-details-x9p4-header-actions">
            <Link
              to={editUrl}
              className="admin-student-details-x9p4-action-link"
            >
              <AnimatedButton
                variant="secondary"
                size="small"
                icon={<Edit3 size={17} />}
              >
                ویرایش مشخصات
              </AnimatedButton>
            </Link>

            <AnimatedButton
              variant="primary"
              size="small"
              icon={<Plus size={17} />}
              onClick={() => setShowEnrollModal(true)}
            >
              ثبت‌نام در کلاس جدید
            </AnimatedButton>
          </div>
        </div>
        {/* ======================================
            Stats
        ======================================= */}

        <div className="admin-student-details-x9p4-stats">
          <StatCard
            title="کل شهریه ثبت‌نامی"
            value={`${toPersianDigits(
              totalTuition.toLocaleString("fa-IR"),
            )} تومان`}
            hint={`${toPersianDigits(enrichedEnrollments.length)} کلاس`}
            icon={<CreditCard />}
            color="blue"
          />

          <StatCard
            title="مبلغ تسویه‌شده"
            value={`${toPersianDigits(
              totalPaid.toLocaleString("fa-IR"),
            )} تومان`}
            hint="پرداخت شده به منشی"
            icon={<CheckCircle2 />}
            color="green"
          />

          <StatCard
            title="مانده شهریه"
            value={`${toPersianDigits(
              totalRemaining.toLocaleString("fa-IR"),
            )} تومان`}
            hint={totalRemaining === 0 ? "تسویه کامل" : "بدهکار"}
            icon={<Clock3 />}
            color={totalRemaining === 0 ? "green" : "red"}
          />

          <StatCard
            title="درصد حضور کلاسی"
            value={`${toPersianDigits(attendanceStats.percent)}٪`}
            hint={`${toPersianDigits(
              attendanceStats.present,
            )} حضور از ${toPersianDigits(attendanceStats.total)} جلسه`}
            icon={<ClipboardCheck />}
            color="light-blue"
          />
        </div>

        {/* ======================================
            Classes
        ======================================= */}

        <section className="admin-student-details-x9p4-section">
          <div className="admin-student-details-x9p4-section-header">
            <div className="admin-student-details-x9p4-section-heading">
              <h3 className="admin-student-details-x9p4-title">
                کلاس‌ها و وضعیت پرداخت شهریه
              </h3>

              <p className="admin-student-details-x9p4-description">
                مشاهده شهریه مصوب هر کلاس، تعیین کلاس و تغییر وضعیت پرداخت توسط
                منشی یا مدیر
              </p>
            </div>

            <div className="admin-student-details-x9p4-section-action">
              <AnimatedButton
                variant="secondary"
                icon={<Plus size={16} />}
                size="small"
                onClick={() => setShowEnrollModal(true)}
              >
                افزودن کلاس برای دانش‌آموز
              </AnimatedButton>
            </div>
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
                  <th>عملیات</th>
                </tr>
              </thead>

              <tbody>
                {enrichedEnrollments.length === 0 ? (
                  <tr className="admin-student-details-x9p4-empty-row">
                    <td colSpan="7">
                      <div className="admin-student-details-x9p4-empty-state">
                        <BookOpen size={28} />

                        <span>
                          این دانش‌آموز هنوز در هیچ کلاسی ثبت‌نام نشده است.
                        </span>

                        <small>
                          با دکمه «افزودن کلاس» می‌توانید کلاس مورد نظر را تعیین
                          کنید.
                        </small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  enrichedEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td data-label="کلاس و ترم">
                        <div className="admin-student-details-x9p4-class-cell">
                          <strong>{enrollment.className}</strong>

                          <small>
                            {enrollment.termName}{" "}
                            {enrollment.isTermActive
                              ? "(ترم جاری)"
                              : "(بایگانی)"}
                          </small>
                        </div>
                      </td>

                      <td data-label="مدرس دوره">
                        <span className="admin-student-details-x9p4-table-value">
                          {enrollment.teacherName}
                        </span>
                      </td>

                      <td data-label="شهریه">
                        <strong className="admin-student-details-x9p4-price">
                          {toPersianDigits(
                            enrollment.tuitionFee.toLocaleString("fa-IR"),
                          )}{" "}
                          تومان
                        </strong>
                      </td>

                      <td data-label="وضعیت پرداخت">
                        <span
                          className={`status-badge ${
                            enrollment.is_paid ? "present" : "absent"
                          } admin-student-details-x9p4-payment-badge`}
                        >
                          {enrollment.is_paid
                            ? "پرداخت شده (تسویه)"
                            : "در انتظار پرداخت"}
                        </span>
                      </td>

                      <td data-label="تاریخ پرداخت">
                        <span className="admin-student-details-x9p4-date">
                          {enrollment.paid_at
                            ? toJalaliDateString(enrollment.paid_at)
                            : "-"}
                        </span>
                      </td>

                      <td data-label="یادداشت">
                        <span className="admin-student-details-x9p4-note">
                          {enrollment.payment_notes || "-"}
                        </span>
                      </td>

                      <td data-label="عملیات">
                        <div className="admin-student-details-x9p4-table-actions">
                          {enrollment.is_paid ? (
                            <button
                              type="button"
                              className="tuition-action-btn revert"
                              onClick={() =>
                                handleTogglePayment(enrollment, false)
                              }
                              title="لغو وضعیت پرداخت"
                            >
                              <X size={14} />
                              <span>لغو تسویه</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="tuition-action-btn pay"
                              onClick={() => {
                                setPaymentModalEnrollment(enrollment);

                                setPaymentNotesInput(
                                  enrollment.payment_notes || "",
                                );
                              }}
                              title="ثبت دریافت شهریه"
                            >
                              <Check size={14} />
                              <span>ثبت دریافت وجه</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="tuition-action-btn delete"
                            onClick={() =>
                              handleRemoveEnrollment(
                                enrollment.id,
                                enrollment.className,
                              )
                            }
                            title="حذف از این کلاس"
                          >
                            <span className="admin-student-details-x9p4-delete-text">
                              <Trash2 size={14} />
                            </span>
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

        {/* ======================================
            Personal Information
        ======================================= */}

        <section className="admin-student-details-x9p4-section">
          <div className="admin-student-details-x9p4-section-header">
            <div className="admin-student-details-x9p4-section-heading">
              <h3 className="admin-student-details-x9p4-title">
                اطلاعات پرونده و حساب کاربری
              </h3>

              <p className="admin-student-details-x9p4-description">
                مشخصات فردی، شماره تماس، نام کاربری و رمز عبور ثبت‌شده دانش‌آموز
              </p>
            </div>

            <AnimatedButton
              variant="secondary"
              size="small"
              onClick={() => {
                setNewPasswordInput("");
                setShowChangePasswordModal(true);
              }}
            >
              <KeyRound size={16} />
              <span>تغییر / تنظیم رمز عبور جدید</span>
            </AnimatedButton>
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
                <Award size={19} />
              </div>

              <div>
                <span>کد ملی</span>
                <strong>{studentUser.national_code || "-"}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <Calendar size={19} />
              </div>

              <div>
                <span>تاریخ تولد (شمسی)</span>

                <strong>
                  {studentUser.birth_date
                    ? toJalaliDateString(studentUser.birth_date)
                    : "-"}
                </strong>
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
                <Mail size={19} />
              </div>

              <div>
                <span>ایمیل</span>

                <strong className="admin-student-details-x9p4-email">
                  {studentUser.email || "-"}
                </strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <BookOpen size={19} />
              </div>

              <div>
                <span>سطح آموزشی / رشته</span>

                <strong>{studentUser.level || "-"}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <Users size={19} />
              </div>

              <div>
                <span>نام کاربری ورود</span>

                <strong className="admin-student-details-x9p4-ltr-value">
                  {studentUser.username}
                </strong>
              </div>
            </div>

            {/* Password */}

            <div className="admin-student-details-x9p4-info-card credentials-card">
              <div className="admin-student-details-x9p4-info-icon credentials-icon">
                <Lock size={19} />
              </div>

              <div className="admin-student-details-x9p4-credential-content">
                <span>رمز عبور حساب</span>

                <div className="student-password-view-row">
                  <strong className="student-password-val">
                    {studentUser.plain_password ? (
                      showPasswordState ? (
                        studentUser.plain_password
                      ) : (
                        "••••••••"
                      )
                    ) : (
                      <span className="admin-student-details-x9p4-password-empty">
                        ثبت‌نشده
                      </span>
                    )}
                  </strong>

                  {studentUser.plain_password && (
                    <div className="password-actions-inline">
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPasswordState((prev) => !prev)}
                        title={
                          showPasswordState ? "مخفی‌سازی رمز" : "نمایش رمز"
                        }
                      >
                        {showPasswordState ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>

                      <button
                        type="button"
                        className={`password-copy-btn ${
                          copiedPassword ? "copied" : ""
                        }`}
                        onClick={copyPassword}
                        title="کپی رمز عبور"
                      >
                        {copiedPassword ? (
                          <Check size={15} />
                        ) : (
                          <Copy size={15} />
                        )}

                        <span>{copiedPassword ? "کپی شد" : "کپی"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}

            {studentUser.address && (
              <div className="admin-student-details-x9p4-info-card admin-student-details-x9p4-address-card">
                <div className="admin-student-details-x9p4-info-icon">
                  <MapPin size={19} />
                </div>

                <div>
                  <span>آدرس محل سکونت</span>
                  <strong className="admin-student-details-x9p4-address">
                    {studentUser.address}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ======================================
            Enrollment Modal
        ======================================= */}

        {showEnrollModal && (
          <div
            className="exam-modal-backdrop"
            onClick={() => setShowEnrollModal(false)}
          >
            <div
              className="exam-modal-container admin-student-details-x9p4-modal"
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
                <div className="exam-modal-body admin-student-details-x9p4-modal-body">
                  <div className="class-form-group full-width">
                    <label>
                      انتخاب کلاس آموزشی
                      <span className="admin-student-details-x9p4-required">
                        *
                      </span>
                    </label>

                    <select
                      value={selectedClassToAdd}
                      onChange={(e) => setSelectedClassToAdd(e.target.value)}
                      required
                      className="admin-student-details-x9p4-select"
                    >
                      <option value="">انتخاب کلاس...</option>

                      {availableClassesToEnroll.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name} ( شهریه:{" "}
                          {toPersianDigits(
                            (classroom.tuition_fee || 2500000).toLocaleString(
                              "fa-IR",
                            ),
                          )}
                          تومان)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="class-form-group full-width">
                    <label className="admin-student-details-x9p4-checkbox-label">
                      <input
                        type="checkbox"
                        checked={initialPaidStatus}
                        onChange={(e) => setInitialPaidStatus(e.target.checked)}
                      />

                      <span>
                        شهریه این کلاس هم‌اکنون نقداً دریافت و تسویه شد.
                      </span>
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

        {/* ======================================
            Payment Modal
        ======================================= */}

        {paymentModalEnrollment && (
          <div
            className="exam-modal-backdrop"
            onClick={() => setPaymentModalEnrollment(null)}
          >
            <div
              className="exam-modal-container admin-student-details-x9p4-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div
                    className="exam-icon-circle"
                    style={{
                      background: "var(--green-5, #10b981)",
                    }}
                  >
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

              <div className="exam-modal-body admin-student-details-x9p4-modal-body">
                <div className="admin-student-details-x9p4-payment-summary">
                  <div>
                    <span>دانش‌آموز:</span>
                    <strong>{studentName}</strong>
                  </div>

                  <div>
                    <span>مبلغ مصوب شهریه:</span>

                    <strong className="admin-student-details-x9p4-price">
                      {toPersianDigits(
                        paymentModalEnrollment.tuitionFee.toLocaleString(
                          "fa-IR",
                        ),
                      )}{" "}
                      تومان
                    </strong>
                  </div>
                </div>

                <div className="class-form-group full-width">
                  <label>
                    توضیحات و شماره پیگیری / رسید
                    <span className="admin-student-details-x9p4-optional">
                      اختیاری
                    </span>
                  </label>

                  <input
                    type="text"
                    placeholder="مثال: پرداخت نقدی / کارتخوان آموزشگاه - شماره فیش ۱۲۳"
                    value={paymentNotesInput}
                    onChange={(e) => setPaymentNotesInput(e.target.value)}
                    className="admin-student-details-x9p4-input"
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
                  onClick={() =>
                    handleTogglePayment(
                      paymentModalEnrollment,
                      true,
                      paymentNotesInput,
                    )
                  }
                >
                  {updatingPayment ? "در حال ثبت..." : "تایید و ثبت تسویه"}
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}

        {/* ======================================
            Password Modal
        ======================================= */}

        {showChangePasswordModal && (
          <div
            className="exam-modal-backdrop"
            onClick={() => {
              if (!changingPasswordLoading) {
                setShowChangePasswordModal(false);
              }
            }}
          >
            <div
              className="exam-modal-container admin-student-details-x9p4-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="exam-icon-circle">
                    <KeyRound size={20} />
                  </div>

                  <div>
                    <h4>تغییر رمز عبور دانش‌آموز</h4>

                    <p>
                      {studentName} ({studentUser.username})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  disabled={changingPasswordLoading}
                  onClick={() => setShowChangePasswordModal(false)}
                  aria-label="بستن"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleChangePassword}>
                <div className="exam-modal-body admin-student-details-x9p4-modal-body">
                  {/* Password Field */}
                  <div className="secretary-student-form-field full">
                    <span>
                      رمز عبور جدید <b>*</b>
                    </span>

                    <div className="secretary-student-form-password-wrapper">
                      <input
                        type={showNewPasswordInModal ? "text" : "password"}
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="رمز عبور جدید را وارد کنید..."
                        required
                        minLength={4}
                        autoComplete="new-password"
                        dir="ltr"
                      />

                      <button
                        type="button"
                        className="secretary-student-form-icon-btn"
                        onClick={() =>
                          setShowNewPasswordInModal((prev) => !prev)
                        }
                        title={
                          showNewPasswordInModal ? "مخفی کردن رمز" : "نمایش رمز"
                        }
                      >
                        {showNewPasswordInModal ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>

                    <small
                      style={{
                        display: "block",
                        marginTop: "0.5rem",
                        color: "#8a9299",
                        fontSize: "0.72rem",
                        lineHeight: 1.7,
                      }}
                    ></small>
                  </div>

                  {/* Password Tools */}
                  <div className="secretary-student-form-password-actions full">
                    <div className="secretary-student-form-password-tools-content">
                      <div className="secretary-student-form-password-tools-title">
                        <div className="secretary-student-form-password-tools-icon">
                          <Lock size={17} />
                        </div>

                        <div>
                          <strong>ابزارهای رمز عبور</strong>
                        </div>
                      </div>

                      <div className="secretary-student-form-password-buttons">
                        {/* Generate Password */}
                        <button
                          type="button"
                          className="secretary-student-form-action-btn generate"
                          onClick={generatePassword}
                          disabled={changingPasswordLoading}
                        >
                          <span className="secretary-student-form-action-icon">
                            <RefreshCw size={16} />
                          </span>

                          <span className="secretary-student-form-action-text">
                            <strong>تولید رمز امن</strong>
                          </span>
                        </button>

                        {/* Copy Password */}
                        <button
                          type="button"
                          className={`secretary-student-form-action-btn copy ${
                            passwordCopied ? "copied" : ""
                          }`}
                          onClick={copyPassword}
                          disabled={
                            !newPasswordInput || changingPasswordLoading
                          }
                        >
                          <span className="secretary-student-form-action-icon">
                            {passwordCopied ? (
                              <Check size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
                          </span>

                          <span className="secretary-student-form-action-text">
                            <strong>
                              {passwordCopied ? "کپی شد" : "کپی رمز"}
                            </strong>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="exam-modal-footer">
                  <AnimatedButton
                    variant="secondary"
                    type="button"
                    disabled={changingPasswordLoading}
                    onClick={() => setShowChangePasswordModal(false)}
                  >
                    انصراف
                  </AnimatedButton>

                  <AnimatedButton
                    variant="primary"
                    type="submit"
                    disabled={
                      changingPasswordLoading || !newPasswordInput.trim()
                    }
                    icon={
                      changingPasswordLoading ? (
                        <RefreshCw size={17} />
                      ) : (
                        <Check size={17} />
                      )
                    }
                  >
                    {changingPasswordLoading
                      ? "در حال ذخیره..."
                      : "ثبت رمز جدید"}
                  </AnimatedButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AdminStudentDetails;
