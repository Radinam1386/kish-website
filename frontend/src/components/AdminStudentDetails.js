import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  User,
  Phone,
  BookOpen,
  CreditCard,
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

import "./AdminStudentDetails.css";

function AdminStudentDetails() {
  const { id } = useParams();

  const [student, setStudent] = useState({
    id,
    name: "علی محمدی",
    phone: "۰۹۱۲۳۴۵۶۷۸۹",
    studentCode: "ST-10024",
    avatar: "ع",
    age: 18,
    gender: "آقا",
    className: "English A2",
    level: "Elementary",
    teacher: "خانم رضایی",
    classDays: "شنبه / دوشنبه",
    classTime: "۱۷:۰۰",
    semester: "ترم پاییز ۱۴۰۵",
    tuition: {
      total: 4500000,
      paid: 4500000,
      remaining: 0,
      status: "paid",
    },
    attendance: {
      total: 20,
      present: 17,
      absent: 2,
      late: 1,
    },
    sessions: {
      held: 12,
      remaining: 8,
      total: 20,
    },
    payments: [
      {
        id: 1,
        title: "شهریه ترم پاییز",
        amount: 4500000,
        date: "۱۴۰۵/۰۵/۱۰",
        status: "paid",
      },
    ],
    attendanceHistory: [
      {
        id: 1,
        date: "۱۴۰۵/۰۵/۲۲",
        day: "شنبه",
        status: "present",
      },
      {
        id: 2,
        date: "۱۴۰۵/۰۵/۲۴",
        day: "دوشنبه",
        status: "present",
      },
      {
        id: 3,
        date: "۱۴۰۵/۰۵/۲۹",
        day: "شنبه",
        status: "late",
      },
      {
        id: 4,
        date: "۱۴۰۵/۰۵/۳۱",
        day: "دوشنبه",
        status: "absent",
      },
    ],
  });

  const [isEditing, setIsEditing] = useState(false);

  const attendancePercent = useMemo(() => {
    if (!student.attendance.total) return 0;

    return Math.round(
      (student.attendance.present / student.attendance.total) * 100,
    );
  }, [student.attendance]);

  const sessionPercent = useMemo(() => {
    if (!student.sessions.total) return 0;

    return Math.round((student.sessions.held / student.sessions.total) * 100);
  }, [student.sessions]);

  const formatPrice = (value) => {
    return new Intl.NumberFormat("fa-IR").format(value);
  };

  const handleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  return (
    <DashboardLayout
      role="پنل مدیریت"
      title="جزئیات دانش‌آموز"
      menuType="admin"
    >
      <div className="admin-student-details-x9p4-root">
        <div className="admin-student-details-x9p4-page-header">
          <div className="admin-student-details-x9p4-header-content">
            <Link
              to="/panel/admin/students"
              className="admin-student-details-x9p4-back-link"
            >
              <ArrowRight size={18} />
              بازگشت به لیست دانش‌آموزان
            </Link>

            <div className="admin-student-details-x9p4-heading">
              <div className="admin-student-details-x9p4-avatar">
                {student.avatar}
              </div>

              <div>
                <h2>{student.name}</h2>

                <div className="admin-student-details-x9p4-subtitle">
                  <span>کد دانش‌آموزی: {student.studentCode}</span>

                  <span className="admin-student-details-x9p4-dot">•</span>

                  <span>{student.className}</span>
                </div>
              </div>
            </div>
          </div>
          <Link to={`/panel/secretary/students/:${student.id}/edit`}>
            <AnimatedButton variant="primary" onClick={handleEdit}>
              <Edit3 size={17} />
              {isEditing ? "ذخیره اطلاعات" : "ویرایش اطلاعات"}
            </AnimatedButton>
          </Link>
        </div>
        <div className="admin-student-details-x9p4-stats">
          <StatCard
            title="درصد حضور"
            value={`${attendancePercent}٪`}
            hint={`${student.attendance.present} حضور از ${student.attendance.total} جلسه`}
            icon={<ClipboardCheck />}
            color="green"
          />

          <StatCard
            title="جلسات برگزار شده"
            value={`${student.sessions.held} جلسه`}
            hint={`${student.sessions.remaining} جلسه باقی‌مانده`}
            icon={<CalendarDays />}
            color="blue"
          />

          <StatCard
            title="وضعیت شهریه"
            value={
              student.tuition.status === "paid" ? "پرداخت شده" : "در انتظار"
            }
            hint={
              student.tuition.remaining === 0
                ? "تسویه کامل"
                : `${formatPrice(student.tuition.remaining)} تومان باقی‌مانده`
            }
            icon={<CreditCard />}
            color="red"
          />

          <StatCard
            title="کلاس فعلی"
            value={student.className}
            hint={student.teacher}
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
                <strong>{student.name}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <Phone size={19} />
              </div>

              <div>
                <span>شماره تماس</span>
                <strong className="admin-student-details-x9p4-phone">
                  {student.phone}
                </strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <Users size={19} />
              </div>

              <div>
                <span>جنسیت</span>
                <strong>{student.gender}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <CalendarDays size={19} />
              </div>

              <div>
                <span>سن</span>
                <strong>{student.age} سال</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <BookOpen size={19} />
              </div>

              <div>
                <span>کلاس</span>
                <strong>{student.className}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <User size={19} />
              </div>

              <div>
                <span>استاد</span>
                <strong>{student.teacher}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <CalendarDays size={19} />
              </div>

              <div>
                <span>روزهای کلاس</span>
                <strong>{student.classDays}</strong>
              </div>
            </div>

            <div className="admin-student-details-x9p4-info-card">
              <div className="admin-student-details-x9p4-info-icon">
                <Clock3 size={19} />
              </div>

              <div>
                <span>ساعت کلاس</span>
                <strong>{student.classTime}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================
            Tuition
        ====================================== */}

        <section className="admin-student-details-x9p4-section">
          <div className="admin-student-details-x9p4-section-header">
            <div>
              <h3 className="admin-student-details-x9p4-title">وضعیت شهریه</h3>

              <p className="admin-student-details-x9p4-description">
                وضعیت پرداخت شهریه ترم جاری
              </p>
            </div>

            <span
              className={`admin-student-details-x9p4-status ${
                student.tuition.status === "paid" ? "paid" : "pending"
              }`}
            >
              {student.tuition.status === "paid"
                ? "تسویه شده"
                : "در انتظار پرداخت"}
            </span>
          </div>

          <div className="admin-student-details-x9p4-tuition-grid">
            <div>
              <span>مبلغ کل</span>
              <strong>{formatPrice(student.tuition.total)} تومان</strong>
            </div>

            <div>
              <span>پرداخت شده</span>
              <strong className="paid-text">
                {formatPrice(student.tuition.paid)} تومان
              </strong>
            </div>

            <div>
              <span>باقی‌مانده</span>
              <strong className="remaining-text">
                {formatPrice(student.tuition.remaining)} تومان
              </strong>
            </div>
          </div>

          <div className="admin-student-details-x9p4-progress">
            <div
              className="admin-student-details-x9p4-progress-fill"
              style={{
                width: `${
                  student.tuition.total
                    ? (student.tuition.paid / student.tuition.total) * 100
                    : 0
                }%`,
              }}
            />
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
              {attendancePercent}٪ حضور
            </span>
          </div>

          <div className="admin-student-details-x9p4-attendance-grid">
            <div className="admin-student-details-x9p4-attendance-card good">
              <CheckCircle2 size={22} />

              <span>حضور</span>

              <strong>{student.attendance.present}</strong>
            </div>

            <div className="admin-student-details-x9p4-attendance-card warning">
              <Clock3 size={22} />

              <span>تاخیر</span>

              <strong>{student.attendance.late}</strong>
            </div>

            <div className="admin-student-details-x9p4-attendance-card danger">
              <AlertCircle size={22} />

              <span>غیبت</span>

              <strong>{student.attendance.absent}</strong>
            </div>
          </div>

          <div className="admin-student-details-x9p4-progress">
            <div
              className="admin-student-details-x9p4-progress-fill"
              style={{
                width: `${attendancePercent}%`,
              }}
            />
          </div>
        </section>

        {/* =====================================
            Term Progress
        ====================================== */}

        <section className="admin-student-details-x9p4-section">
          <div className="admin-student-details-x9p4-section-header">
            <div>
              <h3 className="admin-student-details-x9p4-title">پیشرفت ترم</h3>

              <p className="admin-student-details-x9p4-description">
                میزان جلسات برگزار شده و باقی‌مانده
              </p>
            </div>

            <span className="admin-student-details-x9p4-capacity">
              {sessionPercent}٪
            </span>
          </div>

          <div className="admin-student-details-x9p4-session-info">
            <div>
              <span>برگزار شده</span>
              <strong>{student.sessions.held} جلسه</strong>
            </div>

            <div>
              <span>باقی‌مانده</span>
              <strong>{student.sessions.remaining} جلسه</strong>
            </div>

            <div>
              <span>کل ترم</span>
              <strong>{student.sessions.total} جلسه</strong>
            </div>
          </div>

          <div className="admin-student-details-x9p4-progress">
            <div
              className="admin-student-details-x9p4-progress-fill"
              style={{
                width: `${sessionPercent}%`,
              }}
            />
          </div>
        </section>

        {/* =====================================
            Payment History
        ====================================== */}

        <section className="admin-student-details-x9p4-section">
          <div className="admin-student-details-x9p4-section-header">
            <div>
              <h3 className="admin-student-details-x9p4-title">سابقه پرداخت</h3>

              <p className="admin-student-details-x9p4-description">
                سوابق مالی دانش‌آموز
              </p>
            </div>
          </div>

          <div className="admin-student-details-x9p4-table-wrapper">
            <table className="admin-student-details-x9p4-table">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>مبلغ</th>
                  <th>تاریخ</th>
                  <th>وضعیت</th>
                </tr>
              </thead>

              <tbody>
                {student.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label="عنوان">{payment.title}</td>

                    <td data-label="مبلغ">
                      {formatPrice(payment.amount)} تومان
                    </td>

                    <td data-label="تاریخ">{payment.date}</td>

                    <td data-label="وضعیت">
                      <span className="admin-student-details-x9p4-payment-status">
                        <CheckCircle2 size={15} />
                        پرداخت شده
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                آخرین وضعیت حضور و غیاب
              </p>
            </div>
          </div>

          <div className="admin-student-details-x9p4-table-wrapper">
            <table className="admin-student-details-x9p4-table">
              <thead>
                <tr>
                  <th>تاریخ</th>
                  <th>روز</th>
                  <th>وضعیت</th>
                </tr>
              </thead>

              <tbody>
                {student.attendanceHistory.map((item) => (
                  <tr key={item.id}>
                    <td data-label="تاریخ">{item.date}</td>

                    <td data-label="روز">{item.day}</td>

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
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default AdminStudentDetails;
