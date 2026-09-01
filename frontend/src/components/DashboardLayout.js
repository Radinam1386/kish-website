import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  UsersRound,
  X,
  Layers,
  GraduationCap,
  UserCheck,
  Award,
} from "lucide-react";
import "./DashboardLayout.css";
import { storage } from "../services/api";

function DashboardLayout({ role, title, children, menuType }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menus = {
    student: [
      { label: "خلاصه وضعیت", icon: <Home size={19} />, to: "/panel/student" },
      {
        label: "شهریه",
        icon: <CreditCard size={19} />,
        to: "/panel/student/tuition",
      },
      {
        label: "امتحانات",
        icon: <FileText size={19} />,
        to: "/panel/student/exams",
      },
    ],

    teacher: [
      {
        label: "کلاس‌های من",
        icon: <BookOpen size={19} />,
        to: "/panel/teacher",
      },
      {
        label: "دانش‌آموزان",
        icon: <UsersRound size={19} />,
        to: "/panel/teacher/students",
      },
      {
        label: "حضور و غیاب",
        icon: <ClipboardCheck size={19} />,
        to: "/panel/teacher/attendance",
      },
      {
        label: "امتحانات و نمره‌دهی",
        icon: <Award size={19} />,
        to: "/panel/teacher/exams",
      },
      {
        label: "ایجاد امتحان",
        icon: <FileText size={19} />,
        to: "/panel/teacher/create-exam",
      },
    ],

    secretary: [
      { label: "نمای کلی", icon: <Home size={19} />, to: "/panel/secretary" },
      {
        label: "کلاس‌ها",
        icon: <CalendarDays size={19} />,
        to: "/panel/secretary/classes",
      },
      {
        label: "مدیریت ترم‌ها",
        icon: <Layers size={19} />,
        to: "/panel/secretary/terms",
      },
      {
        label: "مدیریت معلمان",
        icon: <GraduationCap size={19} />,
        to: "/panel/secretary/teachers",
      },
      {
        label: "دانش‌آموزان",
        icon: <UsersRound size={19} />,
        to: "/panel/secretary/students",
      },
      {
        label: "شهریه‌ها",
        icon: <CreditCard size={19} />,
        to: "/panel/secretary/tuition",
      },
      {
        label: "حضور و غیاب",
        icon: <ClipboardCheck size={19} />,
        to: "/panel/secretary/attendance",
      },
      {
        label: "نظارت بر امتحانات",
        icon: <FileText size={19} />,
        to: "/panel/secretary/exams",
      },
    ],

    admin: [
      { label: "نمای کلی", icon: <Home size={19} />, to: "/panel/admin" },
      {
        label: "کلاس‌ها",
        icon: <CalendarDays size={19} />,
        to: "/panel/admin/classes",
      },
      {
        label: "مدیریت ترم‌ها",
        icon: <Layers size={19} />,
        to: "/panel/admin/terms",
      },
      {
        label: "دانش‌آموزان",
        icon: <UsersRound size={19} />,
        to: "/panel/admin/students",
      },
      {
        label: "معلمان",
        icon: <GraduationCap size={19} />,
        to: "/panel/admin/teachers",
      },
      {
        label: "منشی‌ها",
        icon: <UserCheck size={19} />,
        to: "/panel/admin/secretaries",
      },
      {
        label: "شهریه‌ها",
        icon: <CreditCard size={19} />,
        to: "/panel/admin/tuition",
      },
      {
        label: "حضور و غیاب",
        icon: <ClipboardCheck size={19} />,
        to: "/panel/admin/attendance",
      },
      {
        label: "نظارت بر امتحانات",
        icon: <FileText size={19} />,
        to: "/panel/admin/exams",
      },
    ],
  };

  return (
    <div className="dashboard">
      <div className="dashboard-blob blob-1"></div>
      <div className="dashboard-blob blob-2"></div>

      {sidebarOpen && (
        <div
          className="dashboard-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="dashboard-brand">
          <div className="brand-flex">
            <img src="/logo.png" className="brand-logo" alt="Kish Institute" />
            <div className="brand-text">
              <strong>Kish Institute</strong>
              <small>{role}</small>
            </div>
          </div>

          <button
            className="sidebar-close"
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="dashboard-nav">
          {menus[menuType].map((item, index) => (
            <NavLink
              to={item.to}
              key={index}
              className="dashboard-link"
              end={item.to === `/panel/${menuType}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <Link
          to="/login"
          className="dashboard-logout"
          onClick={() => storage.clearSession()}
        >
          <LogOut size={19} />
          <span>خروج از حساب</span>
        </Link>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-inner">
            <div className="header-titles">
              <span className="header-subtitle">داشبورد مدیریت</span>

              <h1>{title}</h1>
            </div>

            <button
              className="mobile-menu-btn"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="باز کردن منو"
            >
              <Menu size={22} />
            </button>
          </div>
        </header>
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}

export default DashboardLayout;
