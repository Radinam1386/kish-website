import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  User,
  Phone,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ArrowRight,
  Edit3,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Users,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";

import "./AdminStudentDetails.css";

function AdminStudentDetails() {
  const { id } = useParams();
  const location = useLocation();
  const isSecretary = location.pathname.includes("/secretary/");

  const [studentUser, setStudentUser] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        setError("");
        const [userData, enrollmentsData, classroomsData, attendanceData, sessionsData] =
          await Promise.all([
            api.users.get(id),
            api.enrollments.list(),
            api.classrooms.list(),
            api.attendance.list(),
            api.sessions.list(),
          ]);

        if (!alive) return;

        setStudentUser(userData);

        const studentEnrollment = (enrollmentsData || []).find(
          (enr) => enr.student === Number(id) || enr.student?.id === Number(id),
        );
        if (studentEnrollment) {
          const cls = (classroomsData || []).find(
            (c) => c.id === studentEnrollment.classroom,
          );
          setClassroom(cls || null);
        }

        const studentRecords = (attendanceData || []).filter(
          (rec) => rec.student === Number(id) || rec.student?.id === Number(id),
        );
        setAttendanceRecords(studentRecords);
        setSessions(sessionsData || []);
      } catch (err) {
        if (alive) setError(err.message || "دریافت اطلاعات دانش‌آموز ناموفق بود.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, [id]);

  const attendanceStats = useMemo(() => {
    const present = attendanceRecords.filter(
      (rec) => rec.status === "present",
    ).length;
    const late = attendanceRecords.filter(
      (rec) => rec.status === "late",
    ).length;
    const absent = attendanceRecords.filter(
      (rec) => rec.status === "absent",
    ).length;
    const excused = attendanceRecords.filter(
      (rec) => rec.status === "excused",
    ).length;
    const total = attendanceRecords.length;

    const percent = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return {
      present,
      late,
      absent,
      excused,
      total,
      percent,
    };
  }, [attendanceRecords]);

  const attendanceHistory = useMemo(() => {
    return attendanceRecords.map((rec) => {
      const session = sessions.find((s) => s.id === rec.session);
      return {
        id: rec.id,
        date: session?.date || "-",
        day: session?.date ? "جلسه" : "-",
        status: rec.status,
        note: rec.note || "",
      };
    });
  }, [attendanceRecords, sessions]);

  const backUrl = isSecretary ? "/panel/secretary/students" : "/panel/admin/students";
  const editUrl = isSecretary
    ? `/panel/secretary/students/${id}/edit`
    : `/panel/admin/students/${id}/edit`;
  const menuType = isSecretary ? "secretary" : "admin";
  const roleName = isSecretary ? "پنل منشی" : "پنل مدیریت";

  const studentName = getFullName(studentUser);

  if (loading) {
    return (
      <DashboardLayout role={roleName} title="جزئیات دانش‌آموز" menuType={menuType}>
        <div className="admin-student-details-x9p4-root" style={{ padding: "2rem", textAlign: "center" }}>
          در حال بارگذاری اطلاعات دانش‌آموز...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !studentUser) {
    return (
      <DashboardLayout role={roleName} title="جزئیات دانش‌آموز" menuType={menuType}>
        <div className="admin-student-details-x9p4-root" style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--danger, #ef4444)", marginBottom: "1rem" }}>{error || "دانش‌آموز یافت نشد."}</p>
          <Link to={backUrl}>
            <AnimatedButton variant="primary">بازگشت به لیست</AnimatedButton>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role={roleName}
      title="جزئیات دانش‌آموز"
      menuType={menuType}
    >
      <div className="admin-student-details-x9p4-root">
        <div className="admin-student-details-x9p4-page-header">
          <div className="admin-student-details-x9p4-header-content">
            <Link
              to={backUrl}
              className="admin-student-details-x9p4-back-link"
            >
              <ArrowRight size={18} />
              بازگشت به لیست دانش‌آموزان
            </Link>

            <div className="admin-student-details-x9p4-heading">
              <div className="admin-student-details-x9p4-avatar">
                {studentName.charAt(0)}
              </div>

              <div>
                <h2>{studentName}</h2>

                <div className="admin-student-details-x9p4-subtitle">
                  <span>شناسه کاربری: {studentUser.username}</span>

                  <span className="admin-student-details-x9p4-dot">•</span>

                  <span>{classroom?.name || "بدون کلاس"}</span>
                </div>
              </div>
            </div>
          </div>
          <Link to={editUrl}>
            <AnimatedButton variant="primary">
              <Edit3 size={17} />
              ویرایش اطلاعات
            </AnimatedButton>
          </Link>
        </div>

        <div className="admin-student-details-x9p4-stats">
          <StatCard
            title="درصد حضور"
            value={`${attendanceStats.percent}٪`}
            hint={`${attendanceStats.present} حضور از ${attendanceStats.total} جلسه`}
            icon={<ClipboardCheck />}
            color="green"
          />

          <StatCard
            title="جلسات ثبت‌شده"
            value={`${attendanceStats.total} جلسه`}
            hint="سوابق کلاسی"
            icon={<CalendarDays />}
            color="blue"
          />

          <StatCard
            title="وضعیت حساب"
            value={studentUser.is_active ? "فعال" : "غیرفعال"}
            hint={studentUser.role === "student" ? "دانش‌آموز" : studentUser.role}
            icon={<User />}
            color="green"
          />

          <StatCard
            title="کلاس فعلی"
            value={classroom?.name || "بدون کلاس"}
            hint={getFullName(classroom?.teacher_detail) || "بدون مدرس"}
            icon={<BookOpen />}
            color="orange"
          />
        </div>

        {/* =====================================
            Main Information
        ====================================== */}

        <section className="admin-student-details-x9p4-section">
          <div className="admin-student-details-x9p4-section-header">
            <div>
              <h3 className="admin-student-details-x9p4-title">
                اطلاعات دانش‌آموز
              </h3>

              <p className="admin-student-details-x9p4-description">
                اطلاعات پایه و مشخصات ثبت‌نام دانش‌آموز
              </p>
            </div>
          </div>

          <div className="admin-student-details-x9p4-info-grid">
            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <User size={19} />
              </div>

              <div>
                <span>نام و نام خانوادگی</span>
                <strong>{studentName}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <Phone size={19} />
              </div>

              <div>
                <span>شماره تماس</span>
                <strong className="admin-student-details-x9p4-phone">
                  {studentUser.phone_number || "-"}
                </strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <Users size={19} />
              </div>

              <div>
                <span>نام کاربری</span>
                <strong>{studentUser.username}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <CalendarDays size={19} />
              </div>

              <div>
                <span>ایمیل</span>
                <strong>{studentUser.email || "-"}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <BookOpen size={19} />
              </div>

              <div>
                <span>کلاس</span>
                <strong>{classroom?.name || "بدون کلاس"}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <User size={19} />
              </div>

              <div>
                <span>استاد</span>
                <strong>{getFullName(classroom?.teacher_detail) || "-"}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <CalendarDays size={19} />
              </div>

              <div>
                <span>ترم</span>
                <strong>{classroom?.term ? `کد ترم: ${classroom.term}` : "-"}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <Clock3 size={19} />
              </div>

              <div>
                <span>وضعیت حساب</span>
                <strong>{studentUser.is_active ? "فعال" : "غیرفعال"}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================
            Attendance
        ====================================== */}

        <section className="admin-student-details-x9p4-section">
          <div className="admin-student-details-x9p4-section-header">
            <div>
              <h3 className="admin-student-details-x9p4-title">
                وضعیت حضور و غیاب
              </h3>

              <p className="admin-student-details-x9p4-description">
                خلاصه عملکرد حضور دانش‌آموز
              </p>
            </div>

            <span className="admin-student-details-x9p4-attendance-percent">
              {attendanceStats.percent}٪ حضور
            </span>
          </div>

          <div className="admin-student-details-x9p4-attendance-grid">
            <div className="admin-student-details-x9p4-attendance-card good">
              <CheckCircle2 size={22} />

              <span>حضور</span>

              <strong>{attendanceStats.present}</strong>
            </div>

            <div className="admin-student-details-x9p4-attendance-card warning">
              <Clock3 size={22} />

              <span>تاخیر</span>

              <strong>{attendanceStats.late}</strong>
            </div>

            <div className="admin-student-details-x9p4-attendance-card danger">
              <AlertCircle size={22} />

              <span>غیبت</span>

              <strong>{attendanceStats.absent}</strong>
            </div>
          </div>

          <div className="admin-student-details-x9p4-progress">
            <div
              className="admin-student-details-x9p4-progress-fill"
              style={{
                width: `${attendanceStats.percent}%`,
              }}
            />
          </div>
        </section>

        {/* =====================================
            Attendance History
        ====================================== */}

        <section className="admin-student-details-x9p4-section">
          <div className="admin-student-details-x9p4-section-header">
            <div>
              <h3 className="admin-student-details-x9p4-title">سابقه حضور</h3>

              <p className="admin-student-details-x9p4-description">
                آخرین وضعیت حضور و غیاب ثبت‌شده
              </p>
            </div>
          </div>

          <div className="admin-student-details-x9p4-table-wrapper">
            {attendanceHistory.length > 0 ? (
              <table className="admin-student-details-x9p4-table">
                <thead>
                  <tr>
                    <th>تاریخ</th>
                    <th>وضعیت</th>
                    <th>یادداشت</th>
                  </tr>
                </thead>

                <tbody>
                  {attendanceHistory.map((item) => (
                    <tr key={item.id}>
                      <td data-label="تاریخ">{item.date}</td>

                      <td data-label="وضعیت">
                        <span
                          className={`admin-student-details-x9p4-attendance-status ${item.status}`}
                        >
                          {item.status === "present" && (
                            <>
                              <CheckCircle2 size={15} />
                              حاضر
                            </>
                          )}

                          {item.status === "late" && (
                            <>
                              <Clock3 size={15} />
                              تاخیر
                            </>
                          )}

                          {item.status === "absent" && (
                            <>
                              <AlertCircle size={15} />
                              غایب
                            </>
                          )}

                          {item.status === "excused" && (
                            <>
                              <AlertCircle size={15} />
                              غیبت موجه
                            </>
                          )}
                        </span>
                      </td>

                      <td data-label="یادداشت">{item.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--muted, #888)" }}>
                هنوز سابقه حضور و غیابی برای این دانش‌آموز ثبت نشده است.
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default AdminStudentDetails;
