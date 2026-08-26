import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Filter,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";

import "./SecretaryClasses.css";
import { api, getFullName, storage } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

function SecretaryClasses() {
  const currentUser = storage.getUser();
  const role = currentUser?.role === "admin" ? "admin" : "secretary";
  const basePath = `/panel/${role}`;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const [rawClasses, setRawClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [error, setError] = useState("");
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
        setRawClasses(classroomsData || []);
        setTerms(termsData || []);
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

  const handleDeleteClass = async (classId) => {
    if (!window.confirm("آیا از حذف این کلاس اطمینان دارید؟ تمامی ثبت‌نام‌های این کلاس حذف خواهند شد.")) {
      return;
    }

    try {
      await api.classrooms.delete(classId);
      setRawClasses((prev) => prev.filter((c) => c.id !== classId));
    } catch (err) {
      alert(err.message || "خطا در حذف کلاس");
    }
  };

  const classes = useMemo(
    () =>
      rawClasses.map((classroom, index) => {
        const term = terms.find((item) => item.id === classroom.term);
        const enrolled = classroom.student_count || 0;

        return {
          id: classroom.id,
          title: classroom.name,
          code: `CLS-${classroom.id}`,
          category: term?.name || "ترم نامشخص",
          level: term?.name || "ثبت نشده",
          teacher: getFullName(classroom.teacher_detail),
          schedule: "برنامه هفتگی",
          time: "ساعات آموزشی",
          room: `کد ${classroom.id}`,
          capacity: Math.max(enrolled, 15),
          enrolled,
          startDate: term?.start_date ? toJalaliDateString(term.start_date) : "-",
          status: term?.is_active ? "در حال برگزاری" : "غیرفعال",
          statusType: term?.is_active ? "active" : "open",
          colorType: ["orange", "blue", "green", "yellow"][index % 4],
        };
      }),
    [rawClasses, terms],
  );

  const filteredClasses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return classes.filter((classItem) => {
      const matchesSearch =
        !search ||
        classItem.title.toLowerCase().includes(search) ||
        classItem.code.toLowerCase().includes(search) ||
        classItem.teacher.toLowerCase().includes(search) ||
        classItem.room.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" || classItem.statusType === statusFilter;

      const matchesLevel =
        levelFilter === "all" || classItem.level === levelFilter;

      return matchesSearch && matchesStatus && matchesLevel;
    });
  }, [classes, searchTerm, statusFilter, levelFilter]);

  const totalStudents = useMemo(() => {
    return classes.reduce((total, classItem) => total + classItem.enrolled, 0);
  }, [classes]);

  const totalCapacity = useMemo(() => {
    return classes.reduce((total, classItem) => total + classItem.capacity, 0);
  }, [classes]);

  const activeClasses = useMemo(() => {
    return classes.filter((classItem) => classItem.statusType === "active")
      .length;
  }, [classes]);

  const occupancyPercent =
    totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  const getCapacityPercent = (enrolled, capacity) => {
    if (!capacity) return 0;

    return Math.min(Math.round((enrolled / capacity) * 100), 100);
  };

  const getProgressClass = (percent) => {
    if (percent >= 100) return "full";
    if (percent >= 80) return "warning";
    return "normal";
  };

  return (
    <DashboardLayout
      role={role === "admin" ? "پنل مدیریت" : "پنل منشی"}
      title="مدیریت کلاس‌ها"
      menuType={role}
    >
      <div className="secretary-classes-x9k3-root">
        {/* =====================================================
            Stats Cards
        ===================================================== */}

        <div className="secretary-classes-x9k3-stats">
          <StatCard
            title="کل کلاس‌ها"
            value={`${toPersianDigits(classes.length)} کلاس`}
            hint="کلاس‌های ثبت‌شده"
            icon={<BookOpen />}
            color="red"
          />

          <StatCard
            title="کلاس‌های فعال"
            value={`${toPersianDigits(activeClasses)} کلاس`}
            hint="در حال برگزاری"
            icon={<CheckCircle2 />}
            color="green"
          />

          <StatCard
            title="دانش‌آموزان"
            value={`${toPersianDigits(totalStudents)} نفر`}
            hint="ثبت‌نام‌شده"
            icon={<Users />}
            color="blue"
          />
        </div>
        <section className="secretary-classes-x9k3-section">
          <div className="secretary-classes-x9k3-header">
            <div className="secretary-classes-x9k3-heading">
              <h3 className="secretary-classes-x9k3-title">لیست کلاس‌ها</h3>

              <p className="secretary-classes-x9k3-description">
                مدیریت کلاس‌ها، مدرس‌ها، ظرفیت و وضعیت ثبت‌نام
              </p>
            </div>

            <Link to={`${basePath}/classes/new`}>
              <AnimatedButton variant="primary">
                <Plus size={18} />
                افزودن کلاس جدید
              </AnimatedButton>
            </Link>
          </div>
          {error && (
            <div className="secretary-classes-x9k3-empty">
              <BookOpen size={42} />
              <strong>{error}</strong>
            </div>
          )}
          <div className="secretary-classes-x9k3-filters">
            <div className="secretary-classes-x9k3-search">
              <Search
                size={18}
                className="secretary-classes-x9k3-search-icon"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="جستجو بر اساس نام کلاس، کد، مدرس یا اتاق..."
                className="secretary-classes-x9k3-input"
              />
            </div>

            <div className="secretary-classes-x9k3-select-wrapper">
              <Filter
                size={17}
                className="secretary-classes-x9k3-filter-icon"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="secretary-classes-x9k3-select"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">در حال برگزاری</option>
                <option value="open">ثبت‌نام آزاد</option>
                <option value="full">تکمیل ظرفیت</option>
              </select>
            </div>

            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              className="secretary-classes-x9k3-level-select"
            >
              <option value="all">همه سطوح</option>
              <option value="مقدماتی">مقدماتی</option>
              <option value="متوسط">متوسط</option>
              <option value="پیشرفته">پیشرفته</option>
              <option value="تخصصی">تخصصی</option>
            </select>
          </div>
          <div className="secretary-classes-x9k3-result">
            <span>
              نمایش
              <strong> {toPersianDigits(filteredClasses.length)} </strong> کلاس از
              <strong> {toPersianDigits(classes.length)} </strong>
            </span>

            <span>
              ظرفیت استفاده‌شده:
              <strong> {toPersianDigits(occupancyPercent)}٪ </strong>
            </span>
          </div>
          <div className="secretary-classes-x9k3-table-wrapper">
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted, #94a3b8)" }}>
                در حال دریافت اطلاعات کلاس‌ها...
              </div>
            ) : (
              <table className="secretary-classes-x9k3-table">
                <thead>
                  <tr>
                    <th>کلاس</th>
                    <th>مدرس</th>
                    <th>زمان برگزاری</th>
                    <th>ظرفیت</th>
                    <th>تاریخ شروع (شمسی)</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

              <tbody>
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((classItem) => {
                    const percent = getCapacityPercent(
                      classItem.enrolled,
                      classItem.capacity,
                    );

                    const progressClass = getProgressClass(percent);

                    return (
                      <tr key={classItem.id}>
                        <td data-label="کلاس">
                          <div className="secretary-classes-x9k3-class">
                            <div
                              className={`secretary-classes-x9k3-class-icon ${classItem.colorType}`}
                            >
                              <GraduationCap size={19} />
                            </div>

                            <div className="secretary-classes-x9k3-class-info">
                              <strong>{classItem.title}</strong>

                              <div>
                                <span className="secretary-classes-x9k3-badge">
                                  {classItem.category}
                                </span>

                                <span className="secretary-classes-x9k3-code">
                                  {classItem.code}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>


                        <td data-label="مدرس">
                          <div className="secretary-classes-x9k3-teacher">
                            <div className="secretary-classes-x9k3-teacher-avatar">
                              {classItem.teacher.charAt(0)}
                            </div>

                            <span>{classItem.teacher}</span>
                          </div>
                        </td>

                        <td data-label="زمان برگزاری">
                          <div className="secretary-classes-x9k3-schedule">
                            <span>
                              <CalendarDays size={15} />
                              {classItem.schedule}
                            </span>

                            <span>
                              <Clock3 size={15} />
                              {classItem.time}
                            </span>

                            <small>{classItem.room}</small>
                          </div>
                        </td>

                        <td data-label="ظرفیت">
                          <div className="secretary-classes-x9k3-capacity">
                            <div className="secretary-classes-x9k3-capacity-number">
                              <strong>{toPersianDigits(classItem.enrolled)}</strong>

                              <span>از {toPersianDigits(classItem.capacity)} نفر</span>
                            </div>

                            <div className="secretary-classes-x9k3-progress">
                              <span
                                className={progressClass}
                                style={{
                                  width: `${percent}%`,
                                }}
                              />
                            </div>

                            <small>{toPersianDigits(percent)}٪ تکمیل</small>
                          </div>
                        </td>

                        <td data-label="تاریخ شروع">
                          <span className="secretary-classes-x9k3-date">
                            {classItem.startDate}
                          </span>
                        </td>

                        <td data-label="وضعیت">
                          <span
                            className={`secretary-classes-x9k3-status ${classItem.statusType}`}
                          >
                            {classItem.status}
                          </span>
                        </td>

                        <td
                          data-label="عملیات"
                          className="secretary-classes-x9k3-action-cell"
                        >
                          <div className="secretary-classes-x9k3-actions">
                            <Link
                              to={`${basePath}/classes/${classItem.id}`}
                              className="secretary-classes-x9k3-action view"
                              title="مشاهده کلاس"
                            >
                              <Eye size={16} />
                            </Link>

                            <Link
                              to={`${basePath}/classes/${classItem.id}/edit`}
                              className="secretary-classes-x9k3-action edit"
                              title="ویرایش کلاس"
                            >
                              <Edit3 size={16} />
                            </Link>

                            <button
                              type="button"
                              className="secretary-classes-x9k3-action delete"
                              title="حذف کلاس"
                              onClick={() => handleDeleteClass(classItem.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="secretary-classes-x9k3-empty">
                        <BookOpen size={42} />

                        <strong>کلاسی پیدا نشد</strong>

                        <span>عبارت جستجو یا فیلتر انتخابی را تغییر دهید.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default SecretaryClasses;
