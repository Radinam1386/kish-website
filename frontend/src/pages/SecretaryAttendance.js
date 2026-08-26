import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Search,
  UserCheck,
  UserX,
  Users,
  AlertCircle,
  Clock,
  ShieldCheck,
  Eye,
  BookOpen,
  Info,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { AnimatedButton } from "../components/AnimatedButton";
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
  const today = getTodayJalali();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDate, setSelectedDate] = useState(today.isoGregorian);

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
        const [classroomsData, usersData, enrollmentsData, sessionsData, attendanceData] =
          await Promise.all([
            api.classrooms.list(),
            api.users.list(),
            api.enrollments.list(),
            api.sessions.list(),
            api.attendance.list(),
          ]);

        if (!alive) return;
        setClassrooms(classroomsData || []);
        setUsers(usersData || []);
        setEnrollments(enrollmentsData || []);
        setSessions(sessionsData || []);
        setAttendanceRecords(attendanceData || []);

        if (classroomsData?.length && selectedClass === "all") {
          setSelectedClass(String(classroomsData[0].id));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const studentsList = useMemo(() => {
    if (!classrooms.length || !enrollments.length || !users.length) return [];

    let relevantClassrooms = classrooms;
    if (selectedClass !== "all") {
      relevantClassrooms = classrooms.filter((c) => String(c.id) === String(selectedClass));
    }

    const list = [];
    for (const cls of relevantClassrooms) {
      const clsEnrollments = enrollments.filter(
        (e) => e.classroom === cls.id || e.classroom?.id === cls.id,
      );

      const existingSession = sessions.find(
        (s) => (s.classroom === cls.id || s.classroom?.id === cls.id) && s.date === selectedDate,
      );

      for (const enr of clsEnrollments) {
        const studentId = typeof enr.student === "object" ? enr.student.id : enr.student;
        const studentUser = users.find((u) => u.id === studentId);
        if (!studentUser) continue;

        let record = null;
        if (existingSession) {
          record = attendanceRecords.find(
            (a) =>
              (a.session === existingSession.id || a.session?.id === existingSession.id) &&
              (a.student === studentId || a.student?.id === studentId),
          );
        }

        list.push({
          id: studentId,
          name: getFullName(studentUser),
          username: studentUser.username,
          phone: studentUser.phone_number || "-",
          classId: cls.id,
          className: cls.name,
          status: record ? record.status : existingSession ? "absent" : "not_recorded",
          note: record?.note || "",
          hasSession: Boolean(existingSession),
        });
      }
    }

    return list;
  }, [classrooms, enrollments, users, sessions, attendanceRecords, selectedClass, selectedDate]);

  const filteredStudents = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return studentsList;
    return studentsList.filter(
      (st) =>
        st.name.toLowerCase().includes(s) ||
        st.username.toLowerCase().includes(s) ||
        st.phone.includes(s) ||
        st.className.toLowerCase().includes(s),
    );
  }, [studentsList, searchTerm]);

  const stats = useMemo(() => {
    const total = studentsList.length;
    const present = studentsList.filter((s) => s.status === "present").length;
    const absent = studentsList.filter((s) => s.status === "absent").length;
    const late = studentsList.filter((s) => s.status === "late").length;
    const excused = studentsList.filter((s) => s.status === "excused").length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, late, excused, rate };
  }, [studentsList]);

  return (
    <DashboardLayout role="پنل منشی" title="نظارت بر حضور و غیاب" menuType="secretary">
      <div className="secretary-attendance-page">
        {/* Info Banner */}
        <div className="attendance-monitoring-banner">
          <div className="banner-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4>داشبورد نظارت بر حضور و غیاب آموزشگاه</h4>
            <p>
              در این بخش منشی می‌تواند وضعیت حضور و غیاب دانش‌آموزان را بر اساس تاریخ شمسی و کلاس مشاهده و نظارت کند.
              (ثبت اولیه حضور و غیاب توسط اساتید محترم انجام می‌شود.)
            </p>
          </div>
        </div>

        {error && (
          <div className="attendance-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="attendance-stats-grid">
          <StatCard
            title="کل دانش‌آموزان کلاس"
            value={`${toPersianDigits(stats.total)} نفر`}
            icon={<Users size={22} />}
            color="blue"
          />
          <StatCard
            title="حاضرین"
            value={`${toPersianDigits(stats.present)} نفر`}
            icon={<UserCheck size={22} />}
            color="green"
          />
          <StatCard
            title="غایبین"
            value={`${toPersianDigits(stats.absent)} نفر`}
            icon={<UserX size={22} />}
            color="red"
          />
          <StatCard
            title="درصد حضور جلسه"
            value={`${toPersianDigits(stats.rate)}٪`}
            icon={<Clock size={22} />}
            color="orange"
          />
        </div>

        {/* Control Bar: Class & Jalali Date Picker */}
        <div className="attendance-control-bar">
          <div className="control-box class-picker-box">
            <label className="control-label">
              <BookOpen size={16} />
              <span>انتخاب کلاس</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="class-select"
            >
              <option value="all">همه کلاس‌ها</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-box datepicker-box">
            <JalaliDatePicker
              label="تاریخ جلسه (شمسی)"
              value={selectedDate}
              onChange={(iso) => setSelectedDate(iso)}
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="attendance-search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="جستجوی نام دانش‌آموز، شماره تماس یا کلاس..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Attendance List Table */}
        <div className="attendance-table-card">
          <div className="card-header">
            <h3>
              لیست وضعیت حضور و غیاب - {toJalaliDateString(selectedDate)}
            </h3>
            <span className="selected-date-badge">
              <CalendarDays size={14} />
              تاریخ انتخاب شده: {toJalaliDateString(selectedDate)}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              در حال بارگذاری اطلاعات حضور و غیاب...
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="table-responsive">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>دانش‌آموز</th>
                    <th>شماره تماس</th>
                    <th>کلاس</th>
                    <th>وضعیت حضور</th>
                    <th>توضیحات / یادداشت</th>
                    <th>پروفایل</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st) => {
                    const statusInfo = statusMapping[st.status] || statusMapping.not_recorded;
                    return (
                      <tr key={`${st.classId}-${st.id}`}>
                        <td>
                          <div className="student-cell-info">
                            <div className="student-avatar">{st.name.charAt(0)}</div>
                            <div>
                              <strong>{st.name}</strong>
                              <small>نام کاربری: {st.username}</small>
                            </div>
                          </div>
                        </td>
                        <td>{st.phone}</td>
                        <td>
                          <span className="class-badge-tag">{st.className}</span>
                        </td>
                        <td>
                          <span className={`status-pill ${statusInfo.class}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td>
                          <span className="note-cell-text">
                            {st.note || "-"}
                          </span>
                        </td>
                        <td>
                          <Link to={`/panel/secretary/students/${st.id}`}>
                            <AnimatedButton variant="secondary" size="small">
                              <Eye size={14} />
                              مشاهده
                            </AnimatedButton>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="attendance-empty-state">
              <Info size={40} />
              <p>رکوردی برای این کلاس یا تاریخ یافت نشد.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SecretaryAttendance;
