import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FilePlus2,
  Loader2,
  Save,
  Search,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { api, getFullName } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

import "./TeacherAttendance.css";

/* =========================================================
   Helpers
========================================================= */

function getEntityId(value) {
  if (value && typeof value === "object") {
    return value.id;
  }

  return value;
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("kish_auth_user");

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getCurrentUserId() {
  const user = getCurrentUser();

  return user?.id || user?.user?.id || null;
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
    record.status === "غایب" ||
    record.status === "حاضر نیست" ||
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

  if (
    record.status === "excused" ||
    record.status === "موجه"
  ) {
    return "excused";
  }

  return "unknown";
}

function getStudentFromEnrollment(enrollment) {
  if (!enrollment) {
    return null;
  }

  if (enrollment.student_detail) {
    return enrollment.student_detail;
  }

  if (
    enrollment.student &&
    typeof enrollment.student === "object"
  ) {
    return enrollment.student;
  }

  return null;
}

function getClassroomTeacherId(classroom) {
  return (
    getEntityId(classroom?.teacher) ||
    getEntityId(classroom?.teacher_detail) ||
    classroom?.teacher_id ||
    classroom?.teacher_user_id ||
    null
  );
}

function getClassroomName(classroom) {
  return (
    classroom?.name ||
    classroom?.title ||
    classroom?.course_name ||
    `کلاس ${classroom?.id || ""}`
  );
}

function getSessionDate(session) {
  return (
    session?.date ||
    session?.session_date ||
    session?.created_at ||
    null
  );
}

function getSessionTitle(session) {
  return (
    session?.title ||
    session?.topic ||
    session?.description ||
    "جلسه کلاس"
  );
}

function getEnrollmentClassroomId(enrollment) {
  return (
    getEntityId(enrollment?.classroom) ||
    enrollment?.classroom_id ||
    null
  );
}

function getEnrollmentStudentId(enrollment) {
  return (
    getEntityId(enrollment?.student) ||
    enrollment?.student_id ||
    getEntityId(enrollment?.student_detail)
  );
}

/* =========================================================
   Component
========================================================= */

function TeacherAttendance() {
  const [classrooms, setClassrooms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const [studentSearch, setStudentSearch] = useState("");

  const [attendanceDraft, setAttendanceDraft] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showNewSession, setShowNewSession] = useState(false);

  const [newSessionDate, setNewSessionDate] = useState("");
  const [newSessionTitle, setNewSessionTitle] = useState("");

  /* =========================================================
     Load Data
  ========================================================= */

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          classroomsData,
          sessionsData,
          attendanceData,
          enrollmentsData,
          usersData,
        ] = await Promise.all([
          api.classrooms.list(),
          api.sessions.list(),
          api.attendance.list(),
          api.enrollments.list(),
          api.users.list(),
        ]);

        if (!alive) {
          return;
        }

        setClassrooms(
          Array.isArray(classroomsData)
            ? classroomsData
            : [],
        );

        setSessions(
          Array.isArray(sessionsData)
            ? sessionsData
            : [],
        );

        setAttendanceRecords(
          Array.isArray(attendanceData)
            ? attendanceData
            : [],
        );

        setEnrollments(
          Array.isArray(enrollmentsData)
            ? enrollmentsData
            : [],
        );

        setUsers(
          Array.isArray(usersData)
            ? usersData
            : [],
        );
      } catch (err) {
        if (!alive) {
          return;
        }

        setError(
          err?.message ||
            "دریافت اطلاعات حضور و غیاب ناموفق بود.",
        );
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
     Teacher Classes
  ========================================================= */

  const teacherClasses = useMemo(() => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId) {
      return classrooms;
    }

    const filtered = classrooms.filter((classroom) => {
      const teacherId =
        getClassroomTeacherId(classroom);

      return (
        Number(teacherId) ===
        Number(currentUserId)
      );
    });

    return filtered.length > 0
      ? filtered
      : classrooms;
  }, [classrooms]);

  /* =========================================================
     Default Class
  ========================================================= */

  useEffect(() => {
    if (
      teacherClasses.length > 0 &&
      !selectedClassId
    ) {
      setSelectedClassId(
        String(teacherClasses[0].id),
      );
    }
  }, [teacherClasses, selectedClassId]);

  /* =========================================================
     Selected Class
  ========================================================= */

  const selectedClass = useMemo(() => {
    return (
      teacherClasses.find(
        (item) =>
          String(item.id) ===
          String(selectedClassId),
      ) || null
    );
  }, [teacherClasses, selectedClassId]);

  /* =========================================================
     Sessions Of Selected Class
  ========================================================= */

  const selectedClassSessions = useMemo(() => {
    if (!selectedClassId) {
      return [];
    }

    return sessions
      .filter((session) => {
        const classroomId =
          getEntityId(session.classroom) ||
          session.classroom_id;

        return (
          Number(classroomId) ===
          Number(selectedClassId)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(
          getSessionDate(a) || 0,
        );

        const dateB = new Date(
          getSessionDate(b) || 0,
        );

        return dateB - dateA;
      });
  }, [sessions, selectedClassId]);

  /* =========================================================
     Default Session
  ========================================================= */

  useEffect(() => {
    if (
      selectedClassSessions.length > 0
    ) {
      const exists =
        selectedClassSessions.some(
          (session) =>
            String(session.id) ===
            String(selectedSessionId),
        );

      if (!exists) {
        setSelectedSessionId(
          String(
            selectedClassSessions[0].id,
          ),
        );
      }
    } else {
      setSelectedSessionId("");
    }
  }, [
    selectedClassSessions,
    selectedSessionId,
  ]);

  /* =========================================================
     Students Of Selected Class
  ========================================================= */

  const classStudents = useMemo(() => {
    if (!selectedClassId) {
      return [];
    }

    const result = [];

    /* -------------------------------------------------------
       First priority: classroom.enrollments
    ------------------------------------------------------- */

    const classroomEnrollments =
      selectedClass?.enrollments || [];

    classroomEnrollments.forEach(
      (enrollment) => {
        const student =
          getStudentFromEnrollment(enrollment);

        if (student) {
          result.push(student);
        }
      },
    );

    /* -------------------------------------------------------
       Second priority: global enrollments
    ------------------------------------------------------- */

    if (result.length === 0) {
      enrollments
        .filter(
          (enrollment) =>
            Number(
              getEnrollmentClassroomId(
                enrollment,
              ),
            ) ===
            Number(selectedClassId),
        )
        .forEach((enrollment) => {
          let student =
            getStudentFromEnrollment(
              enrollment,
            );

          if (!student) {
            const studentId =
              getEnrollmentStudentId(
                enrollment,
              );

            student = users.find(
              (user) =>
                Number(user.id) ===
                Number(studentId),
            );
          }

          if (student) {
            result.push(student);
          }
        });
    }

    /* -------------------------------------------------------
       Remove duplicates
    ------------------------------------------------------- */

    const unique = [];

    const seen = new Set();

    result.forEach((student) => {
      if (!student?.id) {
        return;
      }

      if (seen.has(String(student.id))) {
        return;
      }

      seen.add(String(student.id));
      unique.push(student);
    });

    return unique.sort((a, b) =>
      getFullName(a).localeCompare(
        getFullName(b),
        "fa",
      ),
    );
  }, [
    selectedClass,
    selectedClassId,
    enrollments,
    users,
  ]);

  /* =========================================================
     Selected Session
  ========================================================= */

  const selectedSession = useMemo(() => {
    return (
      selectedClassSessions.find(
        (session) =>
          String(session.id) ===
          String(selectedSessionId),
      ) || null
    );
  }, [
    selectedClassSessions,
    selectedSessionId,
  ]);

  /* =========================================================
     Build Attendance Draft
  ========================================================= */

  useEffect(() => {
    if (
      !selectedSession ||
      classStudents.length === 0
    ) {
      setAttendanceDraft({});
      return;
    }

    const draft = {};

    classStudents.forEach((student) => {
      const record =
        attendanceRecords.find((item) => {
          const recordSessionId =
            getEntityId(item.session) ||
            getEntityId(
              item.session_detail,
            );

          const recordStudentId =
            getEntityId(item.student) ||
            getEntityId(
              item.student_detail,
            );

          return (
            Number(recordSessionId) ===
              Number(selectedSession.id) &&
            Number(recordStudentId) ===
              Number(student.id)
          );
        });

      draft[student.id] = {
        status: getAttendanceStatus(record),
        recordId: record?.id || null,
        note:
          record?.note ||
          record?.description ||
          record?.remarks ||
          "",
      };
    });

    setAttendanceDraft(draft);
  }, [
    selectedSession,
    classStudents,
    attendanceRecords,
  ]);

  /* =========================================================
     Filter Students
  ========================================================= */

  const filteredStudents = useMemo(() => {
    const query =
      studentSearch.trim().toLowerCase();

    if (!query) {
      return classStudents;
    }

    return classStudents.filter((student) => {
      const fullName =
        getFullName(student).toLowerCase();

      const phone = String(
        student.phone ||
          student.mobile ||
          "",
      ).toLowerCase();

      const username = String(
        student.username || "",
      ).toLowerCase();

      return (
        fullName.includes(query) ||
        phone.includes(query) ||
        username.includes(query)
      );
    });
  }, [
    classStudents,
    studentSearch,
  ]);

  /* =========================================================
     Statistics
  ========================================================= */

  const statistics = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let unknown = 0;

    Object.values(attendanceDraft).forEach(
      (item) => {
        switch (item.status) {
          case "present":
            present++;
            break;

          case "absent":
            absent++;
            break;

          case "late":
            late++;
            break;

          case "excused":
            excused++;
            break;

          default:
            unknown++;
        }
      },
    );

    return {
      total: classStudents.length,
      present,
      absent,
      late,
      excused,
      unknown,
    };
  }, [
    attendanceDraft,
    classStudents,
  ]);

  /* =========================================================
     Change Attendance
  ========================================================= */

  const changeStatus = (
    studentId,
    status,
  ) => {
    setAttendanceDraft((previous) => ({
      ...previous,
      [studentId]: {
        ...(previous[studentId] || {}),
        status,
      },
    }));
  };

  /* =========================================================
     Save Attendance
  ========================================================= */

  const handleSaveAttendance = async () => {
    if (!selectedSession) {
      setError("ابتدا یک جلسه را انتخاب کنید.");
      return;
    }

    if (classStudents.length === 0) {
      setError(
        "دانش‌آموزی برای این کلاس پیدا نشد.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updatedRecords = [
        ...attendanceRecords,
      ];

      for (const student of classStudents) {
        const draft =
          attendanceDraft[student.id];

        if (
          !draft?.status ||
          draft.status === "unknown"
        ) {
          continue;
        }

        const payload = {
          session: Number(
            selectedSession.id,
          ),
          student: Number(student.id),
          status: draft.status,
          note: draft.note || "",
        };

        let saved;

        if (draft.recordId) {
          saved =
            await api.attendance.update(
              draft.recordId,
              payload,
            );

          const index =
            updatedRecords.findIndex(
              (item) =>
                Number(item.id) ===
                Number(draft.recordId),
            );

          if (index !== -1) {
            updatedRecords[index] = saved;
          }
        } else {
          saved =
            await api.attendance.create(
              payload,
            );

          updatedRecords.push(saved);
        }
      }

      setAttendanceRecords(
        updatedRecords,
      );

      setSuccess(
        "حضور و غیاب این جلسه با موفقیت ذخیره شد.",
      );

      setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "ذخیره حضور و غیاب انجام نشد.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     Create Session
  ========================================================= */

  const handleCreateSession = async () => {
    if (!selectedClassId) {
      setError("ابتدا کلاس را انتخاب کنید.");
      return;
    }

    if (!newSessionDate) {
      setError("تاریخ جلسه را وارد کنید.");
      return;
    }

    try {
      setCreatingSession(true);
      setError("");
      setSuccess("");

      const created =
        await api.sessions.create({
          classroom: Number(
            selectedClassId,
          ),
          date: newSessionDate,
          title:
            newSessionTitle.trim() ||
            "جلسه کلاس",
        });

      setSessions((previous) => [
        ...previous,
        created,
      ]);

      setSelectedSessionId(
        String(created.id),
      );

      setNewSessionDate("");
      setNewSessionTitle("");

      setShowNewSession(false);

      setSuccess(
        "جلسه جدید با موفقیت ایجاد شد.",
      );

      setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "ایجاد جلسه جدید انجام نشد.",
      );
    } finally {
      setCreatingSession(false);
    }
  };

  /* =========================================================
     Status UI
  ========================================================= */

  const renderStatusButton = (
    student,
    status,
    label,
    Icon,
  ) => {
    const currentStatus =
      attendanceDraft[student.id]?.status;

    return (
      <button
        type="button"
        className={`teacher-attendance-x4m2-status-button ${
          currentStatus === status
            ? `is-${status}`
            : ""
        }`}
        onClick={() =>
          changeStatus(
            student.id,
            status,
          )
        }
      >
        <Icon size={15} />
        <span>{label}</span>
      </button>
    );
  };

  /* =========================================================
     Loading
  ========================================================= */

  if (loading) {
    return (
      <DashboardLayout
        role="پنل معلم"
        title="حضور و غیاب"
        menuType="teacher"
      >
        <div
          className="teacher-attendance-x4m2-page"
          dir="rtl"
        >
          <section className="teacher-attendance-x4m2-state">
            <Loader2
              size={30}
              className="teacher-attendance-x4m2-loading-icon"
            />

            <strong>
              در حال دریافت اطلاعات...
            </strong>

            <span>
              کلاس‌ها، جلسات و دانش‌آموزان در حال
              بارگذاری هستند.
            </span>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  /* =========================================================
     Render
  ========================================================= */

  return (
    <DashboardLayout
      role="پنل معلم"
      title="حضور و غیاب"
      menuType="teacher"
    >
      <div
        className="teacher-attendance-x4m2-page"
        dir="rtl"
      >
        {/* =====================================================
            Header
        ====================================================== */}

        <header className="teacher-attendance-x4m2-header">
          <div className="teacher-attendance-x4m2-header-info">
            <div className="teacher-attendance-x4m2-header-icon">
              <ClipboardIcon />
            </div>

            <div>
              <h1>حضور و غیاب کلاس‌ها</h1>

              <p>
                مدیریت جلسات و ثبت وضعیت حضور دانش‌آموزان
              </p>
            </div>
          </div>

          {selectedClass && (
            <div className="teacher-attendance-x4m2-header-class">
              <BookOpen size={17} />

              <span>
                {getClassroomName(
                  selectedClass,
                )}
              </span>
            </div>
          )}
        </header>

        {/* =====================================================
            Alerts
        ====================================================== */}

        {error && (
          <div className="teacher-attendance-x4m2-alert is-error">
            <AlertCircle size={18} />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {success && (
          <div className="teacher-attendance-x4m2-alert is-success">
            <CheckCircle2 size={18} />

            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* =====================================================
            Class Selector
        ====================================================== */}

        <section className="teacher-attendance-x4m2-selector-card">
          <div className="teacher-attendance-x4m2-selector-main">
            <div className="teacher-attendance-x4m2-selector-icon">
              <UsersRound size={21} />
            </div>

            <div className="teacher-attendance-x4m2-selector-content">
              <span className="teacher-attendance-x4m2-overline">
                کلاس آموزشی
              </span>

              <strong>
                انتخاب کلاس برای ثبت حضور و غیاب
              </strong>

              <p>
                ابتدا کلاس موردنظر را انتخاب کنید.
              </p>
            </div>
          </div>

          <div className="teacher-attendance-x4m2-select-wrap">
            <select
              value={selectedClassId}
              onChange={(event) => {
                setSelectedClassId(
                  event.target.value,
                );
                setSelectedSessionId("");
                setStudentSearch("");
              }}
              className="teacher-attendance-x4m2-select"
            >
              {teacherClasses.length === 0 && (
                <option value="">
                  کلاسی برای شما ثبت نشده است
                </option>
              )}

              {teacherClasses.map(
                (classroom) => (
                  <option
                    key={classroom.id}
                    value={classroom.id}
                  >
                    {getClassroomName(
                      classroom,
                    )}
                  </option>
                ),
              )}
            </select>

            <ChevronDown
              size={17}
              className="teacher-attendance-x4m2-select-arrow"
            />
          </div>
        </section>

        {!selectedClass ? (
          <section className="teacher-attendance-x4m2-state">
            <BookOpen size={34} />

            <strong>
              کلاسی برای نمایش وجود ندارد
            </strong>

            <span>
              ابتدا یک کلاس به حساب مدرس اختصاص دهید.
            </span>
          </section>
        ) : (
          <>
            {/* =================================================
                Session Area
            ================================================== */}

            <section className="teacher-attendance-x4m2-session-section">
              <div className="teacher-attendance-x4m2-section-header">
                <div>
                  <h2>
                    جلسات{" "}
                    {getClassroomName(
                      selectedClass,
                    )}
                  </h2>

                  <p>
                    جلسه موردنظر را انتخاب کنید و سپس
                    حضور و غیاب دانش‌آموزان را ثبت کنید.
                  </p>
                </div>

                <button
                  type="button"
                  className="teacher-attendance-x4m2-new-session-btn"
                  onClick={() =>
                    setShowNewSession(
                      (previous) =>
                        !previous,
                    )
                  }
                >
                  <FilePlus2 size={17} />

                  جلسه جدید
                </button>
              </div>

              {showNewSession && (
                <div className="teacher-attendance-x4m2-new-session-box">
                  <div className="teacher-attendance-x4m2-field">
                    <label>
                      تاریخ جلسه
                    </label>

                    <input
                      type="date"
                      value={newSessionDate}
                      onChange={(event) =>
                        setNewSessionDate(
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="teacher-attendance-x4m2-field">
                    <label>
                      عنوان جلسه
                    </label>

                    <input
                      type="text"
                      value={newSessionTitle}
                      onChange={(event) =>
                        setNewSessionTitle(
                          event.target.value,
                        )
                      }
                      placeholder="مثلاً جلسه پنجم - Unit 4"
                    />
                  </div>

                  <div className="teacher-attendance-x4m2-new-session-actions">
                    <button
                      type="button"
                      className="teacher-attendance-x4m2-cancel-btn"
                      onClick={() =>
                        setShowNewSession(false)
                      }
                    >
                      انصراف
                    </button>

                    <button
                      type="button"
                      className="teacher-attendance-x4m2-create-session-btn"
                      onClick={
                        handleCreateSession
                      }
                      disabled={
                        creatingSession
                      }
                    >
                      {creatingSession ? (
                        <Loader2
                          size={16}
                          className="teacher-attendance-x4m2-spin"
                        />
                      ) : (
                        <Check size={16} />
                      )}

                      ایجاد جلسه
                    </button>
                  </div>
                </div>
              )}

              {selectedClassSessions.length ===
              0 ? (
                <div className="teacher-attendance-x4m2-empty-sessions">
                  <CalendarDays size={30} />

                  <strong>
                    هنوز جلسه‌ای ثبت نشده است
                  </strong>

                  <span>
                    برای شروع، یک جلسه جدید ایجاد کنید.
                  </span>
                </div>
              ) : (
                <div className="teacher-attendance-x4m2-sessions">
                  {selectedClassSessions.map(
                    (session, index) => {
                      const active =
                        String(
                          selectedSessionId,
                        ) ===
                        String(session.id);

                      const sessionRecords =
                        attendanceRecords.filter(
                          (record) => {
                            const recordSessionId =
                              getEntityId(
                                record.session,
                              ) ||
                              getEntityId(
                                record.session_detail,
                              );

                            return (
                              Number(
                                recordSessionId,
                              ) ===
                              Number(
                                session.id,
                              )
                            );
                          },
                        );

                      return (
                        <button
                          type="button"
                          key={session.id}
                          className={`teacher-attendance-x4m2-session-card ${
                            active
                              ? "is-active"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedSessionId(
                              String(
                                session.id,
                              ),
                            )
                          }
                        >
                          <div className="teacher-attendance-x4m2-session-number">
                            {toPersianDigits(
                              selectedClassSessions.length -
                                index,
                            )}
                          </div>

                          <div className="teacher-attendance-x4m2-session-content">
                            <strong>
                              {getSessionTitle(
                                session,
                              )}
                            </strong>

                            <span>
                              <CalendarDays
                                size={13}
                              />

                              {toJalaliDateString(
                                getSessionDate(
                                  session,
                                ),
                              )}
                            </span>
                          </div>

                          <div className="teacher-attendance-x4m2-session-records">
                            {toPersianDigits(
                              sessionRecords.length,
                            )}{" "}
                            ثبت
                          </div>

                          {active && (
                            <div className="teacher-attendance-x4m2-session-check">
                              <Check
                                size={14}
                              />
                            </div>
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </section>

            {/* =================================================
                Attendance Area
            ================================================== */}

            {selectedSession && (
              <section className="teacher-attendance-x4m2-attendance-section">
                <div className="teacher-attendance-x4m2-attendance-header">
                  <div className="teacher-attendance-x4m2-attendance-title">
                    <div className="teacher-attendance-x4m2-attendance-icon">
                      <ClipboardIcon />
                    </div>

                    <div>
                      <span>
                        جلسه انتخاب‌شده
                      </span>

                      <h2>
                        {getSessionTitle(
                          selectedSession,
                        )}
                      </h2>

                      <p>
                        <CalendarDays
                          size={13}
                        />

                        {toJalaliDateString(
                          getSessionDate(
                            selectedSession,
                          ),
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="teacher-attendance-x4m2-save-btn"
                    onClick={
                      handleSaveAttendance
                    }
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2
                        size={17}
                        className="teacher-attendance-x4m2-spin"
                      />
                    ) : (
                      <Save size={17} />
                    )}

                    {saving
                      ? "در حال ذخیره..."
                      : "ذخیره حضور و غیاب"}
                  </button>
                </div>

                {/* =================================================
                    Statistics
                ================================================== */}

                <div className="teacher-attendance-x4m2-stats">
                  <div className="teacher-attendance-x4m2-stat total">
                    <UsersRound size={17} />

                    <div>
                      <span>
                        کل دانش‌آموزان
                      </span>

                      <strong>
                        {toPersianDigits(
                          statistics.total,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="teacher-attendance-x4m2-stat present">
                    <CheckCircle2 size={17} />

                    <div>
                      <span>حاضر</span>

                      <strong>
                        {toPersianDigits(
                          statistics.present,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="teacher-attendance-x4m2-stat absent">
                    <XCircle size={17} />

                    <div>
                      <span>غایب</span>

                      <strong>
                        {toPersianDigits(
                          statistics.absent,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="teacher-attendance-x4m2-stat late">
                    <Clock3 size={17} />

                    <div>
                      <span>تأخیر</span>

                      <strong>
                        {toPersianDigits(
                          statistics.late,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="teacher-attendance-x4m2-stat excused">
                    <CheckCircle2 size={17} />

                    <div>
                      <span>موجه</span>

                      <strong>
                        {toPersianDigits(
                          statistics.excused,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="teacher-attendance-x4m2-stat unknown">
                    <AlertCircle size={17} />

                    <div>
                      <span>ثبت نشده</span>

                      <strong>
                        {toPersianDigits(
                          statistics.unknown,
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    Search
                ================================================== */}

                <div className="teacher-attendance-x4m2-toolbar">
                  <div className="teacher-attendance-x4m2-search">
                    <Search size={17} />

                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(event) =>
                        setStudentSearch(
                          event.target.value,
                        )
                      }
                      placeholder="جستجوی نام، شماره تماس یا نام کاربری..."
                    />

                    {studentSearch && (
                      <button
                        type="button"
                        onClick={() =>
                          setStudentSearch("")
                        }
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <div className="teacher-attendance-x4m2-count">
                    <UsersRound size={15} />

                    {toPersianDigits(
                      filteredStudents.length,
                    )}{" "}
                    دانش‌آموز
                  </div>
                </div>

                {/* =================================================
                    Students
                ================================================== */}

                {classStudents.length === 0 ? (
                  <div className="teacher-attendance-x4m2-empty-students">
                    <UsersRound size={32} />

                    <strong>
                      دانش‌آموزی در این کلاس پیدا نشد
                    </strong>

                    <span>
                      ابتدا دانش‌آموزان را در این کلاس
                      ثبت‌نام کنید تا در فرم حضور و غیاب نمایش داده شوند.
                    </span>
                  </div>
                ) : filteredStudents.length ===
                  0 ? (
                  <div className="teacher-attendance-x4m2-empty-students">
                    <Search size={30} />

                    <strong>
                      دانش‌آموزی با این جستجو پیدا نشد
                    </strong>
                  </div>
                ) : (
                  <div className="teacher-attendance-x4m2-students-table-wrap">
                    <table className="teacher-attendance-x4m2-students-table">
                      <thead>
                        <tr>
                          <th>دانش‌آموز</th>
                          <th>وضعیت حضور</th>
                          <th>توضیحات</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredStudents.map(
                          (student, index) => {
                            const draft =
                              attendanceDraft[
                                student.id
                              ] || {};

                            return (
                              <tr
                                key={student.id}
                              >
                                <td data-label="دانش‌آموز">
                                  <div className="teacher-attendance-x4m2-student">
                                    <div className="teacher-attendance-x4m2-student-number">
                                      {toPersianDigits(
                                        index + 1,
                                      )}
                                    </div>

                                    <div className="teacher-attendance-x4m2-student-avatar">
                                      <UserRound
                                        size={17}
                                      />
                                    </div>

                                    <div className="teacher-attendance-x4m2-student-info">
                                      <strong>
                                        {getFullName(
                                          student,
                                        ) ||
                                          "دانش‌آموز بدون نام"}
                                      </strong>

                                      <span>
                                        {student.phone ||
                                          student.mobile ||
                                          student.username ||
                                          "اطلاعات تماس ثبت نشده"}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td data-label="وضعیت حضور">
                                  <div className="teacher-attendance-x4m2-statuses">
                                    {renderStatusButton(
                                      student,
                                      "present",
                                      "حاضر",
                                      CheckCircle2,
                                    )}

                                    {renderStatusButton(
                                      student,
                                      "absent",
                                      "غایب",
                                      XCircle,
                                    )}

                                    {renderStatusButton(
                                      student,
                                      "late",
                                      "تأخیر",
                                      Clock3,
                                    )}

                                    {renderStatusButton(
                                      student,
                                      "excused",
                                      "موجه",
                                      Check,
                                    )}

                                    {renderStatusButton(
                                      student,
                                      "unknown",
                                      "ثبت نشده",
                                      AlertCircle,
                                    )}
                                  </div>
                                </td>

                                <td data-label="توضیحات">
                                  <input
                                    className="teacher-attendance-x4m2-note-input"
                                    type="text"
                                    value={
                                      draft.note ||
                                      ""
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setAttendanceDraft(
                                        (
                                          previous,
                                        ) => ({
                                          ...previous,
                                          [student.id]:
                                            {
                                              ...(previous[
                                                student
                                                  .id
                                              ] ||
                                                {}),
                                              note:
                                                event
                                                  .target
                                                  .value,
                                            },
                                        }),
                                      )
                                    }
                                    placeholder="توضیح اختیاری..."
                                  />
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* =================================================
                    Bottom Save
                ================================================== */}

                {classStudents.length > 0 && (
                  <div className="teacher-attendance-x4m2-bottom-save">
                    <div>
                      <strong>
                        وضعیت حضور جلسه آماده ثبت است
                      </strong>

                      <span>
                        برای دانش‌آموزان حاضر، غایب، تأخیر یا موجه
                        وضعیت را انتخاب کنید و سپس ذخیره کنید.
                      </span>
                    </div>

                    <button
                      type="button"
                      className="teacher-attendance-x4m2-save-btn"
                      onClick={
                        handleSaveAttendance
                      }
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2
                          size={17}
                          className="teacher-attendance-x4m2-spin"
                        />
                      ) : (
                        <Save size={17} />
                      )}

                      ذخیره نهایی
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   Small Icon Component
========================================================= */

function ClipboardIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="17"
        rx="2"
      />

      <path d="M9 4.5V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5v1" />

      <path d="m8 12 2 2 5-5" />
    </svg>
  );
}

export default TeacherAttendance;