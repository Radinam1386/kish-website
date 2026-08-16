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
  Square,
  UsersRound,
  X,
} from "lucide-react";
import "./DashboardLayout.css";
import { AnimatedButton } from "./AnimatedButton";

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
        to: "/panel/student/exam/1",
      },
    ],

    teacher: [
      {
        label: "کلاس‌های من",
        icon: <BookOpen size={19} />,
        to: "/panel/teacher",
      },
      {
        label: "حضور و غیاب",
        icon: <ClipboardCheck size={19} />,
        to: "/panel/teacher/attendance/english-a2",
      },
      {
        label: "ایجاد امتحان",
        icon: <FileText size={19} />,
        to: "/panel/teacher/create-exam",
      },
      {
        label: "دانش‌آموزان",
        icon: <UsersRound size={19} />,
        to: "/panel/teacher/students",
      },
    ],

    secretary: [
      { label: "نمای کلی", icon: <Home size={19} />, to: "/panel/secretary/" },
      {
        label: "کلاس‌ها",
        icon: <CalendarDays size={19} />,
        to: "/panel/secretary/classes",
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
    ],

    admin: [
      { label: "نمای کلی", icon: <Home size={19} />, to: "/panel/admin" },
      {
        label: "دانش‌آموزان",
        icon: <UsersRound size={19} />,
        to: "/panel/admin/students",
      },
      {
        label: "معلمان",
        icon: <BookOpen size={19} />,
        to: "/panel/admin/teachers",
      },
      {
        label: "شهریه‌ها",
        icon: <CreditCard size={19} />,
        to: "/panel/admin/tuition",
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
            <img src="/logo.png" className="brand-logo"></img>
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

        <Link to="/" className="dashboard-logout">
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
