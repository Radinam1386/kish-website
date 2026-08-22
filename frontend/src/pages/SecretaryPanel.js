import React, { useMemo, useState } from "react";
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

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";

import "./SecretaryPanel.css";
import { Link } from "react-router-dom";

function SecretaryPanel() {
  /* ========================================
     States
  ======================================== */

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFee, setSelectedFee] = useState("all");

  /* ========================================
     Students State
  ======================================== */

  const [students, setStudents] = useState([
    {
      id: 1,
      name: "علی محمدی",
      phone: "۰۹۱۲۰۰۰۰۰۰۰",
      cls: "English A2",
      fee: "paid",
      attendance: "منظم",
      remaining: 8,
    },
    {
      id: 2,
      name: "سارا احمدی",
      phone: "۰۹۱۲۱۱۱۱۱۱۱",
      cls: "Kids Starter",
      fee: "pending",
      attendance: "۲ غیبت",
      remaining: 10,
    },
    {
      id: 3,
      name: "رضا کریمی",
      phone: "۰۹۱۲۲۲۲۲۲۲۲",
      cls: "Conversation B1",
      fee: "paid",
      attendance: "منظم",
      remaining: 6,
    },
    {
      id: 4,
      name: "مریم رضایی",
      phone: "۰۹۱۲۳۳۳۳۳۳۳",
      cls: "English A2",
      fee: "pending",
      attendance: "۱ غیبت",
      remaining: 12,
    },
  ]);

  /* ========================================
     Classes State
  ======================================== */

  const [classes] = useState([
    {
      id: 1,
      name: "English A2",
      held: 12,
      remaining: 8,
      total: 20,
    },
    {
      id: 2,
      name: "Kids Starter",
      held: 10,
      remaining: 10,
      total: 20,
    },
    {
      id: 3,
      name: "Conversation B1",
      held: 14,
      remaining: 6,
      total: 20,
    },
  ]);

  /* ========================================
     Statistics
  ======================================== */

  const paidStudents = students.filter(
    (student) => student.fee === "paid",
  ).length;

  const activeClasses = classes.length;

  const totalAttendanceRecords = students.reduce(
    (total, student) => total + (student.attendance === "منظم" ? 1 : 0),
    0,
  );

  /* ========================================
     Filter Students
  ======================================== */

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim();

    return students.filter((student) => {
      const matchesSearch =
        student.name.includes(normalizedSearch) ||
        student.phone.includes(normalizedSearch) ||
        student.cls.toLowerCase().includes(normalizedSearch.toLowerCase());

      const matchesFee = selectedFee === "all" || student.fee === selectedFee;

      return matchesSearch && matchesFee;
    });
  }, [students, searchTerm, selectedFee]);

  /* ========================================
     Add Student
  ======================================== */

  const handleAddStudent = () => {
    const newStudent = {
      id: Date.now(),
      name: "دانش‌آموز جدید",
      phone: "۰۹۱۲۰۰۰۰۰۰۰",
      cls: "English A2",
      fee: "pending",
      attendance: "منظم",
      remaining: 20,
    };

    setStudents((prev) => [...prev, newStudent]);
  };

  return (
    <DashboardLayout
      role="پنل منشی"
      title="مدیریت پذیرش و ثبت‌نام"
      menuType="secretary"
    >
      <div className="secretary-panel-x8m4-root">
        <div className="secretary-panel-x8m4-stats">
          <StatCard
            title="ثبت‌نامی‌ها"
            value={`${students.length} نفر`}
            hint="ترم جاری"
            icon={<UsersRound />}
            color="red"
          />

          <StatCard
            title="شهریه‌های پرداخت‌شده"
            value={`${paidStudents} مورد`}
            hint="از دانش‌آموزان"
            icon={<CreditCard />}
            color="green"
          />

          <StatCard
            title="حضور ثبت‌شده"
            value={`${totalAttendanceRecords} رکورد`}
            hint="دانش‌آموزان منظم"
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

        {/* ========================================
            Students
        ======================================== */}

        <section className="secretary-panel-x8m4-section">
          <div className="secretary-panel-x8m4-section-header">
            <div>
              <h3 className="secretary-panel-x8m4-title">لیست دانش‌آموزان</h3>

              <p className="secretary-panel-x8m4-description">
                مدیریت وضعیت ثبت‌نام، شهریه و حضور دانش‌آموزان
              </p>
            </div>

            <AnimatedButton variant="primary" onClick={handleAddStudent}>
              <UserPlus size={18} />
              افزودن دانش‌آموز
            </AnimatedButton>
          </div>
          <div className="secretary-panel-x8m4-filters">
            <div className="secretary-panel-x8m4-filter-wrapper">
              <Filter size={17} className="secretary-panel-x8m4-filter-icon" />

              <select
                value={selectedFee}
                onChange={(event) => setSelectedFee(event.target.value)}
                className="secretary-panel-x8m4-select"
              >
                <option value="all">همه وضعیت‌های شهریه</option>

                <option value="paid">پرداخت شده</option>

                <option value="pending">در انتظار پرداخت</option>
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
                  <th>وضعیت شهریه</th>
                  <th>وضعیت حضور</th>
                  <th>باقی‌مانده</th>
                  <th>عملیات</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.length > 0 ? (
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

                      <td data-label="وضعیت شهریه">
                        <span
                          className={`status-badge ${
                            student.fee === "paid"
                              ? "status-paid"
                              : "status-pending"
                          }`}
                        >
                          {student.fee === "paid" ? "پرداخت شده" : "در انتظار"}
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

                      <td data-label="باقی‌مانده">
                        <span className="secretary-panel-x8m4-remaining">
                          {student.remaining} جلسه
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
                    <td colSpan="7" className="secretary-panel-x8m4-empty">
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
              <h3 className="secretary-panel-x8m4-title">وضعیت پیشرفت ترم</h3>

              <p className="secretary-panel-x8m4-description">
                میزان برگزاری جلسات کلاس‌های فعال
              </p>
            </div>
          </div>

          <div className="secretary-panel-x8m4-class-grid">
            {classes.map((cls) => {
              const progress = Math.round((cls.held / cls.total) * 100);

              return (
                <article
                  key={cls.id}
                  className="secretary-panel-x8m4-class-card"
                >
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
                      برگزار شده:
                      <strong>{cls.held}</strong>
                    </span>

                    <span>
                      باقی‌مانده:
                      <strong>{cls.remaining}</strong>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default SecretaryPanel;
