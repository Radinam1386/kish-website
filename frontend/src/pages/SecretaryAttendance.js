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
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import "./SecretaryAttendance.css";
import { AnimatedButton } from "../components/AnimatedButton";

function SecretaryAttendance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDate, setSelectedDate] = useState("1405/06/18");

  const classesList = [
    { id: "all", name: "همه کلاس‌ها" },
    { id: "english-a2", name: "English A2 (کلاس ۱۰۲)" },
    { id: "conversation-b1", name: "Conversation B1 (کلاس ۲۰۴)" },
    { id: "grammar-adv", name: "Grammar Advanced (کلاس ۳۰۱)" },
  ];

  const studentsData = [
    {
      id: "STD-8821",
      name: "سارا حسینی",
      phone: "۰۹۱۲۳۴۵۶۷۸۹",
      className: "English A2 (کلاس ۱۰۲)",
      classId: "english-a2",
      date: "1405/06/18",
      status: "حاضر",
      statusClass: "status-present",
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
      statusClass: "status-absent",
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
      statusClass: "status-excused",
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
      statusClass: "status-late",
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
      statusClass: "status-present",
      arrival: "۰۸:۵۵",
      note: "حضور کامل",
    },
  ];

  const statusOptions = [
    { value: "حاضر", className: "status-present" },
    { value: "غایب", className: "status-absent" },
    { value: "موجه", className: "status-excused" },
    { value: "دیرکرد", className: "status-late" },
  ];

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return studentsData.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.id.toLowerCase().includes(normalizedSearch) ||
        student.phone.toLowerCase().includes(normalizedSearch);

      const matchesClass =
        selectedClass === "all" || student.classId === selectedClass;

      const matchesDate = !selectedDate || student.date === selectedDate;

      return matchesSearch && matchesClass && matchesDate;
    });
  }, [searchTerm, selectedClass, selectedDate]);

  const totalStudents = studentsData.length;
  const presentCount = studentsData.filter((s) => s.status === "حاضر").length;
  const absentCount = studentsData.filter((s) => s.status === "غایب").length;
  const excusedCount = studentsData.filter((s) => s.status === "موجه").length;
  const lateCount = studentsData.filter((s) => s.status === "دیرکرد").length;

  const attendanceRate = Math.round((presentCount / totalStudents) * 100);

  return (
    <DashboardLayout role="پنل منشی" title="حضور و غیاب" menuType="secretary">
      {/* Summary Cards */}
      <div className="secretary-attendance-stats">
        <div className="attendance-stat-card">
          <div className="attendance-stat-icon blue">
            <Users size={22} />
          </div>
          <div>
            <span>کل دانش‌آموزان</span>
            <strong>{totalStudents} نفر</strong>
          </div>
        </div>

        <div className="attendance-stat-card">
          <div className="attendance-stat-icon green">
            <UserCheck size={22} />
          </div>
          <div>
            <span>حاضر</span>
            <strong>{presentCount} نفر</strong>
          </div>
        </div>

        <div className="attendance-stat-card">
          <div className="attendance-stat-icon red">
            <UserX size={22} />
          </div>
          <div>
            <span>غایب</span>
            <strong>{absentCount} نفر</strong>
          </div>
        </div>

        <div className="attendance-stat-card">
          <div className="attendance-stat-icon amber">
            <AlertCircle size={22} />
          </div>
          <div>
            <span>نرخ حضور</span>
            <strong>{attendanceRate}٪</strong>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <section className="admin-section">
        <div className="admin-section-header secretary-attendance-header">
          <div>
            <h3 className="admin-section-title">ثبت و مدیریت حضور و غیاب</h3>
            <p className="admin-section-description">
              بررسی وضعیت حضور دانش‌آموزان بر اساس کلاس و تاریخ انتخابی
            </p>
          </div>
          <AnimatedButton variant="danger">
            <Save size={17} />
            ذخیره تغییرات
          </AnimatedButton>
        </div>

        {/* Filters */}
        <div className="attendance-filter-panel">
          <div className="attendance-search-wrapper">
            <Search size={18} className="attendance-search-icon" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو بر اساس نام، شناسه یا شماره تماس..."
              className="admin-input attendance-search-input"
            />
          </div>

          <div className="attendance-select-wrapper">
            <Filter size={17} className="attendance-filter-icon" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="admin-input attendance-select"
            >
              {classesList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-date-wrapper">
            <CalendarDays size={17} className="attendance-date-icon" />
            <input
              type="text"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              placeholder="1405/06/18"
              className="admin-input attendance-date-input"
            />
          </div>
        </div>

        <div className="attendance-summary-line">
          <span>
            نمایش <strong>{filteredStudents.length}</strong> رکورد از{" "}
            <strong>{studentsData.length}</strong> دانش‌آموز
          </span>

          <span className="attendance-extra-stats">
            موجه: <strong>{excusedCount}</strong> | دیرکرد:{" "}
            <strong>{lateCount}</strong>
          </span>
        </div>

        {/* Attendance Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table secretary-attendance-table">
            <thead>
              <tr>
                <th>نام دانش‌آموز</th>
                <th>شماره تماس</th>
                <th>کلاس</th>
                <th>ساعت ورود</th>
                <th>وضعیت</th>
                <th>یادداشت</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="attendance-student-cell">
                        <div className="attendance-avatar">
                          {student.name.charAt(0)}
                        </div>
                        <strong>{student.name}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="attendance-phone">{student.phone}</span>
                    </td>

                    <td>
                      <span className="class-badge">{student.className}</span>
                    </td>

                    <td>
                      <span className="attendance-arrival vazir-number">
                        <Clock3 size={15} />
                        {student.arrival}
                      </span>
                    </td>

                    <td>
                      <div className="attendance-status-group">
                        {statusOptions.map((statusItem) => (
                          <button
                            key={statusItem.value}
                            type="button"
                            className={`attendance-status-btn ${
                              student.status === statusItem.value
                                ? statusItem.className
                                : ""
                            }`}
                          >
                            {statusItem.value}
                          </button>
                        ))}
                      </div>
                    </td>

                    <td>
                      <span className="attendance-note">{student.note}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="attendance-empty-state">
                      <Users size={38} />
                      <strong>رکوردی یافت نشد</strong>
                      <span>فیلترها یا عبارت جستجو را تغییر دهید.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default SecretaryAttendance;
