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

    async function loadData() {
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

        // Default to active term if available
        const active = allTerms.find((t) => t.is_active);
        if (active) {
          setSelectedTermId(String(active.id));
        } else if (allTerms.length > 0) {
          setSelectedTermId(String(allTerms[0].id));
        } else {
          setSelectedTermId("all");
        }
      } catch (err) {
        if (alive) setError(err.message || "خطا در دریافت اطلاعات");
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
    if (selectedTermId === "all") return rawClassrooms;
    return rawClassrooms.filter(
      (c) => String(c.term || c.term?.id) === String(selectedTermId),
    );
  }, [rawClassrooms, selectedTermId]);

  const termClassIds = useMemo(
    () => termClassrooms.map((c) => c.id),
    [termClassrooms],
  );

  // Filtered Enrollments by Term Classrooms
  const termEnrollments = useMemo(() => {
    if (selectedTermId === "all") return rawEnrollments;
    return rawEnrollments.filter((e) =>
      termClassIds.includes(e.classroom || e.classroom?.id),
    );
  }, [rawEnrollments, termClassIds, selectedTermId]);

  // Filtered Sessions by Term Classrooms
  const termSessions = useMemo(() => {
    if (selectedTermId === "all") return rawSessions;
    return rawSessions.filter((s) =>
      termClassIds.includes(s.classroom || s.classroom?.id),
    );
  }, [rawSessions, termClassIds, selectedTermId]);

  // Enrolled Students list for the Selected Term
  const studentList = useMemo(() => {
    const studentUsers = rawUsers.filter((u) => u.role === "student");

    // If specific term selected, prioritize students enrolled in this term
    let targetStudents = studentUsers;
    if (selectedTermId !== "all") {
      const enrolledStudentIds = termEnrollments.map(
        (e) => e.student || e.student?.id,
      );
      // If there are enrolled students, show them; otherwise show all with note
      const enrolledOnly = studentUsers.filter((u) =>
        enrolledStudentIds.includes(u.id),
      );
      if (enrolledOnly.length > 0) {
        targetStudents = enrolledOnly;
      }
    }

    return targetStudents.map((u) => {
      const studentEnrollment = termEnrollments.find(
        (e) => e.student === u.id || e.student?.id === u.id,
      );
      const studentClass = studentEnrollment
        ? termClassrooms.find(
            (c) => c.id === (studentEnrollment.classroom || studentEnrollment.classroom?.id),
          )
        : null;

      const studentRecords = rawAttendance.filter(
        (a) => a.student === u.id || a.student?.id === u.id,
      );
      const absents = studentRecords.filter((a) => a.status === "absent").length;
      const attendanceStatus =
        studentRecords.length === 0
          ? "بدون سابقه"
          : absents === 0
          ? "منظم"
          : `${toPersianDigits(absents)} غیبت`;

      return {
        id: u.id,
        name: getFullName(u),
        phone: u.phone_number || "-",
        cls: studentClass?.name || "بدون کلاس در این ترم",
        fee: u.is_active ? "paid" : "pending",
        attendance: attendanceStatus,
        remaining: 0,
      };
    });
  }, [rawUsers, termEnrollments, termClassrooms, rawAttendance, selectedTermId]);

  const classList = useMemo(() => {
    return termClassrooms.map((cls) => {
      const classSessions = termSessions.filter(
        (s) => s.classroom === cls.id || s.classroom?.id === cls.id,
      );
      const held = classSessions.length;
      const total = 20;
      const remaining = Math.max(0, total - held);

      return {
        id: cls.id,
        name: cls.name,
        held,
        remaining,
        total,
      };
    });
  }, [termClassrooms, termSessions]);

  const paidStudents = studentList.filter(
    (student) => student.fee === "paid",
  ).length;

  const totalRegularAttendance = studentList.filter(
    (student) => student.attendance === "منظم",
  ).length;

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return studentList.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.phone.includes(normalizedSearch) ||
        student.cls.toLowerCase().includes(normalizedSearch);

      const matchesFee = selectedFee === "all" || student.fee === selectedFee;

      return matchesSearch && matchesFee;
    });
  }, [studentList, searchTerm, selectedFee]);

  return (
    <DashboardLayout
      role="پنل منشی"
      title="مدیریت پذیرش و ثبت‌نام"
      menuType="secretary"
    >
      <div className="secretary-panel-x8m4-root">
        {/* Term Selection Top Bar */}
        <div className="term-selector-banner">
          <div className="term-banner-info">
            <div className="term-icon-circle">
              <Layers size={22} />
            </div>
            <div>
              <h3>
                ترم تحصیلی انتخابی:{" "}
                <span className="term-highlight-text">
                  {activeTermObj
                    ? activeTermObj.name
                    : selectedTermId === "all"
                    ? "همه ترم‌ها"
                    : "ترم نامشخص"}
                </span>
              </h3>
              <p>
                {activeTermObj?.is_active
                  ? "اطلاعات، کلاس‌ها و آمار مربوط به ترم فعال جاری در حال نمایش است."
                  : activeTermObj
                  ? "اطلاعات مربوط به این ترم بایگانی‌شده در حال نمایش است."
                  : "نمایش کلیه اطلاعات تمامی ترم‌ها"}
              </p>
            </div>
          </div>

          <div className="term-dropdown-wrapper">
            <label>انتخاب ترم:</label>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="term-select-input"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_active ? "(ترم فعال جاری)" : "(به پایان رسیده)"}
                </option>
              ))}
              <option value="all">همه ترم‌ها (مشاهده تجمیعی)</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{ color: "var(--danger, #ef4444)", marginBottom: "1rem", textAlign: "center" }}>
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="secretary-panel-x8m4-stats">
          <StatCard
            title="دانش‌آموزان ترم"
            value={`${toPersianDigits(studentList.length)} نفر`}
            hint={activeTermObj?.name || "ترم انتخابی"}
            icon={<UsersRound />}
            color="red"
          />

          <StatCard
            title="حساب‌های فعال"
            value={`${toPersianDigits(paidStudents)} نفر`}
            hint="دانش‌آموزان فعال"
            icon={<CreditCard />}
            color="green"
          />

          <StatCard
            title="دانش‌آموزان منظم"
            value={`${toPersianDigits(totalRegularAttendance)} نفر`}
            hint="بدون غیبت"
            icon={<ClipboardCheck />}
            color="light-blue"
          />

          <StatCard
            title="کلاس‌های ترم"
            value={`${toPersianDigits(termClassrooms.length)} کلاس`}
            hint={activeTermObj?.is_active ? "در حال برگزاری" : "ترم انتخابی"}
            icon={<CalendarDays />}
            color="soft-red"
          />
        </div>

        {/* Search & Actions Section */}
        <section className="secretary-panel-x8m4-section">
          <div className="secretary-panel-x8m4-section-header">
            <div>
              <h3 className="secretary-panel-x8m4-title">جستجوی سریع دانش‌آموزان</h3>
              <p className="secretary-panel-x8m4-description">
                جستجو در اطلاعات دانش‌آموزان ترم انتخابی
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link to="/panel/secretary/students/new">
                <AnimatedButton variant="primary" icon={<UserPlus size={18} />}>
                  ثبت‌نام دانش‌آموز جدید
                </AnimatedButton>
              </Link>
            </div>
          </div>

          <div className="secretary-panel-x8m4-search-row">
            <div className="secretary-panel-x8m4-input-shell">
              <Search size={18} />
              <input
                type="text"
                placeholder="نام، شماره تماس یا کلاس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="secretary-panel-x8m4-input"
              />
            </div>

            <div className="secretary-panel-x8m4-select-shell">
              <Filter size={16} />
              <select
                value={selectedFee}
                onChange={(e) => setSelectedFee(e.target.value)}
                className="secretary-panel-x8m4-select"
              >
                <option value="all">همه وضعیت‌های حساب</option>
                <option value="paid">فعال / پرداخت‌شده</option>
                <option value="pending">در انتظار پرداخت</option>
              </select>
            </div>
          </div>

          <div className="secretary-panel-x8m4-table-shell">
            <div className="secretary-panel-x8m4-table-scroll">
              <table className="secretary-panel-x8m4-table">
                <thead>
                  <tr>
                    <th>نام دانش‌آموز</th>
                    <th>شماره تماس</th>
                    <th>کلاس ترم</th>
                    <th>وضعیت حساب</th>
                    <th>حضور و غیاب</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                        در حال بارگذاری اطلاعات...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "2.5rem", color: "oklch(55% 0 0)" }}>
                        دانش‌آموزی در این ترم یافت نشد.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <strong>{student.name}</strong>
                        </td>

                        <td>
                          <span className="secretary-panel-x8m4-phone-tag">
                            {student.phone}
                          </span>
                        </td>

                        <td>
                          <span className="secretary-panel-x8m4-class-tag">
                            {student.cls}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`secretary-panel-x8m4-fee-pill ${
                              student.fee === "paid"
                                ? "secretary-panel-x8m4-fee-pill--paid"
                                : "secretary-panel-x8m4-fee-pill--pending"
                            }`}
                          >
                            {student.fee === "paid" ? "فعال" : "در انتظار پرداخت"}
                          </span>
                        </td>

                        <td>
                          <span className="secretary-panel-x8m4-attendance-tag">
                            {student.attendance}
                          </span>
                        </td>

                        <td>
                          <Link to={`/panel/secretary/students/${student.id}`}>
                            <button
                              type="button"
                              className="secretary-panel-x8m4-view-btn"
                            >
                              <Eye size={16} />
                              مشاهده پرونده
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Classes Overview Section */}
        <section className="secretary-panel-x8m4-section">
          <div className="secretary-panel-x8m4-section-header">
            <div>
              <h3 className="secretary-panel-x8m4-title">کلاس‌های ترم انتخابی</h3>
              <p className="secretary-panel-x8m4-description">
                وضعیت تشکیل جلسات کلاس‌های این ترم
              </p>
            </div>

            <Link to="/panel/secretary/classes">
              <span style={{ fontSize: "0.84rem", fontWeight: "800", color: "var(--primary)" }}>
                مدیریت همه کلاس‌ها ←
              </span>
            </Link>
          </div>

          <div className="secretary-panel-x8m4-table-shell">
            <div className="secretary-panel-x8m4-table-scroll">
              <table className="secretary-panel-x8m4-table">
                <thead>
                  <tr>
                    <th>نام کلاس</th>
                    <th>جلسات برگزارشده</th>
                    <th>جلسات باقی‌مانده</th>
                    <th>پیشرفت ترم</th>
                  </tr>
                </thead>

                <tbody>
                  {classList.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "2rem", color: "oklch(55% 0 0)" }}>
                        کلاسی در این ترم تعریف نشده است.
                      </td>
                    </tr>
                  ) : (
                    classList.map((cls) => (
                      <tr key={cls.id}>
                        <td>
                          <strong>{cls.name}</strong>
                        </td>

                        <td>{toPersianDigits(cls.held)} جلسه</td>

                        <td>{toPersianDigits(cls.remaining)} جلسه</td>

                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div
                              style={{
                                flex: 1,
                                height: "8px",
                                background: "oklch(92% 0 0)",
                                borderRadius: "4px",
                                overflow: "hidden",
                                maxWidth: "120px",
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(100, Math.round((cls.held / cls.total) * 100))}%`,
                                  height: "100%",
                                  background: "var(--primary)",
                                  borderRadius: "4px",
                                }}
                              />
                            </div>
                            <span style={{ fontSize: "0.78rem", fontWeight: "700" }}>
                              {toPersianDigits(Math.round((cls.held / cls.total) * 100))}٪
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default SecretaryPanel;
