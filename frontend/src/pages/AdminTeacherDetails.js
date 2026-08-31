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
  const [showPasswordState, setShowPasswordState] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Change Password Modal
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showNewPasswordInModal, setShowNewPasswordInModal] = useState(false);
  const [changingPasswordLoading, setChangingPasswordLoading] = useState(false);

  const copyPassword = () => {
    if (!teacherUser?.plain_password) return;
    navigator.clipboard.writeText(teacherUser.plain_password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789#@!";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(pwd);
    setShowNewPasswordInModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.trim().length < 4) {
      alert("رمز عبور باید حداقل ۴ کاراکتر باشد.");
      return;
    }

    try {
      setChangingPasswordLoading(true);
      await api.users.update(teacherId, {
        password: newPasswordInput.trim(),
      });

      setTeacherUser((prev) => ({
        ...prev,
        plain_password: newPasswordInput.trim(),
      }));

      setShowChangePasswordModal(false);
      alert("رمز عبور استاد با موفقیت به‌روزرسانی شد.");
    } catch (err) {
      alert(err.message || "خطا در تغییر رمز عبور استاد");
    } finally {
      setChangingPasswordLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    async function loadData() {
      if (!teacherId) return;

      try {
        setLoading(true);
        setError("");

        const [userData, classroomsData, termsData, submissionsData] =
          await Promise.all([
            api.users.get(teacherId),
            api.classrooms.list(),
            api.terms.list(),
            api.submissions.list(),
          ]);

        if (!alive) return;

        setTeacherUser(userData);
        const teacherClasses = (classroomsData || []).filter(
          (c) =>
            c.teacher === Number(teacherId) ||
            c.teacher?.id === Number(teacherId),
        );
        setClassrooms(teacherClasses);
        setTerms(termsData || []);
        setSubmissions(submissionsData || []);
      } catch (err) {
        if (alive) setError(err.message || "دریافت اطلاعات معلم ناموفق بود.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, [teacherId]);

  const teacherClassesData = useMemo(() => {
    return classrooms.map((cls) => {
      const term = terms.find((t) => t.id === (cls.term || cls.term?.id));
      return {
        id: cls.id,
        name: cls.name,
        code: `کلاس ${cls.id}`,
        level: term?.name || "ترم جاری",
        students: `${cls.student_count || cls.enrollments?.length || 0}`,
        schedule: cls.schedule || "روزهای زوج (شنبه، دوشنبه، چهارشنبه)",
        time: cls.time_slot || "۱۶:۰۰ الی ۱۷:۳۰",
        status: term?.is_active ? "در حال اجرا" : "پایان یافته",
      };
    });
  }, [classrooms, terms]);

  const totalStudents = useMemo(() => {
    return classrooms.reduce(
      (total, cls) => total + (cls.student_count || 0),
      0,
    );
  }, [classrooms]);

  const averageScore = useMemo(() => {
    const classIds = new Set(classrooms.map((c) => c.id));
    const teacherSubmissions = submissions.filter((s) =>
      classIds.has(s.exam?.classroom || s.classroom),
    );
    const graded = teacherSubmissions.filter(
      (s) => s.total_score !== null && s.total_score !== undefined,
    );
    if (!graded.length) return "-";
    const sum = graded.reduce((acc, s) => acc + Number(s.total_score || 0), 0);
    return (sum / graded.length).toFixed(1);
  }, [classrooms, submissions]);

  const teacherName = getFullName(teacherUser);

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
      value: `${totalStudents} نفر`,
      icon: <Users size={22} />,
      type: "green",
    },
    {
      id: 3,
      title: "میانگین نمرات",
      value: averageScore,
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

  if (loading) {
    return (
      <DashboardLayout role="پنل مدیریت" title="جزئیات معلم" menuType="admin">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          در حال بارگذاری اطلاعات مدرس...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !teacherUser) {
    return (
      <DashboardLayout role={roleTitle} title="جزئیات معلم" menuType={menuType}>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--danger, #ef4444)", marginBottom: "1rem" }}>
            {error || "معلم یافت نشد."}
          </p>
          <Link to={basePath}>
            <AnimatedButton variant="primary">
              بازگشت به لیست معلمان
            </AnimatedButton>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role={roleTitle}
      title={`جزئیات ${teacherName}`}
      menuType={menuType}
    >
      <div className="admin-teacher-details-x7k2-page">
        <div className="admin-teacher-details-x7k2-header">
          <div className="admin-teacher-details-x7k2-header-right">
            <Link
              to={basePath}
            >
              <AnimatedButton
                variant="secondary"
                size="small"
                icon={<ArrowRight size={18} />}
              ></AnimatedButton>
            </Link>

            <div className="admin-teacher-details-x7k2-avatar">
              {teacherName.charAt(0)}
            </div>

            <div className="admin-teacher-details-x7k2-heading">
              <div className="admin-teacher-details-x7k2-name-row">
                <h2>{teacherName}</h2>
              </div>

              <p>{teacherUser.email || "بدون ایمیل"}</p>

              <span className="admin-teacher-details-x7k2-teacher-id">
                شناسه کاربری: {teacherUser.username}
              </span>
            </div>
          </div>

          <Link to={`${basePath}/${teacherId}/edit`}>
            <AnimatedButton variant="primary">
              <Edit3 size={17} />
              ویرایش اطلاعات
            </AnimatedButton>
          </Link>
        </div>
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

        {/* ================= Personal Information ================= */}

        <section className="admin-teacher-details-x7k2-section">
          <div className="admin-teacher-details-x7k2-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3>
                <User size={20} />
                اطلاعات و مشخصات مدرس
              </h3>

              <p>اطلاعات فردی، ارتباطی و کلمه عبور ثبت‌شده مدرس جهت استفاده منشی و مدیریت</p>
            </div>

            <button
              type="button"
              className="teacher-credentials-edit-btn"
              onClick={() => {
                setNewPasswordInput("");
                setShowChangePasswordModal(true);
              }}
            >
              <KeyRound size={16} />
              <span>تغییر / تنظیم رمز عبور جدید</span>
            </button>
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
                <strong>{teacherUser.national_code || "-"}</strong>
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
                    ? toJalaliDateString(teacherUser.birth_date)
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
                <strong>{teacherUser.level || "-"}</strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <GraduationCap size={18} />
              </div>

              <div>
                <span>نام کاربری</span>
                <strong style={{ direction: "ltr", display: "inline-block" }}>{teacherUser.username}</strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card" style={{ background: "#fffaf9", borderColor: "rgba(231, 76, 60, 0.2)" }}>
              <div className="admin-teacher-details-x7k2-info-icon" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "#fff" }}>
                <Lock size={18} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span>رمز عبور حساب</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginTop: "0.2rem" }}>
                  <strong style={{ fontFamily: "monospace, sans-serif", fontSize: "0.95rem" }}>
                    {teacherUser.plain_password ? (
                      showPasswordState ? teacherUser.plain_password : "••••••••"
                    ) : (
                      <span style={{ color: "#95a5a6", fontSize: "0.8rem" }}>تعیین نشده</span>
                    )}
                  </strong>
                  {teacherUser.plain_password && (
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <button
                        type="button"
                        onClick={() => setShowPasswordState((p) => !p)}
                        style={{
                          background: "#fff",
                          border: "1px solid #eceff3",
                          borderRadius: "6px",
                          width: "28px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        {showPasswordState ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={copyPassword}
                        style={{
                          background: copiedPassword ? "#edf8f1" : "#fff",
                          color: copiedPassword ? "#2e8b57" : "#2d3436",
                          border: `1px solid ${copiedPassword ? "#2e8b57" : "#eceff3"}`,
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
                        {copiedPassword ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedPassword ? "کپی شد" : "کپی"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {teacherUser.address && (
              <div className="admin-teacher-details-x7k2-info-card" style={{ gridColumn: "1 / -1" }}>
                <div className="admin-teacher-details-x7k2-info-icon">
                  <MapPin size={18} />
                </div>

                <div>
                  <span>آدرس محل سکونت</span>
                  <strong>{teacherUser.address}</strong>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= Classes ================= */}

        <section className="admin-teacher-details-x7k2-section">
          <div className="admin-teacher-details-x7k2-section-header">
            <div>
              <h3>
                <BookOpen size={20} />
                کلاس‌های مدرس
              </h3>

              <p>لیست کلاس‌هایی که توسط این مدرس برگزار می‌شوند</p>
            </div>

            <span className="admin-teacher-details-x7k2-count-badge">
              {teacherClassesData.length} کلاس
            </span>
          </div>

          <div className="admin-teacher-details-x7k2-class-grid">
            {teacherClassesData.length > 0 ? (
              teacherClassesData.map((item) => (
                <Link
                  key={item.id}
                  to={`/panel/${menuType}/classes/${item.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div className="admin-teacher-details-x7k2-class-card">
                    <div className="admin-teacher-details-x7k2-class-top">
                      <div>
                        <span className="admin-teacher-details-x7k2-class-level">
                          {item.level}
                        </span>

                        <h4>{item.name}</h4>

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
                        <span>{toPersianDigits(item.students)} دانش‌آموز</span>
                      </div>

                      <div>
                        <CalendarDays size={16} />
                        <span>{item.schedule}</span>
                      </div>

                      <div>
                        <Clock3 size={16} />
                        <span>{item.time}</span>
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
        {/* Modal: Change / Reset Teacher Password */}
        {showChangePasswordModal && (
          <div
            className="exam-modal-backdrop"
            onClick={() => setShowChangePasswordModal(false)}
          >
            <div
              className="exam-modal-container"
              style={{ maxWidth: "480px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="exam-icon-circle">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h4>تغییر یا تنظیم رمز عبور جدید</h4>
                    <p>مدرس: {teacherName} ({teacherUser.username})</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowChangePasswordModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleChangePassword}>
                <div className="exam-modal-body" style={{ padding: "1.5rem" }}>
                  <div className="class-form-group full-width" style={{ marginBottom: "1rem" }}>
                    <label style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block" }}>
                      رمز عبور جدید مدرس <span style={{ color: "red" }}>*</span>
                    </label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showNewPasswordInModal ? "text" : "password"}
                        placeholder="حداقل ۴ کاراکتر یا تولید رمز تصادفی..."
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          paddingLeft: "2.75rem",
                          borderRadius: "10px",
                          border: "1px solid oklch(85% 0 0)",
                          fontFamily: "inherit",
                          fontSize: "0.95rem",
                          direction: "ltr",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPasswordInModal((p) => !p)}
                        style={{
                          position: "absolute",
                          left: "0.5rem",
                          background: "transparent",
                          border: "none",
                          color: "#7f8c8d",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {showNewPasswordInModal ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                    <button
                      type="button"
                      className="secretary-student-form-action-btn"
                      onClick={generateRandomPassword}
                      style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}
                    >
                      <RefreshCw size={14} />
                      <span>تولید رمز تصادفی</span>
                    </button>
                  </div>

                  <p style={{ fontSize: "0.78rem", color: "#7f8c8d", margin: 0, lineHeight: 1.6 }}>
                    با ثبت کلمه عبور جدید، رمز ورود مدرس بلافاصله در دیتابیس بروزرسانی شده و در پنل مدیریت و منشی قابل مشاهده و کپی خواهد بود.
                  </p>
                </div>

                <div className="exam-modal-footer">
                  <AnimatedButton
                    variant="secondary"
                    type="button"
                    onClick={() => setShowChangePasswordModal(false)}
                  >
                    انصراف
                  </AnimatedButton>
                  <AnimatedButton
                    variant="primary"
                    type="submit"
                    disabled={changingPasswordLoading}
                  >
                    {changingPasswordLoading ? "در حال ذخیره..." : "ثبت و تغییر رمز"}
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
