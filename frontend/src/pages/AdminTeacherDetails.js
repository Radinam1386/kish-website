import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  BookOpen,
  Users,
  CalendarDays,
  Clock3,
  Award,
  TrendingUp,
  Edit3,
  GraduationCap,
  MapPin,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  KeyRound,
  RefreshCw,
  X,
  FileDown,
  Printer,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";
import "./AdminTeacherDetails.css";
import StatCard from "../components/StatCard";

function AdminTeacherDetails() {
  const { teacherId } = useParams();
  const location = useLocation();

  const numericTeacherId = Number(teacherId);

  const isSecretary = location.pathname.includes("/secretary");

  const roleTitle = isSecretary ? "پنل منشی" : "پنل مدیریت";
  const menuType = isSecretary ? "secretary" : "admin";

  const basePath = isSecretary
    ? "/panel/secretary/teachers"
    : "/panel/admin/teachers";

  const [teacherUser, setTeacherUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     Password State
     ========================================================= */

  const [showPasswordState, setShowPasswordState] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [showChangePasswordModal, setShowChangePasswordModal] =
    useState(false);

  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showNewPasswordInModal, setShowNewPasswordInModal] = useState(false);
  const [changingPasswordLoading, setChangingPasswordLoading] =
    useState(false);

  /* =========================================================
     Generate Password
     ========================================================= */

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
    setCopiedPassword(false);
  };

  /* =========================================================
     Copy Password
     ========================================================= */

  const copyPassword = async () => {
    const password =
      newPasswordInput?.trim() || teacherUser?.plain_password?.trim();

    if (!password) {
      alert("رمز عبوری برای کپی وجود ندارد.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(password);
      } else {
        throw new Error("Clipboard API unavailable");
      }

      setCopiedPassword(true);

      window.setTimeout(() => {
        setCopiedPassword(false);
      }, 1800);
    } catch (error) {
      console.error("Password copy failed:", error);

      try {
        const textarea = document.createElement("textarea");

        textarea.value = password;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        const success = document.execCommand("copy");

        document.body.removeChild(textarea);

        if (!success) {
          throw new Error("Copy command failed");
        }

        setCopiedPassword(true);

        window.setTimeout(() => {
          setCopiedPassword(false);
        }, 1800);
      } catch (fallbackError) {
        console.error("Password fallback copy failed:", fallbackError);
        alert("کپی رمز عبور انجام نشد.");
      }
    }
  };

  /* =========================================================
     Change Password
     ========================================================= */

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

      await api.users.update(numericTeacherId, {
        password,
      });

      setTeacherUser((prev) => ({
        ...prev,
        plain_password: password,
      }));

      setShowPasswordState(true);
      setNewPasswordInput("");
      setShowNewPasswordInModal(false);
      setCopiedPassword(false);
      setShowChangePasswordModal(false);

      alert("رمز عبور مدرس با موفقیت به‌روزرسانی شد.");
    } catch (err) {
      console.error("Change teacher password failed:", err);

      alert(err?.message || "خطا در تغییر رمز عبور مدرس.");
    } finally {
      setChangingPasswordLoading(false);
    }
  };

  /* =========================================================
     Load Data
     ========================================================= */

  useEffect(() => {
    let alive = true;

    async function loadData() {
      if (!teacherId || Number.isNaN(numericTeacherId)) {
        setError("شناسه مدرس نامعتبر است.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          userData,
          classroomsData,
          termsData,
          submissionsData,
        ] = await Promise.all([
          api.users.get(numericTeacherId),
          api.classrooms.list(),
          api.terms.list(),
          api.submissions.list(),
        ]);

        if (!alive) return;

        setTeacherUser(userData);

        const teacherClasses = (classroomsData || []).filter((classroom) => {
          const classroomTeacherId =
            typeof classroom.teacher === "object"
              ? classroom.teacher?.id
              : classroom.teacher;

          return Number(classroomTeacherId) === numericTeacherId;
        });

        setClassrooms(teacherClasses);
        setTerms(termsData || []);
        setSubmissions(submissionsData || []);
      } catch (err) {
        if (alive) {
          setError(err?.message || "دریافت اطلاعات مدرس ناموفق بود.");
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
  }, [teacherId, numericTeacherId]);

  /* =========================================================
     Teacher Classes
     ========================================================= */

  const teacherClassesData = useMemo(() => {
    return classrooms.map((cls) => {
      const termId =
        typeof cls.term === "object" ? cls.term?.id : cls.term;

      const term = terms.find(
        (item) => Number(item.id) === Number(termId),
      );

      const studentCount =
        Number(cls.student_count) ||
        Number(cls.enrollments?.length) ||
        0;

      return {
        id: cls.id,
        name: cls.name || `کلاس ${cls.id}`,
        code: `کلاس ${cls.id}`,
        level: term?.name || "ترم جاری",
        students: studentCount,
        schedule:
          cls.schedule ||
          "روزهای زوج (شنبه، دوشنبه، چهارشنبه)",
        time:
          cls.time_slot ||
          "۱۶:۰۰ الی ۱۷:۳۰",
        status: term?.is_active
          ? "در حال اجرا"
          : "پایان یافته",
      };
    });
  }, [classrooms, terms]);

  /* =========================================================
     Statistics
     ========================================================= */

  const totalStudents = useMemo(() => {
    return classrooms.reduce((total, cls) => {
      const count =
        Number(cls.student_count) ||
        Number(cls.enrollments?.length) ||
        0;

      return total + count;
    }, 0);
  }, [classrooms]);

  const averageScore = useMemo(() => {
    const classIds = new Set(
      classrooms.map((classroom) => Number(classroom.id)),
    );

    const teacherSubmissions = submissions.filter((submission) => {
      const classroomId =
        submission.exam?.classroom ||
        submission.classroom;

      const normalizedId =
        typeof classroomId === "object"
          ? classroomId?.id
          : classroomId;

      return classIds.has(Number(normalizedId));
    });

    const graded = teacherSubmissions.filter(
      (submission) =>
        submission.total_score !== null &&
        submission.total_score !== undefined &&
        submission.total_score !== "",
    );

    if (!graded.length) {
      return "-";
    }

    const sum = graded.reduce(
      (acc, submission) =>
        acc + Number(submission.total_score || 0),
      0,
    );

    return (sum / graded.length).toFixed(1);
  }, [classrooms, submissions]);

  const teacherName =
    getFullName(teacherUser) || "مدرس";

  /* =========================================================
     Stats
     ========================================================= */

  const stats = [
    {
      id: 1,
      title: "کلاس‌های فعال",
      value: `${classrooms.length} کلاس`,
      icon: <BookOpen size={22} />,
      type: "red",
    },
    {
      id: 2,
      title: "دانش‌آموزان",
      value: `${toPersianDigits(totalStudents)} نفر`,
      icon: <Users size={22} />,
      type: "green",
    },
    {
      id: 3,
      title: "میانگین نمرات",
      value:
        averageScore === "-"
          ? "-"
          : toPersianDigits(averageScore),
      icon: <Award size={22} />,
      type: "blue",
    },
    {
      id: 4,
      title: "وضعیت حساب",
      value: teacherUser?.is_active ? "فعال" : "غیرفعال",
      icon: <TrendingUp size={22} />,
      type: "orange",
    },
  ];

  /* =========================================================
     Escape HTML
     ========================================================= */

  const escapeHtml = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  /* =========================================================
     Export Teacher PDF
     ========================================================= */

  const handleExportPDF = () => {
    if (!teacherUser) {
      return;
    }

    const now = new Date();

    const printDate = now.toLocaleDateString("fa-IR");

    const password =
      teacherUser.plain_password || "ثبت‌نشده";

    const classesRows =
      teacherClassesData.length > 0
        ? teacherClassesData
            .map(
              (item) => `
                <tr>
                  <td>
                    <strong>${escapeHtml(item.name)}</strong>
                    <br />
                    <small>${escapeHtml(item.level)}</small>
                  </td>

                  <td>
                    ${escapeHtml(item.code)}
                  </td>

                  <td>
                    ${escapeHtml(
                      toPersianDigits(item.students),
                    )}
                    نفر
                  </td>

                  <td>
                    ${escapeHtml(item.schedule)}
                  </td>

                  <td>
                    ${escapeHtml(item.time)}
                  </td>

                  <td>
                    <span
                      class="${
                        item.status === "در حال اجرا"
                          ? "active"
                          : "inactive"
                      }"
                    >
                      ${escapeHtml(item.status)}
                    </span>
                  </td>
                </tr>
              `,
            )
            .join("")
        : `
            <tr>
              <td colspan="6" class="empty">
                هیچ کلاسی برای این مدرس ثبت نشده است.
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
            پرونده مدرس - ${escapeHtml(teacherName)}
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

            .teacher-header {
              border: 1px solid #dce2e8;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 16px;
              background: #f8fafc;
            }

            .teacher-header-top {
              display: flex;
              align-items: center;
              gap: 14px;
            }

            .avatar {
              width: 58px;
              height: 58px;
              border-radius: 50%;
              background: #202a35;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 22px;
              font-weight: 800;
              flex-shrink: 0;
            }

            .teacher-header h2 {
              margin: 0;
              font-size: 19px;
            }

            .teacher-header p {
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

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 8.5px;
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

            .active {
              color: #087443;
              font-weight: 800;
            }

            .inactive {
              color: #b42318;
              font-weight: 800;
            }

            .empty {
              text-align: center;
              padding: 18px;
              color: #7b858e;
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
                <div class="brand-logo">
                  K
                </div>

                <div>
                  <h1>
                    پرونده مدرس
                  </h1>

                  <p>
                    گزارش اطلاعات ثبت‌شده در سامانه آموزشگاه
                  </p>
                </div>
              </div>

              <div class="print-meta">
                <div>
                  تاریخ گزارش:
                  ${escapeHtml(printDate)}
                </div>

                <div>
                  شناسه مدرس:
                  ${escapeHtml(teacherId)}
                </div>
              </div>
            </header>

            <section class="teacher-header">
              <div class="teacher-header-top">

                <div class="avatar">
                  ${escapeHtml(
                    teacherName?.charAt(0) || "م",
                  )}
                </div>

                <div>
                  <h2>
                    ${escapeHtml(teacherName)}
                  </h2>

                  <p>
                    نام کاربری:
                    <strong class="ltr">
                      ${escapeHtml(
                        teacherUser.username || "-",
                      )}
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
                  <span>
                    نام و نام خانوادگی
                  </span>

                  <strong>
                    ${escapeHtml(teacherName)}
                  </strong>
                </div>

                <div class="info-item">
                  <span>
                    کد ملی
                  </span>

                  <strong>
                    ${escapeHtml(
                      teacherUser.national_code || "-",
                    )}
                  </strong>
                </div>

                <div class="info-item">
                  <span>
                    تاریخ تولد
                  </span>

                  <strong>
                    ${
                      teacherUser.birth_date
                        ? escapeHtml(
                            toJalaliDateString(
                              teacherUser.birth_date,
                            ),
                          )
                        : "-"
                    }
                  </strong>
                </div>

                <div class="info-item">
                  <span>
                    شماره تماس
                  </span>

                  <strong class="ltr">
                    ${escapeHtml(
                      teacherUser.phone_number || "-",
                    )}
                  </strong>
                </div>

                <div class="info-item">
                  <span>
                    ایمیل
                  </span>

                  <strong class="ltr">
                    ${escapeHtml(
                      teacherUser.email || "-",
                    )}
                  </strong>
                </div>

                <div class="info-item">
                  <span>
                    رشته / تخصص تدریس
                  </span>

                  <strong>
                    ${escapeHtml(
                      teacherUser.level || "-",
                    )}
                  </strong>
                </div>

                <div class="info-item">
                  <span>
                    نام کاربری
                  </span>

                  <strong class="ltr">
                    ${escapeHtml(
                      teacherUser.username || "-",
                    )}
                  </strong>
                </div>

                <div class="info-item">
                  <span>
                    وضعیت حساب
                  </span>

                  <strong>
                    ${
                      teacherUser.is_active
                        ? "فعال"
                        : "غیرفعال"
                    }
                  </strong>
                </div>

                <div class="info-item">
                  <span>
                    رمز عبور حساب
                  </span>

                  <strong class="ltr">
                    ${escapeHtml(password)}
                  </strong>
                </div>

                ${
                  teacherUser.address
                    ? `
                      <div
                        class="info-item"
                        style="grid-column: 1 / -1;"
                      >
                        <span>
                          آدرس محل سکونت
                        </span>

                        <strong>
                          ${escapeHtml(
                            teacherUser.address,
                          )}
                        </strong>
                      </div>
                    `
                    : ""
                }

              </div>
            </section>

            <section class="section">

              <h3 class="section-title">
                آمار مدرس
              </h3>

              <div class="stats">

                <div class="stat">
                  <span class="stat-label">
                    تعداد کلاس‌ها
                  </span>

                  <span class="stat-value">
                    ${escapeHtml(
                      toPersianDigits(
                        classrooms.length,
                      ),
                    )}
                  </span>
                </div>

                <div class="stat">
                  <span class="stat-label">
                    تعداد دانش‌آموزان
                  </span>

                  <span class="stat-value">
                    ${escapeHtml(
                      toPersianDigits(
                        totalStudents,
                      ),
                    )}
                  </span>
                </div>

                <div class="stat">
                  <span class="stat-label">
                    میانگین نمرات
                  </span>

                  <span class="stat-value">
                    ${escapeHtml(
                      averageScore === "-"
                        ? "-"
                        : toPersianDigits(
                            averageScore,
                          ),
                    )}
                  </span>
                </div>

                <div class="stat">
                  <span class="stat-label">
                    وضعیت حساب
                  </span>

                  <span class="stat-value">
                    ${
                      teacherUser.is_active
                        ? "فعال"
                        : "غیرفعال"
                    }
                  </span>
                </div>

              </div>
            </section>

            <section class="section">

              <h3 class="section-title">
                کلاس‌های مدرس
              </h3>

              <table>

                <thead>
                  <tr>
                    <th>کلاس / ترم</th>
                    <th>شناسه</th>
                    <th>دانش‌آموزان</th>
                    <th>برنامه</th>
                    <th>ساعت</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>

                <tbody>
                  ${classesRows}
                </tbody>

              </table>
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

  /* =========================================================
     Loading
     ========================================================= */

  if (loading) {
    return (
      <DashboardLayout
        role={roleTitle}
        title="جزئیات مدرس"
        menuType={menuType}
      >
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
          }}
        >
          در حال بارگذاری اطلاعات مدرس...
        </div>
      </DashboardLayout>
    );
  }

  /* =========================================================
     Error
     ========================================================= */

  if (error || !teacherUser) {
    return (
      <DashboardLayout
        role={roleTitle}
        title="جزئیات مدرس"
        menuType={menuType}
      >
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "var(--danger, #ef4444)",
              marginBottom: "1rem",
            }}
          >
            {error || "مدرس یافت نشد."}
          </p>

          <Link to={basePath}>
            <AnimatedButton variant="primary">
              بازگشت به لیست مدرس‌ها
            </AnimatedButton>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  /* =========================================================
     Main
     ========================================================= */

  return (
    <DashboardLayout
      role={roleTitle}
      title={`جزئیات ${teacherName}`}
      menuType={menuType}
    >
      <div className="admin-teacher-details-x7k2-page">

        {/* =====================================================
            Header
            ===================================================== */}

        <div className="admin-teacher-details-x7k2-header">

          <div className="admin-teacher-details-x7k2-header-right">

            <Link to={basePath}>
              <AnimatedButton
                variant="secondary"
                size="small"
                icon={<ArrowRight size={18} />}
              />
            </Link>

            <div className="admin-teacher-details-x7k2-avatar">
              {teacherName.charAt(0)}
            </div>

            <div className="admin-teacher-details-x7k2-heading">

              <div className="admin-teacher-details-x7k2-name-row">
                <h2>
                  {teacherName}
                </h2>
              </div>

              <p>
                {teacherUser.email || "بدون ایمیل"}
              </p>

              <span className="admin-teacher-details-x7k2-teacher-id">
                شناسه کاربری:{" "}
                {teacherUser.username || "-"}
              </span>

            </div>
          </div>

          <Link
            to={`${basePath}/${teacherId}/edit`}
          >
            <AnimatedButton variant="primary">
              <Edit3 size={17} />
              ویرایش اطلاعات
            </AnimatedButton>
          </Link>

        </div>

        {/* =====================================================
            Stats
            ===================================================== */}

        <div className="admin-teacher-details-x7k2-stats">

          {stats.map((stat) => (
            <StatCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              hint={stat.hint}
              icon={stat.icon}
              color={stat.type}
            />
          ))}

        </div>

        {/* =====================================================
            Personal Information
            ===================================================== */}

        <section className="admin-teacher-details-x7k2-section">

          <div
            className="admin-teacher-details-x7k2-section-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >

            <div>

              <h3>
                <User size={20} />
                اطلاعات و مشخصات مدرس
              </h3>

              <p>
                اطلاعات فردی، ارتباطی و حساب کاربری مدرس
              </p>

            </div>

            <AnimatedButton
              variant="secondary"
              size="small"
              onClick={() => {
                setNewPasswordInput(
                  teacherUser.plain_password || "",
                );
                setShowNewPasswordInModal(false);
                setCopiedPassword(false);
                setShowChangePasswordModal(true);
              }}
            >
              <KeyRound size={16} />
              <span>
                تغییر / تنظیم رمز عبور
              </span>
            </AnimatedButton>

          </div>

          <div className="admin-teacher-details-x7k2-info-grid">

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <User size={18} />
              </div>

              <div>
                <span>نام و نام خانوادگی</span>
                <strong>{teacherName}</strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <Award size={18} />
              </div>

              <div>
                <span>کد ملی</span>
                <strong>
                  {teacherUser.national_code || "-"}
                </strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <Calendar size={18} />
              </div>

              <div>
                <span>تاریخ تولد (شمسی)</span>

                <strong>
                  {teacherUser.birth_date
                    ? toJalaliDateString(
                        teacherUser.birth_date,
                      )
                    : "-"}
                </strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <Phone size={18} />
              </div>

              <div>
                <span>شماره تماس</span>

                <strong className="admin-teacher-details-x7k2-ltr">
                  {teacherUser.phone_number || "-"}
                </strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <Mail size={18} />
              </div>

              <div>
                <span>ایمیل</span>

                <strong className="admin-teacher-details-x7k2-email">
                  {teacherUser.email || "-"}
                </strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <BookOpen size={18} />
              </div>

              <div>
                <span>رشته / تخصص تدریس</span>

                <strong>
                  {teacherUser.level || "-"}
                </strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <GraduationCap size={18} />
              </div>

              <div>
                <span>نام کاربری</span>

                <strong
                  style={{
                    direction: "ltr",
                    display: "inline-block",
                  }}
                >
                  {teacherUser.username || "-"}
                </strong>
              </div>
            </div>

            {/* =================================================
                Password
                ================================================= */}

            <div
              className="admin-teacher-details-x7k2-info-card"
              style={{
                background: "#fffaf9",
                borderColor: "rgba(231, 76, 60, 0.2)",
              }}
            >

              <div
                className="admin-teacher-details-x7k2-info-icon"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                  color: "#fff",
                }}
              >
                <Lock size={18} />
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >

                <span>
                  رمز عبور حساب
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    marginTop: "0.2rem",
                    flexWrap: "wrap",
                  }}
                >

                  <strong
                    style={{
                      fontFamily:
                        "monospace, sans-serif",
                      fontSize: "0.95rem",
                      direction: "ltr",
                      minWidth: 0,
                      wordBreak: "break-all",
                    }}
                  >
                    {teacherUser.plain_password ? (
                      showPasswordState ? (
                        teacherUser.plain_password
                      ) : (
                        "••••••••"
                      )
                    ) : (
                      <span
                        style={{
                          color: "#95a5a6",
                          fontSize: "0.8rem",
                        }}
                      >
                        تعیین نشده
                      </span>
                    )}
                  </strong>

                  {teacherUser.plain_password && (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.3rem",
                        flexShrink: 0,
                      }}
                    >

                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswordState(
                            (prev) => !prev,
                          )
                        }
                        aria-label={
                          showPasswordState
                            ? "مخفی کردن رمز"
                            : "نمایش رمز"
                        }
                        style={{
                          background: "#fff",
                          border:
                            "1px solid #eceff3",
                          borderRadius: "6px",
                          width: "28px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        {showPasswordState ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={copyPassword}
                        style={{
                          background: copiedPassword
                            ? "#edf8f1"
                            : "#fff",
                          color: copiedPassword
                            ? "#2e8b57"
                            : "#2d3436",
                          border: `1px solid ${
                            copiedPassword
                              ? "#2e8b57"
                              : "#eceff3"
                          }`,
                          borderRadius: "6px",
                          padding: "0 0.5rem",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.2rem",
                          fontSize: "0.74rem",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        {copiedPassword ? (
                          <Check size={13} />
                        ) : (
                          <Copy size={13} />
                        )}

                        <span>
                          {copiedPassword
                            ? "کپی شد"
                            : "کپی"}
                        </span>
                      </button>

                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* =================================================
                Address
                ================================================= */}

            {teacherUser.address && (
              <div
                className="admin-teacher-details-x7k2-info-card"
                style={{
                  gridColumn: "1 / -1",
                }}
              >

                <div className="admin-teacher-details-x7k2-info-icon">
                  <MapPin size={18} />
                </div>

                <div>
                  <span>
                    آدرس محل سکونت
                  </span>

                  <strong>
                    {teacherUser.address}
                  </strong>
                </div>

              </div>
            )}

          </div>
        </section>

        {/* =====================================================
            Classes
            ===================================================== */}

        <section className="admin-teacher-details-x7k2-section">

          <div className="admin-teacher-details-x7k2-section-header">

            <div>

              <h3>
                <BookOpen size={20} />
                کلاس‌های مدرس
              </h3>

              <p>
                لیست کلاس‌هایی که توسط این مدرس برگزار می‌شوند
              </p>

            </div>

            <span className="admin-teacher-details-x7k2-count-badge">
              {toPersianDigits(
                teacherClassesData.length,
              )}{" "}
              کلاس
            </span>

          </div>

          <div className="admin-teacher-details-x7k2-class-grid">

            {teacherClassesData.length > 0 ? (
              teacherClassesData.map((item) => (
                <Link
                  key={item.id}
                  to={`/panel/${menuType}/classes/${item.id}`}
                  style={{
                    textDecoration: "none",
                  }}
                >
                  <div className="admin-teacher-details-x7k2-class-card">

                    <div className="admin-teacher-details-x7k2-class-top">

                      <div>

                        <span className="admin-teacher-details-x7k2-class-level">
                          {item.level}
                        </span>

                        <h4>
                          {item.name}
                        </h4>

                        <span className="admin-teacher-details-x7k2-class-code">
                          {item.code}
                        </span>

                      </div>

                      <span className="admin-teacher-details-x7k2-class-status">
                        {item.status}
                      </span>

                    </div>

                    <div className="admin-teacher-details-x7k2-class-details">

                      <div>
                        <Users size={16} />

                        <span>
                          {toPersianDigits(
                            item.students,
                          )}{" "}
                          دانش‌آموز
                        </span>
                      </div>

                      <div>
                        <CalendarDays size={16} />

                        <span>
                          {item.schedule}
                        </span>
                      </div>

                      <div>
                        <Clock3 size={16} />

                        <span>
                          {item.time}
                        </span>
                      </div>

                    </div>

                  </div>
                </Link>
              ))
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "1.5rem",
                  color: "var(--muted, #888)",
                  gridColumn: "1 / -1",
                }}
              >
                هیچ کلاسی برای این مدرس ثبت نشده است.
              </div>
            )}

          </div>
        </section>

        {/* =====================================================
            Print / PDF
            ===================================================== */}

        <section className="admin-student-details-x9p4-print-section">
          <div className="admin-student-details-x9p4-print-content">

            <div className="term-icon-circle-admin">
              <FileDown size={24} />
            </div>

            <div className="admin-student-details-x9p4-print-info">

              <h3>
                خروجی پرونده مدرس
              </h3>

              <p>
                اطلاعات فردی، حساب کاربری، کلاس‌ها و
                آمار مدرس را برای چاپ یا ذخیره به صورت
                PDF دریافت کنید.
              </p>

            </div>

            <AnimatedButton
              onClick={handleExportPDF}
            >
              <Printer size={18} />
              <span>
                چاپ / خروجی PDF
              </span>
            </AnimatedButton>

          </div>
        </section>

        {/* =====================================================
            Change Password Modal
            ===================================================== */}

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
              className="exam-modal-container"
              style={{
                maxWidth: "480px",
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="exam-modal-header">

                <div className="modal-header-info">

                  <div className="exam-icon-circle">
                    <KeyRound size={20} />
                  </div>

                  <div>

                    <h4>
                      تغییر یا تنظیم رمز عبور
                    </h4>

                    <p>
                      مدرس: {teacherName} (
                      {teacherUser.username || "-"})
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  disabled={
                    changingPasswordLoading
                  }
                  onClick={() =>
                    setShowChangePasswordModal(
                      false,
                    )
                  }
                >
                  <X size={20} />
                </button>

              </div>

              <form
                onSubmit={handleChangePassword}
              >

                <div
                  className="exam-modal-body"
                  style={{
                    padding: "1.5rem",
                  }}
                >

                  <div
                    className="class-form-group full-width"
                    style={{
                      marginBottom: "1rem",
                    }}
                  >

                    <label
                      style={{
                        fontWeight: "700",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      رمز عبور جدید مدرس{" "}
                      <span
                        style={{
                          color: "red",
                        }}
                      >
                        *
                      </span>
                    </label>

                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >

                      <input
                        type={
                          showNewPasswordInModal
                            ? "text"
                            : "password"
                        }
                        value={newPasswordInput}
                        onChange={(e) =>
                          setNewPasswordInput(
                            e.target.value,
                          )
                        }
                        required
                        minLength={4}
                        autoComplete="new-password"
                        placeholder="رمز عبور جدید را وارد کنید"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          paddingLeft: "2.75rem",
                          borderRadius: "10px",
                          border:
                            "1px solid oklch(85% 0 0)",
                          fontFamily: "inherit",
                          fontSize: "0.95rem",
                          direction: "ltr",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPasswordInModal(
                            (prev) => !prev,
                          )
                        }
                        style={{
                          position: "absolute",
                          left: "0.5rem",
                          background:
                            "transparent",
                          border: "none",
                          color: "#7f8c8d",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "center",
                        }}
                      >
                        {showNewPasswordInModal ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>

                    </div>
                  </div>
                </div>

                {/* =================================================
                    Password Tools
                    ================================================= */}

                <div className="secretary-student-form-password-actions full">

                  <div className="secretary-student-form-password-tools-content">

                    <div className="secretary-student-form-password-tools-title">

                      <div className="secretary-student-form-password-tools-icon">
                        <Lock size={17} />
                      </div>

                      <div>
                        <strong>
                          ابزارهای رمز عبور
                        </strong>
                      </div>

                    </div>

                    <div className="secretary-student-form-password-buttons">

                      <button
                        type="button"
                        className="secretary-student-form-action-btn generate"
                        onClick={generatePassword}
                        disabled={
                          changingPasswordLoading
                        }
                      >
                        <span className="secretary-student-form-action-icon">
                          <RefreshCw size={16} />
                        </span>

                        <span className="secretary-student-form-action-text">
                          <strong>
                            تولید رمز امن
                          </strong>
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`secretary-student-form-action-btn copy ${
                          copiedPassword
                            ? "copied"
                            : ""
                        }`}
                        onClick={copyPassword}
                        disabled={
                          !newPasswordInput ||
                          changingPasswordLoading
                        }
                      >
                        <span className="secretary-student-form-action-icon">

                          {copiedPassword ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}

                        </span>

                        <span className="secretary-student-form-action-text">

                          <strong>
                            {copiedPassword
                              ? "کپی شد"
                              : "کپی رمز"}
                          </strong>

                        </span>
                      </button>

                    </div>
                  </div>
                </div>

                {/* =================================================
                    Modal Footer
                    ================================================= */}

                <div className="exam-modal-footer">

                  <AnimatedButton
                    variant="secondary"
                    type="button"
                    disabled={
                      changingPasswordLoading
                    }
                    onClick={() =>
                      setShowChangePasswordModal(
                        false,
                      )
                    }
                  >
                    انصراف
                  </AnimatedButton>

                  <AnimatedButton
                    variant="primary"
                    type="submit"
                    disabled={
                      changingPasswordLoading ||
                      !newPasswordInput.trim()
                    }
                  >
                    {changingPasswordLoading
                      ? "در حال ذخیره..."
                      : "ثبت و تغییر رمز"}
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

export default AdminTeacherDetails;
