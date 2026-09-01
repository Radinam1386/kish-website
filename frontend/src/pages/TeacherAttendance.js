import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Save,
  Users,
  Clock,
  AlertCircle,
  Sparkles,
  UserCheck,
  UserX,
  BookOpen,
  ArrowLeft,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import { toPersianDigits, getTodayJalali } from "../utils/dateUtils";
import Attendance from "./Attendance";
import "./TeacherAttendance.css";

const statusOptions = [
  {
    value: "present",
    label: "حاضر",
    color: "green",
  },
  {
    value: "absent",
    label: "غایب",
    color: "red",
  },
  {
    value: "late",
    label: "دیرکرد",
    color: "yellow",
  },
  {
    value: "excused",
    label: "موجه",
    color: "blue",
  },
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

  /* =========================================================
     Load Teacher Classes
     ========================================================= */

  useEffect(() => {
    let alive = true;

    async function loadTeacherClasses() {
      try {
        const [classes, terms] = await Promise.all([
          api.classrooms.list(),
          api.terms.list(),
        ]);

        if (!alive) return;

        const activeTermIds = (terms || [])
          .filter((term) => term.is_active)
          .map((term) => term.id);

        const activeClasses = (classes || []).filter(
          (classroom) =>
            activeTermIds.length === 0 ||
            activeTermIds.includes(classroom.term?.id ?? classroom.term),
        );

        setClassrooms(activeClasses);

        if (!selectedClassId && activeClasses.length > 0) {
          setSelectedClassId(String(activeClasses[0].id));
        }
      } catch (error) {
        if (!alive) return;

        setErrorMessage(error.message || "خطا در دریافت لیست کلاس‌ها");
      }
    }

    loadTeacherClasses();

    return () => {
      alive = false;
    };
  }, [selectedClassId]);

  /* =========================================================
     Load Classroom + Attendance
     ========================================================= */

  useEffect(() => {
    if (!selectedClassId) return;

    let alive = true;

    async function loadClassroomAndAttendance() {
      try {
        setLoading(true);
        setErrorMessage("");
        setMessage("");

        const [classroomData, sessionsData, attendanceData] = await Promise.all(
          [
            api.classrooms.get(selectedClassId),
            api.sessions.list(),
            api.attendance.list(),
          ],
        );

        if (!alive) return;

        setCurrentClassroom(classroomData);

        const enrollments = classroomData.enrollments || [];

        const existingSession = (sessionsData || []).find(
          (session) =>
            (session.classroom === Number(selectedClassId) ||
              session.classroom?.id === Number(selectedClassId)) &&
            session.date === selectedDate,
        );

        setExistingSessionId(existingSession ? existingSession.id : null);

        const nextStatuses = {};
        const nextNotes = {};
        const nextRecordIds = {};

        for (const enrollment of enrollments) {
          const studentId =
            typeof enrollment.student === "object"
              ? enrollment.student.id
              : enrollment.student;

          let record = null;

          if (existingSession) {
            record = (attendanceData || []).find(
              (attendance) =>
                (attendance.session === existingSession.id ||
                  attendance.session?.id === existingSession.id) &&
                (attendance.student === studentId ||
                  attendance.student?.id === studentId),
            );
          }

          if (record) {
            nextStatuses[studentId] = record.status;
            nextNotes[studentId] = record.note || "";
            nextRecordIds[studentId] = record.id;
          } else {
            nextStatuses[studentId] = "present";
            nextNotes[studentId] = "";
          }
        }

        setStatuses(nextStatuses);
        setNotes(nextNotes);
        setExistingRecordIds(nextRecordIds);
      } catch (error) {
        if (!alive) return;

        setErrorMessage(
          error.message || "خطا در دریافت اطلاعات کلاس و حضور و غیاب",
        );
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadClassroomAndAttendance();

    return () => {
      alive = false;
    };
  }, [selectedClassId, selectedDate]);

  /* =========================================================
     Students
     ========================================================= */

  const students = useMemo(() => {
    if (!currentClassroom?.enrollments) {
      return [];
    }

    return currentClassroom.enrollments.map((item) => {
      return (
        item.student_detail || {
          id: item.student,
          username: `دانش‌آموز ${item.student}`,
        }
      );
    });
  }, [currentClassroom]);

  /* =========================================================
     Status
     ========================================================= */

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
    const updatedStatuses = {};

    students.forEach((student) => {
      updatedStatuses[student.id] = status;
    });

    setStatuses(updatedStatuses);
  };

  /* =========================================================
     Save Attendance
     ========================================================= */

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

      const newRecordIds = {
        ...existingRecordIds,
      };

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
    } catch (error) {
      setErrorMessage(error.message || "ثبت حضور و غیاب ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     Statistics
     ========================================================= */

  const stats = useMemo(() => {
    const total = students.length;

    const present = Object.values(statuses).filter(
      (status) => status === "present",
    ).length;

    const absent = Object.values(statuses).filter(
      (status) => status === "absent",
    ).length;

    const late = Object.values(statuses).filter(
      (status) => status === "late",
    ).length;

    const excused = Object.values(statuses).filter(
      (status) => status === "excused",
    ).length;

    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      late,
      excused,
      rate,
    };
  }, [students, statuses]);

  /* =========================================================
     Render
     ========================================================= */

  return (
    <DashboardLayout role="پنل معلم" title="ثبت حضور و غیاب" menuType="teacher">
      <div className="teacher-attendance-page">
        <section className="teacher-attendance-card">
          {/* =================================================
              Header
             ================================================= */}

          <div className="teacher-attendance-header">
            <div className="teacher-attendance-header-content">
              <div className="teacher-attendance-header-icon">
                <Users size={22} />
              </div>

              <div className="teacher-attendance-header-text">
                <h2>ثبت حضور و غیاب کلاسی</h2>

                <p>
                  {currentClassroom ? currentClassroom.name : "انتخاب کلاس"}
                </p>
              </div>
            </div>

            <Link to="/panel/teacher" className="teacher-attendance-back">
              <span>بازگشت به کلاس‌های من</span>
              <ArrowLeft size={17} />
            </Link>
          </div>

          {/* =================================================
              Alerts
             ================================================= */}

          {errorMessage && (
            <div className="teacher-attendance-alert teacher-attendance-alert-error">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {message && (
            <div className="teacher-attendance-alert teacher-attendance-alert-success">
              <Sparkles size={18} />
              <span>{message}</span>
            </div>
          )}

          {/* =================================================
              Controls
             ================================================= */}

          <div className="teacher-attendance-controls">
            <div className="teacher-attendance-control">
              <label>
                <BookOpen size={16} />
                <span>کلاس تدریس</span>
              </label>

              <select
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
              >
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="teacher-attendance-control teacher-attendance-date">
              <JalaliDatePicker
                label="تاریخ برگزاری جلسه (شمسی)"
                value={selectedDate}
                onChange={(iso) => setSelectedDate(iso)}
              />
            </div>
          </div>

          <Attendance />

          {/* =================================================
              Statistics
             ================================================= */}

          <div className="teacher-attendance-stats">
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

          {/* =================================================
              Bulk Actions
             ================================================= */}

          <div className="teacher-attendance-bulk">
            <div className="teacher-attendance-bulk-title">
              <span>عملیات سریع</span>
            </div>

            <div className="teacher-attendance-bulk-actions">
              <button
                type="button"
                className="teacher-attendance-bulk-btn teacher-attendance-bulk-present"
                onClick={() => handleMarkAll("present")}
              >
                <UserCheck size={15} />
                حاضر کردن همه
              </button>

              <button
                type="button"
                className="teacher-attendance-bulk-btn teacher-attendance-bulk-absent"
                onClick={() => handleMarkAll("absent")}
              >
                <UserX size={15} />
                غایب کردن همه
              </button>
            </div>
          </div>

          {/* =================================================
              Students
             ================================================= */}

          {loading ? (
            <div className="teacher-attendance-loading">
              <div className="teacher-attendance-loading-spinner" />
              <span>در حال دریافت لیست دانش‌آموزان...</span>
            </div>
          ) : students.length > 0 ? (
            <div className="teacher-attendance-students">
              {students.map((student) => {
                const fullName = getFullName(student);
                const selectedStatus = statuses[student.id] || "present";

                return (
                  <div key={student.id} className="teacher-attendance-student">
                    <div className="teacher-attendance-student-info">
                      <div className="teacher-attendance-student-avatar">
                        {fullName?.charAt(0) || "د"}
                      </div>

                      <div className="teacher-attendance-student-details">
                        <h3>{fullName}</h3>

                        <div className="teacher-attendance-student-meta">
                          <span>نام کاربری: {student.username || "-"}</span>

                          <span className="teacher-attendance-meta-divider">
                            |
                          </span>

                          <span>تلفن: {student.phone_number || "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="teacher-attendance-student-actions">
                      <div className="teacher-attendance-statuses">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`
                              teacher-attendance-status
                              teacher-attendance-status-${option.color}
                              ${
                                selectedStatus === option.value
                                  ? "is-active"
                                  : ""
                              }
                            `}
                            onClick={() =>
                              handleStatusChange(student.id, option.value)
                            }
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={notes[student.id] || ""}
                        onChange={(event) =>
                          handleNoteChange(student.id, event.target.value)
                        }
                        placeholder="یادداشت معلم (اختیاری)..."
                        className="teacher-attendance-note"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="teacher-attendance-empty">
              <div className="teacher-attendance-empty-icon">
                <Users size={32} />
              </div>

              <h3>دانش‌آموزی یافت نشد</h3>

              <p>دانش‌آموزی در این کلاس ثبت‌نام نشده است.</p>
            </div>
          )}

          {/* =================================================
              Footer
             ================================================= */}

          {students.length > 0 && (
            <div className="teacher-attendance-footer">
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
