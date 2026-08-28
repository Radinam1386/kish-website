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

        const rawStatus = record ? record.status : "not_recorded";
        const statusObj = statusMapping[rawStatus] || statusMapping.not_recorded;

        list.push({
          id: studentId,
          studentName: getFullName(studentUser),
          username: studentUser.username,
          phone: studentUser.phone_number || "-",
          className: cls.name,
          classId: cls.id,
          status: statusObj.text,
          statusClass: statusObj.class,
          note: record?.note || "",
          hasSession: Boolean(existingSession),
        });
      }
    }

    return list;
  }, [termClassrooms, enrollments, users, sessions, attendanceRecords, selectedClass, selectedDate]);

  const filteredStudents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return studentsList;

    return studentsList.filter(
      (s) =>
        s.studentName.toLowerCase().includes(search) ||
        s.username.toLowerCase().includes(search) ||
        s.phone.includes(search) ||
        s.className.toLowerCase().includes(search),
    );
  }, [studentsList, searchTerm]);

  const stats = useMemo(() => {
    const total = studentsList.length;
    const present = studentsList.filter((s) => s.statusClass === "present").length;
    const absent = studentsList.filter((s) => s.statusClass === "absent").length;
    const notRecorded = studentsList.filter((s) => s.statusClass === "not-recorded").length;

    return { total, present, absent, notRecorded };
  }, [studentsList]);

  return (
    <DashboardLayout role={roleTitle} title="نظارت بر حضور و غیاب" menuType={menuType}>
      <div className="secretary-attendance-page">
        {/* Term Selector Header Banner */}
        <div className="term-selector-banner" style={{ marginBottom: "1.75rem" }}>
          <div className="term-banner-info">
            <div className="term-icon-circle">
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: "800" }}>
                ترم تحصیلی انتخابی:{" "}
                <span className="term-highlight-text" style={{ color: "var(--primary)" }}>
                  {activeTermObj
                    ? activeTermObj.name
                    : selectedTermId === "all"
                    ? "همه ترم‌ها"
                    : "ترم نامشخص"}
                </span>
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "oklch(55% 0 0)" }}>
                {activeTermObj?.is_active
                  ? "حضور و غیاب جلسات مربوط به ترم فعال جاری در حال نمایش است."
                  : activeTermObj
                  ? "حضور و غیاب جلسات مربوط به این ترم بایگانی‌شده در حال نمایش است."
                  : "نمایش حضور و غیاب تمامی دوره‌ها"}
              </p>
            </div>
          </div>

          <div className="term-dropdown-wrapper" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <label style={{ fontSize: "0.84rem", fontWeight: "700" }}>انتخاب ترم:</label>
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
            <strong>نظارت بر حضور و غیاب</strong>
            <p>
              ثبت و ویرایش وضعیت حضور و غیاب جلسات توسط اساتید در پنل مدرس انجام می‌شود.
              شما می‌توانید وضعیت حضور و غیاب تمامی کلاس‌های ترم را بررسی نمایید.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="secretary-attendance-stats">
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
            hint="در این تاریخ"
            icon={<UserCheck size={22} />}
            color="green"
          />
          <StatCard
            title="غائبین ثبت‌شده"
            value={`${toPersianDigits(stats.absent)} نفر`}
            hint="در این تاریخ"
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

        {/* Filters */}
        <div className="secretary-attendance-card">
          <div className="attendance-controls-grid">
            <div className="control-group">
              <label>انتخاب کلاس در {activeTermObj ? `«${activeTermObj.name}»` : "ترم"}:</label>
              <div className="select-wrapper">
                <BookOpen size={16} className="field-icon" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="custom-select"
                >
                  <option value="all">همه کلاس‌های ترم</option>
                  {termClassrooms.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="control-group">
              <label>تاریخ جلسه (شمسی):</label>
              <JalaliDatePicker
                value={selectedDate}
                onChange={(iso) => setSelectedDate(iso)}
                placeholder="انتخاب تاریخ جلسه..."
              />
            </div>

            <div className="control-group search-group">
              <label>جستجو در دانش‌آموزان:</label>
              <div className="search-wrapper">
                <Search size={16} className="field-icon" />
                <input
                  type="text"
                  placeholder="نام، شماره کاربری یا شماره تماس..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="secretary-attendance-card">
          <div className="card-header">
            <div className="header-info">
              <h3>گزارش حضور و غیاب دانش‌آموزان</h3>
              <p>تاریخ: {toJalaliDateString(selectedDate)}</p>
            </div>
            <div className="header-badges">
              <span className="count-badge">
                {toPersianDigits(filteredStudents.length)} دانش‌آموز
              </span>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">در حال بارگذاری اطلاعات...</div>
          ) : filteredStudents.length > 0 ? (
            <div className="table-responsive">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>دانش‌آموز</th>
                    <th>نام کاربری</th>
                    <th>شماره تماس</th>
                    <th>کلاس مربوطه</th>
                    <th>وضعیت در تاریخ</th>
                    <th>توضیحات استاد</th>
                    <th>پرونده</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((item) => (
                    <tr key={`${item.classId}-${item.id}`}>
                      <td>
                        <strong>{item.studentName}</strong>
                      </td>
                      <td>
                        <span className="username-tag">{item.username}</span>
                      </td>
                      <td>
                        <span className="phone-tag">{item.phone}</span>
                      </td>
                      <td>
                        <span className="class-badge">{item.className}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${item.statusClass}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <span className="note-text">
                          {item.note || "-"}
                        </span>
                      </td>
                      <td>
                        <Link to={`/panel/${menuType}/students/${item.id}`}>
                          <button type="button" className="btn-view-profile">
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
            <div className="empty-state">
              <Users size={36} />
              <p>دانش‌آموزی در این کلاس یا تاریخ یافت نشد.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SecretaryAttendance;
