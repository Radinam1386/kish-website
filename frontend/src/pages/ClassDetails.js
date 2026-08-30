import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Users,
  Clock,
  ArrowRight,
  Edit3,
  Trash2,
  AlertCircle,
  ClipboardCheck,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Eye,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName, storage } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

import "./ClassDetails.css";

export default function ClassDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = storage.getUser();
  const userRole = currentUser?.role || "secretary";
  const basePath = `/panel/${userRole === "admin" ? "admin" : userRole === "teacher" ? "teacher" : "secretary"}`;

  const [classroom, setClassroom] = useState(null);
  const [term, setTerm] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [clsData, termsData, usersData, sessionsData, attendanceData] =
          await Promise.all([
            api.classrooms.get(id),
            api.terms.list(),
            api.users.list(),
            api.sessions.list(),
            api.attendance.list(),
          ]);

        if (!alive) return;

        setClassroom(clsData);

        const currentTerm = (termsData || []).find(
          (t) => t.id === clsData.term,
        );
        setTerm(currentTerm);

        const currentTeacher = (usersData || []).find(
          (u) =>
            u.id === clsData.teacher || u.id === clsData.teacher_detail?.id,
        );
        setTeacher(currentTeacher || clsData.teacher_detail);

        const classSessions = (sessionsData || []).filter(
          (s) => s.classroom === Number(id) || s.classroom?.id === Number(id),
        );
        setSessions(classSessions);

        const classSessionIds = classSessions.map((s) => s.id);
        const relevantAttendance = (attendanceData || []).filter((a) =>
          classSessionIds.includes(a.session || a.session?.id),
        );
        setAttendanceRecords(relevantAttendance);
      } catch (err) {
        if (alive) setError(err.message || "خطا در دریافت جزئیات کلاس");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, [id]);

  const enrolledStudents = useMemo(() => {
    if (!classroom?.enrollments) return [];
    return classroom.enrollments.map((e) => {
      const student = e.student_detail || {
        id: e.student,
        username: `کاربر ${e.student}`,
      };
      const studentAttendance = attendanceRecords.filter(
        (a) => a.student === student.id || a.student?.id === student.id,
      );
      const totalAttended = studentAttendance.filter(
        (a) => a.status === "present" || a.status === "late",
      ).length;
      const totalAbsences = studentAttendance.filter(
        (a) => a.status === "absent",
      ).length;
      const attRate =
        studentAttendance.length > 0
          ? Math.round((totalAttended / studentAttendance.length) * 100)
          : 100;

      return {
        ...student,
        fullName: getFullName(student),
        enrollmentId: e.id,
        enrolledAt: e.enrolled_at,
        attendanceCount: totalAttended,
        absentCount: totalAbsences,
        attendanceRate: attRate,
      };
    });
  }, [classroom, attendanceRecords]);

  const overallStats = useMemo(() => {
    const totalStudents = enrolledStudents.length;
    const totalSessions = sessions.length;
    const totalPresent = attendanceRecords.filter(
      (a) => a.status === "present" || a.status === "late",
    ).length;
    const rate =
      attendanceRecords.length > 0
        ? Math.round((totalPresent / attendanceRecords.length) * 100)
        : 100;

    return {
      totalStudents,
      totalSessions,
      overallAttendanceRate: rate,
    };
  }, [enrolledStudents, sessions, attendanceRecords]);

  const handleDeleteClass = async () => {
    if (
      !window.confirm(
        "آیا از حذف این کلاس اطمینان دارید؟ تمامی ثبت‌نام‌ها حذف خواهند شد.",
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      await api.classrooms.delete(id);
      navigate(`${basePath}/classes`);
    } catch (err) {
      alert(err.message || "خطا در حذف کلاس");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        role={
          userRole === "admin"
            ? "پنل مدیریت"
            : userRole === "teacher"
              ? "پنل معلم"
              : "پنل منشی"
        }
        title="جزئیات کلاس"
        menuType={
          userRole === "admin"
            ? "admin"
            : userRole === "teacher"
              ? "teacher"
              : "secretary"
        }
      >
        <div style={{ textAlign: "center", padding: "4rem" }}>
          در حال بارگذاری اطلاعات کلاس...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !classroom) {
    return (
      <DashboardLayout
        role={
          userRole === "admin"
            ? "پنل مدیریت"
            : userRole === "teacher"
              ? "پنل معلم"
              : "پنل منشی"
        }
        title="جزئیات کلاس"
        menuType={
          userRole === "admin"
            ? "admin"
            : userRole === "teacher"
              ? "teacher"
              : "secretary"
        }
      >
        <div className="class-details-page">
          <div className="class-form-alert error">
            <AlertCircle size={18} />
            <span>{error || "کلاس مورد نظر یافت نشد."}</span>
          </div>
          <Link to={`${basePath}/classes`}>
            <AnimatedButton variant="secondary">
              <ArrowRight size={16} />
              بازگشت به کلاس‌ها
            </AnimatedButton>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role={
        userRole === "admin"
          ? "پنل مدیریت"
          : userRole === "teacher"
            ? "پنل معلم"
            : "پنل منشی"
      }
      title={`جزئیات ${classroom.name}`}
      menuType={
        userRole === "admin"
          ? "admin"
          : userRole === "teacher"
            ? "teacher"
            : "secretary"
      }
    >
      <div className="class-details-page">
        <div className="class-details-header">
          <div className="class-details-title-box">
            <Link to={`${basePath}/classes`}>
              <AnimatedButton variant="secondary" size="small">
                <ArrowRight size={16} />
              </AnimatedButton>
            </Link>
            <div className="class-details-badge-icon">
              <BookOpen size={28} />
            </div>
            <div>
              <div className="class-title-row">
                <h2>{classroom.name}</h2>
                <span
                  className={`term-status-pill ${term?.is_active ? "active" : "inactive"}`}
                >
                  {term?.is_active ? "ترم جاری (فعال)" : "پایان‌یافته"}
                </span>
              </div>
              <p className="class-term-name">
                <Calendar size={14} />
                ترم: {term?.name || "نامشخص"} | تاریخ شروع:{" "}
                {toJalaliDateString(term?.start_date)}
              </p>
            </div>
          </div>

          <div className="class-details-header-actions">
            {userRole === "teacher" ? (
              <Link to={`/panel/teacher/attendance/${classroom.id}`}>
                <AnimatedButton variant="primary" size="small">
                  <ClipboardCheck size={16} />
                  ثبت حضور و غیاب
                </AnimatedButton>
              </Link>
            ) : (
              <>
                <Link to={`${basePath}/classes/${classroom.id}/edit`}>
                  <AnimatedButton variant="primary" size="small">
                    <Edit3 size={16} />
                    ویرایش کلاس
                  </AnimatedButton>
                </Link>

                <AnimatedButton
                  variant="danger"
                  size="small"
                  onClick={handleDeleteClass}
                  disabled={deleting}
                >
                  <Trash2 size={16} />
                  {deleting ? "در حال حذف..." : "حذف کلاس"}
                </AnimatedButton>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="class-details-stats-grid">
          <StatCard
            title="تعداد دانش‌آموزان"
            value={`${toPersianDigits(overallStats.totalStudents)} نفر`}
            icon={<Users size={24} />}
            color="blue"
          />
          <StatCard
            title="جلسات برگزار شده"
            value={`${toPersianDigits(overallStats.totalSessions)} جلسه`}
            icon={<Calendar size={24} />}
            color="green"
          />
          <StatCard
            title="میانگین حضور کلاس"
            value={`${toPersianDigits(overallStats.overallAttendanceRate)}٪`}
            icon={<UserCheck size={24} />}
            color="orange"
          />
          <StatCard
            title="وضعیت ترم"
            value={term?.is_active ? "فعال" : "خاتمه یافته"}
            icon={<Clock size={24} />}
            color="red"
          />
        </div>

        {/* Main Grid: Teacher info & Student table */}
        <div className="class-details-main-grid">
          {/* Teacher Profile Card */}
          <div className="class-card teacher-info-card">
            <h4 className="card-heading">
              <GraduationCap size={18} />
              مدرس کلاس
            </h4>

            {teacher ? (
              <div className="teacher-profile-body">
                <div className="teacher-avatar">
                  {getFullName(teacher).charAt(0) || "م"}
                </div>
                <h3 className="teacher-name">{getFullName(teacher)}</h3>
                <span className="teacher-role-badge">
                  استاد رسمی آموزشگاه کیش
                </span>

                <div className="teacher-contacts">
                  <div className="contact-item">
                    <Phone size={14} />
                    <span>{teacher.phone_number || "شماره ثبت نشده"}</span>
                  </div>
                  <div className="contact-item">
                    <Mail size={14} />
                    <span>{teacher.email || "ایمیل ثبت نشده"}</span>
                  </div>
                </div>

                {userRole === "admin" && (
                  <Link
                    to={`/panel/admin/teachers/${teacher.id}`}
                    className="view-teacher-link"
                  >
                    مشاهده پروفایل کامل استاد
                  </Link>
                )}
              </div>
            ) : (
              <div className="no-teacher-assigned">
                استادی برای این کلاس تعیین نشده است.
              </div>
            )}
          </div>

          {/* Enrolled Students Table */}
          <div className="class-card enrolled-students-card">
            <div className="enrolled-students-header">
              <h4 className="card-heading">
                <Users size={18} />
                دانش‌آموزان ثبت‌نامی ({toPersianDigits(
                  enrolledStudents.length,
                )}{" "}
                نفر)
              </h4>

              {userRole !== "teacher" && (
                <Link to={`${basePath}/classes/${classroom.id}/edit`}>
                  <button type="button" className="add-student-shortcut-btn">
                    + مدیریت ثبت‌نامی‌ها
                  </button>
                </Link>
              )}
            </div>

            {enrolledStudents.length > 0 ? (
              <div className="enrolled-table-wrap">
                <table className="enrolled-table">
                  <thead>
                    <tr>
                      <th>دانش‌آموز</th>
                      <th>شماره تماس</th>
                      <th>تاریخ عضویت</th>
                      <th>درصد حضور</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map((st) => (
                      <tr key={st.id}>
                        <td>
                          <div className="student-row-info">
                            <div className="student-small-avatar">
                              {st.fullName.charAt(0)}
                            </div>
                            <div>
                              <strong>{st.fullName}</strong>
                              <small>نام کاربری: {st.username}</small>
                            </div>
                          </div>
                        </td>
                        <td>{st.phone_number || "-"}</td>
                        <td>{toJalaliDateString(st.enrolledAt)}</td>
                        <td>
                          <span
                            className={`att-pill ${
                              st.attendanceRate >= 80
                                ? "high"
                                : st.attendanceRate >= 50
                                  ? "medium"
                                  : "low"
                            }`}
                          >
                            {toPersianDigits(st.attendanceRate)}٪
                          </span>
                        </td>
                        <td>
                          <Link
                            to={
                              userRole === "teacher"
                                ? `/panel/teacher/students`
                                : `${basePath}/students/${st.id}`
                            }
                          >
                            <AnimatedButton variant="secondary" size="small">
                              <Eye size={14} />
                              مشاهده
                            </AnimatedButton>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-students-box">
                <Users size={36} />
                <p>هنوز دانش‌آموزی در این کلاس ثبت‌نام نشده است.</p>
                {userRole !== "teacher" && (
                  <Link to={`${basePath}/classes/${classroom.id}/edit`}>
                    <AnimatedButton variant="primary" size="small">
                      ثبت‌نام اولین دانش‌آموز
                    </AnimatedButton>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Held Sessions History Table */}
        <div className="class-card sessions-history-card">
          <h4 className="card-heading">
            <Calendar size={18} />
            تاریخچه جلسات برگزار شده ({toPersianDigits(sessions.length)} جلسه)
          </h4>

          {sessions.length > 0 ? (
            <div className="sessions-table-wrap">
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>جلسه</th>
                    <th>تاریخ برگزاری (شمسی)</th>
                    <th>حاضرین</th>
                    <th>غایبین</th>
                    <th>تأخیر / موجه</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, idx) => {
                    const sessionAtt = attendanceRecords.filter(
                      (a) => a.session === s.id || a.session?.id === s.id,
                    );
                    const present = sessionAtt.filter(
                      (a) => a.status === "present",
                    ).length;
                    const absent = sessionAtt.filter(
                      (a) => a.status === "absent",
                    ).length;
                    const other = sessionAtt.filter(
                      (a) => a.status === "late" || a.status === "excused",
                    ).length;

                    return (
                      <tr key={s.id}>
                        <td>
                          <strong>
                            جلسه {toPersianDigits(sessions.length - idx)}
                          </strong>
                        </td>
                        <td>
                          <span className="shamsi-date-tag">
                            <Calendar size={13} />
                            {toJalaliDateString(s.date)}
                          </span>
                        </td>
                        <td>
                          <span className="present-count">
                            <UserCheck size={14} /> {toPersianDigits(present)}{" "}
                            نفر
                          </span>
                        </td>
                        <td>
                          <span className="absent-count">
                            <UserX size={14} /> {toPersianDigits(absent)} نفر
                          </span>
                        </td>
                        <td>{toPersianDigits(other)} نفر</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-sessions-box">
              <Clock size={36} />
              <p>هنوز جلسه‌ای برای این کلاس ثبت نشده است.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
