import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Search,
  UserPlus,
  UsersRound,
  Eye,
  Filter,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";

import "./SecretaryPanel.css";

function SecretaryPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFee, setSelectedFee] = useState("all");

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [usersData, classroomsData, enrollmentsData, sessionsData, attendanceData] =
          await Promise.all([
            api.users.list(),
            api.classrooms.list(),
            api.enrollments.list(),
            api.sessions.list(),
            api.attendance.list(),
          ]);

        if (!alive) return;

        const studentUsers = (usersData || []).filter((u) => u.role === "student");
        const classrooms = classroomsData || [];
        const enrollments = enrollmentsData || [];
        const sessions = sessionsData || [];
        const attendance = attendanceData || [];

        const studentList = studentUsers.map((u) => {
          const studentEnrollment = enrollments.find(
            (e) => e.student === u.id || e.student?.id === u.id,
          );
          const studentClass = studentEnrollment
            ? classrooms.find((c) => c.id === studentEnrollment.classroom)
            : null;

          const studentRecords = attendance.filter(
            (a) => a.student === u.id || a.student?.id === u.id,
          );
          const absents = studentRecords.filter((a) => a.status === "absent").length;
          const attendanceStatus =
            studentRecords.length === 0
              ? "بدون سابقه"
              : absents === 0
              ? "منظم"
              : `${absents} غیبت`;

          return {
            id: u.id,
            name: getFullName(u),
            phone: u.phone_number || "-",
            cls: studentClass?.name || "بدون کلاس",
            fee: u.is_active ? "paid" : "pending",
            attendance: attendanceStatus,
            remaining: 0,
          };
        });

        const classList = classrooms.map((cls) => {
          const classSessions = sessions.filter((s) => s.classroom === cls.id);
          const held = classSessions.length;
          const total = 20;
          const remaining = Math.max(0, total - held);

          return {
            id: cls.id,
            name: cls.name,
            held,
            remaining,
            total,
          };
        });

        setStudents(studentList);
        setClasses(classList);
      } catch (err) {
        if (alive) setError(err.message || "خطا در دریافت اطلاعات");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const paidStudents = students.filter(
    (student) => student.fee === "paid",
  ).length;

  const activeClasses = classes.length;

  const totalAttendanceRecords = students.reduce(
    (total, student) => total + (student.attendance === "منظم" ? 1 : 0),
    0,
  );

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.phone.includes(normalizedSearch) ||
        student.cls.toLowerCase().includes(normalizedSearch);

      const matchesFee = selectedFee === "all" || student.fee === selectedFee;

      return matchesSearch && matchesFee;
    });
  }, [students, searchTerm, selectedFee]);

  return (
    <DashboardLayout
      role="پنل منشی"
      title="مدیریت پذیرش و ثبت‌نام"
      menuType="secretary"
    >
      <div className="secretary-panel-x8m4-root">
        {error && (
          <div style={{ color: "var(--danger, #ef4444)", marginBottom: "1rem", textAlign: "center" }}>
            {error}
          </div>
        )}

        <div className="secretary-panel-x8m4-stats">
          <StatCard
            title="ثبت‌نامی‌ها"
            value={`${students.length} نفر`}
            hint="دانش‌آموزان ثبت‌شده"
            icon={<UsersRound />}
            color="red"
          />

          <StatCard
            title="حساب‌های فعال"
            value={`${paidStudents} نفر`}
            hint="دانش‌آموزان فعال"
            icon={<CreditCard />}
            color="green"
          />

          <StatCard
            title="دانش‌آموزان منظم"
            value={`${totalAttendanceRecords} نفر`}
            hint="بدون غیبت"
            icon={<ClipboardCheck />}
            color="light-blue"
          />

          <StatCard
            title="کلاس‌های فعال"
            value={`${activeClasses} کلاس`}
            hint="در حال برگزاری"
            icon={<CalendarDays />}
            color="soft-red"
          />
        </div>

        <section className="secretary-panel-x8m4-section">
          <div className="secretary-panel-x8m4-section-header">
            <div>
              <h3 className="secretary-panel-x8m4-title">جستجوی سریع</h3>

              <p className="secretary-panel-x8m4-description">
                جستجو در اطلاعات دانش‌آموزان ثبت‌نام‌شده
              </p>
            </div>
          </div>

          <div className="secretary-panel-x8m4-search-row">
            <div className="secretary-panel-x8m4-search-wrapper">
              <Search size={18} className="secretary-panel-x8m4-search-icon" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="secretary-panel-x8m4-search-input"
                placeholder="نام، شماره موبایل یا نام کلاس..."
              />
            </div>

            <AnimatedButton variant="primary">
              <Search size={17} />
              جستجو
            </AnimatedButton>
          </div>
        </section>

        <section className="secretary-panel-x8m4-section">
          <div className="secretary-panel-x8m4-section-header">
            <div>
              <h3 className="secretary-panel-x8m4-title">لیست دانش‌آموزان</h3>

              <p className="secretary-panel-x8m4-description">
                مدیریت وضعیت ثبت‌نام، حساب و حضور دانش‌آموزان
              </p>
            </div>
            <Link to={"/panel/secretary/students/new"}>
              <AnimatedButton variant="primary">
                <UserPlus size={18} />
                افزودن دانش‌آموز
              </AnimatedButton>
            </Link>
          </div>

          <div className="secretary-panel-x8m4-filters">
            <div className="secretary-panel-x8m4-filter-wrapper">
              <Filter size={17} className="secretary-panel-x8m4-filter-icon" />

              <select
                value={selectedFee}
                onChange={(event) => setSelectedFee(event.target.value)}
                className="secretary-panel-x8m4-select"
              >
                <option value="all">همه وضعیت‌های حساب</option>

                <option value="paid">فعال</option>

                <option value="pending">در انتظار / غیرفعال</option>
              </select>
            </div>
          </div>

          <div className="secretary-panel-x8m4-table-wrapper">
            <table className="secretary-panel-x8m4-table">
              <thead>
                <tr>
                  <th>نام دانش‌آموز</th>
                  <th>شماره تماس</th>
                  <th>کلاس</th>
                  <th>وضعیت حساب</th>
                  <th>وضعیت حضور</th>
                  <th>عملیات</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                      در حال بارگذاری دانش‌آموزان...
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td data-label="دانش‌آموز">
                        <div className="secretary-panel-x8m4-student">
                          <div className="secretary-panel-x8m4-avatar">
                            {student.name.charAt(0)}
                          </div>

                          <strong>{student.name}</strong>
                        </div>
                      </td>

                      <td data-label="شماره تماس">
                        <span className="secretary-panel-x8m4-phone">
                          {student.phone}
                        </span>
                      </td>

                      <td data-label="کلاس">
                        <span className="class-badge">{student.cls}</span>
                      </td>

                      <td data-label="وضعیت حساب">
                        <span
                          className={`status-badge ${
                            student.fee === "paid"
                              ? "status-paid"
                              : "status-pending"
                          }`}
                        >
                          {student.fee === "paid" ? "فعال" : "در انتظار"}
                        </span>
                      </td>

                      <td data-label="وضعیت حضور">
                        <span
                          className={
                            student.attendance === "منظم"
                              ? "secretary-panel-x8m4-attendance good"
                              : "secretary-panel-x8m4-attendance warning"
                          }
                        >
                          {student.attendance}
                        </span>
                      </td>

                      <td
                        data-label="عملیات"
                        className="secretary-panel-x8m4-action-cell"
                      >
                        <Link
                          to={`/panel/secretary/students/${student.id}`}
                          className="admin-students-x7k2-details-link"
                        >
                          <AnimatedButton variant="primary" size="small">
                            <Eye size={16} />
                            مشاهده
                          </AnimatedButton>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="secretary-panel-x8m4-empty">
                      <UsersRound size={38} />

                      <strong>دانش‌آموزی پیدا نشد</strong>

                      <span>عبارت جستجو یا فیلتر را تغییر دهید.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="secretary-panel-x8m4-section">
          <div className="secretary-panel-x8m4-section-header">
            <div>
              <h3 className="secretary-panel-x8m4-title">وضعیت برگزاری کلاس‌ها</h3>

              <p className="secretary-panel-x8m4-description">
                تعداد جلسات برگزار شده برای کلاس‌های تعریف‌شده
              </p>
            </div>
          </div>

          <div className="secretary-panel-x8m4-class-grid">
            {classes.map((cls) => {
              const progress = Math.min(100, Math.round((cls.held / cls.total) * 100));

              return (
                <Link
                  key={cls.id}
                  to={`/panel/secretary/classes/${cls.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <article className="secretary-panel-x8m4-class-card">
                    <div className="secretary-panel-x8m4-class-header">
                      <div className="secretary-panel-x8m4-class-icon">
                        <BookOpen size={20} />
                      </div>

                      <h4>{cls.name}</h4>

                      <span className="capacity-badge">{progress}٪</span>
                    </div>

                    <div className="secretary-panel-x8m4-progress">
                      <div
                        className="secretary-panel-x8m4-progress-fill"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <div className="secretary-panel-x8m4-class-meta">
                      <span>
                        جلسات ثبت‌شده:
                        <strong>{cls.held}</strong>
                      </span>

                      <span>
                        کد کلاس:
                        <strong>{cls.id}</strong>
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default SecretaryPanel;
