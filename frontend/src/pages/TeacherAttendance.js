import { useParams } from "react-router-dom";
import { Save, Users, Calendar, Hash, UserCircle } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import "./TeacherAttendance.css";
import StatCard from "../components/StatCard";

function TeacherAttendance() {
  const { classId } = useParams();

  const students = [
    {
      id: 1,
      name: "علی محمدی",
      phone: "09120000000",
      level: "A2",
    },
    {
      id: 2,
      name: "سارا احمدی",
      phone: "09121111111",
      level: "A2",
    },
    {
      id: 3,
      name: "محمد کریمی",
      phone: "09122222222",
      level: "A2",
    },
    {
      id: 4,
      name: "نگار رضایی",
      phone: "09123333333",
      level: "A2",
    },
  ];

  return (
    <DashboardLayout
      role="پنل معلم"
      title="حضور و غیاب کلاس"
      menuType="teacher"
    >
      <div className="teacher-attendance-q9m4-root">
        <section className="teacher-attendance-q9m4-section">
          <div className="teacher-attendance-q9m4-section-head">
            <div className="teacher-attendance-q9m4-heading">
              <div className="teacher-attendance-q9m4-avatar">
                <Users size={24} />
              </div>

              <div className="teacher-attendance-q9m4-heading-content">
                <h3 className="teacher-attendance-q9m4-title">
                  مدیریت حضور و غیاب
                </h3>

                <p className="teacher-attendance-q9m4-class-code">
                  کد سیستمی کلاس: {classId}
                </p>
              </div>
            </div>

            <AnimatedButton variant="danger" icon={<Save size={18} />}>
              ثبت نهایی لیست
            </AnimatedButton>
          </div>

          <div className="teacher-attendance-q9m4-meta-grid">
            <StatCard
              title="نام کلاس"
              value="English A2"
              icon={<Hash size={23} />}
            />
            <StatCard
              title="تاریخ جلسه"
              value="۱۴۰۵/۰۹/۲۰"
              icon={<Calendar size={23} />}
            />
            <StatCard
              title="شماره جلسه"
              value="جلسه ۱۲"
              icon={<Hash size={23} />}
            />
            <StatCard
              title="استاد مربوطه"
              value="خانم رضایی"
              icon={<UserCircle size={23} />}
            />
          </div>
        </section>

        <section className="teacher-attendance-q9m4-section">
          <div className="teacher-attendance-q9m4-section-head teacher-attendance-q9m4-list-head">
            <h3 className="teacher-attendance-q9m4-title">لیست دانش‌آموزان</h3>

            <span className="teacher-attendance-q9m4-count-badge">
              تعداد: {students.length} نفر
            </span>
          </div>

          <div className="teacher-attendance-q9m4-table-shell">
            <div className="teacher-attendance-q9m4-table-scroll">
              <table className="teacher-attendance-q9m4-table">
                <thead>
                  <tr>
                    <th>نام دانش‌آموز</th>
                    <th>شماره موبایل</th>
                    <th>سطح</th>
                    <th className="teacher-attendance-q9m4-status-column">
                      وضعیت حضور
                    </th>
                    <th>توضیحات تکمیلی</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="teacher-attendance-q9m4-student-name">
                          {student.name}
                        </div>
                      </td>

                      <td>
                        <span className="teacher-attendance-q9m4-phone">
                          {student.phone}
                        </span>
                      </td>

                      <td>
                        <span className="teacher-attendance-q9m4-level-badge">
                          {student.level}
                        </span>
                      </td>

                      <td>
                        <select className="teacher-attendance-q9m4-select">
                          <option value="present">حاضر</option>
                          <option value="absent">غایب</option>
                          <option value="late">تاخیر</option>
                        </select>
                      </td>

                      <td>
                        <input
                          className="teacher-attendance-q9m4-input"
                          type="text"
                          placeholder="مثلاً: تاخیر با هماهنگی..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default TeacherAttendance;
