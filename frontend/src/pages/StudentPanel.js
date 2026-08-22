import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, CreditCard, FileText } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import "./StudentPanel.css";
import { api, getFullName } from "../services/api";

function StudentPanel() {
  const [classrooms, setClassrooms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        const [classroomsData, sessionsData, submissionsData] =
          await Promise.all([
            api.classrooms.list(),
            api.sessions.list(),
            api.submissions.list(),
          ]);

        if (!alive) return;
        setClassrooms(classroomsData);
        setSessions(sessionsData);
        setSubmissions(submissionsData);
      } catch {
        if (alive) {
          setClassrooms([]);
          setSessions([]);
          setSubmissions([]);
        }
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const scheduleData = useMemo(
    () =>
      classrooms.map((classroom) => ({
        day: classroom.created_at?.slice(0, 10) || "-",
        time: "-",
        class: classroom.name,
        teacher: getFullName(classroom.teacher_detail),
        status: "فعال",
      })),
    [classrooms],
  );

  const latestGrade = submissions.find(
    (item) => item.total_score !== null && item.total_score !== undefined,
  );

  return (
    <DashboardLayout role="پنل دانش‌آموز" title="داشبورد من" menuType="student">
      <div className="student-panel-stats-grid">
        <StatCard
          title="کلاس فعال"
          value={classrooms[0]?.name || "-"}
          hint="ترم جاری"
          icon={<BookOpen />}
          color="red"
        />

        <StatCard
          title="جلسات باقی‌مانده"
          value={`${sessions.length} جلسه`}
          hint="ثبت‌شده"
          icon={<CalendarDays />}
          color="blue"
        />

        <StatCard
          title="وضعیت شهریه"
          value="ثبت نشده"
          hint="در بک‌اند مدل ندارد"
          icon={<CreditCard />}
          color="orange"
        />

        <StatCard
          title="نمرات"
          value={latestGrade?.total_score ?? "-"}
          hint="آخرین نمره ثبت‌شده"
          icon={<FileText />}
          color="green"
        />
      </div>

      <div className="student-panel-content-grid">
        <section className="student-panel-data-card">
          <h3 className="student-panel-section-title">برنامه کلاس‌ها</h3>

          <div className="student-panel-list-wrapper">
            {scheduleData.map((item, index) => (
              <div
                key={`${item.day}-${index}`}
                className="student-panel-list-item"
              >
                <div className="student-panel-list-item-main">
                  <span className="student-panel-list-item-date">
                    {item.day}
                  </span>

                  <span className="student-panel-list-item-title">
                    {item.class}
                  </span>
                </div>

                <div className="student-panel-list-item-sub">
                  <span className="student-panel-badge-time">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="student-panel-data-card">
          <h3 className="student-panel-section-title">آخرین نمرات</h3>

          <div className="student-panel-list-wrapper">
            <div className="student-panel-list-item">
              <div className="student-panel-list-item-main">
                <span className="student-panel-list-item-date">۱۴۰۵/۰۴/۱۵</span>

                <span className="student-panel-list-item-title">
                  Midterm Exam
                </span>
              </div>

                <span className="student-panel-score-badge">
                  {latestGrade?.total_score ?? "-"}
                </span>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default StudentPanel;
