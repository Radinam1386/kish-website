import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CreditCard,
  UsersRound,
  UserPlus,
  Eye,
  ChevronRight,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";

import "./AdminPanel.css";

function AdminPanel() {
  const [stats] = useState([
    {
      id: 1,
      title: "کل دانش‌آموزان",
      value: "۲۴۶ نفر",
      hint: "فعال و ثبت‌نامی",
      icon: <UsersRound />,
    },
    {
      id: 2,
      title: "معلمان",
      value: "۱۸ نفر",
      hint: "اساتید فعال",
      icon: <BookOpen />,
    },
    {
      id: 3,
      title: "شهریه‌ها",
      value: "۸۴٪",
      hint: "پرداخت‌شده",
      icon: <CreditCard />,
    },
    {
      id: 4,
      title: "کلاس‌ها",
      value: "۳۱ کلاس",
      hint: "در حال اجرا",
      icon: <CalendarDays />,
    },
  ]);

  const [students] = useState([
    {
      id: 1,
      name: "علی محمدی",
      phone: "۰۹۱۲۰۰۰۰۰۰۰",
      className: "English A2",
      tuitionStatus: "پرداخت شده",
      tuitionStatusClass: "admin-panel-status-paid",
    },
    {
      id: 2,
      name: "سارا احمدی",
      phone: "۰۹۱۲۱۱۱۱۱۱۱",
      className: "Kids Starter",
      tuitionStatus: "در انتظار",
      tuitionStatusClass: "admin-panel-status-pending",
    },
    {
      id: 3,
      name: "محمد کریمی",
      phone: "۰۹۱۲۲۲۲۲۲۲۲",
      className: "English B1",
      tuitionStatus: "پرداخت شده",
      tuitionStatusClass: "admin-panel-status-paid",
    },
  ]);

  const [teachers] = useState([
    {
      id: 1,
      name: "خانم رضایی",
      avatar: "خ",
      specialty: "زبان عمومی",
      activeClasses: "۴ کلاس فعال",
    },
    {
      id: 2,
      name: "آقای کریمی",
      avatar: "آ",
      specialty: "مکالمه",
      activeClasses: "۳ کلاس فعال",
    },
    {
      id: 3,
      name: "خانم مرادی",
      avatar: "خ",
      specialty: "کودکان",
      activeClasses: "۵ کلاس فعال",
    },
        {
      id: 3,
      name: "خانم مرادی",
      avatar: "خ",
      specialty: "کودکان",
      activeClasses: "۵ کلاس فعال",
    },
        {
      id: 3,
      name: "خانم مرادی",
      avatar: "خ",
      specialty: "کودکان",
      activeClasses: "۵ کلاس فعال",
    },
        {
      id: 3,
      name: "خانم مرادی",
      avatar: "خ",
      specialty: "کودکان",
      activeClasses: "۵ کلاس فعال",
    },
  ]);

  const [schedule] = useState([
    {
      id: 1,
      className: "English A2",
      teacher: "خانم رضایی",
      days: "شنبه / دوشنبه",
      time: "۱۷:۰۰",
      capacity: "۱۸ نفر",
    },
    {
      id: 2,
      className: "Kids Starter",
      teacher: "خانم مرادی",
      days: "یکشنبه / سه‌شنبه",
      time: "۱۶:۰۰",
      capacity: "۱۲ نفر",
    },
    {
      id: 3,
      className: "English B1",
      teacher: "آقای کریمی",
      days: "چهارشنبه / پنج‌شنبه",
      time: "۱۸:۳۰",
      capacity: "۱۵ نفر",
    },
  ]);

  return (
    <DashboardLayout
      role="پنل مدیریت"
      title="پنل مدیریت آقا بهنام"
      menuType="admin"
    >

      <div className="admin-panel-x7k2-stats-grid">
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            hint={stat.hint}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* ================= Students ================= */}

      <section className="admin-panel-x7k2-section">
        <div className="admin-panel-x7k2-section-header">
          <h3 className="admin-panel-x7k2-section-title">
            مدیریت دانش‌آموزان
          </h3>

          <AnimatedButton variant="primary">
            <UserPlus size={18} />
            افزودن دانش‌آموز
          </AnimatedButton>
        </div>

        <div className="admin-panel-x7k2-table-wrapper">
          <table className="admin-panel-x7k2-table">
            <thead>
              <tr>
                <th>نام</th>
                <th>شماره موبایل</th>
                <th>کلاس</th>
                <th>شهریه</th>
                <th>عملیات</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td data-label="نام">
                    <div className="admin-panel-x7k2-student-name">
                      {student.name}
                    </div>
                  </td>

                  <td data-label="شماره موبایل">
                    <span className="admin-panel-x7k2-student-phone">
                      {student.phone}
                    </span>
                  </td>

                  <td data-label="کلاس">
                    <span className="admin-panel-x7k2-class-badge">
                      {student.className}
                    </span>
                  </td>

                  <td data-label="شهریه">
                    <span
                      className={`admin-panel-x7k2-status-badge ${student.tuitionStatusClass}`}
                    >
                      {student.tuitionStatus}
                    </span>
                  </td>

                  <td data-label="عملیات">
                    <AnimatedButton
                      variant="secondary"
                      size="small"
                    >
                      <Eye size={16} />
                      مشاهده
                    </AnimatedButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ================= Teachers ================= */}

      <section className="admin-panel-x7k2-section">
        <div className="admin-panel-x7k2-section-header">
          <h3 className="admin-panel-x7k2-section-title">
            معلمان
          </h3>

          <AnimatedButton variant="primary">
            <UserPlus size={18} />
            افزودن معلم
          </AnimatedButton>
        </div>

        <div className="admin-panel-x7k2-teacher-grid">
          {teachers.map((teacher) => (
            <div
              className="admin-panel-x7k2-teacher-card"
              key={teacher.id}
            >
              <div className="admin-panel-x7k2-teacher-avatar">
                {teacher.avatar}
              </div>

              <div className="admin-panel-x7k2-teacher-info">
                <h4 className="admin-panel-x7k2-teacher-name">
                  {teacher.name}
                </h4>

                <p className="admin-panel-x7k2-teacher-specialty">
                  {teacher.specialty}
                </p>

                <span className="admin-panel-x7k2-teacher-classes">
                  {teacher.activeClasses}
                </span>
              </div>

              <ChevronRight
                className="admin-panel-x7k2-teacher-arrow"
                size={20}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ================= Schedule ================= */}

      <section className="admin-panel-x7k2-section">
        <div className="admin-panel-x7k2-section-header">
          <h3 className="admin-panel-x7k2-section-title">
            برنامه کلاس‌ها
          </h3>
        </div>

        <div className="admin-panel-x7k2-table-wrapper">
          <table className="admin-panel-x7k2-table admin-panel-x7k2-schedule-table">
            <thead>
              <tr>
                <th>کلاس</th>
                <th>استاد</th>
                <th>روزها</th>
                <th>ساعت</th>
                <th>ظرفیت</th>
              </tr>
            </thead>

            <tbody>
              {schedule.map((item) => (
                <tr key={item.id}>
                  <td data-label="کلاس">
                    <span className="admin-panel-x7k2-class-badge admin-panel-x7k2-highlight">
                      {item.className}
                    </span>
                  </td>

                  <td data-label="استاد">
                    {item.teacher}
                  </td>

                  <td data-label="روزها">
                    <span className="admin-panel-x7k2-schedule-days">
                      {item.days}
                    </span>
                  </td>

                  <td data-label="ساعت">
                    <span className="admin-panel-x7k2-schedule-time">
                      {item.time}
                    </span>
                  </td>

                  <td data-label="ظرفیت">
                    <span className="admin-panel-x7k2-capacity-badge">
                      {item.capacity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default AdminPanel;