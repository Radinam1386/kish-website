import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  BookOpen,
  Phone,
  TrendingUp,
  Award,
  GraduationCap,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import "./TeacherStudents.css";
import StatCard from "../components/StatCard";

function TeacherStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");

  const teacherClasses = [
    {
      id: "all",
      name: "همه کلاس‌ها",
    },
    {
      id: "english-a2",
      name: "English A2 (کلاس ۱۰۲)",
    },
    {
      id: "conversation-b1",
      name: "Conversation B1 (کلاس ۲۰۴)",
    },
  ];

  const studentsData = [
    {
      id: "STD-8821",
      name: "سارا حسینی",
      phone: "۰۹۱۲۳۴۵۶۷۸۹",
      className: "English A2 (کلاس ۱۰۲)",
      classId: "english-a2",
      averageGrade: "۱۸.۵",
      attendanceRate: "۹۵٪",
      status: "فعال",
      statusClass: "active",
    },
    {
      id: "STD-8822",
      name: "امیرمحمد علیزاده",
      phone: "۰۹۳۵۷۶۵۴۳۲۱",
      className: "English A2 (کلاس ۱۰۲)",
      classId: "english-a2",
      averageGrade: "۱۹.۲",
      attendanceRate: "۱۰۰٪",
      status: "فعال",
      statusClass: "active",
    },
    {
      id: "STD-8823",
      name: "فاطمه رضایی",
      phone: "۰۹۱۹۸۷۶۵۴۳۲",
      className: "Conversation B1 (کلاس ۲۰۴)",
      classId: "conversation-b1",
      averageGrade: "۱۶.۸",
      attendanceRate: "۸۸٪",
      status: "فعال",
      statusClass: "active",
    },
    {
      id: "STD-8824",
      name: "محمدامین کریمی",
      phone: "۰۹۱۲۱۱۱۱۱۱۱",
      className: "Conversation B1 (کلاس ۲۰۴)",
      classId: "conversation-b1",
      averageGrade: "۱۴.۰",
      attendanceRate: "۷۵٪",
      status: "مشروط هشدار",
      statusClass: "warning",
    },
  ];

  const filteredStudents = studentsData.filter((student) => {
    const normalizedSearch = searchTerm.trim();

    const matchesSearch =
      student.name.includes(normalizedSearch) ||
      student.id.includes(normalizedSearch) ||
      student.phone.includes(normalizedSearch);

    const matchesClass =
      selectedClass === "all" || student.classId === selectedClass;

    return matchesSearch && matchesClass;
  });

  return (
    <DashboardLayout
      role="پنل مدرس"
      title="مدیریت دانش‌آموزان"
      menuType="teacher"
    >
      <div className="teacher-students-k7p2-root">
        {/* =========================
            Stats
        ========================== */}

        <div className="teacher-students-k7p2-stats">
          <StatCard
            title="کل دانش‌آموزان شما"
            value={`${studentsData.length} نفر`}
            icon={<Users size={23} />}
          />
          <StatCard
            title="میانگین نمرات کلاس‌ها"
            value="۱۷.۱۲"
            icon={<TrendingUp size={23} />}
          />
          <StatCard
            title="دانش‌آموزان ممتاز"
            value="۲ نفر"
            icon={<Award size={23} />}
          />
        </div>

        {/* =========================
            Main Section
        ========================== */}

        <section className="teacher-students-k7p2-section">
          <div className="teacher-students-k7p2-section-header">
            <div>
              <h3 className="teacher-students-k7p2-section-title">
                لیست دانش‌آموزان
              </h3>

              <p className="teacher-students-k7p2-section-description">
                مشاهده اطلاعات تحصیلی، شماره تماس و حضور و غیاب دانش‌آموزان تحت
                آموزش شما
              </p>
            </div>
          </div>

          {/* =========================
              Filters
          ========================== */}

          <div className="teacher-students-k7p2-filter-row">
            <div className="teacher-students-k7p2-search-wrapper">
              <Search className="teacher-students-k7p2-search-icon" size={18} />

              <input
                type="text"
                placeholder="جستجو بر اساس نام، شناسه یا شماره تماس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="teacher-students-k7p2-search-input"
              />
            </div>

            <div className="teacher-students-k7p2-select-wrapper">
              <Filter className="teacher-students-k7p2-filter-icon" size={18} />

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
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

          {/* =========================
              Desktop / Tablet Table
          ========================== */}

          <div className="teacher-students-k7p2-desktop-table">
            {filteredStudents.length > 0 ? (
              <div className="teacher-students-k7p2-table-wrapper">
                <table className="teacher-students-k7p2-table">
                  <thead>
                    <tr>
                      <th>شناسه دانش‌آموز</th>
                      <th>نام و نام خانوادگی</th>
                      <th>شماره تماس</th>
                      <th>کلاس فعال</th>
                      <th>معدل نمرات</th>
                      <th>درصد حضور</th>
                      <th>وضعیت</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <span className="teacher-students-k7p2-id-badge">
                            {student.id}
                          </span>
                        </td>

                        <td>
                          <div className="teacher-students-k7p2-name-cell">
                            <GraduationCap
                              size={18}
                              className="teacher-students-k7p2-avatar-icon"
                            />

                            <strong>{student.name}</strong>
                          </div>
                        </td>

                        <td>
                          <span className="teacher-students-k7p2-phone">
                            <Phone size={14} />
                            {student.phone}
                          </span>
                        </td>

                        <td>
                          <span className="teacher-students-k7p2-class-badge">
                            {student.className}
                          </span>
                        </td>

                        <td>
                          <strong className="teacher-students-k7p2-vazir-num teacher-students-k7p2-grade">
                            {student.averageGrade}
                          </strong>
                        </td>

                        <td>
                          <span className="teacher-students-k7p2-vazir-num teacher-students-k7p2-attendance">
                            {student.attendanceRate}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`teacher-students-k7p2-status-badge teacher-students-k7p2-status-${student.statusClass}`}
                          >
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          {/* =========================
              Mobile Cards
          ========================== */}

          <div className="teacher-students-k7p2-mobile-list">
            {filteredStudents.length > 0
              ? filteredStudents.map((student) => (
                  <article
                    className="teacher-students-k7p2-mobile-card"
                    key={student.id}
                  >
                    <div className="teacher-students-k7p2-mobile-card-header">
                      <div className="teacher-students-k7p2-mobile-student">
                        <div className="teacher-students-k7p2-mobile-avatar">
                          <GraduationCap size={20} />
                        </div>

                        <div className="teacher-students-k7p2-mobile-student-info">
                          <strong>{student.name}</strong>

                          <span className="teacher-students-k7p2-mobile-id">
                            {student.id}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`teacher-students-k7p2-status-badge teacher-students-k7p2-status-${student.statusClass}`}
                      >
                        {student.status}
                      </span>
                    </div>

                    <div className="teacher-students-k7p2-mobile-divider" />

                    <div className="teacher-students-k7p2-mobile-info-grid">
                      <div className="teacher-students-k7p2-mobile-info">
                        <span>شماره تماس</span>

                        <strong className="teacher-students-k7p2-mobile-phone">
                          <Phone size={14} />
                          {student.phone}
                        </strong>
                      </div>

                      <div className="teacher-students-k7p2-mobile-info">
                        <span>کلاس فعال</span>

                        <strong className="teacher-students-k7p2-mobile-class">
                          {student.className}
                        </strong>
                      </div>

                      <div className="teacher-students-k7p2-mobile-info">
                        <span>معدل نمرات</span>

                        <strong className="teacher-students-k7p2-mobile-grade">
                          {student.averageGrade}
                        </strong>
                      </div>

                      <div className="teacher-students-k7p2-mobile-info">
                        <span>درصد حضور</span>

                        <strong className="teacher-students-k7p2-mobile-attendance">
                          {student.attendanceRate}
                        </strong>
                      </div>
                    </div>
                  </article>
                ))
              : null}
          </div>

          {/* =========================
              Empty State
          ========================== */}

          {filteredStudents.length === 0 && (
            <div className="teacher-students-k7p2-empty">
              <BookOpen size={36} />

              <p>هیچ دانش‌آموزی یافت نشد.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default TeacherStudents;
