import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search,
  UserCheck,
  UserX,
  Users,
  AlertCircle,
  Clock,
  Eye,
  BookOpen,
  Info,
  Layers,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { api, getFullName } from "../services/api";
import { toJalaliDateString, toPersianDigits, getTodayJalali } from "../utils/dateUtils";

import "./SecretaryAttendance.css";

const statusMapping = {
  present: { text: "حاضر", class: "present" },
  absent: { text: "غایب", class: "absent" },
  excused: { text: "موجه", class: "excused" },
  late: { text: "دیرکرد", class: "late" },
  not_recorded: { text: "ثبت نشده", class: "not-recorded" },
};

function SecretaryAttendance() {
  const location = useLocation();
  const isSecretary = location.pathname.includes("/secretary");
  const roleTitle = isSecretary ? "پنل منشی" : "پنل مدیریت";
  const menuType = isSecretary ? "secretary" : "admin";

  const today = getTodayJalali();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDate, setSelectedDate] = useState(today.isoGregorian);

  const [terms, setTerms] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [termsData, classroomsData, usersData, enrollmentsData, sessionsData, attendanceData] =
          await Promise.all([
            api.terms.list(),
            api.classrooms.list(),
            api.users.list(),
            api.enrollments.list(),
            api.sessions.list(),
            api.attendance.list(),
          ]);

        if (!alive) return;
        const allTerms = termsData || [];
        setTerms(allTerms);
        setClassrooms(classroomsData || []);
        setUsers(usersData || []);
        setEnrollments(enrollmentsData || []);
        setSessions(sessionsData || []);
        setAttendanceRecords(attendanceData || []);

        const active = allTerms.find((t) => t.is_active);
        if (active) {
          setSelectedTermId(String(active.id));
        } else if (allTerms.length > 0) {
          setSelectedTermId(String(allTerms[0].id));
        } else {
          setSelectedTermId("all");
        }
      } catch (err) {
        if (alive) setError(err.message || "خطا در دریافت اطلاعات از سرور");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const activeTermObj = useMemo(() => {
    if (selectedTermId === "all") return null;
    return terms.find((t) => String(t.id) === String(selectedTermId));
  }, [terms, selectedTermId]);

  // Filtered Classrooms by Term
  const termClassrooms = useMemo(() => {
    if (selectedTermId === "all") return classrooms;
    return classrooms.filter(
      (c) => String(c.term || c.term?.id) === String(selectedTermId),
    );
  }, [classrooms, selectedTermId]);

  const studentsList = useMemo(() => {
    if (!termClassrooms.length || !enrollments.length || !users.length) return [];

    let relevantClassrooms = termClassrooms;
    if (selectedClass !== "all") {
      relevantClassrooms = termClassrooms.filter((c) => String(c.id) === String(selectedClass));
    }

    const relevantClassIds = relevantClassrooms.map((c) => c.id);
    const relevantEnrollments = enrollments.filter((e) =>
      relevantClassIds.includes(e.classroom || e.classroom?.id),
    );

    return relevantEnrollments.map((enr) => {
      const student =
        enr.student_detail ||
        users.find((u) => u.id === (enr.student || enr.student?.id)) ||
        {};
      const classroom =
        termClassrooms.find((c) => c.id === (enr.classroom || enr.classroom?.id)) || {};

      // Match session by classroom and date
      const matchedSession = sessions.find(
        (s) =>
          (s.classroom === classroom.id || s.classroom?.id === classroom.id) &&
          s.date === selectedDate,
      );

      let statusKey = "not_recorded";
      let note = "";

      if (matchedSession) {
        const att = attendanceRecords.find(
          (a) =>
            (a.session === matchedSession.id || a.session?.id === matchedSession.id) &&
            (a.student === student.id || a.student?.id === student.id),
        );
        if (att) {
          statusKey = att.status || "present";
          note = att.note || "";
        }
      }

      const statusInfo = statusMapping[statusKey] || statusMapping.not_recorded;

      return {
        id: student.id,
        studentName: getFullName(student) || `کاربر کد ${student.id}`,
        username: student.username || "-",
        phone: student.phone_number || "-",
        className: classroom.name || "کلاس نامشخص",
        classId: classroom.id,
        status: statusInfo.text,
        statusKey,
        statusClass: statusInfo.class,
        note,
      };
    });
  }, [termClassrooms, enrollments, users, sessions, attendanceRecords, selectedClass, selectedDate]);

  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return studentsList;

    return studentsList.filter(
      (item) =>
        item.studentName.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.className.toLowerCase().includes(q),
    );
  }, [studentsList, searchTerm]);

  const stats = useMemo(() => {
    const total = studentsList.length;
    const present = studentsList.filter((s) => s.statusKey === "present").length;
    const absent = studentsList.filter((s) => s.statusKey === "absent").length;
    const notRecorded = studentsList.filter((s) => s.statusKey === "not_recorded").length;

    return { total, present, absent, notRecorded };
  }, [studentsList]);

  return (
    <DashboardLayout role={roleTitle} title="نظارت بر حضور و غیاب" menuType={menuType}>
      <div className="secretary-attendance-page-container">
        {/* Term Selector Banner */}
        <div className="term-selector-banner">
          <div className="term-banner-info">
            <div className="term-icon-circle">
              <Layers size={22} />
            </div>
            <div>
              <h3>
                ترم تحصیلی انتخابی:{" "}
                <span className="term-highlight-text" style={{ color: "var(--primary)" }}>
                  {activeTermObj
                    ? activeTermObj.name
                    : selectedTermId === "all"
                    ? "همه ترم‌ها"
                    : "ترم نامشخص"}
                </span>
              </h3>
              <p>
                {activeTermObj?.is_active
                  ? "حضور و غیاب جلسات مربوط به ترم فعال جاری در حال نمایش است."
                  : activeTermObj
                  ? "حضور و غیاب جلسات مربوط به این ترم بایگانی‌شده در حال نمایش است."
                  : "نمایش حضور و غیاب تمامی دوره‌ها"}
              </p>
            </div>
          </div>

          <div className="term-dropdown-wrapper">
            <label>انتخاب ترم:</label>
            <select
              value={selectedTermId}
              onChange={(e) => {
                setSelectedTermId(e.target.value);
                setSelectedClass("all");
              }}
              className="term-select-input"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_active ? "(ترم فعال جاری)" : "(به پایان رسیده)"}
                </option>
              ))}
              <option value="all">همه ترم‌ها (مشاهده کامل)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="secretary-attendance-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Read-Only Notice */}
        <div className="secretary-attendance-notice">
          <div className="notice-icon">
            <Info size={20} />
          </div>
          <div className="notice-content">
            <strong>نظارت بر حضور و غیاب کلاس‌ها</strong>
            <p>
              ثبت و ویرایش حضور و غیاب جلسات توسط اساتید در پنل مدرس انجام می‌گردد.
              مدیر و منشی می‌توانند وضعیت حضور و غیاب تمام جلسات و کلاس‌های ترم را بررسی و پیگیری نمایند.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="secretary-attendance-stats-grid">
          <StatCard
            title="دانش‌آموزان کلاس"
            value={`${toPersianDigits(stats.total)} نفر`}
            hint={toJalaliDateString(selectedDate)}
            icon={<Users size={22} />}
            color="blue"
          />
          <StatCard
            title="حاضرین ثبت‌شده"
            value={`${toPersianDigits(stats.present)} نفر`}
            hint="در تاریخ انتخابی"
            icon={<UserCheck size={22} />}
            color="green"
          />
          <StatCard
            title="غائبین ثبت‌شده"
            value={`${toPersianDigits(stats.absent)} نفر`}
            hint="در تاریخ انتخابی"
            icon={<UserX size={22} />}
            color="red"
          />
          <StatCard
            title="جلسات ثبت‌نشده"
            value={`${toPersianDigits(stats.notRecorded)} نفر`}
            hint="منتظر ثبت استاد"
            icon={<Clock size={22} />}
            color="yellow"
          />
        </div>

        {/* Main Section */}
        <section className="secretary-attendance-main-section">
          <div className="secretary-attendance-section-header">
            <div className="attendance-heading-info">
              <h3 className="secretary-attendance-section-title">
                گزارش حضور و غیاب دانش‌آموزان
              </h3>
              <p className="secretary-attendance-section-desc">
                تاریخ جلسه: <strong>{toJalaliDateString(selectedDate)}</strong> | تعداد:{" "}
                <strong>{toPersianDigits(filteredStudents.length)} دانش‌آموز</strong>
              </p>
            </div>
          </div>

          {/* Filters Row */}
          <div className="secretary-attendance-filters-row">
            {/* Search Input */}
            <div className="attendance-search-wrapper">
              <Search size={18} className="attendance-search-icon" />
              <input
                type="text"
                placeholder="جستجوی نام، کد کاربری یا شماره تماس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="attendance-search-input"
              />
            </div>

            {/* Class Filter */}
            <div className="attendance-select-wrapper">
              <BookOpen size={16} className="attendance-filter-icon" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="attendance-select"
              >
                <option value="all">همه کلاس‌های ترم</option>
                {termClassrooms.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="attendance-datepicker-wrapper">
              <JalaliDatePicker
                value={selectedDate}
                onChange={(iso) => setSelectedDate(iso)}
                placeholder="انتخاب تاریخ جلسه..."
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "oklch(50% 0 0)" }}>
              در حال بارگذاری اطلاعات حضور و غیاب...
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="secretary-attendance-table-wrapper">
              <table className="secretary-attendance-table">
                <thead>
                  <tr>
                    <th>دانش‌آموز</th>
                    <th>نام کاربری</th>
                    <th>شماره تماس</th>
                    <th>کلاس مربوطه</th>
                    <th>وضعیت در تاریخ</th>
                    <th>توضیحات استاد</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((item) => (
                    <tr key={`${item.classId}-${item.id}`}>
                      <td>
                        <strong>{item.studentName}</strong>
                      </td>
                      <td>
                        <span className="attendance-username-tag">{item.username}</span>
                      </td>
                      <td>
                        <span className="attendance-phone-tag">{item.phone}</span>
                      </td>
                      <td>
                        <span className="attendance-class-badge">{item.className}</span>
                      </td>
                      <td>
                        <span className={`attendance-status-pill ${item.statusClass}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <span className="attendance-note-text">
                          {item.note || "-"}
                        </span>
                      </td>
                      <td>
                        <Link to={`/panel/${menuType}/students/${item.id}`}>
                          <button type="button" className="attendance-view-btn">
                            <Eye size={14} />
                            مشاهده پرونده
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="attendance-empty-state">
              <Users size={44} />
              <h4>هیچ دانش‌آموزی در این فیلتر یافت نشد</h4>
              <p>لطفاً تاریخ یا کلاس انتخابی را تغییر دهید.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default SecretaryAttendance;
