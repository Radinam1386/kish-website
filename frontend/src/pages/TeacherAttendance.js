import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Save,
  Users,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  UserCheck,
  UserX,
  BookOpen,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import { toPersianDigits, getTodayJalali } from "../utils/dateUtils";

import "./TeacherAttendance.css";

const statusOptions = [
  { value: "present", label: "حاضر", color: "green" },
  { value: "absent", label: "غایب", color: "red" },
  { value: "late", label: "دیرکرد", color: "yellow" },
  { value: "excused", label: "موجه", color: "blue" },
];

function TeacherAttendance() {
  const { classId: initialClassId } = useParams();
  const today = getTodayJalali();

  const [selectedClassId, setSelectedClassId] = useState(initialClassId || "");
  const [selectedDate, setSelectedDate] = useState(today.isoGregorian);

  const [classrooms, setClassrooms] = useState([]);
  const [currentClassroom, setCurrentClassroom] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [notes, setNotes] = useState({});
  const [existingRecordIds, setExistingRecordIds] = useState({});
  const [existingSessionId, setExistingSessionId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load teacher's classrooms
  useEffect(() => {
    let alive = true;

    async function loadTeacherClasses() {
      try {
        const [classes, terms] = await Promise.all([
          api.classrooms.list(),
          api.terms.list(),
        ]);
        if (!alive) return;
        const activeTermIds = (terms || []).filter((t) => t.is_active).map((t) => t.id);
        const activeClasses = (classes || []).filter(
          (c) => activeTermIds.length === 0 || activeTermIds.includes(c.term || c.term?.id),
        );
        setClassrooms(activeClasses || []);
        if (!selectedClassId && activeClasses?.length) {
          setSelectedClassId(String(activeClasses[0].id));
        }
      } catch (err) {
        if (alive) setErrorMessage(err.message || "خطا در دریافت لیست کلاس‌ها");
      }
    }

    loadTeacherClasses();

    return () => {
      alive = false;
    };
  }, [selectedClassId]);

  // Load classroom and existing attendance for selectedDate
  useEffect(() => {
    if (!selectedClassId) return;
    let alive = true;

    async function loadClassroomAndAttendance() {
      try {
        setLoading(true);
        setErrorMessage("");
        setMessage("");

        const [clsData, sessionsData, attendanceData] = await Promise.all([
          api.classrooms.get(selectedClassId),
          api.sessions.list(),
          api.attendance.list(),
        ]);

        if (!alive) return;

        setCurrentClassroom(clsData);

        const enrollments = clsData.enrollments || [];
        const existingSession = (sessionsData || []).find(
          (s) =>
            (s.classroom === Number(selectedClassId) || s.classroom?.id === Number(selectedClassId)) &&
            s.date === selectedDate,
        );

        setExistingSessionId(existingSession ? existingSession.id : null);

        const newStatuses = {};
        const newNotes = {};
        const newRecordIds = {};

        for (const enr of enrollments) {
          const studentId = typeof enr.student === "object" ? enr.student.id : enr.student;
          let record = null;
          if (existingSession) {
            record = (attendanceData || []).find(
              (a) =>
                (a.session === existingSession.id || a.session?.id === existingSession.id) &&
                (a.student === studentId || a.student?.id === studentId),
            );
          }

          if (record) {
            newStatuses[studentId] = record.status;
            newNotes[studentId] = record.note || "";
            newRecordIds[studentId] = record.id;
          } else {
            newStatuses[studentId] = "present";
            newNotes[studentId] = "";
          }
        }

        setStatuses(newStatuses);
        setNotes(newNotes);
        setExistingRecordIds(newRecordIds);
      } catch (err) {
        if (alive) setErrorMessage(err.message || "خطا در دریافت اطلاعات کلاس و حضور و غیاب");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadClassroomAndAttendance();

    return () => {
      alive = false;
    };
  }, [selectedClassId, selectedDate]);

  const students = useMemo(() => {
    if (!currentClassroom?.enrollments) return [];
    return currentClassroom.enrollments.map((item) => item.student_detail || { id: item.student, username: `دانش‌آموز ${item.student}` });
  }, [currentClassroom]);

  const handleStatusChange = (studentId, status) => {
    setStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleNoteChange = (studentId, note) => {
    setNotes((prev) => ({
      ...prev,
      [studentId]: note,
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((st) => {
      updated[st.id] = status;
    });
    setStatuses(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      let sessionId = existingSessionId;

      if (!sessionId) {
        const session = await api.sessions.create({
          classroom: Number(selectedClassId),
          date: selectedDate,
        });
        sessionId = session.id;
        setExistingSessionId(sessionId);
      }

      const newRecordIds = { ...existingRecordIds };

      for (const student of students) {
        const studentId = student.id;
        const status = statuses[studentId] || "present";
        const note = notes[studentId] || "";
        const recordId = existingRecordIds[studentId];

        if (recordId) {
          await api.attendance.update(recordId, {
            session: sessionId,
            student: studentId,
            status,
            note,
          });
        } else {
          const newRecord = await api.attendance.create({
            session: sessionId,
            student: studentId,
            status,
            note,
          });
          newRecordIds[studentId] = newRecord.id;
        }
      }

      setExistingRecordIds(newRecordIds);
      setMessage("حضور و غیاب این جلسه با موفقیت در سیستم ثبت گردید.");
    } catch (err) {
      setErrorMessage(err.message || "ثبت حضور و غیاب ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const total = students.length;
    const present = Object.values(statuses).filter((s) => s === "present").length;
    const absent = Object.values(statuses).filter((s) => s === "absent").length;
    const late = Object.values(statuses).filter((s) => s === "late").length;
    const excused = Object.values(statuses).filter((s) => s === "excused").length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, late, excused, rate };
  }, [students, statuses]);

  return (
    <DashboardLayout
      role="پنل معلم"
      title="ثبت حضور و غیاب"
      menuType="teacher"
    >
      <div className="teacher-attendance-q9m4-root">
        {/* Header Section */}
        <section className="teacher-attendance-q9m4-section">
          <div className="teacher-attendance-q9m4-section-head">
            <div className="teacher-attendance-q9m4-heading">
              <div className="teacher-attendance-q9m4-avatar">
                <Users size={24} />
              </div>

              <div className="teacher-attendance-q9m4-heading-content">
                <h3 className="teacher-attendance-q9m4-title">
                  ثبت حضور و غیاب کلاسی
                </h3>

                <p className="teacher-attendance-q9m4-class-code">
                  {currentClassroom ? currentClassroom.name : "انتخاب کلاس"}
                </p>
              </div>
            </div>

            <div className="teacher-attendance-header-actions">
              <Link to="/panel/teacher">
                <AnimatedButton variant="secondary" size="small">
                  <ArrowRight size={16} />
                  بازگشت به کلاس‌های من
                </AnimatedButton>
              </Link>
            </div>
          </div>

          {errorMessage && (
            <div className="attendance-alert error">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {message && (
            <div className="attendance-alert success">
              <Sparkles size={18} />
              <span>{message}</span>
            </div>
          )}

          {/* Controls: Class Selector & Jalali DatePicker */}
          <div className="teacher-att-controls-grid">
            <div className="teacher-att-control-box">
              <label className="teacher-att-label">
                <BookOpen size={16} />
                <span>کلاس تدریس</span>
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="teacher-att-select"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="teacher-att-control-box">
              <JalaliDatePicker
                label="تاریخ برگزاری جلسه (شمسی)"
                value={selectedDate}
                onChange={(iso) => setSelectedDate(iso)}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="teacher-att-stats-row">
            <StatCard
              title="کل دانش‌آموزان"
              value={`${toPersianDigits(stats.total)} نفر`}
              icon={<Users size={20} />}
              color="blue"
            />
            <StatCard
              title="حاضرین"
              value={`${toPersianDigits(stats.present)} نفر`}
              icon={<UserCheck size={20} />}
              color="green"
            />
            <StatCard
              title="غایبین"
              value={`${toPersianDigits(stats.absent)} نفر`}
              icon={<UserX size={20} />}
              color="red"
            />
            <StatCard
              title="درصد حضور"
              value={`${toPersianDigits(stats.rate)}٪`}
              icon={<Clock size={20} />}
              color="orange"
            />
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="teacher-att-bulk-bar">
            <span>عملیات سریع:</span>
            <button
              type="button"
              className="bulk-action-btn present"
              onClick={() => handleMarkAll("present")}
            >
              حاضر کردن همه
            </button>
            <button
              type="button"
              className="bulk-action-btn absent"
              onClick={() => handleMarkAll("absent")}
            >
              غایب کردن همه
            </button>
          </div>

          {/* Students List for Taking Attendance */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              در حال دریافت لیست دانش‌آموزان...
            </div>
          ) : students.length > 0 ? (
            <div className="teacher-attendance-q9m4-students">
              {students.map((student) => (
                <div key={student.id} className="teacher-attendance-q9m4-student-card">
                  <div className="teacher-attendance-q9m4-student-info">
                    <div className="teacher-attendance-q9m4-student-avatar">
                      {getFullName(student).charAt(0) || "د"}
                    </div>

                    <div className="teacher-attendance-q9m4-student-details">
                      <h4 className="teacher-attendance-q9m4-student-name">
                        {getFullName(student)}
                      </h4>

                      <span className="teacher-attendance-q9m4-student-meta">
                        نام کاربری: {student.username} | تلفن: {student.phone_number || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="teacher-attendance-q9m4-student-controls">
                    {/* Status radio buttons */}
                    <div className="teacher-att-status-pills">
                      {statusOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`status-choice-btn ${opt.value} ${
                            statuses[student.id] === opt.value ? "active" : ""
                          }`}
                          onClick={() => handleStatusChange(student.id, opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Note input */}
                    <input
                      type="text"
                      placeholder="یادداشت معلم (اختیاری)..."
                      value={notes[student.id] || ""}
                      onChange={(e) => handleNoteChange(student.id, e.target.value)}
                      className="teacher-att-note-input"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <Users size={36} />
              <p>دانش‌آموزی در این کلاس ثبت‌نام نشده است.</p>
            </div>
          )}

          {/* Save Button Footer */}
          {students.length > 0 && (
            <div className="teacher-att-footer">
              <AnimatedButton
                variant="primary"
                onClick={handleSave}
                disabled={saving || loading}
              >
                <Save size={18} />
                {saving ? "در حال ذخیره‌سازی..." : "ذخیره نهایی حضور و غیاب"}
              </AnimatedButton>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default TeacherAttendance;
