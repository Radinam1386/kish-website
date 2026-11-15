
import React, { useEffect, useMemo, useState } from "react";
import {
  MessageSquareText,
  Send,
  UsersRound,
  UserRound,
  Clock3,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Megaphone,
  Phone,
  AlertCircle,
  History,
  ChevronDown,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { api, getFullName } from "../services/api";
import {
  toPersianDigits,
  getTodayJalali,
  toJalaliDateString,
} from "../utils/dateUtils";

import "./AdminSmsPanel.css";

const INITIAL_LOGS = [
  {
    id: 1,
    title: "اطلاعیه شروع کلاس",
    message:
      "دانش‌آموزان عزیز، کلاس‌ها از هفته آینده طبق برنامه برگزار می‌شوند.",
    recipients: 24,
    successful: 22,
    failed: 2,
    date: "۱۴۰۵/۰۸/۱۲ - ۱۰:۳۰",
    status: "partial",
    type: "گروهی",
  },
  {
    id: 2,
    title: "یادآوری شهریه",
    message: "لطفاً نسبت به پرداخت شهریه ترم جاری اقدام فرمایید.",
    recipients: 15,
    successful: 15,
    failed: 0,
    date: "۱۴۰۵/۰۸/۱۰ - ۱۲:۱۵",
    status: "success",
    type: "گروهی",
  },
];

const TEMPLATES = [
  {
    title: "اطلاع‌رسانی غیبت",
    text: "ولی گرامی، فرزند شما امروز در کلاس {{class}} غایب بوده است. لطفاً در صورت امکان علت غیبت را به آموزشگاه اطلاع دهید.",
  },
  {
    title: "اطلاعیه عمومی",
    text: "اولیای گرامی، به اطلاع می‌رساند {{message}} با تشکر، آموزشگاه کیش خوبان زنجان",
  },
  {
    title: "یادآوری شهریه",
    text: "ولی گرامی، لطفاً نسبت به تسویه شهریه کلاس {{class}} اقدام فرمایید. با تشکر، آموزشگاه کیش خوبان زنجان",
  },
];

function AdminSmsPanel() {
  const today = getTodayJalali();

  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [terms, setTerms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeTab, setActiveTab] = useState("compose");
  const [recipientMode, setRecipientMode] = useState("class");

  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(today.isoGregorian);

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [message, setMessage] = useState("");
  const [messageTitle, setMessageTitle] = useState("");

  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [reportFilter, setReportFilter] = useState("all");
  const [reportSearch, setReportSearch] = useState("");

  const [showPreview, setShowPreview] = useState(false);
  const [notice, setNotice] = useState("");

  // دریافت اطلاعات موردنیاز از APIهای موجود
  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setLoadError("");

        const [
          usersData,
          classroomsData,
          enrollmentsData,
          termsData,
          sessionsData,
          attendanceData,
        ] = await Promise.all([
          api.users.list(),
          api.classrooms.list(),
          api.enrollments.list(),
          api.terms.list(),
          api.sessions.list(),
          api.attendance.list(),
        ]);

        if (!alive) return;

        const loadedTerms = termsData || [];
        const loadedClassrooms = classroomsData || [];

        setUsers(usersData || []);
        setClassrooms(loadedClassrooms);
        setEnrollments(enrollmentsData || []);
        setTerms(loadedTerms);
        setSessions(sessionsData || []);
        setAttendanceRecords(attendanceData || []);

        const activeTerm = loadedTerms.find((term) => term.is_active);

        if (activeTerm) {
          setSelectedTermId(String(activeTerm.id));
        } else if (loadedTerms.length) {
          setSelectedTermId(String(loadedTerms[0].id));
        } else {
          setSelectedTermId("all");
        }

        if (loadedClassrooms.length) {
          setSelectedClassId(String(loadedClassrooms[0].id));
        }
      } catch (error) {
        if (!alive) return;

        setLoadError(
          error?.message || "دریافت اطلاعات از سرور با مشکل مواجه شد.",
        );
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  // ترم انتخاب‌شده
  const termClassrooms = useMemo(() => {
    if (selectedTermId === "all") return classrooms;

    return classrooms.filter(
      (classroom) =>
        String(classroom.term?.id ?? classroom.term) ===
        String(selectedTermId),
    );
  }, [classrooms, selectedTermId]);

  // انتخاب اولین کلاس معتبر پس از تغییر ترم
  useEffect(() => {
    if (!termClassrooms.length) {
      setSelectedClassId("");
      return;
    }

    const selectedClassExists = termClassrooms.some(
      (classroom) => String(classroom.id) === String(selectedClassId),
    );

    if (!selectedClassExists) {
      setSelectedClassId(String(termClassrooms[0].id));
    }
  }, [termClassrooms, selectedClassId]);

  // ساخت فهرست دانش‌آموزان عضو کلاس‌ها
  const enrolledStudents = useMemo(() => {
    const studentUsers = users.filter((user) => user.role === "student");

    return enrollments
      .map((enrollment) => {
        const studentId =
          enrollment.student?.id ?? enrollment.student;

        const student =
          enrollment.student_detail ||
          studentUsers.find(
            (user) => String(user.id) === String(studentId),
          );

        if (!student || student.role === "teacher") return null;

        const classroomId =
          enrollment.classroom?.id ?? enrollment.classroom;

        const classroom = classrooms.find(
          (item) => String(item.id) === String(classroomId),
        );

        if (!classroom) return null;

        return {
          id: student.id,
          name: getFullName(student) || `دانش‌آموز ${student.id}`,
          phone: student.phone_number || "",
          classroomId: String(classroom.id),
          classroomName: classroom.name || "کلاس نامشخص",
        };
      })
      .filter(Boolean);
  }, [users, enrollments, classrooms]);

  // فهرست یکتای دانش‌آموزان برای ارسال عمومی
  const students = useMemo(() => {
    const studentMap = new Map();

    enrolledStudents.forEach((student) => {
      if (!studentMap.has(String(student.id))) {
        studentMap.set(String(student.id), student);
      }
    });

    return Array.from(studentMap.values());
  }, [enrolledStudents]);

  // دانش‌آموزان کلاس انتخاب‌شده
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];

    return enrolledStudents.filter(
      (student) =>
        String(student.classroomId) === String(selectedClassId),
    );
  }, [enrolledStudents, selectedClassId]);

  // جلسه کلاس در تاریخ انتخاب‌شده
  const selectedSession = useMemo(() => {
    if (!selectedClassId || !selectedDate) return null;

    return (
      sessions.find(
        (session) =>
          String(session.classroom?.id ?? session.classroom) ===
            String(selectedClassId) &&
          session.date === selectedDate,
      ) || null
    );
  }, [sessions, selectedClassId, selectedDate]);

  // استخراج غایبین واقعی از سوابق حضور و غیاب
  const absentStudents = useMemo(() => {
    if (!selectedSession) return [];

    return classStudents.filter((student) => {
      const attendance = attendanceRecords.find(
        (record) =>
          String(record.session?.id ?? record.session) ===
            String(selectedSession.id) &&
          String(record.student?.id ?? record.student) ===
            String(student.id),
      );

      return attendance?.status === "absent";
    });
  }, [classStudents, selectedSession, attendanceRecords]);

  // فهرست گیرندگان بر اساس نوع ارسال
  const recipientCandidates = useMemo(() => {
    if (recipientMode === "all") return students;

    if (recipientMode === "absent") return absentStudents;

    return classStudents;
  }, [recipientMode, students, absentStudents, classStudents]);

  // فیلتر جستجو
  const visibleStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return recipientCandidates;

    return recipientCandidates.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.phone.toLowerCase().includes(query),
    );
  }, [recipientCandidates, searchTerm]);

  // گیرندگان انتخاب‌شده از فهرست فعلی
  const selectedRecipients = useMemo(
    () =>
      recipientCandidates.filter((student) =>
        selectedStudents.some(
          (id) => String(id) === String(student.id),
        ),
      ),
    [recipientCandidates, selectedStudents],
  );

  const validRecipients = selectedRecipients.filter(
    (student) => student.phone.trim(),
  );

  const selectedClass = classrooms.find(
    (classroom) =>
      String(classroom.id) === String(selectedClassId),
  );

  const selectedTerm = terms.find(
    (term) => String(term.id) === String(selectedTermId),
  );

  const characterCount = message.length;
  const smsCount =
    characterCount === 0 ? 0 : Math.ceil(characterCount / 70);

  const toggleStudent = (studentId) => {
    setSelectedStudents((current) =>
      current.some((id) => String(id) === String(studentId))
        ? current.filter((id) => String(id) !== String(studentId))
        : [...current, studentId],
    );
  };

  const toggleVisibleStudents = () => {
    const visibleIds = visibleStudents.map((student) => student.id);

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) =>
        selectedStudents.some(
          (selectedId) => String(selectedId) === String(id),
        ),
      );

    setSelectedStudents((current) =>
      allSelected
        ? current.filter(
            (id) =>
              !visibleIds.some(
                (visibleId) => String(visibleId) === String(id),
              ),
          )
        : [
            ...current,
            ...visibleIds.filter(
              (id) =>
                !current.some(
                  (selectedId) => String(selectedId) === String(id),
                ),
            ),
          ],
    );
  };

  const selectAbsentStudents = () => {
    setSelectedStudents(absentStudents.map((student) => student.id));

    setNotice(
      absentStudents.length
        ? `${toPersianDigits(absentStudents.length)} دانش‌آموز غایب انتخاب شدند.`
        : "برای این کلاس و تاریخ، دانش‌آموز غایبی ثبت نشده است.",
    );
  };

  const handleModeChange = (mode) => {
    setRecipientMode(mode);
    setSelectedStudents([]);
    setSearchTerm("");
    setNotice("");
  };

  const applyTemplate = (template) => {
    setMessageTitle(template.title);

    const className = selectedClass?.name || "کلاس مربوطه";

    setMessage(
      template.text
        .replaceAll("{{class}}", className)
        .replaceAll("{{message}}", "اطلاعیه موردنظر"),
    );

    setNotice("");
  };

  const handleSend = () => {
    if (!message.trim()) {
      setNotice("لطفاً متن پیامک را وارد کنید.");
      return;
    }

    if (!validRecipients.length) {
      setNotice("هیچ گیرنده معتبری با شماره موبایل انتخاب نشده است.");
      return;
    }

    const newLog = {
      id: Date.now(),
      title: messageTitle || "پیامک بدون عنوان",
      message: message.trim(),
      recipients: validRecipients.length,
      successful: 0,
      failed: 0,
      date: new Date().toLocaleString("fa-IR"),
      status: "demo",
      type:
        recipientMode === "absent"
          ? "اطلاع‌رسانی غیبت"
          : recipientMode === "all"
            ? "ارسال عمومی"
            : "ارسال کلاسی",
    };

    setLogs((current) => [newLog, ...current]);

    setNotice(
      `ارسال آزمایشی ثبت شد؛ ${toPersianDigits(validRecipients.length)} گیرنده در گزارش قرار گرفتند. پیام واقعی ارسال نشده است.`,
    );

    setShowPreview(false);
    setActiveTab("reports");
    setMessage("");
    setMessageTitle("");
    setSelectedStudents([]);
  };

  // فیلتر گزارش‌ها
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesStatus =
        reportFilter === "all" || log.status === reportFilter;

      const query = reportSearch.trim().toLowerCase();

      const matchesSearch =
        !query ||
        log.title.toLowerCase().includes(query) ||
        log.message.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [logs, reportFilter, reportSearch]);

  const totalRecipients = logs.reduce(
    (sum, log) => sum + log.recipients,
    0,
  );

  const successfulMessages = logs.reduce(
    (sum, log) => sum + log.successful,
    0,
  );

  return (
    <DashboardLayout
      role="پنل مدیریت"
      title="پنل پیامکی مدیریت"
      menuType="admin"
    >
      <div className="admin-sms-page">
        <div className="admin-students-x7k2-header">
          <div className="admin-students-x7k2-heading">
            <div className="admin-students-x7k2-heading-icon">
              <MessageSquareText size={25} />
            </div>

            <div className="student-certificate-x8k4-header-content">
              <h1>مدیریت پیامک‌ها</h1>
              <p>
                ارسال اطلاعیه، پیگیری غیبت‌ها و بررسی گزارش پیامک‌های آموزشگاه
              </p>
            </div>
          </div>
        </div>

        <div className="admin-sms-demo-alert">
          <AlertCircle size={19} />
          <span>
            حالت نمایشی: پیامک واقعی ارسال نمی‌شود و گزارش‌های جدید فقط در
            حافظه همین صفحه ثبت می‌شوند.
          </span>
        </div>

        {loadError && (
          <div className="admin-sms-notice">
            <AlertCircle size={17} />
            {loadError}
          </div>
        )}

        <div className="admin-sms-stats">
          <div className="admin-sms-stat-card">
            <div className="admin-sms-stat-icon purple">
              <Send size={21} />
            </div>
            <div>
              <span>کل گیرندگان ثبت‌شده</span>
              <strong>{toPersianDigits(totalRecipients)}</strong>
            </div>
          </div>

          <div className="admin-sms-stat-card">
            <div className="admin-sms-stat-icon green">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <span>ارسال موفق نمونه</span>
              <strong>{toPersianDigits(successfulMessages)}</strong>
            </div>
          </div>

          <div className="admin-sms-stat-card">
            <div className="admin-sms-stat-icon orange">
              <UsersRound size={21} />
            </div>
            <div>
              <span>دانش‌آموزان قابل انتخاب</span>
              <strong>{toPersianDigits(students.length)}</strong>
            </div>
          </div>
        </div>

        <div className="admin-sms-tabs">
          <button
            type="button"
            className={activeTab === "compose" ? "active" : ""}
            onClick={() => setActiveTab("compose")}
          >
            <Send size={17} />
            ارسال پیامک
          </button>

          <button
            type="button"
            className={activeTab === "reports" ? "active" : ""}
            onClick={() => setActiveTab("reports")}
          >
            <History size={17} />
            گزارش ارسال‌ها
            <span>{toPersianDigits(logs.length)}</span>
          </button>
        </div>

        {activeTab === "compose" && (
          <div className="admin-sms-compose-layout">
            <section className="admin-sms-card admin-sms-recipient-card">
              <div className="admin-sms-card-heading">
                <div>
                  <h3>انتخاب گیرندگان</h3>
                  <p>مشخص کنید پیامک برای چه افرادی ارسال شود.</p>
                </div>
                <UsersRound size={22} />
              </div>

              <div className="admin-sms-recipient-modes">
                <button
                  type="button"
                  className={recipientMode === "class" ? "active" : ""}
                  onClick={() => handleModeChange("class")}
                >
                  <UserRound size={17} />
                  یک کلاس
                </button>

                <button
                  type="button"
                  className={recipientMode === "all" ? "active" : ""}
                  onClick={() => handleModeChange("all")}
                >
                  <UsersRound size={17} />
                  همه دانش‌آموزان
                </button>

                <button
                  type="button"
                  className={recipientMode === "absent" ? "active" : ""}
                  onClick={() => handleModeChange("absent")}
                >
                  <AlertCircle size={17} />
                  غایبین
                </button>
              </div>

              {recipientMode !== "all" && (
                <>
                  <div className="admin-sms-field">
                    <label htmlFor="admin-sms-term">انتخاب ترم</label>
                    <div className="admin-sms-select-wrap">
                      <select
                        id="admin-sms-term"
                        value={selectedTermId}
                        onChange={(event) => {
                          setSelectedTermId(event.target.value);
                          setSelectedStudents([]);
                          setNotice("");
                        }}
                      >
                        {terms.map((term) => (
                          <option key={term.id} value={term.id}>
                            {term.name}
                            {term.is_active ? " (ترم فعال)" : ""}
                          </option>
                        ))}
                        <option value="all">همه ترم‌ها</option>
                      </select>
                      <ChevronDown size={17} />
                    </div>
                  </div>

                  <div className="admin-sms-field">
                    <label htmlFor="admin-sms-class">انتخاب کلاس</label>
                    <div className="admin-sms-select-wrap">
                      <select
                        id="admin-sms-class"
                        value={selectedClassId}
                        onChange={(event) => {
                          setSelectedClassId(event.target.value);
                          setSelectedStudents([]);
                          setNotice("");
                        }}
                        disabled={!termClassrooms.length}
                      >
                        {termClassrooms.map((classroom) => (
                          <option key={classroom.id} value={classroom.id}>
                            {classroom.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={17} />
                    </div>
                  </div>
                </>
              )}

              {recipientMode === "absent" && (
                <>
                  <div className="admin-sms-field">
                    <label>تاریخ جلسه</label>
                    <JalaliDatePicker
                      value={selectedDate}
                      onChange={(date) => {
                        setSelectedDate(date);
                        setSelectedStudents([]);
                        setNotice("");
                      }}
                      placeholder="انتخاب تاریخ جلسه..."
                    />
                  </div>

                  <div className="admin-sms-absent-note">
                    <AlertCircle size={17} />
                    <div>
                      {selectedSession ? (
                        <>
                          <strong>
                            جلسه در تاریخ{" "}
                            {toJalaliDateString(selectedDate)} پیدا شد.
                          </strong>
                          <span>
                            {toPersianDigits(absentStudents.length)} دانش‌آموز
                            با وضعیت «غایب» ثبت شده‌اند. غیبت موجه در این فهرست
                            قرار نمی‌گیرد.
                          </span>
                        </>
                      ) : (
                        <>
                          <strong>جلسه‌ای برای این تاریخ ثبت نشده است.</strong>
                          <span>
                            برای مشاهده غایبین، کلاسی را انتخاب کنید که در
                            تاریخ انتخاب‌شده جلسه داشته باشد.
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {recipientMode === "class" && selectedClass && (
                <div className="admin-sms-absent-note">
                  <UsersRound size={17} />
                  <span>
                    {toPersianDigits(classStudents.length)} دانش‌آموز در کلاس{" "}
                    {selectedClass.name} ثبت‌نام شده‌اند.
                  </span>
                </div>
              )}

              <div className="admin-sms-student-toolbar">
                <div className="admin-sms-search">
                  <Search size={17} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="جستجوی نام یا شماره موبایل..."
                  />
                </div>

                <button
                  type="button"
                  onClick={toggleVisibleStudents}
                  disabled={!visibleStudents.length}
                >
                  انتخاب همه
                </button>
              </div>

              <div className="admin-sms-student-list">
                {loading ? (
                  <div className="admin-sms-empty">
                    در حال دریافت اطلاعات دانش‌آموزان...
                  </div>
                ) : recipientMode === "absent" && !selectedSession ? (
                  <div className="admin-sms-empty">
                    ابتدا کلاس و تاریخ جلسه دارای سابقه حضور و غیاب را انتخاب
                    کنید.
                  </div>
                ) : visibleStudents.length === 0 ? (
                  <div className="admin-sms-empty">
                    دانش‌آموزی برای نمایش پیدا نشد.
                  </div>
                ) : (
                  visibleStudents.map((student) => (
                    <label
                      key={student.id}
                      className={`admin-sms-student-item ${
                        selectedStudents.some(
                          (id) => String(id) === String(student.id),
                        )
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.some(
                          (id) => String(id) === String(student.id),
                        )}
                        onChange={() => toggleStudent(student.id)}
                      />

                      <span className="admin-sms-student-avatar">
                        {student.name.charAt(0)}
                      </span>

                      <span className="admin-sms-student-details">
                        <strong>{student.name}</strong>
                        <small>
                          <Phone size={12} />
                          {student.phone || "شماره موبایل ثبت نشده"}
                        </small>
                      </span>

                      {!student.phone && (
                        <span className="admin-sms-no-phone">بدون شماره</span>
                      )}
                    </label>
                  ))
                )}
              </div>

              <div className="admin-sms-selection-footer">
                <span>
                  {toPersianDigits(selectedRecipients.length)} نفر انتخاب‌شده
                </span>

                <span>
                  {toPersianDigits(validRecipients.length)} شماره معتبر
                </span>

                {recipientMode === "absent" && (
                  <button
                    type="button"
                    onClick={selectAbsentStudents}
                    disabled={!absentStudents.length}
                  >
                    انتخاب همه غایبین
                  </button>
                )}
              </div>
            </section>

            <section className="admin-sms-card admin-sms-message-card">
              <div className="admin-sms-card-heading">
                <div>
                  <h3>متن پیامک</h3>
                  <p>متن پیام و عنوان گزارش را مشخص کنید.</p>
                </div>
                <Megaphone size={22} />
              </div>

              <div className="admin-sms-field">
                <label htmlFor="admin-sms-title">عنوان پیام (اختیاری)</label>
                <input
                  id="admin-sms-title"
                  type="text"
                  value={messageTitle}
                  onChange={(event) => setMessageTitle(event.target.value)}
                  placeholder="مثلاً اطلاعیه غیبت دانش‌آموز"
                />
              </div>

              <div className="admin-sms-template-section">
                <label>قالب‌های آماده</label>
                <div className="admin-sms-template-list">
                  {TEMPLATES.map((template) => (
                    <button
                      type="button"
                      key={template.title}
                      onClick={() => applyTemplate(template)}
                    >
                      {template.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-sms-field">
                <label htmlFor="admin-sms-message">متن پیام</label>
                <textarea
                  id="admin-sms-message"
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    setNotice("");
                  }}
                  placeholder="متن پیامک خود را اینجا بنویسید..."
                  rows={8}
                />

                <div className="admin-sms-message-meta">
                  <span>{toPersianDigits(characterCount)} کاراکتر</span>
                  <span>
                    حدود {toPersianDigits(smsCount)} پیامک برای هر گیرنده
                  </span>
                </div>
              </div>

              <div className="admin-sms-message-hint">
                <AlertCircle size={16} />
                تعداد نهایی پیامک به نوع خط و محدودیت اپراتور بستگی دارد.
              </div>

              {notice && <div className="admin-sms-notice">{notice}</div>}

              <div className="admin-sms-send-actions">
                <button
                  type="button"
                  className="admin-sms-preview-btn"
                  onClick={() => setShowPreview(true)}
                >
                  پیش‌نمایش
                </button>

                <button
                  type="button"
                  className="admin-sms-send-btn"
                  onClick={handleSend}
                  disabled={!message.trim() || !validRecipients.length}
                >
                  <Send size={17} />
                  ثبت ارسال آزمایشی
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === "reports" && (
          <section className="admin-sms-card admin-sms-reports-card">
            <div className="admin-sms-card-heading admin-sms-report-heading">
              <div>
                <h3>گزارش پیامک‌ها</h3>
                <p>سوابق ارسال‌های ثبت‌شده در پنل</p>
              </div>
              <History size={22} />
            </div>

            <div className="admin-sms-report-toolbar">
              <div className="admin-sms-search">
                <Search size={17} />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(event) => setReportSearch(event.target.value)}
                  placeholder="جستجو در عنوان یا متن پیام..."
                />
              </div>

              <div className="admin-sms-report-filter">
                <Filter size={16} />
                <select
                  value={reportFilter}
                  onChange={(event) => setReportFilter(event.target.value)}
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="success">موفق</option>
                  <option value="partial">دارای خطا</option>
                  <option value="demo">آزمایشی</option>
                </select>
              </div>
            </div>

            <div className="admin-sms-report-list">
              {filteredLogs.length === 0 ? (
                <div className="admin-sms-empty">
                  گزارشی مطابق فیلترهای انتخاب‌شده وجود ندارد.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <article className="admin-sms-report-item" key={log.id}>
                    <div className="admin-sms-report-main">
                      <div className="admin-sms-report-title-row">
                        <h4>{log.title}</h4>

                        <span
                          className={`admin-sms-report-status ${log.status}`}
                        >
                          {log.status === "success"
                            ? "موفق"
                            : log.status === "partial"
                              ? "دارای خطا"
                              : "آزمایشی"}
                        </span>
                      </div>

                      <p>{log.message}</p>

                      <div className="admin-sms-report-meta">
                        <span>
                          <UsersRound size={14} />
                          {toPersianDigits(log.recipients)} گیرنده
                        </span>

                        <span>
                          <Clock3 size={14} />
                          {log.date}
                        </span>

                        <span>{log.type}</span>
                      </div>
                    </div>

                    <div className="admin-sms-report-results">
                      <span className="success">
                        <CheckCircle2 size={15} />
                        {toPersianDigits(log.successful)}
                      </span>

                      <span className="failed">
                        <XCircle size={15} />
                        {toPersianDigits(log.failed)}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {showPreview && (
          <div
            className="admin-sms-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowPreview(false);
              }
            }}
          >
            <div
              className="admin-sms-preview-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-sms-preview-title"
            >
              <div className="admin-sms-preview-header">
                <h3 id="admin-sms-preview-title">پیش‌نمایش پیامک</h3>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  aria-label="بستن پیش‌نمایش"
                >
                  ×
                </button>
              </div>

              <div className="admin-sms-phone-preview">
                <div className="admin-sms-phone-top">
                  <span>Kish Institute</span>
                  <MessageSquareText size={17} />
                </div>

                <div className="admin-sms-phone-message">
                  {message || "متن پیامک شما اینجا نمایش داده می‌شود."}
                </div>
              </div>

              <div className="admin-sms-preview-summary">
                <span>گیرندگان انتخاب‌شده</span>
                <strong>{toPersianDigits(validRecipients.length)} نفر</strong>
                <span>شماره‌های بدون موبایل ارسال نخواهند شد.</span>
              </div>

              <button
                type="button"
                className="admin-sms-send-btn"
                onClick={handleSend}
                disabled={!message.trim() || !validRecipients.length}
              >
                ثبت ارسال آزمایشی
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AdminSmsPanel;
