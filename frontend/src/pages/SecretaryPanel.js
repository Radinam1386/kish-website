import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Search,
  UserPlus,
  UsersRound,
  Eye,
  Filter,
  Layers,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Home,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import { toPersianDigits } from "../utils/dateUtils";

import "./SecretaryPanel.css";

function SecretaryPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFee, setSelectedFee] = useState("all");
  const [selectedTermId, setSelectedTermId] = useState("");

  const [terms, setTerms] = useState([]);
  const [rawUsers, setRawUsers] = useState([]);
  const [rawClassrooms, setRawClassrooms] = useState([]);
  const [rawEnrollments, setRawEnrollments] = useState([]);
  const [rawSessions, setRawSessions] = useState([]);
  const [rawAttendance, setRawAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          termsData,
          usersData,
          classroomsData,
          enrollmentsData,
          sessionsData,
          attendanceData,
        ] = await Promise.all([
          api.terms.list(),
          api.users.list(),
          api.classrooms.list(),
          api.enrollments.list(),
          api.sessions.list(),
          api.attendance.list(),
        ]);

        if (!alive) return;

        const allTerms = termsData || [];

        setTerms(allTerms);
        setRawUsers(usersData || []);
        setRawClassrooms(classroomsData || []);
        setRawEnrollments(enrollmentsData || []);
        setRawSessions(sessionsData || []);
        setRawAttendance(attendanceData || []);

        const activeTerm = allTerms.find((term) => term.is_active);

        if (activeTerm) {
          setSelectedTermId(String(activeTerm.id));
        } else if (allTerms.length > 0) {
          setSelectedTermId(String(allTerms[0].id));
        } else {
          setSelectedTermId("all");
        }
      } catch (err) {
        if (alive) {
          setError(err.message || "دریافت اطلاعات پنل منشی با خطا مواجه شد.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const activeTermObj = useMemo(() => {
    if (selectedTermId === "all") return null;

    return terms.find((term) => String(term.id) === String(selectedTermId));
  }, [terms, selectedTermId]);

  const termClassrooms = useMemo(() => {
    if (selectedTermId === "all") {
      return rawClassrooms;
    }

    return rawClassrooms.filter(
      (classroom) =>
        String(classroom.term?.id ?? classroom.term) === String(selectedTermId),
    );
  }, [rawClassrooms, selectedTermId]);

  const termClassIds = useMemo(
    () => termClassrooms.map((classroom) => classroom.id),
    [termClassrooms],
  );

  const termEnrollments = useMemo(() => {
    if (selectedTermId === "all") {
      return rawEnrollments;
    }

    return rawEnrollments.filter((enrollment) =>
      termClassIds.includes(enrollment.classroom?.id ?? enrollment.classroom),
    );
  }, [rawEnrollments, termClassIds, selectedTermId]);

  const termSessions = useMemo(() => {
    if (selectedTermId === "all") {
      return rawSessions;
    }

    return rawSessions.filter((session) =>
      termClassIds.includes(session.classroom?.id ?? session.classroom),
    );
  }, [rawSessions, termClassIds, selectedTermId]);

  const studentList = useMemo(() => {
    const studentUsers = rawUsers.filter((user) => user.role === "student");

    let targetStudents = studentUsers;

    if (selectedTermId !== "all") {
      const enrolledStudentIds = termEnrollments.map(
        (enrollment) => enrollment.student?.id ?? enrollment.student,
      );

      const enrolledStudents = studentUsers.filter((user) =>
        enrolledStudentIds.includes(user.id),
      );

      if (enrolledStudents.length > 0) {
        targetStudents = enrolledStudents;
      }
    }

    return targetStudents.map((user) => {
      const studentEnrollment = termEnrollments.find(
        (enrollment) =>
          (enrollment.student?.id ?? enrollment.student) === user.id,
      );

      const classroomId =
        studentEnrollment?.classroom?.id ?? studentEnrollment?.classroom;

      const studentClass =
        termClassrooms.find((classroom) => classroom.id === classroomId) ||
        null;

      const studentRecords = rawAttendance.filter(
        (attendance) =>
          (attendance.student?.id ?? attendance.student) === user.id,
      );

      const absentCount = studentRecords.filter(
        (attendance) => attendance.status === "absent",
      ).length;

      let attendanceStatus = "بدون سابقه";

      if (studentRecords.length > 0) {
        attendanceStatus =
          absentCount === 0 ? "منظم" : `${toPersianDigits(absentCount)} غیبت`;
      }

      return {
        id: user.id,
        name: getFullName(user) || user.username,
        username: user.username,
        phone: user.phone_number || "-",
        cls: studentClass?.name || "بدون کلاس",
        fee: user.is_active ? "paid" : "pending",
        attendance: attendanceStatus,
        isRegular: attendanceStatus === "منظم",
        avatar: (getFullName(user) || user.username || "د").charAt(0),
      };
    });
  }, [
    rawUsers,
    termEnrollments,
    termClassrooms,
    rawAttendance,
    selectedTermId,
  ]);

  const classList = useMemo(() => {
    return termClassrooms.map((classroom) => {
      const classSessions = termSessions.filter(
        (session) =>
          (session.classroom?.id ?? session.classroom) === classroom.id,
      );

      const total = 20;
      const held = classSessions.length;
      const remaining = Math.max(0, total - held);
      const progress = Math.min(100, Math.round((held / total) * 100));

      return {
        id: classroom.id,
        name: classroom.name,
        held,
        remaining,
        total,
        progress,
      };
    });
  }, [termClassrooms, termSessions]);

  const paidStudents = useMemo(
    () => studentList.filter((student) => student.fee === "paid").length,
    [studentList],
  );

  const regularStudents = useMemo(
    () => studentList.filter((student) => student.isRegular).length,
    [studentList],
  );

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return studentList.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.phone.toLowerCase().includes(normalizedSearch) ||
        student.cls.toLowerCase().includes(normalizedSearch);

      const matchesFee = selectedFee === "all" || student.fee === selectedFee;

      return matchesSearch && matchesFee;
    });
  }, [studentList, searchTerm, selectedFee]);

  const selectedTermTitle = activeTermObj
    ? activeTermObj.name
    : selectedTermId === "all"
      ? "همه ترم‌ها"
      : "ترم نامشخص";

  return (
    <DashboardLayout
      role="پنل منشی"
      title="مدیریت پذیرش و ثبت‌نام"
      menuType="secretary"
    >
      <div className="secretary-panel-x8m4-root">
        <section className="secretary-panel-x8m4-term-banner">
          <div className="secretary-panel-x8m4-term-content">
            <div className="secretary-panel-x8m4-term-icon">
              <Home size={25} />
            </div>

            <div className="secretary-panel-x8m4-term-text">
              <div className="secretary-panel-x8m4-term-label">
                ترم تحصیلی انتخابی
              </div>

              <h3>{selectedTermTitle}</h3>

              <p>
                {activeTermObj?.is_active
                  ? "اطلاعات و آمار مربوط به ترم فعال جاری نمایش داده می‌شود."
                  : activeTermObj
                    ? "اطلاعات مربوط به ترم انتخاب‌شده در حال نمایش است."
                    : "اطلاعات تجمیعی تمام ترم‌های آموزشگاه نمایش داده می‌شود."}
              </p>
            </div>
          </div>

          <div className="secretary-panel-x8m4-term-control">
            <label htmlFor="secretary-term-select">انتخاب ترم</label>

            <select
              id="secretary-term-select"
              value={selectedTermId}
              onChange={(event) => setSelectedTermId(event.target.value)}
              className="secretary-panel-x8m4-term-select"
            >
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}{" "}
                  {term.is_active ? "(ترم فعال جاری)" : "(به پایان رسیده)"}
                </option>
              ))}

              <option value="all">همه ترم‌ها (مشاهده تجمیعی)</option>
            </select>
          </div>
        </section>
        {error && (
          <div className="secretary-panel-x8m4-error">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}
        <section className="secretary-panel-x8m4-stats">
          <StatCard
            title="دانش‌آموزان ترم"
            value={`${toPersianDigits(studentList.length)} نفر`}
            hint={selectedTermTitle}
            icon={<UsersRound size={21} />}
            color="red"
          />

          <StatCard
            title="حساب‌های فعال"
            value={`${toPersianDigits(paidStudents)} نفر`}
            hint="دانش‌آموزان فعال"
            icon={<CreditCard size={21} />}
            color="green"
          />

          <StatCard
            title="دانش‌آموزان منظم"
            value={`${toPersianDigits(regularStudents)} نفر`}
            hint="بدون غیبت ثبت‌شده"
            icon={<ClipboardCheck size={21} />}
            color="light-blue"
          />

          <StatCard
            title="کلاس‌های ترم"
            value={`${toPersianDigits(termClassrooms.length)} کلاس`}
            hint={activeTermObj?.is_active ? "در حال برگزاری" : "ترم انتخابی"}
            icon={<CalendarDays size={21} />}
            color="soft-red"
          />
        </section>
        <section className="secretary-panel-x8m4-section">
          <div className="secretary-panel-x8m4-section-header">
            <div className="secretary-panel-x8m4-section-heading">
              <div className="secretary-panel-x8m4-section-kicker">
                مدیریت دانش‌آموزان
              </div>

              <h3 className="secretary-panel-x8m4-title">
                جستجوی سریع دانش‌آموزان
              </h3>

              <p className="secretary-panel-x8m4-description">
                جستجو و مشاهده اطلاعات دانش‌آموزان ترم انتخابی
              </p>
            </div>

            <Link to="/panel/secretary/students/new">
              <AnimatedButton variant="primary" icon={<UserPlus size={18} />}>
                ثبت‌نام دانش‌آموز جدید
              </AnimatedButton>
            </Link>
          </div>
          <div className="secretary-panel-x8m4-filters">
            <div className="secretary-panel-x8m4-search">
              <Search size={18} className="secretary-panel-x8m4-search-icon" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="نام، شماره تماس یا نام کلاس را جستجو کنید..."
                className="secretary-panel-x8m4-search-input"
              />

              {searchTerm && (
                <button
                  type="button"
                  className="secretary-panel-x8m4-search-clear"
                  onClick={() => setSearchTerm("")}
                  aria-label="پاک کردن جستجو"
                >
                  ×
                </button>
              )}
            </div>

            <div className="secretary-panel-x8m4-filter">
              <Filter size={17} />

              <select
                value={selectedFee}
                onChange={(event) => setSelectedFee(event.target.value)}
                className="secretary-panel-x8m4-filter-select"
              >
                <option value="all">همه وضعیت‌های حساب</option>
                <option value="paid">فعال / پرداخت‌شده</option>
                <option value="pending">در انتظار پرداخت</option>
              </select>
            </div>
          </div>

          <div className="secretary-panel-x8m4-results-info">
            <span>
              نمایش
              <strong>{toPersianDigits(filteredStudents.length)}</strong>
              دانش‌آموز
            </span>

            {(searchTerm || selectedFee !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedFee("all");
                }}
                className="secretary-panel-x8m4-reset"
              >
                حذف فیلترها
              </button>
            )}
          </div>
          <div className="secretary-panel-x8m4-table-shell">
            {loading ? (
              <div className="secretary-panel-x8m4-state">
                <div className="secretary-panel-x8m4-loader" />
                <strong>در حال دریافت اطلاعات</strong>
                <span>اطلاعات دانش‌آموزان در حال بارگذاری است...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="secretary-panel-x8m4-state">
                <div className="secretary-panel-x8m4-state-icon">
                  <UsersRound size={27} />
                </div>

                <strong>دانش‌آموزی پیدا نشد</strong>

                <span>عبارت جستجو یا فیلتر وضعیت حساب را تغییر دهید.</span>
              </div>
            ) : (
              <div className="secretary-panel-x8m4-table-scroll">
                <table className="secretary-panel-x8m4-table">
                  <thead>
                    <tr>
                      <th>دانش‌آموز</th>
                      <th>شماره تماس</th>
                      <th>کلاس ترم</th>
                      <th>وضعیت حساب</th>
                      <th>حضور و غیاب</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td data-label="دانش‌آموز">
                          <div className="secretary-panel-x8m4-student">
                            <div className="secretary-panel-x8m4-avatar">
                              {student.avatar}
                            </div>

                            <div className="secretary-panel-x8m4-student-info">
                              <strong>{student.name}</strong>

                              <span>{student.username}</span>
                            </div>
                          </div>
                        </td>

                        <td data-label="شماره تماس">
                          <span className="secretary-panel-x8m4-phone">
                            {student.phone}
                          </span>
                        </td>

                        <td data-label="کلاس ترم">
                          <span className="secretary-panel-x8m4-class-tag">
                            {student.cls}
                          </span>
                        </td>

                        <td data-label="وضعیت حساب">
                          <span
                            className={`secretary-panel-x8m4-status ${
                              student.fee === "paid"
                                ? "secretary-panel-x8m4-status--active"
                                : "secretary-panel-x8m4-status--pending"
                            }`}
                          >
                            {student.fee === "paid" ? (
                              <>
                                <CheckCircle2 size={14} />
                                فعال
                              </>
                            ) : (
                              <>
                                <CreditCard size={14} />
                                در انتظار پرداخت
                              </>
                            )}
                          </span>
                        </td>

                        <td data-label="حضور و غیاب">
                          <span
                            className={`secretary-panel-x8m4-attendance ${
                              student.isRegular
                                ? "secretary-panel-x8m4-attendance--good"
                                : "secretary-panel-x8m4-attendance--warning"
                            }`}
                          >
                            {student.attendance}
                          </span>
                        </td>

                        <td
                          data-label="عملیات"
                          className="secretary-panel-x8m4-action-cell"
                        >
                          <Link to={`/panel/secretary/students/${student.id}`}>
                            <AnimatedButton
                              icon={<Eye size={16} />}
                              size="small"
                              variant="secondary"
                            >
                              <span>مشاهده پرونده</span>
                              <ChevronLeft size={14} />
                            </AnimatedButton>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
        <section className="secretary-panel-x8m4-section">
          <div className="secretary-panel-x8m4-section-header">
            <div className="secretary-panel-x8m4-section-heading">
              <h3 className="secretary-panel-x8m4-title">
                کلاس‌های ترم انتخابی
              </h3>

              <p className="secretary-panel-x8m4-description">
                وضعیت تشکیل جلسات و میزان پیشرفت کلاس‌های این ترم
              </p>
            </div>

            <Link
              to="/panel/secretary/classes"
              className="secretary-panel-x8m4-more-link"
            >
              <AnimatedButton icon={<ChevronLeft size={16} />} size="small">
                مدیریت همه کلاس‌ها
              </AnimatedButton>
            </Link>
          </div>

          {classList.length === 0 ? (
            <div className="secretary-panel-x8m4-state secretary-panel-x8m4-state--classes">
              <div className="secretary-panel-x8m4-state-icon">
                <CalendarDays size={27} />
              </div>

              <strong>کلاسی برای این ترم تعریف نشده است</strong>

              <span>
                پس از ایجاد کلاس، وضعیت جلسات در این بخش نمایش داده می‌شود.
              </span>
            </div>
          ) : (
            <div className="secretary-panel-x8m4-class-grid">
              {classList.map((classItem) => (
                <article
                  key={classItem.id}
                  className="secretary-panel-x8m4-class-card"
                >
                  <div className="secretary-panel-x8m4-class-header">
                    <div className="secretary-panel-x8m4-class-icon">
                      <Layers size={20} />
                    </div>

                    <div className="secretary-panel-x8m4-class-title">
                      <span>کلاس آموزشی</span>
                      <h4>{classItem.name}</h4>
                    </div>
                  </div>

                  <div className="secretary-panel-x8m4-progress-head">
                    <span>پیشرفت ترم</span>

                    <strong>{toPersianDigits(classItem.progress)}٪</strong>
                  </div>

                  <div className="secretary-panel-x8m4-progress">
                    <div
                      className="secretary-panel-x8m4-progress-fill"
                      style={{
                        width: `${classItem.progress}%`,
                      }}
                    />
                  </div>

                  <div className="secretary-panel-x8m4-class-meta">
                    <div>
                      <span>برگزارشده</span>
                      <strong>{toPersianDigits(classItem.held)} جلسه</strong>
                    </div>

                    <div>
                      <span>باقی‌مانده</span>
                      <strong>
                        {toPersianDigits(classItem.remaining)} جلسه
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default SecretaryPanel;
