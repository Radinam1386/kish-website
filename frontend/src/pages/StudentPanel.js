import {
  BookOpen,
  CalendarDays,
  CreditCard,
  FileText,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import "./StudentPanel.css";

function StudentPanel() {
  const scheduleData = [
    {
      day: "شنبه",
      time: "۱۶:۰۰ - ۱۸:۰۰",
      class: "English A2",
      teacher: "خانم رضایی",
      status: "فعال",
    },
    {
      day: "دوشنبه",
      time: "۱۶:۰۰ - ۱۸:۰۰",
      class: "English A2",
      teacher: "خانم رضایی",
      status: "فعال",
    },
  ];

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title="داشبورد من"
      menuType="student"
    >
      <div className="student-panel-stats-grid">
        <StatCard
          title="کلاس فعال"
          value="English A2"
          hint="ترم جاری"
          icon={<BookOpen />}
        />

        <StatCard
          title="جلسات باقی‌مانده"
          value="۸ جلسه"
          hint="از ۲۰ جلسه"
          icon={<CalendarDays />}
        />

        <StatCard
          title="وضعیت شهریه"
          value="پرداخت شده"
          hint="بدون بدهی"
          icon={<CreditCard />}
        />

        <StatCard
          title="نمرات"
          value="۱۷.۵"
          hint="میان‌ترم"
          icon={<FileText />}
        />
      </div>

      <div className="student-panel-content-grid">
        <section className="student-panel-data-card">
          <h3 className="student-panel-section-title">
            برنامه کلاس‌ها
          </h3>

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
                  <span className="student-panel-badge-time">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="student-panel-data-card">
          <h3 className="student-panel-section-title">
            آخرین نمرات
          </h3>

          <div className="student-panel-list-wrapper">
            <div className="student-panel-list-item">
              <div className="student-panel-list-item-main">
                <span className="student-panel-list-item-date">
                  ۱۴۰۵/۰۴/۱۵
                </span>

                <span className="student-panel-list-item-title">
                  Midterm Exam
                </span>
              </div>

              <span className="student-panel-score-badge">
                ۱۷.۵
              </span>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default StudentPanel;
