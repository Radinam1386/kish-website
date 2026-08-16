import {
  BookOpen,
  ClipboardCheck,
  FileText,
  UsersRound,
  PlusCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import "./TeacherPanel.css";
import { AnimatedButton } from "../components/AnimatedButton";

function TeacherPanel() {
  const classes = [
    {
      id: "english-a2",
      name: "English A2",
      students: 14,
      time: "ش/د/چ ۱۶-۱۸",
      held: 12,
      remaining: 8,
    },
    {
      id: "conversation-b1",
      name: "Conversation B1",
      students: 10,
      time: "ی/س ۱۰-۱۲",
      held: 14,
      remaining: 6,
    },
  ];

  const latestExams = [
    {
      id: 1,
      title: "Midterm - Unit 1-3",
      className: "English A2",
      date: "۱۴۰۵/۰۴/۱۵",
      participants: "۱۳ / ۱۴",
      status: "برگزارشده",
      statusClass: "teacher-panel-x7k2-status-done",
    },
    {
      id: 2,
      title: "Speaking Test",
      className: "Conversation B1",
      date: "۱۴۰۵/۰۵/۲۰",
      participants: "—",
      status: "برنامه‌ریزی‌شده",
      statusClass: "teacher-panel-x7k2-status-pending",
    },
  ];

  return (
    <DashboardLayout
      role="پنل معلم"
      title="پنل معلم"
      menuType="teacher"
    >
      <div className="teacher-panel-x7k2-root">
        <div className="teacher-panel-x7k2-stat-grid">
          <StatCard
            title="کلاس‌های فعال"
            value="۲ کلاس"
            hint="این ترم"
            icon={<BookOpen />}
          />

          <StatCard
            title="کل دانش‌آموزان"
            value="۲۴ نفر"
            hint="در کلاس‌های من"
            icon={<UsersRound />}
          />

          <StatCard
            title="حضور ثبت‌شده"
            value="۱۸۶ رکورد"
            hint="این ترم"
            icon={<ClipboardCheck />}
          />

          <StatCard
            title="آزمون‌های ایجادشده"
            value="۵ آزمون"
            hint="این ترم"
            icon={<FileText />}
          />
        </div>

        <section className="teacher-panel-x7k2-section">
          <div className="teacher-panel-x7k2-section-head">
            <h3 className="teacher-panel-x7k2-section-title">
              کلاس‌های من
            </h3>

            <AnimatedButton
              variant="danger"
              icon={<PlusCircle size={18} />}
            >
              <Link
                to="/panel/teacher/create-exam"
                className="teacher-panel-x7k2-action-link"
              >
                ایجاد آزمون
              </Link>
            </AnimatedButton>
          </div>

          <div className="teacher-panel-x7k2-table-shell">
            <div className="teacher-panel-x7k2-table-scroll">
              <table className="teacher-panel-x7k2-table">
                <thead>
                  <tr>
                    <th>نام کلاس</th>
                    <th>دانش‌آموزان</th>
                    <th>زمان</th>
                    <th>تشکیل‌شده</th>
                    <th>باقی‌مانده</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id}>
                      <td>
                        <span className="teacher-panel-x7k2-class-tag teacher-panel-x7k2-class-tag--highlight">
                          {cls.name}
                        </span>
                      </td>

                      <td>
                        <span className="teacher-panel-x7k2-count">
                          {cls.students} نفر
                        </span>
                      </td>

                      <td>
                        <span className="teacher-panel-x7k2-time">
                          {cls.time}
                        </span>
                      </td>

                      <td>{cls.held} جلسه</td>

                      <td>
                        <span className="teacher-panel-x7k2-capacity">
                          {cls.remaining} جلسه
                        </span>
                      </td>

                      <td>
                        <AnimatedButton variant="danger">
                          <Link
                            to={`/panel/teacher/attendance/${cls.id}`}
                            className="teacher-panel-x7k2-action-link"
                          >
                            حضور و غیاب
                          </Link>
                        </AnimatedButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="teacher-panel-x7k2-section">
          <div className="teacher-panel-x7k2-section-head">
            <h3 className="teacher-panel-x7k2-section-title">
              آخرین آزمون‌ها
            </h3>
          </div>

          <div className="teacher-panel-x7k2-table-shell">
            <div className="teacher-panel-x7k2-table-scroll">
              <table className="teacher-panel-x7k2-table">
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>کلاس</th>
                    <th>تاریخ</th>
                    <th>شرکت‌کنندگان</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>

                <tbody>
                  {latestExams.map((exam) => (
                    <tr key={exam.id}>
                      <td>
                        <strong className="teacher-panel-x7k2-exam-title">
                          {exam.title}
                        </strong>
                      </td>

                      <td>
                        <span className="teacher-panel-x7k2-class-tag">
                          {exam.className}
                        </span>
                      </td>

                      <td>
                        <span className="teacher-panel-x7k2-count">
                          {exam.date}
                        </span>
                      </td>

                      <td>{exam.participants}</td>

                      <td>
                        <span
                          className={`teacher-panel-x7k2-status ${exam.statusClass}`}
                        >
                          {exam.status}
                        </span>
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

export default TeacherPanel;
