import { useEffect, useMemo, useState } from "react";
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
import { api, getFullName } from "../services/api";

function SecretaryClasses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const [rawClasses, setRawClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        const [classroomsData, termsData, usersData] = await Promise.all([
          api.classrooms.list(),
          api.terms.list(),
          api.users.list(),
        ]);

        if (!alive) return;
        setRawClasses(classroomsData);
        setTerms(termsData);
        setTeachers(usersData.filter((user) => user.role === "teacher"));
      } catch (err) {
        if (alive) setError(err.message || "دریافت کلاس‌ها ناموفق بود.");
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

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
          schedule: "در مدل بک‌اند ثبت نشده",
          time: "-",
          room: "-",
          capacity: Math.max(enrolled, 1),
          enrolled,
          startDate: term?.start_date || "-",
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

  const handleAddClass = async () => {
    const term = terms.find((item) => item.is_active) || terms[0];
    const teacher = teachers[0];

    if (!term || !teacher) {
      alert("برای ساخت کلاس، ابتدا حداقل یک ترم و یک معلم در بک‌اند ثبت کنید.");
      return;
    }

    try {
      const newClass = await api.classrooms.create({
        name: "کلاس جدید",
        term: term.id,
        teacher: teacher.id,
      });
      setRawClasses((prev) => [newClass, ...prev]);
    } catch (err) {
      alert(err.message || "ساخت کلاس ناموفق بود.");
    }
  };

  const handleDeleteClass = async (id) => {
    try {
      await api.classrooms.remove(id);
      setRawClasses((prev) => prev.filter((classItem) => classItem.id !== id));
    } catch (err) {
      alert(err.message || "حذف کلاس ناموفق بود.");
    }
  };

  return (
    <DashboardLayout
      role="پنل منشی"
      title="مدیریت کلاس‌ها"
      menuType="secretary"
    >
      <div className="secretary-classes-x9k3-root">
        {/* =========================================
            Statistics
        ========================================== */}

        <div className="secretary-classes-x9k3-stats">
          <StatCard
            title="کل کلاس‌ها"
            value={`${classes.length} کلاس`}
            hint="کلاس‌های ثبت‌شده"
            icon={<BookOpen />}
            color="red"
          />

          <StatCard
            title="کلاس‌های فعال"
            value={`${activeClasses} کلاس`}
            hint="در حال برگزاری"
            icon={<CheckCircle2 />}
            color="green"
          />

          <StatCard
            title="دانش‌آموزان"
            value={`${totalStudents} نفر`}
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

            <AnimatedButton variant="primary" onClick={handleAddClass}>
              <Plus size={18} />
              افزودن کلاس جدید
            </AnimatedButton>
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
              <strong>{filteredClasses.length}</strong> کلاس از
              <strong>{classes.length}</strong>
            </span>

            <span>
              ظرفیت استفاده‌شده:
              <strong>{occupancyPercent}٪</strong>
            </span>
          </div>
          <div className="secretary-classes-x9k3-table-wrapper">
            <table className="secretary-classes-x9k3-table">
              <thead>
                <tr>
                  <th>کلاس</th>
                  <th>مدرس</th>
                  <th>زمان برگزاری</th>
                  <th>ظرفیت</th>
                  <th>تاریخ شروع</th>
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

                        {/* Schedule */}

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

                        {/* Capacity */}

                        <td data-label="ظرفیت">
                          <div className="secretary-classes-x9k3-capacity">
                            <div className="secretary-classes-x9k3-capacity-number">
                              <strong>{classItem.enrolled}</strong>

                              <span>از {classItem.capacity} نفر</span>
                            </div>

                            <div className="secretary-classes-x9k3-progress">
                              <span
                                className={progressClass}
                                style={{
                                  width: `${percent}%`,
                                }}
                              />
                            </div>

                            <small>{percent}٪ تکمیل</small>
                          </div>
                        </td>

                        {/* Date */}

                        <td data-label="تاریخ شروع">
                          <span className="secretary-classes-x9k3-date">
                            {classItem.startDate}
                          </span>
                        </td>

                        {/* Status */}

                        <td data-label="وضعیت">
                          <span
                            className={`secretary-classes-x9k3-status ${classItem.statusType}`}
                          >
                            {classItem.status}
                          </span>
                        </td>

                        {/* Actions */}

                        <td
                          data-label="عملیات"
                          className="secretary-classes-x9k3-action-cell"
                        >
                          <div className="secretary-classes-x9k3-actions">
                            <button
                              type="button"
                              className="secretary-classes-x9k3-action view"
                              title="مشاهده کلاس"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              className="secretary-classes-x9k3-action edit"
                              title="ویرایش کلاس"
                            >
                              <Edit3 size={16} />
                            </button>

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
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default SecretaryClasses;
