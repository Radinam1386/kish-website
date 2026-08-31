import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  Phone,
  Edit3,
  Trash2,
  Power,
  Sparkles,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import StatCard from "../components/StatCard";
import { api, getFullName } from "../services/api";
import { toPersianDigits } from "../utils/dateUtils";

import "./AdminTeachers.css";

function AdminTeachers() {
  const location = useLocation();
  const isSecretary = location.pathname.includes("/secretary");
  const roleTitle = isSecretary ? "پنل منشی" : "پنل مدیریت";
  const menuType = isSecretary ? "secretary" : "admin";
  const basePath = isSecretary
    ? "/panel/secretary/teachers"
    : "/panel/admin/teachers";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");

  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [usersData, classroomsData] = await Promise.all([
        api.users.list(),
        api.classrooms.list(),
      ]);

      setUsers(usersData || []);
      setClassrooms(classroomsData || []);
    } catch (err) {
      setError(err.message || "دریافت اطلاعات معلمان ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (teacher) => {
    try {
      const nextStatus = !teacher.isActive;
      await api.users.update(teacher.id, { is_active: nextStatus });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === teacher.id ? { ...u, is_active: nextStatus } : u,
        ),
      );
      setSuccessMsg(
        `وضعیت مدرس «${teacher.name}» به ${nextStatus ? "فعال" : "غیرفعال"} تغییر یافت.`,
      );
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert(err.message || "خطا در تغییر وضعیت مدرس");
    }
  };

  const handleDeleteTeacher = async (teacher) => {
    if (
      !window.confirm(
        `آیا از حذف حساب کاربری مدرس «${teacher.name}» اطمینان دارید؟`,
      )
    ) {
      return;
    }

    try {
      await api.users.remove(teacher.id);
      setUsers((prev) => prev.filter((u) => u.id !== teacher.id));
      setSuccessMsg(`حساب کاربری مدرس «${teacher.name}» حذف گردید.`);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert(err.message || "خطا در حذف مدرس");
    }
  };

  const teachers = useMemo(
    () =>
      users
        .filter((user) => user.role === "teacher")
        .map((user) => {
          const teacherClasses = classrooms.filter(
            (classroom) =>
              classroom.teacher === user.id ||
              classroom.teacher?.id === user.id,
          );
          const students = teacherClasses.reduce(
            (total, classroom) => total + (classroom.student_count || 0),
            0,
          );

          return {
            id: user.id,
            name: getFullName(user),
            phone: user.phone_number || "-",
            specialty: user.email || "ثبت نشده",
            classes: teacherClasses.length,
            students,
            isActive: Boolean(user.is_active),
            status: user.is_active ? "فعال" : "غیرفعال",
            statusType: user.is_active ? "active" : "warning",
            avatar: getFullName(user).charAt(0) || "م",
          };
        }),
    [users, classrooms],
  );

  const specialties = [
    "all",
    ...new Set(teachers.map((teacher) => teacher.specialty)),
  ];

  const filteredTeachers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesSearch =
        teacher.name.toLowerCase().includes(normalizedSearch) ||
        teacher.phone.includes(normalizedSearch) ||
        teacher.specialty.toLowerCase().includes(normalizedSearch);

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

  const activeTeachers = teachers.filter((teacher) => teacher.isActive).length;

  return (
    <DashboardLayout role={roleTitle} title="مدیریت معلمان" menuType={menuType}>
      <div className="admin-teachers-x7k2-root">
        {/* ================= HEADER ================= */}
        <div className="admin-students-x7k2-header">
          <div className="admin-students-x7k2-heading">
            <div className="admin-students-x7k2-heading-icon">
              <GraduationCap size={25} />
            </div>

            <div>
              <h3 className="admin-students-x7k2-title">لیست معلمان آکادمی</h3>

              <p className="admin-students-x7k2-description">
                مدیریت اطلاعات، تخصص، کلاس‌ها و وضعیت اساتید
              </p>
            </div>
          </div>
          <Link to={`${basePath}/new`}>
            <AnimatedButton variant="primary" icon={<UserPlus size={18} />}>
              افزودن معلم جدید
            </AnimatedButton>
          </Link>
        </div>

        <div className="admin-teachers-x7k2-stats">
          <StatCard
            title="کل معلمان"
            value={`${toPersianDigits(teachers.length)} نفر`}
            icon={<Users size={23} />}
            color="orange"
          />
          <StatCard
            title="معلمان فعال"
            value={`${toPersianDigits(activeTeachers)} نفر`}
            icon={<GraduationCap size={23} />}
            color="green"
          />
          <StatCard
            title="کلاس‌های فعال"
            value={`${toPersianDigits(totalClasses)} کلاس`}
            icon={<BookOpen size={23} />}
            color="blue"
          />
          <StatCard
            title="دانش‌آموزان تحت آموزش"
            value={`${toPersianDigits(totalStudents)} نفر`}
            icon={<Users size={23} />}
            color="red"
          />
        </div>

        {successMsg && (
          <div
            style={{
              background: "oklch(95% 0.05 145 / 0.8)",
              border: "1px solid oklch(75% 0.15 145 / 0.3)",
              color: "oklch(35% 0.15 145)",
              padding: "0.85rem 1.25rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "700",
            }}
          >
            <Sparkles size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <section className="admin-teachers-x7k2-section">
          {/* Filters */}
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

          {/* Teachers Grid */}
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "oklch(55% 0 0)",
              }}
            >
              در حال بارگذاری اطلاعات معلمان...
            </div>
          ) : error ? (
            <div className="admin-teachers-x7k2-empty">
              <Users size={42} />
              <h4>{error}</h4>
            </div>
          ) : filteredTeachers.length > 0 ? (
            <div className="admin-teachers-x7k2-grid">
              {filteredTeachers.map((teacher) => (
                <article key={teacher.id} className="admin-teachers-x7k2-card">
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

                    <span
                      className={`admin-teachers-x7k2-status ${teacher.statusType}`}
                    >
                      {teacher.status}
                    </span>
                  </div>

                  <div className="admin-teachers-x7k2-divider" />

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
                        <strong>{toPersianDigits(teacher.classes)} کلاس</strong>
                      </div>
                    </div>

                    <div className="admin-teachers-x7k2-info-item">
                      <div className="admin-teachers-x7k2-info-icon">
                        <Users size={16} />
                      </div>
                      <div>
                        <span>دانش‌آموزان</span>
                        <strong>{toPersianDigits(teacher.students)} نفر</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "14px",
                      paddingTop: "10px",
                      borderTop: "1px dashed oklch(0% 0 0 / 0.08)",
                    }}
                  >
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Link to={`${basePath}/${teacher.id}/edit`}>
                        <button
                          type="button"
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            border: "1px solid oklch(0% 0 0 / 0.08)",
                            background: "oklch(98% 0.003 29)",
                            color: "oklch(40% 0 0)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="ویرایش معلم"
                        >
                          <Edit3 size={15} />
                        </button>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(teacher)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          border: "1px solid oklch(0% 0 0 / 0.08)",
                          background: teacher.isActive
                            ? "oklch(96% 0.08 85 / 0.7)"
                            : "oklch(95% 0.05 145 / 0.7)",
                          color: teacher.isActive
                            ? "oklch(45% 0.15 85)"
                            : "oklch(35% 0.15 145)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title={
                          teacher.isActive
                            ? "غیرفعال‌سازی حساب"
                            : "فعال‌سازی حساب"
                        }
                      >
                        <Power size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTeacher(teacher)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          border: "1px solid oklch(0% 0 0 / 0.08)",
                          background: "oklch(97% 0.05 25 / 0.6)",
                          color: "oklch(45% 0.18 25)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="حذف حساب مدرس"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <Link to={`${basePath}/${teacher.id}`}>
                      <AnimatedButton
                        size="small"
                        variant="primary"
                        icon={<ChevronLeft size={16} />}
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
