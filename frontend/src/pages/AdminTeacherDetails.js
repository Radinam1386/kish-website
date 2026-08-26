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
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import { toPersianDigits } from "../utils/dateUtils";
import "./AdminTeacherDetails.css";

function AdminTeacherDetails() {
  const { teacherId } = useParams();
  const location = useLocation();

  const isSecretary = location.pathname.includes("/secretary");
  const roleTitle = isSecretary ? "پنل منشی" : "پنل مدیریت";
  const menuType = isSecretary ? "secretary" : "admin";
  const basePath = isSecretary ? "/panel/secretary/teachers" : "/panel/admin/teachers";

  const [teacherUser, setTeacherUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          (c) => c.teacher === Number(teacherId) || c.teacher?.id === Number(teacherId),
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
      const term = terms.find((t) => t.id === cls.term);
      return {
        id: cls.id,
        name: cls.name,
        code: `کلاس ${cls.id}`,
        level: term?.name || "ترم جاری",
        students: `${cls.student_count || 0}`,
        schedule: "در مدل بک‌اند ثبت نشده",
        time: "-",
        status: term?.is_active ? "در حال اجرا" : "پایان یافته",
      };
    });
  }, [classrooms, terms]);

  const totalStudents = useMemo(() => {
    return classrooms.reduce((total, cls) => total + (cls.student_count || 0), 0);
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
      type: "primary",
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
          <p style={{ color: "var(--danger, #ef4444)", marginBottom: "1rem" }}>{error || "معلم یافت نشد."}</p>
          <Link to={basePath}>
            <AnimatedButton variant="primary">بازگشت به لیست معلمان</AnimatedButton>
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
        {/* ================= Header ================= */}

        <div className="admin-teacher-details-x7k2-header">
          <div className="admin-teacher-details-x7k2-header-right">
            <Link
              to={basePath}
              className="admin-teacher-details-x7k2-back-button"
              style={{ textDecoration: "none" }}
            >
              <ArrowRight size={18} />
              بازگشت به لیست
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

        {/* ================= Stats ================= */}

        <div className="admin-teacher-details-x7k2-stats">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="admin-teacher-details-x7k2-stat-card"
            >
              <div
                className={`admin-teacher-details-x7k2-stat-icon admin-teacher-details-x7k2-stat-${stat.type}`}
              >
                {stat.icon}
              </div>

              <div className="admin-teacher-details-x7k2-stat-content">
                <span>{stat.title}</span>
                <strong>{stat.value}</strong>
              </div>
            </div>
          ))}
        </div>

        {/* ================= Personal Information ================= */}

        <section className="admin-teacher-details-x7k2-section">
          <div className="admin-teacher-details-x7k2-section-header">
            <div>
              <h3>
                <User size={20} />
                اطلاعات مدرس
              </h3>

              <p>
                اطلاعات شخصی و ارتباطی مدرس
              </p>
            </div>
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
                <GraduationCap size={18} />
              </div>

              <div>
                <span>نام کاربری</span>
                <strong>{teacherUser.username}</strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <Award size={18} />
              </div>

              <div>
                <span>نقش سیستم</span>
                <strong>{teacherUser.role === "teacher" ? "مدرس" : teacherUser.role}</strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <CalendarDays size={18} />
              </div>

              <div>
                <span>وضعیت حساب</span>
                <strong>{teacherUser.is_active ? "فعال" : "غیرفعال"}</strong>
              </div>
            </div>
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

              <p>
                لیست کلاس‌هایی که توسط این مدرس برگزار می‌شوند
              </p>
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
                        <span>
                          {toPersianDigits(item.students)} دانش‌آموز
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
              <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--muted, #888)", gridColumn: "1 / -1" }}>
                هیچ کلاسی برای این مدرس ثبت نشده است.
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default AdminTeacherDetails;