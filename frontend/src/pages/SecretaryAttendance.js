import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Filter,
  Search,
  UserCheck,
  UserX,
  Users,
  AlertCircle,
  Save,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import "./SecretaryAttendance.css";

const statusMapping = {
  present: "حاضر",
  absent: "غایب",
  excused: "موجه",
  late: "دیرکرد",
};

const reverseStatusMapping = {
  حاضر: "present",
  غایب: "absent",
  موجه: "excused",
  دیرکرد: "late",
};

function getTodayIsoDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function SecretaryAttendance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate());

  const [classrooms, setClassrooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [attendanceState, setAttendanceState] = useState({});

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

      setClassrooms(classroomsData || []);
      setUsers(usersData || []);
      setEnrollments(enrollmentsData || []);
      setSessions(sessionsData || []);
      setAttendanceRecords(attendanceData || []);

      if (classroomsData?.length && selectedClass === "all") {
        setSelectedClass(String(classroomsData[0].id));
      }
    } catch (err) {
      setError(err.message || "خطا در دریافت اطلاعات از سرور");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
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

        const recordKey = `${cls.id}-${studentId}`;
        let existingRecord = null;
        if (existingSession) {
          existingRecord = attendanceRecords.find(
            (r) =>
              (r.session === existingSession.id || r.session?.id === existingSession.id) &&
              (r.student === studentId || r.student?.id === studentId),
          );
        }

        const currentLocal = attendanceState[recordKey];
        const status = currentLocal?.status || (existingRecord ? statusMapping[existingRecord.status] || "حاضر" : "حاضر");
        const note = currentLocal?.note !== undefined ? currentLocal.note : (existingRecord?.note || "");

        list.push({
          key: recordKey,
          id: studentId,
          recordId: existingRecord?.id || null,
          sessionId: existingSession?.id || null,
          classId: cls.id,
          className: cls.name,
          name: getFullName(studentUser),
          phone: studentUser.phone_number || "-",
          status,
          note,
        });
      }
    }

    return list;
  }, [classrooms, enrollments, users, sessions, attendanceRecords, selectedClass, selectedDate, attendanceState]);

  const statusOptions = [
    { value: "حاضر", className: "present" },
    { value: "غایب", className: "absent" },
    { value: "موجه", className: "excused" },
    { value: "دیرکرد", className: "late" },
  ];

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return studentsList.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        String(student.id).includes(normalizedSearch) ||
        student.phone.toLowerCase().includes(normalizedSearch);

      return matchesSearch;
    });
  }, [studentsList, searchTerm]);

  const totalStudents = filteredStudents.length;
  const presentCount = filteredStudents.filter((s) => s.status === "حاضر").length;
  const absentCount = filteredStudents.filter((s) => s.status === "غایب").length;
  const excusedCount = filteredStudents.filter((s) => s.status === "موجه").length;
  const lateCount = filteredStudents.filter((s) => s.status === "دیرکرد").length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const handleStatusChange = (key, newStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        status: newStatus,
      },
    }));
  };

  const handleNoteChange = (key, newNote) => {
    setAttendanceState((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        note: newNote,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSaveSuccess("");

      const groupedByClass = {};
      for (const item of studentsList) {
        if (!groupedByClass[item.classId]) {
          groupedByClass[item.classId] = [];
        }
        groupedByClass[item.classId].push(item);
      }

      for (const [classIdStr, classStudents] of Object.entries(groupedByClass)) {
        const classId = Number(classIdStr);
        let session = sessions.find(
          (s) => (s.classroom === classId || s.classroom?.id === classId) && s.date === selectedDate,
        );

        if (!session) {
          session = await api.sessions.create({
            classroom: classId,
            date: selectedDate,
          });
        }

        for (const st of classStudents) {
          const backendStatus = reverseStatusMapping[st.status] || "present";
          if (st.recordId) {
            await api.attendance.update(st.recordId, {
              session: session.id,
              student: st.id,
              status: backendStatus,
              note: st.note,
            });
          } else {
            await api.attendance.create({
              session: session.id,
              student: st.id,
              status: backendStatus,
              note: st.note,
            });
          }
        }
      }

      setSaveSuccess("تغییرات حضور و غیاب با موفقیت در سیستم ذخیره شد.");
      setAttendanceState({});
      await loadData();
    } catch (err) {
      setError(err.message || "خطا در ذخیره‌سازی حضور و غیاب");
    } finally {
      setSaving(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    if (classrooms.length > 0) setSelectedClass(String(classrooms[0].id));
    setSelectedDate(getTodayIsoDate());
    setAttendanceState({});
  };

  return (
    <DashboardLayout role="پنل منشی" title="حضور و غیاب" menuType="secretary">
      <div className="secretary-attendance-page">
        <section className="secretary-attendance-stats">
          <AttendanceStatCard
            title="کل دانش‌آموزان کلاس"
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

        <section className="secretary-attendance-section">
          <div className="secretary-attendance-section-header">
            <div className="secretary-attendance-heading">
              <span className="secretary-attendance-kicker">
                <CalendarDays size={15} />
                مدیریت حضور و غیاب
              </span>

              <h2>ثبت و مدیریت حضور دانش‌آموزان</h2>

              <p>
                وضعیت حضور دانش‌آموزان را بر اساس کلاس و تاریخ بررسی، ثبت و در سرور ذخیره کنید.
              </p>
            </div>

            <div className="secretary-attendance-actions">
              <button
                type="button"
                className="secretary-attendance-reset-btn"
                onClick={handleResetFilters}
              >
                <RotateCcw size={16} />
                بازنشانی
              </button>

              <AnimatedButton
                variant="danger"
                onClick={handleSave}
                disabled={saving || loading}
              >
                {saving ? (
                  <>
                    <RefreshCw size={17} className="secretary-student-form-loading" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    ذخیره تغییرات
                  </>
                )}
              </AnimatedButton>
            </div>
          </div>

          {error && (
            <div style={{ color: "var(--danger, #ef4444)", padding: "0.8rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          {saveSuccess && (
            <div style={{ color: "var(--success, #22c55e)", padding: "0.8rem", background: "rgba(34, 197, 94, 0.1)", borderRadius: "8px", marginBottom: "1rem" }}>
              {saveSuccess}
            </div>
          )}

          <div className="secretary-attendance-filter-card">
            <div className="secretary-attendance-search">
              <Search size={18} className="secretary-attendance-input-icon" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="جستجو بر اساس نام یا شماره تماس..."
                className="secretary-attendance-input"
              />
            </div>

            <div className="secretary-attendance-select">
              <Filter size={17} className="secretary-attendance-input-icon" />

              <select
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
                className="secretary-attendance-input"
              >
                <option value="all">همه کلاس‌ها</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name} (کلاس {c.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="secretary-attendance-date">
              <CalendarDays size={17} className="secretary-attendance-input-icon" />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="secretary-attendance-input secretary-attendance-date-input"
              />
            </div>
          </div>

          <div className="secretary-attendance-summary">
            <div>
              نمایش <strong>{filteredStudents.length}</strong> دانش‌آموز در تاریخ <strong>{selectedDate}</strong>
            </div>

            <div className="secretary-attendance-extra">
              <span>
                موجه: <strong>{excusedCount}</strong>
              </span>

              <span>
                دیرکرد: <strong>{lateCount}</strong>
              </span>
            </div>
          </div>

          <div className="secretary-attendance-table-wrapper">
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                در حال بارگذاری اطلاعات حضور و غیاب...
              </div>
            ) : filteredStudents.length > 0 ? (
              <table className="secretary-attendance-table">
                <thead>
                  <tr>
                    <th>دانش‌آموز</th>
                    <th>شماره تماس</th>
                    <th>کلاس</th>
                    <th>وضعیت حضور</th>
                    <th>یادداشت</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.key}>
                      <td>
                        <div className="secretary-attendance-student">
                          <div className="secretary-attendance-avatar">
                            {student.name.charAt(0)}
                          </div>

                          <div className="secretary-attendance-student-info">
                            <strong>{student.name}</strong>
                            <span>شناسه: {student.id}</span>
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
                        <div className="secretary-attendance-status-group">
                          {statusOptions.map((statusItem) => (
                            <button
                              key={statusItem.value}
                              type="button"
                              onClick={() =>
                                handleStatusChange(student.key, statusItem.value)
                              }
                              className={`secretary-attendance-status ${statusItem.className} ${
                                student.status === statusItem.value ? "active" : ""
                              }`}
                            >
                              {statusItem.value}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td>
                        <input
                          type="text"
                          value={student.note || ""}
                          placeholder="افزودن یادداشت..."
                          onChange={(e) => handleNoteChange(student.key, e.target.value)}
                          className="secretary-attendance-input"
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="secretary-attendance-empty">
                <div className="secretary-attendance-empty-icon">
                  <Users size={34} />
                </div>

                <strong>دانش‌آموزی در این کلاس یافت نشد</strong>

                <span>کلاس دیگری را انتخاب کنید یا دانش‌آموزان را در کلاس ثبت‌نام نمایید.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function AttendanceStatCard({ title, value, icon, color }) {
  return (
    <article className="secretary-attendance-stat-card">
      <div className={`secretary-attendance-stat-icon ${color}`}>{icon}</div>

      <div className="secretary-attendance-stat-content">
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

export default SecretaryAttendance;