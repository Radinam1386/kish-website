import { useState } from "react";
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
  CheckCircle2,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import "./AdminTeacherDetails.css";

function AdminTeacherDetails() {
  const [teacher, setTeacher] = useState({
    id: "TCH-1024",
    firstName: "خانم",
    lastName: "رضایی",
    fullName: "خانم رضایی",
    specialty: "زبان عمومی",
    phone: "۰۹۱۲۱۲۳۴۵۶۷",
    email: "rezaei@example.com",
    experience: "۸ سال",
    status: "فعال",
    statusClass: "active",
    joinDate: "۱۴۰۱/۰۶/۱۵",
    totalStudents: "۴۸",
    totalClasses: "۴",
    averageScore: "۱۸.۴",
    attendanceRate: "۹۴٪",
    classes: [
      {
        id: 1,
        name: "English A2",
        code: "کلاس ۱۰۲",
        level: "A2",
        students: "۱۸",
        schedule: "شنبه / دوشنبه",
        time: "۱۷:۰۰",
        status: "در حال اجرا",
      },
      {
        id: 2,
        name: "English B1",
        code: "کلاس ۲۰۵",
        level: "B1",
        students: "۱۵",
        schedule: "یکشنبه / سه‌شنبه",
        time: "۱۸:۳۰",
        status: "در حال اجرا",
      },
      {
        id: 3,
        name: "Conversation B1",
        code: "کلاس ۲۰۴",
        level: "B1",
        students: "۱۰",
        schedule: "شنبه / چهارشنبه",
        time: "۱۶:۰۰",
        status: "در حال اجرا",
      },
      {
        id: 4,
        name: "Advanced English",
        code: "کلاس ۳۰۱",
        level: "C1",
        students: "۵",
        schedule: "پنج‌شنبه",
        time: "۱۸:۰۰",
        status: "در حال اجرا",
      },
    ],
  });

  const stats = [
    {
      id: 1,
      title: "کلاس‌های فعال",
      value: `${teacher.totalClasses} کلاس`,
      icon: <BookOpen size={22} />,
      type: "primary",
    },
    {
      id: 2,
      title: "دانش‌آموزان",
      value: `${teacher.totalStudents} نفر`,
      icon: <Users size={22} />,
      type: "green",
    },
    {
      id: 3,
      title: "میانگین نمرات",
      value: teacher.averageScore,
      icon: <Award size={22} />,
      type: "blue",
    },
    {
      id: 4,
      title: "درصد حضور",
      value: teacher.attendanceRate,
      icon: <TrendingUp size={22} />,
      type: "orange",
    },
  ];

  return (
    <DashboardLayout
      role="پنل مدیریت"
      title={`جزئیات ${teacher.fullName}`}
      menuType="admin"
    >
      <div className="admin-teacher-details-x7k2-page">

        {/* ================= Header ================= */}

        <div className="admin-teacher-details-x7k2-header">
          <div className="admin-teacher-details-x7k2-header-right">
            <button
              type="button"
              className="admin-teacher-details-x7k2-back-button"
              onClick={() => window.history.back()}
            >
              <ArrowRight size={18} />
              بازگشت
            </button>

            <div className="admin-teacher-details-x7k2-avatar">
              {teacher.lastName.charAt(0)}
            </div>

            <div className="admin-teacher-details-x7k2-heading">
              <div className="admin-teacher-details-x7k2-name-row">
                <h2>{teacher.fullName}</h2>
{/* 
                <span
                  className={`admin-teacher-details-x7k2-status admin-teacher-details-x7k2-status-${teacher.statusClass}`}
                >
                  <CheckCircle2 size={14} />
                  {teacher.status}
                </span> */}
              </div>

              <p>{teacher.specialty}</p>

              <span className="admin-teacher-details-x7k2-teacher-id">
                شناسه مدرس: {teacher.id}
              </span>
            </div>
          </div>
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
                <strong>{teacher.fullName}</strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <Phone size={18} />
              </div>

              <div>
                <span>شماره تماس</span>
                <strong className="admin-teacher-details-x7k2-ltr">
                  {teacher.phone}
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
                  {teacher.email}
                </strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <GraduationCap size={18} />
              </div>

              <div>
                <span>تخصص</span>
                <strong>{teacher.specialty}</strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <Award size={18} />
              </div>

              <div>
                <span>سابقه تدریس</span>
                <strong>{teacher.experience}</strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <CalendarDays size={18} />
              </div>

              <div>
                <span>تاریخ عضویت</span>
                <strong>{teacher.joinDate}</strong>
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
                لیست کلاس‌هایی که در حال حاضر توسط این مدرس برگزار می‌شوند
              </p>
            </div>

            <span className="admin-teacher-details-x7k2-count-badge">
              {teacher.classes.length} کلاس
            </span>
          </div>

          <div className="admin-teacher-details-x7k2-class-grid">

            {teacher.classes.map((item) => (
              <div
                key={item.id}
                className="admin-teacher-details-x7k2-class-card"
              >

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
                      {item.students} دانش‌آموز
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
            ))}

          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}

export default AdminTeacherDetails;