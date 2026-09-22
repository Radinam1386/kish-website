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
  Printer,
  FileDown,
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

  // FIX:
  // قبلاً copiedPassword بدون setter تعریف شده بود
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [passwordCopied, setPasswordCopied] = useState(false);
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

  // ========================================
  // Clipboard Helper
  // ========================================

  const copyTextToClipboard = async (text) => {
    if (!text) return false;

    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      // Fallback برای بعضی مرورگرها / HTTP
      const textarea = document.createElement("textarea");

      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";

      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const successful = document.execCommand("copy");

      document.body.removeChild(textarea);

      return successful;
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      return false;
    }
  };

  // ========================================
  // Copy Password
  // ========================================

  const copyPassword = async () => {
    const password = newPasswordInput || studentUser?.plain_password || "";

    if (!password) {
      alert("رمزی برای کپی کردن وجود ندارد.");
      return;
    }

    const success = await copyTextToClipboard(password);

    if (success) {
      setPasswordCopied(true);
      setCopiedPassword(true);

      window.setTimeout(() => {
        setPasswordCopied(false);
        setCopiedPassword(false);
      }, 1800);
    } else {
      alert("کپی رمز عبور انجام نشد. لطفاً کپی را دستی انجام دهید.");
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
      setCopiedPassword(false);
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
  // HTML Escape برای PDF / Print
  // ========================================

  const escapeHtml = (value) => {
    if (value === null || value === undefined) return "";

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // ========================================
  // Export / Print PDF
  // ========================================

  const handleExportPDF = () => {
    if (!studentUser) return;

    const now = new Date();

    const printDate = now.toLocaleDateString("fa-IR");

    const password = studentUser.plain_password || "ثبت‌نشده";

    const classesRows =
      enrichedEnrollments.length > 0
        ? enrichedEnrollments
            .map(
              (enrollment) => `
                <tr>
                  <td>
                    <strong>${escapeHtml(enrollment.className)}</strong>
                    <br />
                    <small>${escapeHtml(enrollment.termName)}</small>
                  </td>

                  <td>
                    ${escapeHtml(enrollment.teacherName)}
                  </td>

                  <td>
                    ${escapeHtml(
                      toPersianDigits(
                        enrollment.tuitionFee.toLocaleString("fa-IR"),
                      ),
                    )}
                    تومان
                  </td>

                  <td>
                    <span class="${enrollment.is_paid ? "paid" : "unpaid"}">
                      ${
                        enrollment.is_paid
                          ? "پرداخت شده / تسویه"
                          : "در انتظار پرداخت"
                      }
                    </span>
                  </td>

                  <td>
                    ${
                      enrollment.paid_at
                        ? escapeHtml(toJalaliDateString(enrollment.paid_at))
                        : "-"
                    }
                  </td>

                  <td>
                    ${escapeHtml(enrollment.payment_notes || "-")}
                  </td>
                </tr>
              `,
            )
            .join("")
        : `
            <tr>
              <td colspan="6" class="empty">
                این دانش‌آموز در هیچ کلاسی ثبت‌نام نشده است.
              </td>
            </tr>
          `;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert(
        "پنجره چاپ باز نشد. لطفاً اجازه باز شدن Pop-up را برای سایت فعال کنید.",
      );
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
        <head>
          <meta charset="UTF-8" />

          <title>
            پرونده دانش‌آموز - ${escapeHtml(studentName)}
          </title>

          <style>
            @page {
              size: A4;
              margin: 12mm;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #17202a;
              font-family:
                Tahoma,
                Arial,
                "Segoe UI",
                sans-serif;
              direction: rtl;
            }

            body {
              font-size: 12px;
              line-height: 1.8;
            }

            .page {
              width: 100%;
              max-width: 100%;
              margin: 0 auto;
            }

            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 20px;
              padding-bottom: 16px;
              margin-bottom: 18px;
              border-bottom: 2px solid #202a35;
            }

            .brand {
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .brand-logo {
              width: 48px;
              height: 48px;
              border-radius: 12px;
              background: #202a35;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              font-weight: 900;
            }

            .brand h1 {
              margin: 0;
              font-size: 18px;
            }

            .brand p {
              margin: 2px 0 0;
              color: #68727d;
              font-size: 10px;
            }

            .print-meta {
              text-align: left;
              color: #68727d;
              font-size: 10px;
            }

            .student-header {
              border: 1px solid #dce2e8;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 16px;
              background: #f8fafc;
            }

            .student-header-top {
              display: flex;
              align-items: center;
              gap: 14px;
            }

            .avatar {
              width: 58px;
              height: 58px;
              border-radius: 50%;
              background: #202a35;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 22px;
              font-weight: 800;
              flex-shrink: 0;
            }

            .student-header h2 {
              margin: 0;
              font-size: 19px;
            }

            .student-header p {
              margin: 3px 0 0;
              color: #68727d;
            }

            .section {
              margin-top: 18px;
              page-break-inside: avoid;
            }

            .section-title {
              margin: 0 0 9px;
              padding-bottom: 7px;
              border-bottom: 1px solid #dfe4e8;
              font-size: 14px;
              font-weight: 800;
            }

            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
            }

            .info-item {
              border: 1px solid #e0e5e9;
              border-radius: 8px;
              padding: 9px 11px;
              min-height: 58px;
            }

            .info-item span {
              display: block;
              color: #7b858e;
              font-size: 9px;
              margin-bottom: 2px;
            }

            .info-item strong {
              display: block;
              font-size: 11px;
              color: #1c2732;
              word-break: break-word;
            }

            .stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
            }

            .stat {
              border: 1px solid #dfe4e8;
              border-radius: 9px;
              padding: 10px;
              text-align: center;
            }

            .stat-label {
              display: block;
              color: #747f88;
              font-size: 9px;
              margin-bottom: 3px;
            }

            .stat-value {
              display: block;
              font-size: 14px;
              font-weight: 900;
            }

            .stat-hint {
              display: block;
              color: #89929a;
              font-size: 8px;
              margin-top: 2px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 9px;
            }

            th {
              background: #202a35;
              color: #ffffff;
              font-weight: 700;
              padding: 7px 5px;
              border: 1px solid #202a35;
            }

            td {
              padding: 7px 5px;
              border: 1px solid #dfe4e8;
              vertical-align: middle;
              word-break: break-word;
            }

            tbody tr:nth-child(even) {
              background: #f8fafc;
            }

            .paid {
              color: #087443;
              font-weight: 800;
            }

            .unpaid {
              color: #b42318;
              font-weight: 800;
            }

            .empty {
              text-align: center;
              padding: 18px;
              color: #7b858e;
            }

            .credentials {
              direction: rtl;
            }

            .ltr {
              direction: ltr;
              text-align: right;
              font-family: Arial, sans-serif;
            }

            .footer {
              margin-top: 25px;
              padding-top: 10px;
              border-top: 1px solid #dfe4e8;
              display: flex;
              justify-content: space-between;
              color: #7b858e;
              font-size: 9px;
            }

            .no-print {
              display: none !important;
            }

            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .section {
                break-inside: avoid;
              }

              table {
                break-inside: auto;
              }

              tr {
                break-inside: avoid;
                break-after: auto;
              }
            }
          </style>
        </head>

        <body>
          <div class="page">

            <header class="header">
              <div class="brand">
                <div class="brand-logo">K</div>

                <div>
                  <h1>پرونده دانش‌آموز</h1>
                  <p>گزارش اطلاعات ثبت‌شده در سامانه آموزشگاه</p>
                </div>
              </div>

              <div class="print-meta">
                <div>تاریخ گزارش: ${escapeHtml(printDate)}</div>
                <div>شماره پرونده: ${escapeHtml(id)}</div>
              </div>
            </header>

            <section class="student-header">
              <div class="student-header-top">

                <div class="avatar">
                  ${escapeHtml(studentName?.charAt(0) || "؟")}
                </div>

                <div>
                  <h2>${escapeHtml(studentName)}</h2>

                  <p>
                    نام کاربری:
                    <strong class="ltr">
                      ${escapeHtml(studentUser.username || "-")}
                    </strong>
                  </p>
                </div>

              </div>
            </section>

            <section class="section">

              <h3 class="section-title">
                اطلاعات فردی و حساب کاربری
              </h3>

              <div class="info-grid">

                <div class="info-item">
                  <span>نام و نام خانوادگی</span>
                  <strong>${escapeHtml(studentName)}</strong>
                </div>

                <div class="info-item">
                  <span>کد ملی</span>
                  <strong>${escapeHtml(
                    studentUser.national_code || "-",
                  )}</strong>
                </div>

                <div class="info-item">
                  <span>تاریخ تولد</span>
                  <strong>
                    ${
                      studentUser.birth_date
                        ? escapeHtml(toJalaliDateString(studentUser.birth_date))
                        : "-"
                    }
                  </strong>
                </div>

                <div class="info-item">
                  <span>شماره تماس</span>
                  <strong class="ltr">
                    ${escapeHtml(studentUser.phone_number || "-")}
                  </strong>
                </div>

                <div class="info-item">
                  <span>ایمیل</span>
                  <strong class="ltr">
                    ${escapeHtml(studentUser.email || "-")}
                  </strong>
                </div>

                <div class="info-item">
                  <span>سطح آموزشی / رشته</span>
                  <strong>
                    ${escapeHtml(studentUser.level || "-")}
                  </strong>
                </div>

                <div class="info-item">
                  <span>نام کاربری</span>
                  <strong class="ltr">
                    ${escapeHtml(studentUser.username || "-")}
                  </strong>
                </div>

                <div class="info-item credentials">
                  <span>رمز عبور حساب</span>
                  <strong class="ltr">
                    ${escapeHtml(password)}
                  </strong>
                </div>

                ${
                  studentUser.address
                    ? `
                      <div class="info-item">
                        <span>آدرس محل سکونت</span>
                        <strong>
                          ${escapeHtml(studentUser.address)}
                        </strong>
                      </div>
                    `
                    : ""
                }

              </div>
            </section>
            <footer class="footer">
              <span>
                این گزارش از سامانه آموزشگاه تهیه شده است.
              </span>

              <span>
                ${escapeHtml(printDate)}
              </span>
            </footer>

          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 400);
            };

            window.onafterprint = function () {
              setTimeout(function () {
                window.close();
              }, 300);
            };
          </script>

        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
                />
              </Link>

              <div className="admin-student-details-x9p4-avatar">
                {studentName?.charAt(0) || "؟"}
              </div>

              <div className="admin-student-details-x9p4-heading-info">
                <h2>{studentName}</h2>

                <div className="admin-student-details-x9p4-subtitle">
                  <span>
                    نام کاربری:
                    {studentUser.parent_phone || studentUser.username || "-"}
                  </span>
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
            {/* Name */}

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <User size={19} />
              </div>

              <div>
                <span>نام و نام خانوادگی</span>
                <strong>{studentName}</strong>
              </div>
            </div>

            {/* National Code */}

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <Award size={19} />
              </div>

              <div>
                <span>کد ملی</span>
                <strong>{studentUser.national_code || "-"}</strong>
              </div>
            </div>

            {/* Birth Date */}

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

            {/* Phone */}

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

            {/* {bol} */}
            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <Phone size={19} />
              </div>

              <div>
                <span>شماره تماس والدین</span>

                <strong className="admin-student-details-x9p4-phone">
                  {studentUser.parent_phone || "-"}
                </strong>
              </div>
            </div>

            {/* Email */}

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

            {/* Level */}

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <BookOpen size={19} />
              </div>

              <div>
                <span>سطح آموزشی / رشته</span>

                <strong>{studentUser.level || "-"}</strong>
              </div>
            </div>

            {/* Username */}

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
            PRINT / PDF BUTTON
        ======================================= */}
        <div className="admin-teacher-details-x7k2-header">
          <div className="admin-student-details-x9p4-header-content">
            <div className="admin-student-details-x9p4-heading">
              <div className="term-icon-circle-admin">
                <FileDown size={24} />
              </div>
              <div className="admin-student-details-x9p4-print-info">
                <h3>خروجی پرونده دانش‌آموز</h3>

                <p>
                  اطلاعات فردی، کلاس‌ها، وضعیت شهریه و آمار حضور را برای چاپ یا
                  ذخیره به صورت PDF دریافت کنید.
                </p>
              </div>
            </div>
          </div>

          <div className="admin-student-details-x9p4-header-actions">
            <AnimatedButton onClick={handleExportPDF}>
              <Printer size={18} />
              <span>چاپ / خروجی PDF</span>
            </AnimatedButton>
          </div>
        </div>

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
                          {classroom.name}
                          {" ("}
                          شهریه:{" "}
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
                        {/* Generate */}

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

                        {/* Copy */}

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
