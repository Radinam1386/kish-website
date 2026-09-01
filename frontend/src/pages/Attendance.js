import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  BookOpen,
  UserRound,
  XCircle,
  AlertCircle,
  ClipboardCheck,
  UsersRound,
} from "lucide-react";

import { api, getFullName } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

import "./Attendance.css";

/* =========================================================
   Helpers
========================================================= */

function getEntityId(value) {
  if (value && typeof value === "object") {
    return value.id;
  }

  return value;
}

function getStudentIdFromSession() {
  try {
    const storedUser = localStorage.getItem("kish_auth_user");

    if (!storedUser) {
      return null;
    }

    const user = JSON.parse(storedUser);

    return user?.student?.id || user?.student_id || user?.id || null;
  } catch {
    return null;
  }
}

function getAttendanceStatus(record) {
  if (!record) {
    return "unknown";
  }

  if (
    record.status === "present" ||
    record.status === "حاضر" ||
    record.is_present === true
  ) {
    return "present";
  }

  if (
    record.status === "absent" ||
    record.status === "حاضر نیست" ||
    record.status === "غایب" ||
    record.is_present === false
  ) {
    return "absent";
  }

  if (
    record.status === "late" ||
    record.status === "تأخیر" ||
    record.status === "دیرکرد" ||
    record.is_late === true
  ) {
    return "late";
  }

  if (record.status === "excused" || record.status === "موجه") {
    return "excused";
  }

  return "unknown";
}

/*
 * پیدا کردن دانش‌آموز از enrollment
 */
function getEnrollmentStudent(enrollment) {
  if (!enrollment) {
    return null;
  }

  if (enrollment.student_detail) {
    return enrollment.student_detail;
  }

  if (enrollment.student && typeof enrollment.student === "object") {
    return enrollment.student;
  }

  return null;
}

/*
 * بررسی اینکه دانش‌آموز در کلاس ثبت‌نام شده یا نه
 */
function isStudentEnrolledInClass(classroom, studentId) {
  if (!classroom || !studentId) {
    return false;
  }

  const enrollments = classroom.enrollments || [];

  return enrollments.some((enrollment) => {
    const enrollmentStudentId = getEntityId(enrollment.student);

    return Number(enrollmentStudentId) === Number(studentId);
  });
}

/* =========================================================
   Component
========================================================= */

function Attendance() {
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     Load Backend Data
  ========================================================= */

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const studentId = getStudentIdFromSession();

        if (!studentId) {
          throw new Error("اطلاعات دانش‌آموز در حساب کاربری پیدا نشد.");
        }

        /*
         * دقیقاً همان endpointهایی که در TeacherAttendance
         * از بک‌اند فعلی استفاده شده‌اند.
         */
        const [classroomsData, sessionsData, attendanceData] =
          await Promise.all([
            api.classrooms.list(),
            api.sessions.list(),
            api.attendance.list(),
          ]);

        if (!alive) {
          return;
        }

        const allClasses = Array.isArray(classroomsData) ? classroomsData : [];

        const allSessions = Array.isArray(sessionsData) ? sessionsData : [];

        const allAttendance = Array.isArray(attendanceData)
          ? attendanceData
          : [];

        /*
         * فقط کلاس‌هایی که دانش‌آموز واقعاً
         * داخل enrollment آن‌هاست.
         */
        const studentClasses = allClasses.filter((classroom) =>
          isStudentEnrolledInClass(classroom, studentId),
        );

        setClasses(studentClasses);
        setSessions(allSessions);
        setAttendance(allAttendance);
      } catch (err) {
        if (!alive) {
          return;
        }

        setError(err?.message || "دریافت اطلاعات حضور و غیاب ناموفق بود.");
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  /* =========================================================
     Sessions By Class
  ========================================================= */

  const sessionsByClass = useMemo(() => {
    const result = {};

    sessions.forEach((session) => {
      const classroomId = getEntityId(session.classroom);

      if (!classroomId) {
        return;
      }

      if (!result[classroomId]) {
        result[classroomId] = [];
      }

      result[classroomId].push(session);
    });

    /*
     * جدیدترین جلسه اول
     */
    Object.values(result).forEach((items) => {
      items.sort((a, b) => {
        const dateA = new Date(a.date || a.session_date || a.created_at || 0);

        const dateB = new Date(b.date || b.session_date || b.created_at || 0);

        return dateB - dateA;
      });
    });

    return result;
  }, [sessions]);

  /* =========================================================
     Attendance Record For Student
  ========================================================= */

  const getAttendanceForSession = (session) => {
    const sessionId = getEntityId(session);

    const studentId = getStudentIdFromSession();

    if (!sessionId || !studentId) {
      return null;
    }

    return attendance.find((item) => {
      const itemSessionId =
        getEntityId(item.session) || getEntityId(item.session_detail);

      const itemStudentId =
        getEntityId(item.student) || getEntityId(item.student_detail);

      return (
        Number(itemSessionId) === Number(sessionId) &&
        Number(itemStudentId) === Number(studentId)
      );
    });
  };

  /* =========================================================
     Overall Statistics
  ========================================================= */

  const statistics = useMemo(() => {
    let total = 0;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    /*
     * فقط جلساتی که متعلق به کلاس‌های خود دانش‌آموز هستند
     */
    const studentClassIds = new Set(
      classes.map((classroom) => Number(classroom.id)),
    );

    sessions.forEach((session) => {
      const classroomId = Number(getEntityId(session.classroom));

      if (!studentClassIds.has(classroomId)) {
        return;
      }

      const record = getAttendanceForSession(session);

      if (!record) {
        return;
      }

      total += 1;

      const status = getAttendanceStatus(record);

      if (status === "present") {
        present += 1;
      }

      if (status === "absent") {
        absent += 1;
      }

      if (status === "late") {
        late += 1;
      }

      if (status === "excused") {
        excused += 1;
      }
    });

    const attendancePercent =
      total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      late,
      excused,
      attendancePercent,
    };
  }, [classes, sessions, attendance]);

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="student-attendance-x8p4-root" dir="rtl">
      {/* =====================================================
          Header
      ====================================================== */}
      <div className="teacher-attendance-header">
        <div className="teacher-attendance-header-content">
          <div className="teacher-attendance-header-icon">
            <ClipboardCheck size={22} />
          </div>

          <div className="teacher-attendance-header-text">
            <h2>حضور و غیاب کلاس‌ tewrwer</h2>

            <p>سوابق جلسات برگزارشده و وضعیت حضور دانش آموزان در هر کلاس</p>
          </div>
        </div>
      </div>

      {/* =====================================================
          Loading
      ====================================================== */}

      {loading && (
        <section className="student-attendance-x8p4-state">
          <div className="student-attendance-x8p4-loading">
            <span className="student-attendance-x8p4-spinner" />

            <span>در حال دریافت سوابق حضور و غیاب...</span>
          </div>
        </section>
      )}

      {/* =====================================================
          Error
      ====================================================== */}

      {!loading && error && (
        <section className="student-attendance-x8p4-state">
          <div className="student-attendance-x8p4-error">
            <AlertCircle size={22} />

            <span>{error}</span>
          </div>
        </section>
      )}

      {/* =====================================================
          Empty
      ====================================================== */}

      {!loading && !error && classes.length === 0 && (
        <section className="student-attendance-x8p4-state">
          <div className="student-attendance-x8p4-empty">
            <BookOpen size={34} />

            <strong>هنوز کلاسی برای شما ثبت نشده است</strong>

            <span>
              پس از ثبت‌نام در کلاس، سوابق جلسات و حضور و غیاب شما در این بخش
              نمایش داده می‌شود.
            </span>
          </div>
        </section>
      )}

      {/* =====================================================
          Classes
      ====================================================== */}

      {!loading &&
        !error &&
        classes.map((classroom) => {
          const classId = classroom.id;

          const classSessions = sessionsByClass[classId] || [];

          let classPresent = 0;
          let classAbsent = 0;
          let classLate = 0;
          let classExcused = 0;

          classSessions.forEach((session) => {
            const record = getAttendanceForSession(session);

            const status = getAttendanceStatus(record);

            if (status === "present") {
              classPresent++;
            }

            if (status === "absent") {
              classAbsent++;
            }

            if (status === "late") {
              classLate++;
            }

            if (status === "excused") {
              classExcused++;
            }
          });

          const recorded =
            classPresent + classAbsent + classLate + classExcused;

          const percentage =
            recorded > 0
              ? Math.round(((classPresent + classLate) / recorded) * 100)
              : 0;

          const teacher = classroom.teacher_detail || classroom.teacher;

          const teacherName =
            getFullName(teacher) || classroom.teacher_name || "استاد مشخص نشده";

          return (
            <section key={classId} className="student-attendance-x8p4-class">
              {/* =================================================
                  Class Header
              ================================================== */}

              <div className="student-attendance-x8p4-class-header">
                <div className="student-attendance-x8p4-class-info">
                  <div className="student-attendance-x8p4-class-icon">
                    <BookOpen size={21} />
                  </div>

                  <div>
                    <h3>{classroom.name || `کلاس ${classId}`}</h3>

                    <div className="student-attendance-x8p4-class-meta">
                      <span>
                        <UserRound size={14} />

                        {teacherName}
                      </span>

                      <span>
                        <CalendarDays size={14} />
                        {toPersianDigits(classSessions.length)} جلسه
                      </span>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    Summary
                ================================================== */}

                <div className="student-attendance-x8p4-summary">
                  <div className="student-attendance-x8p4-summary-item present">
                    <CheckCircle2 size={16} />

                    <div>
                      <span>حضور</span>

                      <strong>{toPersianDigits(classPresent)}</strong>
                    </div>
                  </div>

                  <div className="student-attendance-x8p4-summary-item absent">
                    <XCircle size={16} />

                    <div>
                      <span>غیبت</span>

                      <strong>{toPersianDigits(classAbsent)}</strong>
                    </div>
                  </div>

                  <div className="student-attendance-x8p4-summary-item late">
                    <Clock3 size={16} />

                    <div>
                      <span>تأخیر</span>

                      <strong>{toPersianDigits(classLate)}</strong>
                    </div>
                  </div>

                  <div className="student-attendance-x8p4-percent">
                    <span>درصد حضور</span>

                    <strong>{toPersianDigits(percentage)}%</strong>
                  </div>
                </div>
              </div>

              {/* =================================================
                  Sessions
              ================================================== */}

              <div className="student-attendance-x8p4-table-shell">
                <div className="student-attendance-x8p4-table-scroll">
                  <table className="student-attendance-x8p4-table">
                    <thead>
                      <tr>
                        <th>جلسه</th>
                        <th>تاریخ</th>
                        <th>عنوان جلسه</th>
                        <th>وضعیت حضور</th>
                        <th>توضیحات</th>
                      </tr>
                    </thead>

                    <tbody>
                      {classSessions.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="student-attendance-x8p4-table-empty"
                          >
                            <CalendarDays size={22} />

                            <span>
                              هنوز جلسه‌ای برای این کلاس ثبت نشده است.
                            </span>
                          </td>
                        </tr>
                      ) : (
                        classSessions.map((session, index) => {
                          const record = getAttendanceForSession(session);

                          const status = getAttendanceStatus(record);

                          return (
                            <tr key={session.id}>
                              {/* جلسه */}

                              <td data-label="جلسه">
                                <span className="student-attendance-x8p4-session-number">
                                  جلسه{" "}
                                  {toPersianDigits(
                                    classSessions.length - index,
                                  )}
                                </span>
                              </td>

                              {/* تاریخ */}

                              <td data-label="تاریخ">
                                <span className="student-attendance-x8p4-date">
                                  {toJalaliDateString(
                                    session.date || session.session_date,
                                  )}
                                </span>
                              </td>

                              {/* عنوان */}

                              <td data-label="عنوان جلسه">
                                <strong className="student-attendance-x8p4-session-title">
                                  {session.title ||
                                    session.topic ||
                                    session.description ||
                                    "جلسه کلاس"}
                                </strong>
                              </td>

                              {/* وضعیت */}

                              <td data-label="وضعیت">
                                {status === "present" && (
                                  <span className="student-attendance-x8p4-status is-present">
                                    <CheckCircle2 size={15} />
                                    حاضر
                                  </span>
                                )}

                                {status === "absent" && (
                                  <span className="student-attendance-x8p4-status is-absent">
                                    <XCircle size={15} />
                                    غایب
                                  </span>
                                )}

                                {status === "late" && (
                                  <span className="student-attendance-x8p4-status is-late">
                                    <Clock3 size={15} />
                                    تأخیر
                                  </span>
                                )}

                                {status === "excused" && (
                                  <span className="student-attendance-x8p4-status is-unknown">
                                    <CheckCircle2 size={15} />
                                    موجه
                                  </span>
                                )}

                                {status === "unknown" && (
                                  <span className="student-attendance-x8p4-status is-unknown">
                                    <AlertCircle size={15} />
                                    ثبت نشده
                                  </span>
                                )}
                              </td>

                              {/* توضیحات */}

                              <td data-label="توضیحات">
                                <span className="student-attendance-x8p4-note">
                                  {record?.note ||
                                    record?.description ||
                                    record?.remarks ||
                                    "—"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          );
        })}

      {/* =====================================================
          Overall Footer Statistics
      ====================================================== */}

      {/* {!loading &&
        !error &&
        classes.length > 0 && (
          <section className="student-attendance-x8p4-overall">
            <StatCard
              title="کل جلسات ثبت‌شده"
              value={`${toPersianDigits(
                statistics.total
              )} جلسه`}
              icon={<CalendarDays size={20} />}
              color="blue"
            />

            <StatCard
              title="حضور"
              value={`${toPersianDigits(
                statistics.present
              )} جلسه`}
              icon={<CheckCircle2 size={20} />}
              color="green"
            />

            <StatCard
              title="غیبت"
              value={`${toPersianDigits(
                statistics.absent
              )} جلسه`}
              icon={<XCircle size={20} />}
              color="red"
            />

            <StatCard
              title="درصد حضور"
              value={`${toPersianDigits(
                statistics.attendancePercent
              )}%`}
              icon={<Clock3 size={20} />}
              color="orange"
            />
          </section>
        )} */}
    </div>
  );
}

export default Attendance;
