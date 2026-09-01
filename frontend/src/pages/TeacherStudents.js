import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  Filter,
  BookOpen,
  Phone,
  TrendingUp,
  Award,
  GraduationCap,
  ChevronLeft,
  UserRound,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import "./TeacherStudents.css";
import StatCard from "../components/StatCard";
import { api, getFullName } from "../services/api";

function TeacherStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [classrooms, setClassrooms] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        const [classroomsData, termsData, attendanceData, submissionsData] =
          await Promise.all([
            api.classrooms.list(),
            api.terms.list(),
            api.attendance.list(),
            api.submissions.list(),
          ]);

        if (!alive) return;

        const activeTermIds = (termsData || [])
          .filter((term) => term.is_active)
          .map((term) => term.id);

        const activeClasses = (classroomsData || []).filter((classroom) => {
          const termId =
            typeof classroom.term === "object"
              ? classroom.term?.id
              : classroom.term;

          return activeTermIds.length === 0 || activeTermIds.includes(termId);
        });

        setClassrooms(activeClasses);
        setAttendanceRecords(attendanceData || []);
        setSubmissions(submissionsData || []);
      } catch {
        if (alive) {
          setClassrooms([]);
          setAttendanceRecords([]);
          setSubmissions([]);
        }
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const teacherClasses = useMemo(
    () => [
      { id: "all", name: "همه کلاس‌ها" },
      ...classrooms.map((classroom) => ({
        id: classroom.id,
        name: classroom.name,
      })),
    ],
    [classrooms],
  );

  const studentsData = useMemo(() => {
    const rows = [];

    classrooms.forEach((classroom) => {
      (classroom.enrollments || []).forEach((enrollment) => {
        const student = enrollment.student_detail;

        if (!student) return;

        const records = attendanceRecords.filter((record) => {
          const studentId =
            typeof record.student === "object"
              ? record.student?.id
              : record.student;

          return studentId === student.id;
        });

        const presentRecords = records.filter(
          (record) => record.status === "present" || record.status === "late",
        );

        const graded = submissions.filter((submission) => {
          const studentId =
            typeof submission.student === "object"
              ? submission.student?.id
              : submission.student;

          return (
            studentId === student.id &&
            submission.total_score !== null &&
            submission.total_score !== undefined
          );
        });

        const averageGrade = graded.length
          ? (
              graded.reduce((sum, item) => sum + Number(item.total_score), 0) /
              graded.length
            ).toFixed(1)
          : "-";

        const attendanceRate = records.length
          ? `${Math.round((presentRecords.length / records.length) * 100)}٪`
          : "-";

        rows.push({
          id: student.id,
          name: getFullName(student),
          phone: student.phone_number || "-",
          className: classroom.name,
          classId: classroom.id,
          averageGrade,
          attendanceRate,
          status: student.is_active ? "فعال" : "غیرفعال",
          statusClass: student.is_active ? "active" : "warning",
        });
      });
    });

    return rows;
  }, [classrooms, attendanceRecords, submissions]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return studentsData.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        String(student.id).includes(normalizedSearch) ||
        student.phone.includes(normalizedSearch);

      const matchesClass =
        selectedClass === "all" ||
        String(student.classId) === String(selectedClass);

      return matchesSearch && matchesClass;
    });
  }, [studentsData, searchTerm, selectedClass]);

  const averageAllGrades = useMemo(() => {
    const validGrades = submissions.filter(
      (item) =>
        item.total_score !== null &&
        item.total_score !== undefined &&
        !Number.isNaN(Number(item.total_score)),
    );

    if (!validGrades.length) return "-";

    return (
      validGrades.reduce((sum, item) => sum + Number(item.total_score), 0) /
      validGrades.length
    ).toFixed(1);
  }, [submissions]);

  const excellentStudents = useMemo(() => {
    const studentIds = new Set();

    submissions.forEach((submission) => {
      if (Number(submission.total_score || 0) >= 18) {
        const studentId =
          typeof submission.student === "object"
            ? submission.student?.id
            : submission.student;

        if (studentId) {
          studentIds.add(studentId);
        }
      }
    });

    return studentIds.size;
  }, [submissions]);

  return (
    <DashboardLayout
      role="پنل مدرس"
      title="مدیریت دانش‌آموزان"
      menuType="teacher"
    >
      <div className="teacher-students-k7p2-root">
        {/* =========================
            Header
        ========================== */}

        <section className="teacher-students-k7p2-section">
          <section className="teacher-students-k7p2-header">
            <div className="teacher-students-k7p2-header-icon">
              <GraduationCap size={25} />
            </div>

            <div className="teacher-students-k7p2-header-content">
              <h3>لیست دانش‌آموزان</h3>

              <p>
                مشاهده اطلاعات تحصیلی، شماره تماس و وضعیت دانش‌آموزان تحت آموزش
                شما
              </p>
            </div>
          </section>

          {/* =========================
              Stats
          ========================== */}

          <div className="teacher-students-k7p2-stats">
            <StatCard
              title="کل دانش‌آموزان شما"
              value={`${studentsData.length} نفر`}
              icon={<Users size={23} />}
              color="red"
            />

            <StatCard
              title="میانگین نمرات کلاس‌ها"
              value={averageAllGrades}
              icon={<TrendingUp size={23} />}
              color="green"
            />

            <StatCard
              title="دانش‌آموزان ممتاز"
              value={excellentStudents}
              icon={<Award size={23} />}
              color="orange"
            />
          </div>

          {/* =========================
              Filters
          ========================== */}

          <div className="teacher-students-k7p2-filter-panel">
            <div className="teacher-students-k7p2-filter-title">
              <Filter size={18} />
              <span>جستجو و فیلتر دانش‌آموزان</span>
            </div>

            <div className="teacher-students-k7p2-filter-row">
              <div className="teacher-students-k7p2-search-wrapper">
                <Search
                  className="teacher-students-k7p2-search-icon"
                  size={18}
                />

                <input
                  type="text"
                  placeholder="نام، شناسه یا شماره تماس را جستجو کنید..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="teacher-students-k7p2-search-input"
                />
              </div>

              <div className="teacher-students-k7p2-select-wrapper">
                <BookOpen
                  className="teacher-students-k7p2-filter-icon"
                  size={18}
                />

                <select
                  value={selectedClass}
                  onChange={(event) => setSelectedClass(event.target.value)}
                  className="teacher-students-k7p2-select"
                >
                  {teacherClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="teacher-students-k7p2-results-info">
              <span>نتایج:</span>

              <strong>{filteredStudents.length}</strong>

              <span>دانش‌آموز</span>
            </div>
          </div>

          {/* =========================
              Desktop Table
          ========================== */}

          {filteredStudents.length > 0 && (
            <div className="teacher-students-k7p2-table-shell">
              <div className="teacher-students-k7p2-table-top">
                <div>
                  <h3>دانش‌آموزان</h3>
                  <span>اطلاعات آموزشی و وضعیت دانش‌آموزان</span>
                </div>

                <div className="teacher-students-k7p2-table-count">
                  {filteredStudents.length} نفر
                </div>
              </div>

              <div className="teacher-students-k7p2-table-wrapper">
                <table className="teacher-students-k7p2-table">
                  <thead>
                    <tr>
                      <th className="student-id-column">#</th>

                      <th>دانش‌آموز</th>

                      <th>شماره تماس</th>

                      <th>کلاس</th>

                      <th>معدل</th>

                      <th>حضور</th>

                      <th>وضعیت</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={`${student.id}-${student.classId}`}>
                        <td className="student-id-column">
                          <span className="teacher-students-k7p2-row-number">
                            {index + 1}
                          </span>
                        </td>

                        <td>
                          <div className="teacher-students-k7p2-name-cell">
                            <div className="teacher-students-k7p2-avatar">
                              <UserRound size={18} />
                            </div>

                            <div className="teacher-students-k7p2-name-content">
                              <strong>{student.name}</strong>

                              <span>شناسه: {student.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {student.phone !== "-" ? (
                            <a
                              href={`tel:${student.phone}`}
                              className="teacher-students-k7p2-phone"
                            >
                              <Phone size={15} />
                              <span>{student.phone}</span>
                            </a>
                          ) : (
                            <span className="teacher-students-k7p2-muted">
                              ثبت نشده
                            </span>
                          )}
                        </td>

                        <td>
                          <span className="teacher-students-k7p2-class-badge">
                            <BookOpen size={13} />
                            {student.className}
                          </span>
                        </td>

                        <td>
                          <div className="teacher-students-k7p2-grade-cell">
                            <strong
                              className={
                                student.averageGrade === "-" ? "is-empty" : ""
                              }
                            >
                              {student.averageGrade}
                            </strong>

                            {student.averageGrade !== "-" && <span>از 100</span>}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`teacher-students-k7p2-attendance ${
                              student.attendanceRate === "-" ? "is-empty" : ""
                            }`}
                          >
                            {student.attendanceRate}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`teacher-students-k7p2-status teacher-students-k7p2-status-${student.statusClass}`}
                          >
                            <span className="teacher-students-k7p2-status-dot" />
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================
              Mobile Cards
          ========================== */}

          {filteredStudents.length > 0 && (
            <div className="teacher-students-k7p2-mobile-list">
              {filteredStudents.map((student, index) => (
                <article
                  key={`${student.id}-mobile-${student.classId}`}
                  className="teacher-students-k7p2-mobile-card"
                >
                  <div className="teacher-students-k7p2-mobile-header">
                    <div className="teacher-students-k7p2-mobile-profile">
                      <div className="teacher-students-k7p2-mobile-avatar">
                        <UserRound size={20} />
                      </div>

                      <div className="teacher-students-k7p2-mobile-name">
                        <strong>{student.name}</strong>

                        <span>شناسه: {student.id}</span>
                      </div>
                    </div>

                    <span
                      className={`teacher-students-k7p2-status teacher-students-k7p2-status-${student.statusClass}`}
                    >
                      <span className="teacher-students-k7p2-status-dot" />
                      {student.status}
                    </span>
                  </div>

                  <div className="teacher-students-k7p2-mobile-class">
                    <BookOpen size={15} />
                    <span>{student.className}</span>
                  </div>

                  <div className="teacher-students-k7p2-mobile-grid">
                    <div className="teacher-students-k7p2-mobile-item">
                      <span>شماره تماس</span>

                      {student.phone !== "-" ? (
                        <a
                          href={`tel:${student.phone}`}
                          className="teacher-students-k7p2-mobile-phone"
                        >
                          <Phone size={14} />
                          {student.phone}
                        </a>
                      ) : (
                        <strong className="is-empty">ثبت نشده</strong>
                      )}
                    </div>

                    <div className="teacher-students-k7p2-mobile-item">
                      <span>معدل</span>

                      <strong
                        className={
                          student.averageGrade === "-" ? "is-empty" : "grade"
                        }
                      >
                        {student.averageGrade}
                      </strong>
                    </div>

                    <div className="teacher-students-k7p2-mobile-item">
                      <span>درصد حضور</span>

                      <strong
                        className={
                          student.attendanceRate === "-"
                            ? "is-empty"
                            : "attendance"
                        }
                      >
                        {student.attendanceRate}
                      </strong>
                    </div>

                    <div className="teacher-students-k7p2-mobile-item">
                      <span>ردیف</span>

                      <strong>{index + 1}</strong>
                    </div>
                  </div>

                  <div className="teacher-students-k7p2-mobile-footer">
                    <span>اطلاعات آموزشی دانش‌آموز</span>

                    <ChevronLeft size={16} />
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* =========================
              Empty
          ========================== */}

          {filteredStudents.length === 0 && (
            <div className="teacher-students-k7p2-empty">
              <div className="teacher-students-k7p2-empty-icon">
                <BookOpen size={30} />
              </div>

              <h3>دانش‌آموزی پیدا نشد</h3>

              <p>با تغییر عبارت جستجو یا انتخاب کلاس دیگر دوباره تلاش کنید.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default TeacherStudents;
