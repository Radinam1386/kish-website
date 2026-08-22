import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  Search,
  UserCheck,
  UserX,
  Users,
  AlertCircle,
  Save,
  RotateCcw,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import "./SecretaryAttendance.css";

function SecretaryAttendance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDate, setSelectedDate] = useState("1405/06/18");

  const [students, setStudents] = useState([
    {
      id: "STD-8821",
      name: "سارا حسینی",
      phone: "۰۹۱۲۳۴۵۶۷۸۹",
      className: "English A2 (کلاس ۱۰۲)",
      classId: "english-a2",
      date: "1405/06/18",
      status: "حاضر",
      arrival: "۰۸:۵۸",
      note: "به‌موقع",
    },
    {
      id: "STD-8822",
      name: "امیرمحمد علیزاده",
      phone: "۰۹۳۵۷۶۵۴۳۲۱",
      className: "English A2 (کلاس ۱۰۲)",
      classId: "english-a2",
      date: "1405/06/18",
      status: "غایب",
      arrival: "--",
      note: "بدون اطلاع",
    },
    {
      id: "STD-8823",
      name: "فاطمه رضایی",
      phone: "۰۹۱۹۸۷۶۵۴۳۲",
      className: "Conversation B1 (کلاس ۲۰۴)",
      classId: "conversation-b1",
      date: "1405/06/18",
      status: "موجه",
      arrival: "--",
      note: "مرخصی با اطلاع",
    },
    {
      id: "STD-8824",
      name: "محمدامین کریمی",
      phone: "۰۹۱۲۱۱۱۱۱۱۱",
      className: "Conversation B1 (کلاس ۲۰۴)",
      classId: "conversation-b1",
      date: "1405/06/18",
      status: "دیرکرد",
      arrival: "۰۹:۱۸",
      note: "۱۸ دقیقه تأخیر",
    },
    {
      id: "STD-8825",
      name: "نگار احمدی",
      phone: "۰۹۱۵۴۴۴۲۲۱۱",
      className: "Grammar Advanced (کلاس ۳۰۱)",
      classId: "grammar-adv",
      date: "1405/06/18",
      status: "حاضر",
      arrival: "۰۸:۵۵",
      note: "حضور کامل",
    },
  ]);

  const classesList = [
    {
      id: "all",
      name: "همه کلاس‌ها",
    },
    {
      id: "english-a2",
      name: "English A2 (کلاس ۱۰۲)",
    },
    {
      id: "conversation-b1",
      name: "Conversation B1 (کلاس ۲۰۴)",
    },
    {
      id: "grammar-adv",
      name: "Grammar Advanced (کلاس ۳۰۱)",
    },
  ];

  const statusOptions = [
    {
      value: "حاضر",
      className: "present",
    },
    {
      value: "غایب",
      className: "absent",
    },
    {
      value: "موجه",
      className: "excused",
    },
    {
      value: "دیرکرد",
      className: "late",
    },
  ];

  /* =====================================================
     Filter Students
  ===================================================== */

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.id.toLowerCase().includes(normalizedSearch) ||
        student.phone.toLowerCase().includes(normalizedSearch);

      const matchesClass =
        selectedClass === "all" ||
        student.classId === selectedClass;

      const matchesDate =
        !selectedDate ||
        student.date === selectedDate;

      return (
        matchesSearch &&
        matchesClass &&
        matchesDate
      );
    });
  }, [
    students,
    searchTerm,
    selectedClass,
    selectedDate,
  ]);

  /* =====================================================
     Statistics
  ===================================================== */

  const totalStudents = students.length;

  const presentCount = students.filter(
    (student) => student.status === "حاضر"
  ).length;

  const absentCount = students.filter(
    (student) => student.status === "غایب"
  ).length;

  const excusedCount = students.filter(
    (student) => student.status === "موجه"
  ).length;

  const lateCount = students.filter(
    (student) => student.status === "دیرکرد"
  ).length;

  const attendanceRate =
    totalStudents > 0
      ? Math.round(
          (presentCount / totalStudents) * 100
        )
      : 0;

  /* =====================================================
     Change Status
  ===================================================== */

  const handleStatusChange = (
    studentId,
    newStatus
  ) => {
    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.id === studentId
          ? {
              ...student,
              status: newStatus,
            }
          : student
      )
    );
  };

  /* =====================================================
     Save
  ===================================================== */

  const handleSave = () => {
    console.log("Attendance data:", students);

    // بعداً اینجا API قرار می‌گیرد:
    // await updateAttendance(students);
  };

  /* =====================================================
     Reset Filters
  ===================================================== */

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedClass("all");
    setSelectedDate("1405/06/18");
  };

  return (
    <DashboardLayout
      role="پنل منشی"
      title="حضور و غیاب"
      menuType="secretary"
    >
      <div className="secretary-attendance-page">

        {/* =================================================
            Statistics
        ================================================= */}

        <section className="secretary-attendance-stats">

          <AttendanceStatCard
            title="کل دانش‌آموزان"
            value={`${totalStudents} نفر`}
            icon={<Users size={22} />}
            color="blue"
          />

          <AttendanceStatCard
            title="حاضر"
            value={`${presentCount} نفر`}
            icon={<UserCheck size={22} />}
            color="green"
          />

          <AttendanceStatCard
            title="غایب"
            value={`${absentCount} نفر`}
            icon={<UserX size={22} />}
            color="red"
          />

          <AttendanceStatCard
            title="نرخ حضور"
            value={`${attendanceRate}٪`}
            icon={<AlertCircle size={22} />}
            color="orange"
          />

        </section>

        {/* =================================================
            Main Section
        ================================================= */}

        <section className="secretary-attendance-section">

          <div className="secretary-attendance-section-header">

            <div className="secretary-attendance-heading">

              <span className="secretary-attendance-kicker">
                <CalendarDays size={15} />
                مدیریت حضور و غیاب
              </span>

              <h2>
                ثبت و مدیریت حضور دانش‌آموزان
              </h2>

              <p>
                وضعیت حضور دانش‌آموزان را بر اساس
                کلاس و تاریخ بررسی و مدیریت کنید.
              </p>

            </div>

            <div className="secretary-attendance-actions">

              <button
                type="button"
                className="secretary-attendance-reset-btn"
                onClick={handleResetFilters}
              >
                <RotateCcw size={16} />
                پاک کردن فیلترها
              </button>

              <AnimatedButton
                variant="danger"
                onClick={handleSave}
              >
                <Save size={17} />
                ذخیره تغییرات
              </AnimatedButton>

            </div>

          </div>

          {/* =================================================
              Filters
          ================================================= */}

          <div className="secretary-attendance-filter-card">

            <div className="secretary-attendance-search">

              <Search
                size={18}
                className="secretary-attendance-input-icon"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="جستجو بر اساس نام، شناسه یا شماره تماس..."
                className="secretary-attendance-input"
              />

            </div>

            <div className="secretary-attendance-select">

              <Filter
                size={17}
                className="secretary-attendance-input-icon"
              />

              <select
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(event.target.value)
                }
                className="secretary-attendance-input"
              >
                {classesList.map((classItem) => (
                  <option
                    key={classItem.id}
                    value={classItem.id}
                  >
                    {classItem.name}
                  </option>
                ))}
              </select>

            </div>

            <div className="secretary-attendance-date">

              <CalendarDays
                size={17}
                className="secretary-attendance-input-icon"
              />

              <input
                type="text"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
                placeholder="1405/06/18"
                className="secretary-attendance-input secretary-attendance-date-input"
              />

            </div>

          </div>

          {/* =================================================
              Result Summary
          ================================================= */}

          <div className="secretary-attendance-summary">

            <div>
              نمایش{" "}
              <strong>
                {filteredStudents.length}
              </strong>{" "}
              رکورد از{" "}
              <strong>
                {students.length}
              </strong>{" "}
              دانش‌آموز
            </div>

            <div className="secretary-attendance-extra">

              <span>
                موجه:
                <strong>{excusedCount}</strong>
              </span>

              <span>
                دیرکرد:
                <strong>{lateCount}</strong>
              </span>

            </div>

          </div>

          {/* =================================================
              Table
          ================================================= */}

          <div className="secretary-attendance-table-wrapper">

            {filteredStudents.length > 0 ? (

              <table className="secretary-attendance-table">

                <thead>
                  <tr>
                    <th>دانش‌آموز</th>
                    <th>شماره تماس</th>
                    <th>کلاس</th>
                    <th>ساعت ورود</th>
                    <th>وضعیت حضور</th>
                    <th>یادداشت</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredStudents.map(
                    (student) => (

                      <tr key={student.id}>

                        <td>
                          <div className="secretary-attendance-student">

                            <div className="secretary-attendance-avatar">
                              {student.name.charAt(0)}
                            </div>

                            <div className="secretary-attendance-student-info">

                              <strong>
                                {student.name}
                              </strong>

                              <span>
                                {student.id}
                              </span>

                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="secretary-attendance-phone">
                            {student.phone}
                          </span>
                        </td>

                        <td>
                          <span className="secretary-attendance-class">
                            {student.className}
                          </span>
                        </td>

                        <td>

                          <span className="secretary-attendance-arrival">

                            <Clock3 size={15} />

                            {student.arrival}

                          </span>

                        </td>

                        <td>

                          <div className="secretary-attendance-status-group">

                            {statusOptions.map(
                              (statusItem) => (

                                <button
                                  key={statusItem.value}
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      student.id,
                                      statusItem.value
                                    )
                                  }
                                  className={`
                                    secretary-attendance-status
                                    ${statusItem.className}
                                    ${
                                      student.status ===
                                      statusItem.value
                                        ? "active"
                                        : ""
                                    }
                                  `}
                                >
                                  {statusItem.value}
                                </button>

                              )
                            )}

                          </div>

                        </td>

                        <td>
                          <span className="secretary-attendance-note">
                            {student.note}
                          </span>
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            ) : (

              <div className="secretary-attendance-empty">

                <div className="secretary-attendance-empty-icon">
                  <Users size={34} />
                </div>

                <strong>
                  رکوردی یافت نشد
                </strong>

                <span>
                  فیلترها یا عبارت جستجو را تغییر دهید.
                </span>

              </div>

            )}

          </div>

        </section>

      </div>
    </DashboardLayout>
  );
}


/* =====================================================
   Statistic Card
===================================================== */

function AttendanceStatCard({
  title,
  value,
  icon,
  color,
}) {
  return (
    <article className="secretary-attendance-stat-card">

      <div
        className={`secretary-attendance-stat-icon ${color}`}
      >
        {icon}
      </div>

      <div className="secretary-attendance-stat-content">

        <span>{title}</span>

        <strong>{value}</strong>

      </div>

    </article>
  );
}

export default SecretaryAttendance;