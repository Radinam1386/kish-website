import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  Filter,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  Users,
  Layers,
  CreditCard,
  Sparkles,
  CalendarDaysIcon,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName, storage } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

import "./SecretaryClasses.css";

function SecretaryClasses() {
  const currentUser = storage.getUser();
  const role = currentUser?.role === "admin" ? "admin" : "secretary";
  const roleTitle = role === "admin" ? "پنل مدیریت" : "پنل منشی";
  const basePath = `/panel/${role}`;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTermId, setSelectedTermId] = useState("");

  const [rawClasses, setRawClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        const [classroomsData, termsData] = await Promise.all([
          api.classrooms.list(),
          api.terms.list(),
        ]);

        if (!alive) return;
        const allTerms = termsData || [];
        setRawClasses(classroomsData || []);
        setTerms(allTerms);

        const active = allTerms.find((t) => t.is_active);
        if (active) {
          setSelectedTermId(String(active.id));
        } else if (allTerms.length > 0) {
          setSelectedTermId(String(allTerms[0].id));
        } else {
          setSelectedTermId("all");
        }
      } catch (err) {
        if (alive) setError(err.message || "دریافت کلاس‌ها ناموفق بود.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const handleDeleteClass = async (classId, className) => {
    if (
      !window.confirm(
        `آیا از حذف کلاس «${className}» اطمینان دارید؟ تمامی ثبت‌نام‌های این کلاس حذف خواهند شد.`,
      )
    ) {
      return;
    }

    try {
      await api.classrooms.delete(classId);
      setRawClasses((prev) => prev.filter((c) => c.id !== classId));
      setSuccessMsg(`کلاس «${className}» با موفقیت حذف گردید.`);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert(err.message || "خطا در حذف کلاس");
    }
  };

  const activeTermObj = useMemo(() => {
    if (selectedTermId === "all") return null;
    return terms.find((t) => String(t.id) === String(selectedTermId));
  }, [terms, selectedTermId]);

  const classes = useMemo(
    () =>
      rawClasses
        .filter((classroom) => {
          if (selectedTermId === "all") return true;
          return (
            String(classroom.term || classroom.term?.id) ===
            String(selectedTermId)
          );
        })
        .map((classroom) => {
          const term = terms.find(
            (item) => item.id === (classroom.term || classroom.term?.id),
          );
          const enrolled =
            classroom.student_count || classroom.enrollments?.length || 0;
          const tuitionFee =
            classroom.tuition_fee !== undefined
              ? classroom.tuition_fee
              : 2500000;

          return {
            id: classroom.id,
            title: classroom.name,
            code: `CLS-${classroom.id}`,
            termName: term?.name || "ترم نامشخص",
            teacher: getFullName(classroom.teacher_detail) || "استاد نامشخص",
            capacity: Math.max(enrolled, 15),
            enrolled,
            tuitionFee,
            startDate: term?.start_date
              ? toJalaliDateString(term.start_date)
              : "-",
            status: term?.is_active ? "در حال برگزاری" : "به پایان رسیده",
            statusType: term?.is_active ? "active" : "inactive",
          };
        }),
    [rawClasses, terms, selectedTermId],
  );

  const filteredClasses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return classes.filter((classItem) => {
      const matchesSearch =
        !search ||
        classItem.title.toLowerCase().includes(search) ||
        classItem.code.toLowerCase().includes(search) ||
        classItem.teacher.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" || classItem.statusType === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [classes, searchTerm, statusFilter]);

  const totalStudents = useMemo(() => {
    return classes.reduce((total, classItem) => total + classItem.enrolled, 0);
  }, [classes]);

  const activeClassesCount = useMemo(() => {
    return classes.filter((classItem) => classItem.statusType === "active")
      .length;
  }, [classes]);

  return (
    <DashboardLayout role={roleTitle} title="مدیریت کلاس‌ها" menuType={role}>
      <div className="secretary-classes-page-container">
        <div
          className="term-selector-banner"
          style={{ marginBottom: "1.75rem" }}
        >
          <div className="term-banner-info">
            <div className="term-icon-circle-secretary">
              <CalendarDaysIcon size={26} />
            </div>
            <div>
              <h3
                style={{
                  margin: "0 0 0.25rem",
                  fontSize: "1.1rem",
                  fontWeight: "800",
                }}
              >
                ترم تحصیلی انتخابی:{" "}
                <span
                  className="term-highlight-text"
                  style={{ color: "var(--primary)" }}
                >
                  {activeTermObj
                    ? activeTermObj.name
                    : selectedTermId === "all"
                      ? "همه ترم‌ها"
                      : "ترم نامشخص"}
                </span>
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  color: "oklch(55% 0 0)",
                }}
              >
                {activeTermObj?.is_active
                  ? "کلاس‌های مربوط به ترم فعال جاری در حال نمایش است."
                  : activeTermObj
                    ? "کلاس‌های مربوط به این ترم بایگانی‌شده در حال نمایش است."
                    : "نمایش کلاس‌های تمامی دوره‌ها"}
              </p>
            </div>
          </div>

          <div
            className="term-dropdown-wrapper"
            style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
          >
            <label style={{ fontSize: "0.84rem", fontWeight: "700" }}>
              انتخاب ترم:
            </label>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="term-select-input"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{" "}
                  {t.is_active ? "(ترم فعال جاری)" : "(به پایان رسیده)"}
                </option>
              ))}
              <option value="all">همه ترم‌ها (مشاهده کامل)</option>
            </select>
          </div>
        </div>

        <div className="secretary-classes-stats-grid">
          <StatCard
            title="کلاس‌های ترم"
            value={`${toPersianDigits(classes.length)} کلاس`}
            hint={activeTermObj?.name || "ترم انتخابی"}
            icon={<BookOpen />}
            color="red"
          />

          <StatCard
            title="کلاس‌های فعال"
            value={`${toPersianDigits(activeClassesCount)} کلاس`}
            hint="در حال برگزاری"
            icon={<CheckCircle2 />}
            color="green"
          />

          <StatCard
            title="دانش‌آموزان ثبت‌نامی"
            value={`${toPersianDigits(totalStudents)} نفر`}
            hint="در این ترم"
            icon={<Users />}
            color="blue"
          />
        </div>

        {successMsg && (
          <div
            className="classes-alert success"
            style={{ marginBottom: "1.5rem" }}
          >
            <Sparkles size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <section className="secretary-classes-main-section">
          <div className="secretary-classes-section-header">
            <div className="secretary-classes-heading">
              <h3 className="secretary-classes-section-title">
                لیست کلاس‌های{" "}
                {activeTermObj ? `«${activeTermObj.name}»` : "آموزشگاه"}
              </h3>
              <p className="secretary-classes-section-desc">
                مدیریت کلاس‌ها، مدرس‌ها، شهریه مصوب و لیست دانش‌آموزان
              </p>
            </div>

            <Link to={`${basePath}/classes/new`}>
              <AnimatedButton variant="primary" icon={<Plus size={18} />}>
                افزودن کلاس جدید
              </AnimatedButton>
            </Link>
          </div>

          {error && (
            <div className="classes-alert error">
              <span>{error}</span>
            </div>
          )}

          {/* Filters Row */}
          <div className="secretary-classes-filters-row">
            <div className="classes-search-wrapper">
              <Search size={18} className="classes-search-icon" />
              <input
                type="text"
                placeholder="جستجو بر اساس نام کلاس، مدرس دوره یا کد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="classes-search-input"
              />
            </div>

            <div className="classes-select-wrapper">
              <Filter size={16} className="classes-filter-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="classes-select"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">در حال برگزاری (فعال)</option>
                <option value="inactive">به پایان رسیده (بایگانی)</option>
              </select>
            </div>
          </div>

          {/* Classes Cards Grid */}
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "oklch(50% 0 0)",
              }}
            >
              در حال دریافت اطلاعات کلاس‌ها...
            </div>
          ) : filteredClasses.length > 0 ? (
            <div className="secretary-classes-cards-grid">
              {filteredClasses.map((classItem) => (
                <article key={classItem.id} className="secretary-class-card">
                  {/* Top Bar */}
                  <div className="class-card-top-row">
                    <div className="class-avatar-badge">
                      <GraduationCap size={24} />
                    </div>

                    <div className="class-card-title-block">
                      <h4>{classItem.title}</h4>
                      <span className="class-card-code">{classItem.code}</span>
                    </div>

                    <span
                      className={`class-card-status ${classItem.statusType === "active" ? "active" : "inactive"}`}
                    >
                      {classItem.status}
                    </span>
                  </div>

                  <div className="class-card-divider" />

                  {/* Info List */}
                  <div className="class-card-info-list">
                    <div className="class-info-item">
                      <GraduationCap size={16} className="info-icon" />
                      <span className="info-label">مدرس دوره:</span>
                      <strong className="info-val">{classItem.teacher}</strong>
                    </div>

                    <div className="class-info-item">
                      <CalendarDays size={16} className="info-icon" />
                      <span className="info-label">ترم تحصیلی:</span>
                      <span className="info-val">{classItem.termName}</span>
                    </div>

                    <div className="class-info-item">
                      <CreditCard size={16} className="info-icon" />
                      <span className="info-label">شهریه مصوب:</span>
                      <strong className="info-val tuition">
                        {toPersianDigits(
                          classItem.tuitionFee.toLocaleString("fa-IR"),
                        )}{" "}
                        تومان
                      </strong>
                    </div>

                    <div className="class-info-item">
                      <Users size={16} className="info-icon" />
                      <span className="info-label">تعداد دانش‌آموزان:</span>
                      <strong className="info-val">
                        {toPersianDigits(classItem.enrolled)} نفر ثبت‌نامی
                      </strong>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="class-card-actions-row">
                    <Link
                      to={`${basePath}/classes/${classItem.id}`}
                      className="class-btn-action view"
                    >
                      <Eye size={15} />
                      <span>جزئیات</span>
                    </Link>

                    <Link
                      to={`${basePath}/classes/${classItem.id}/edit`}
                      className="class-btn-action edit"
                    >
                      <Edit3 size={15} />
                      <span>ویرایش</span>
                    </Link>

                    <button
                      type="button"
                      className="class-btn-action delete"
                      onClick={() =>
                        handleDeleteClass(classItem.id, classItem.title)
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="classes-empty-state">
              <BookOpen size={44} />
              <h4>کلاسی در این ترم یافت نشد</h4>
              <p>
                برای شروع دوره جدید، با استفاده از دکمه «افزودن کلاس جدید» کلاس
                را تعریف نمایید.
              </p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default SecretaryClasses;
