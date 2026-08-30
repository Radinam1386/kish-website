import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  UsersRound,
  UserPlus,
  UserCheck,
  Eye,
  Layers,
  GraduationCap,
  ChevronLeft,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import { toPersianDigits } from "../utils/dateUtils";

import "./AdminPanel.css";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);

        const [usersData, classroomsData, enrollmentsData, termsData] =
          await Promise.all([
            api.users.list(),
            api.classrooms.list(),
            api.enrollments.list(),
            api.terms.list(),
          ]);

        if (!alive) return;

        const allTerms = termsData || [];

        setUsers(usersData || []);
        setClassrooms(classroomsData || []);
        setEnrollments(enrollmentsData || []);
        setTerms(allTerms);

        const activeTerm = allTerms.find((term) => term.is_active);

        if (activeTerm) {
          setSelectedTermId(String(activeTerm.id));
        } else if (allTerms.length) {
          setSelectedTermId(String(allTerms[0].id));
        } else {
          setSelectedTermId("all");
        }
      } catch {
        if (!alive) return;

        setUsers([]);
        setClassrooms([]);
        setEnrollments([]);
        setTerms([]);
        setSelectedTermId("all");
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

  const activeTermObj = useMemo(() => {
    if (selectedTermId === "all") return null;

    return terms.find((term) => String(term.id) === String(selectedTermId));
  }, [terms, selectedTermId]);

  const termClassrooms = useMemo(() => {
    if (selectedTermId === "all") {
      return classrooms;
    }

    return classrooms.filter((classroom) => {
      const termId =
        typeof classroom.term === "object"
          ? classroom.term?.id
          : classroom.term;

      return String(termId) === String(selectedTermId);
    });
  }, [classrooms, selectedTermId]);

  const termClassIds = useMemo(
    () => termClassrooms.map((classroom) => classroom.id),
    [termClassrooms],
  );

  const termEnrollments = useMemo(() => {
    if (selectedTermId === "all") {
      return enrollments;
    }

    return enrollments.filter((enrollment) => {
      const classroomId =
        typeof enrollment.classroom === "object"
          ? enrollment.classroom?.id
          : enrollment.classroom;

      return termClassIds.includes(classroomId);
    });
  }, [enrollments, termClassIds, selectedTermId]);

  const students = useMemo(() => {
    const studentUsers = users.filter((user) => user.role === "student");

    let targetStudents = studentUsers;

    if (selectedTermId !== "all") {
      const enrolledStudentIds = termEnrollments.map((enrollment) =>
        typeof enrollment.student === "object"
          ? enrollment.student?.id
          : enrollment.student,
      );

      const enrolledStudents = studentUsers.filter((user) =>
        enrolledStudentIds.includes(user.id),
      );

      if (enrolledStudents.length) {
        targetStudents = enrolledStudents;
      }
    }

    return targetStudents.slice(0, 6).map((user) => {
      const enrollment = termEnrollments.find((item) => {
        const studentId =
          typeof item.student === "object" ? item.student?.id : item.student;

        return studentId === user.id;
      });

      const enrollmentClassroomId =
        typeof enrollment?.classroom === "object"
          ? enrollment.classroom?.id
          : enrollment?.classroom;

      const classroom = termClassrooms.find(
        (item) => item.id === enrollmentClassroomId,
      );

      return {
        id: user.id,
        name: getFullName(user),
        phone: user.phone_number || "-",
        className: classroom?.name || "بدون کلاس در این ترم",
        tuitionStatus: user.is_active ? "فعال" : "در انتظار",
        tuitionStatusClass: user.is_active
          ? "admin-panel-status-paid"
          : "admin-panel-status-pending",
      };
    });
  }, [users, termEnrollments, termClassrooms, selectedTermId]);

  const teachers = useMemo(() => {
    return users
      .filter((user) => user.role === "teacher")
      .slice(0, 6)
      .map((user) => {
        const activeClasses = termClassrooms.filter((classroom) => {
          const teacherId =
            typeof classroom.teacher === "object"
              ? classroom.teacher?.id
              : classroom.teacher;

          return (
            teacherId === user.id || classroom.teacher_detail?.id === user.id
          );
        }).length;

        const teacherName = getFullName(user);

        return {
          id: user.id,
          name: teacherName,
          avatar: teacherName.charAt(0),
          specialty: user.email || "استاد آکادمی",
          activeClasses: `${toPersianDigits(activeClasses)} کلاس در ترم`,
        };
      });
  }, [users, termClassrooms]);

  const schedule = useMemo(() => {
    return termClassrooms.slice(0, 6).map((classroom) => ({
      id: classroom.id,
      className: classroom.name,
      teacher: getFullName(classroom.teacher_detail) || "استاد نامشخص",
      capacity: `${toPersianDigits(classroom.student_count || 0)} نفر`,
    }));
  }, [termClassrooms]);

  const studentCount = useMemo(() => {
    if (selectedTermId === "all") {
      return users.filter((user) => user.role === "student").length;
    }

    return (
      termEnrollments.length ||
      users.filter((user) => user.role === "student").length
    );
  }, [users, termEnrollments, selectedTermId]);

  const stats = [
    {
      id: 1,
      title: "دانش‌آموزان ترم",
      value: `${toPersianDigits(studentCount)} نفر`,
      hint: activeTermObj?.name || "ترم انتخابی",
      icon: <UsersRound />,
      color: "green",
    },
    {
      id: 2,
      title: "معلمان",
      value: `${toPersianDigits(
        users.filter((user) => user.role === "teacher").length,
      )} نفر`,
      hint: "اساتید آکادمی",
      icon: <BookOpen />,
      color: "blue",
    },
    {
      id: 3,
      title: "منشی‌ها",
      value: `${toPersianDigits(
        users.filter((user) => user.role === "secretary").length,
      )} نفر`,
      hint: "پرسنل اداری",
      icon: <UserCheck />,
      color: "light-orange",
    },
    {
      id: 4,
      title: "کلاس‌های ترم",
      value: `${toPersianDigits(termClassrooms.length)} کلاس`,
      hint: activeTermObj?.is_active ? "ترم فعال جاری" : "ترم انتخابی",
      icon: <CalendarDays />,
      color: "red",
    },
  ];

  return (
    <DashboardLayout
      role="پنل مدیریت"
      title="مدیریت کل آموزشگاه"
      menuType="admin"
    >
      <div className="term-selector-banner">
        <div className="term-banner-info">
          <div className="term-icon-circle">
            <Layers size={22} />
          </div>
          <div className="term-banner-content">
            <h3>
              ترم تحصیلی انتخابی:
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
                ? "آمار و اطلاعات مربوط به ترم فعال جاری در حال نمایش است."
                : activeTermObj
                  ? "اطلاعات مربوط به این ترم بایگانی‌شده در حال نمایش است."
                  : "نمایش کلیه اطلاعات تمامی ترم‌ها"}
            </p>
          </div>
        </div>
        <div className="term-dropdown-wrapper">
          <label htmlFor="admin-term-select">انتخاب ترم</label>

          <select
            id="admin-term-select"
            value={selectedTermId}
            onChange={(event) => setSelectedTermId(event.target.value)}
            className="term-select-input"
          >
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
                {term.is_active ? "(ترم فعال جاری)" : "(به پایان رسیده)"}
              </option>
            ))}

            <option value="all">همه ترم‌ها (مشاهده تجمیعی)</option>
          </select>
        </div>
      </div>
      <div className="admin-panel-x7k2-stats-grid">
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            hint={stat.hint}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>
      <section className="admin-panel-x7k2-section admin-panel-students-section">
        <div className="admin-panel-x7k2-section-header">
          <h3 className="admin-panel-x7k2-section-title">دانش‌آموزان ترم</h3>

          <Link
            to="/panel/admin/students/new"
            className="admin-panel-add-student-link"
          >
            <AnimatedButton variant="primary" icon={<UserPlus size={18} />}>
              افزودن دانش‌آموز جدید
            </AnimatedButton>
          </Link>
        </div>

        <div className="admin-panel-x7k2-table-wrapper">
          <table className="admin-panel-x7k2-table">
            <thead>
              <tr>
                <th>نام</th>
                <th>شماره موبایل</th>
                <th>کلاس</th>
                <th>وضعیت حساب</th>
                <th>عملیات</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5" className="admin-panel-loading-state">
                    در حال دریافت اطلاعات...
                  </td>
                </tr>
              )}

              {!loading && students.length === 0 && (
                <tr>
                  <td colSpan="5" className="admin-panel-empty-state">
                    دانش‌آموزی در این ترم یافت نشد.
                  </td>
                </tr>
              )}

              {!loading &&
                students.map((student) => (
                  <tr key={student.id}>
                    <td data-label="نام">
                      <div className="admin-panel-x7k2-student-name">
                        {student.name}
                      </div>
                    </td>

                    <td data-label="شماره موبایل">
                      <span className="admin-panel-x7k2-student-phone">
                        {student.phone}
                      </span>
                    </td>

                    <td data-label="کلاس">
                      <span className="admin-panel-x7k2-class-badge">
                        {student.className}
                      </span>
                    </td>

                    <td data-label="وضعیت حساب">
                      <span
                        className={`admin-panel-x7k2-status-badge ${student.tuitionStatusClass}`}
                      >
                        {student.tuitionStatus}
                      </span>
                    </td>

                    <td data-label="عملیات">
                      <Link
                        to={`/panel/admin/students/${student.id}`}
                        className="admin-panel-student-action-link"
                      >
                        <AnimatedButton
                          variant="secondary"
                          icon={<Eye size={16} />}
                          size="small"
                        >
                          <span>مشاهده پرونده</span>
                        </AnimatedButton>
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="admin-panel-x7k2-bottom-grid">
        <section className="admin-panel-x7k2-section">
          <div className="admin-panel-x7k2-section-header">
            <h3 className="admin-panel-x7k2-section-title">معلمان و اساتید</h3>

            <Link
              to="/panel/admin/teachers"
              className="admin-panel-section-link"
            >
              <AnimatedButton variant="primary" size="small">
                مدیریت معلمان ←
              </AnimatedButton>
            </Link>
          </div>

          <div className="admin-panel-teachers-list-container">
            {teachers.length === 0 ? (
              <div className="admin-panel-empty-state">مدرسی ثبت نشده است.</div>
            ) : (
              teachers.map((teacher) => (
                <Link
                  key={teacher.id}
                  to={`/panel/admin/teachers/${teacher.id}`}
                  className="admin-panel-teacher-row-card"
                >
                  <div className="admin-panel-teacher-avatar-circle">
                    {teacher.avatar}
                  </div>

                  <div className="admin-panel-teacher-info-col">
                    <h4 className="admin-panel-teacher-name-text">
                      {teacher.name}
                    </h4>

                    <span className="admin-panel-teacher-sub-text">
                      {teacher.specialty}
                    </span>
                  </div>

                  <span className="admin-panel-teacher-classes-pill">
                    {teacher.activeClasses}
                  </span>

                  <ChevronLeft size={16} className="admin-panel-arrow-icon" />
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="admin-panel-x7k2-section">
          <div className="admin-panel-x7k2-section-header">
            <h3 className="admin-panel-x7k2-section-title">کلاس‌های این ترم</h3>

            <Link
              to="/panel/admin/classes"
              className="admin-panel-section-link"
            >
              <AnimatedButton variant="primary" size="small">
                مدیریت کلاس‌ها ←
              </AnimatedButton>
            </Link>
          </div>

          <div className="admin-panel-classes-list-container">
            {schedule.length === 0 ? (
              <div className="admin-panel-empty-state">
                کلاسی در این ترم ثبت نشده است.
              </div>
            ) : (
              schedule.map((item) => (
                <Link
                  key={item.id}
                  to={`/panel/admin/classes/${item.id}`}
                  className="admin-panel-class-row-card"
                >
                  <div className="admin-panel-class-icon-circle">
                    <GraduationCap size={20} />
                  </div>

                  <div className="admin-panel-class-info-col">
                    <h4 className="admin-panel-class-name-text">
                      {item.className}
                    </h4>

                    <span className="admin-panel-class-teacher-text">
                      مدرس: {item.teacher}
                    </span>
                  </div>

                  <div className="admin-panel-class-capacity-badge">
                    {item.capacity}
                  </div>

                  <ChevronLeft size={16} className="admin-panel-arrow-icon" />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default AdminPanel;
