import React, { useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  Phone,
} from "lucide-react";

import { Link } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";

import "./AdminTeachers.css";
import StatCard from "../components/StatCard";

function AdminTeachers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");

  const [teachers, setTeachers] = useState([
    {
      id: 1,
      name: "خانم رضایی",
      phone: "۰۹۱۲۳۴۵۶۷۸۹",
      specialty: "زبان عمومی",
      classes: 4,
      students: 68,
      status: "فعال",
      statusType: "active",
      avatar: "خ",
    },
    {
      id: 2,
      name: "آقای کریمی",
      phone: "۰۹۳۵۷۶۵۴۳۲۱",
      specialty: "مکالمه",
      classes: 3,
      students: 51,
      status: "فعال",
      statusType: "active",
      avatar: "آ",
    },
    {
      id: 3,
      name: "خانم مرادی",
      phone: "۰۹۱۹۸۷۶۵۴۳۲",
      specialty: "کودکان",
      classes: 5,
      students: 74,
      status: "فعال",
      statusType: "active",
      avatar: "خ",
    },
    {
      id: 4,
      name: "آقای احمدی",
      phone: "۰۹۱۲۱۱۱۱۱۱۱",
      specialty: "گرامر",
      classes: 2,
      students: 32,
      status: "مرخصی",
      statusType: "warning",
      avatar: "ا",
    },
  ]);

  const specialties = [
    "all",
    ...new Set(teachers.map((teacher) => teacher.specialty)),
  ];

  const filteredTeachers = useMemo(() => {
    const normalizedSearch = searchTerm.trim();

    return teachers.filter((teacher) => {
      const matchesSearch =
        teacher.name.includes(normalizedSearch) ||
        teacher.phone.includes(normalizedSearch) ||
        teacher.specialty.includes(normalizedSearch);

      const matchesSpecialty =
        selectedSpecialty === "all" || teacher.specialty === selectedSpecialty;

      return matchesSearch && matchesSpecialty;
    });
  }, [teachers, searchTerm, selectedSpecialty]);

  const totalStudents = teachers.reduce(
    (total, teacher) => total + teacher.students,
    0,
  );

  const totalClasses = teachers.reduce(
    (total, teacher) => total + teacher.classes,
    0,
  );

  const activeTeachers = teachers.filter(
    (teacher) => teacher.statusType === "active",
  ).length;

  const handleAddTeacher = () => {
    const newTeacher = {
      id: Date.now(),
      name: "معلم جدید",
      phone: "۰۹۱۲۰۰۰۰۰۰۰",
      specialty: "زبان عمومی",
      classes: 0,
      students: 0,
      status: "فعال",
      statusType: "active",
      avatar: "م",
    };

    setTeachers((prev) => [...prev, newTeacher]);
  };

  return (
    <DashboardLayout role="پنل مدیریت" title="مدیریت معلمان" menuType="admin">
      <div className="admin-teachers-x7k2-root">
        {/* ================================
            Statistics
        ================================= */}

        <div className="admin-teachers-x7k2-stats">
          <StatCard
            title="کل معلمان"
            value={`${teachers.length} نفر`}
            icon={<Users size={23} />}
          />
          <StatCard
            title="معلمان فعال"
            value={`${activeTeachers} نفر`}
            icon={<GraduationCap size={23} />}
          />
          <StatCard
            title="کلاس‌های فعال"
            value={`${totalClasses} کلاس`}
            icon={<BookOpen size={23} />}
          />
          <StatCard
            title="دانش‌آموزان تحت آموزش"
            value={`${totalStudents} نفر`}
            icon={<Users size={23} />}
          />
        </div>

        {/* ================================
            Main Section
        ================================= */}

        <section className="admin-teachers-x7k2-section">
          {/* Header */}

          <div className="admin-teachers-x7k2-section-header">
            <div className="admin-teachers-x7k2-heading">
              <h3 className="admin-teachers-x7k2-title">لیست معلمان</h3>

              <p className="admin-teachers-x7k2-description">
                مدیریت اطلاعات، تخصص، کلاس‌ها و وضعیت اساتید
              </p>
            </div>

            <AnimatedButton variant="primary" onClick={handleAddTeacher}>
              <UserPlus size={18} />
              افزودن معلم
            </AnimatedButton>
          </div>

          {/* ================================
              Filters
          ================================= */}

          <div className="admin-teachers-x7k2-filters">
            <div className="admin-teachers-x7k2-search-wrapper">
              <Search size={18} className="admin-teachers-x7k2-search-icon" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="جستجو بر اساس نام، شماره یا تخصص..."
                className="admin-teachers-x7k2-search-input"
              />
            </div>

            <div className="admin-teachers-x7k2-select-wrapper">
              <Filter size={18} className="admin-teachers-x7k2-filter-icon" />

              <select
                value={selectedSpecialty}
                onChange={(event) => setSelectedSpecialty(event.target.value)}
                className="admin-teachers-x7k2-select"
              >
                <option value="all">همه تخصص‌ها</option>

                {specialties
                  .filter((item) => item !== "all")
                  .map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* ================================
              Teachers Grid
          ================================= */}

          {filteredTeachers.length > 0 ? (
            <div className="admin-teachers-x7k2-grid">
              {filteredTeachers.map((teacher) => (
                <article key={teacher.id} className="admin-teachers-x7k2-card">
                  {/* Card Top */}

                  <div className="admin-teachers-x7k2-card-top">
                    <div className="admin-teachers-x7k2-avatar">
                      {teacher.avatar}
                    </div>

                    <div className="admin-teachers-x7k2-main-info">
                      <h4>{teacher.name}</h4>

                      <span className="admin-teachers-x7k2-specialty">
                        {teacher.specialty}
                      </span>
                    </div>

                    {/* <span
                      className={`admin-teachers-x7k2-status ${teacher.statusType}`}
                    >
                      {teacher.status}
                    </span> */}
                  </div>

                  <div className="admin-teachers-x7k2-divider" />

                  {/* Info */}

                  <div className="admin-teachers-x7k2-info-list">
                    <div className="admin-teachers-x7k2-info-item">
                      <div className="admin-teachers-x7k2-info-icon">
                        <Phone size={16} />
                      </div>

                      <div>
                        <span>شماره تماس</span>

                        <strong className="admin-teachers-x7k2-number">
                          {teacher.phone}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-teachers-x7k2-info-item">
                      <div className="admin-teachers-x7k2-info-icon">
                        <BookOpen size={16} />
                      </div>

                      <div>
                        <span>کلاس‌های فعال</span>

                        <strong>{teacher.classes} کلاس</strong>
                      </div>
                    </div>

                    <div className="admin-teachers-x7k2-info-item">
                      <div className="admin-teachers-x7k2-info-icon">
                        <Users size={16} />
                      </div>

                      <div>
                        <span>دانش‌آموزان</span>

                        <strong>{teacher.students} نفر</strong>
                      </div>
                    </div>
                  </div>

                  {/* =================================
                        Details Button
                    ================================= */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "end",
                      marginTop: "10px",
                    }}
                  >
                    <Link to={`/panel/admin/teachers/${teacher.id}`}>
                      <AnimatedButton
                        size="small"
                        variant="primary"
                        icon={<ChevronLeft size={17} />}
                      >
                        مشاهده جزئیات
                      </AnimatedButton>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-teachers-x7k2-empty">
              <Users size={42} />

              <h4>معلمی پیدا نشد</h4>

              <p>عبارت جستجو یا فیلتر انتخابی را تغییر دهید.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default AdminTeachers;
