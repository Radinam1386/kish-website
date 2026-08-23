import { useEffect, useMemo, useState } from "react";
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
import { api, getFullName } from "../services/api";

import "./AdminPanel.css";
import { Link } from "react-router-dom";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        const [usersData, classroomsData, enrollmentsData] = await Promise.all([
          api.users.list(),
          api.classrooms.list(),
          api.enrollments.list(),
        ]);

        if (!alive) return;
        setUsers(usersData);
        setClassrooms(classroomsData);
        setEnrollments(enrollmentsData);
      } catch {
        if (alive) {
          setUsers([]);
          setClassrooms([]);
          setEnrollments([]);
        }
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const students = useMemo(
    () =>
      users
        .filter((user) => user.role === "student")
        .slice(0, 5)
        .map((user) => {
          const enrollment = enrollments.find(
            (item) => item.student === user.id,
          );
          const classroom = classrooms.find(
            (item) => item.id === enrollment?.classroom,
          );

          return {
            id: user.id,
            name: getFullName(user),
            phone: user.phone_number || "-",
            className: classroom?.name || "بدون کلاس",
            tuitionStatus: "ثبت نشده",
            tuitionStatusClass: "admin-panel-status-pending",
          };
        }),
    [users, enrollments, classrooms],
  );

  const teachers = useMemo(
    () =>
      users
        .filter((user) => user.role === "teacher")
        .slice(0, 6)
        .map((user) => {
          const activeClasses = classrooms.filter(
            (classroom) => classroom.teacher === user.id,
          ).length;

          return {
            id: user.id,
            name: getFullName(user),
            avatar: getFullName(user).charAt(0),
            specialty: user.email || "ثبت نشده",
            activeClasses: `${activeClasses} کلاس فعال`,
          };
        }),
    [users, classrooms],
  );

  const schedule = useMemo(
    () =>
      classrooms.slice(0, 5).map((classroom) => ({
        id: classroom.id,
        className: classroom.name,
        teacher: getFullName(classroom.teacher_detail),
        days: "در مدل بک‌اند ثبت نشده",
        time: "-",
        capacity: `${classroom.student_count || 0} نفر`,
      })),
    [classrooms],
  );

  const stats = [
    {
      id: 1,
      title: "کل دانش‌آموزان",
      value: `${users.filter((user) => user.role === "student").length} نفر`,
      hint: "فعال و ثبت‌نامی",
      icon: <UsersRound />,
      color: "green",
    },
    {
      id: 2,
      title: "معلمان",
      value: `${users.filter((user) => user.role === "teacher").length} نفر`,
      hint: "اساتید فعال",
      icon: <BookOpen />,
      color :"blue"
    },
    {
      id: 3,
      title: "شهریه‌ها",
      value: "ثبت نشده",
      hint: "endpoint ندارد",
      icon: <CreditCard />,
      color:"light-orange"
    },
    {
      id: 4,
      title: "کلاس‌ها",
      value: `${classrooms.length} کلاس`,
      hint: "در حال اجرا",
      icon: <CalendarDays />,
      color:"red"
    },
  ];

  return (
    <DashboardLayout
      role="پنل مدیریت"
      title="مدیریت"
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
            color={stat.color}
          />
        ))}
      </div>

      <section className="admin-panel-x7k2-section">
        <div className="admin-panel-x7k2-section-header">
          <h3 className="admin-panel-x7k2-section-title">مدیریت دانش‌آموزان</h3>
          <Link to={"/panel/admin/students/new"}>
            <AnimatedButton variant="primary" icon={<UserPlus size={18} />}>
              افزودن دانش‌آموز
            </AnimatedButton>
          </Link>
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
                    <AnimatedButton variant="secondary" size="small">
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
      <section className="admin-panel-x7k2-section">
        <div className="admin-panel-x7k2-section-header">
          <h3 className="admin-panel-x7k2-section-title">معلمان</h3>

          <Link to={"/panel/admin/teachers/new"}>
            <AnimatedButton variant="primary" icon={<UserPlus size={18} />}>
              افزودن معلم
            </AnimatedButton>
          </Link>
        </div>

        <div className="admin-panel-x7k2-teacher-grid">
          {teachers.map((teacher) => (
            <div className="admin-panel-x7k2-teacher-card" key={teacher.id}>
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
      <section className="admin-panel-x7k2-section">
        <div className="admin-panel-x7k2-section-header">
          <h3 className="admin-panel-x7k2-section-title">برنامه کلاس‌ها</h3>
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

                  <td data-label="استاد">{item.teacher}</td>

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
