import { useMemo, useState } from "react";
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

function SecretaryClasses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const [classes, setClasses] = useState([
    {
      id: 1,
      title: "English A2",
      code: "ENG-A2-102",
      category: "زبان انگلیسی",
      level: "مقدماتی",
      teacher: "مریم احمدی",
      schedule: "شنبه و چهارشنبه",
      time: "۱۶:۰۰ تا ۱۸:۰۰",
      room: "کلاس ۱۰۲",
      capacity: 20,
      enrolled: 18,
      startDate: "۱۴۰۵/۰۶/۰۸",
      status: "در حال برگزاری",
      statusType: "active",
      colorType: "orange",
    },
    {
      id: 2,
      title: "Conversation B1",
      code: "CON-B1-204",
      category: "مکالمه",
      level: "متوسط",
      teacher: "علی رضایی",
      schedule: "دوشنبه و پنجشنبه",
      time: "۱۰:۰۰ تا ۱۲:۰۰",
      room: "کلاس ۲۰۴",
      capacity: 15,
      enrolled: 12,
      startDate: "۱۴۰۵/۰۶/۱۰",
      status: "در حال برگزاری",
      statusType: "active",
      colorType: "blue",
    },
    {
      id: 3,
      title: "Grammar Advanced",
      code: "GRA-ADV-301",
      category: "گرامر",
      level: "پیشرفته",
      teacher: "سحر کریمی",
      schedule: "یکشنبه و سه‌شنبه",
      time: "۱۴:۰۰ تا ۱۶:۰۰",
      room: "کلاس ۳۰۱",
      capacity: 12,
      enrolled: 12,
      startDate: "۱۴۰۵/۰۶/۰۹",
      status: "تکمیل ظرفیت",
      statusType: "full",
      colorType: "purple",
    },
    {
      id: 4,
      title: "IELTS Preparation",
      code: "IELTS-405",
      category: "آمادگی آزمون",
      level: "تخصصی",
      teacher: "رضا موسوی",
      schedule: "جمعه",
      time: "۰۹:۰۰ تا ۱۳:۰۰",
      room: "کلاس ۴۰۵",
      capacity: 18,
      enrolled: 8,
      startDate: "۱۴۰۵/۰۶/۱۴",
      status: "ثبت‌نام آزاد",
      statusType: "open",
      colorType: "green",
    },
    {
      id: 5,
      title: "English Kids",
      code: "KID-ENG-101",
      category: "کودکان",
      level: "مقدماتی",
      teacher: "نگار محمدی",
      schedule: "شنبه و دوشنبه",
      time: "۱۱:۰۰ تا ۱۲:۳۰",
      room: "کلاس ۱۰۱",
      capacity: 15,
      enrolled: 15,
      startDate: "۱۴۰۵/۰۶/۰۸",
      status: "تکمیل ظرفیت",
      statusType: "full",
      colorType: "yellow",
    },
  ]);

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
        statusFilter === "all" ||
        classItem.statusType === statusFilter;

      const matchesLevel =
        levelFilter === "all" ||
        classItem.level === levelFilter;

      return matchesSearch && matchesStatus && matchesLevel;
    });
  }, [classes, searchTerm, statusFilter, levelFilter]);

  const totalStudents = useMemo(() => {
    return classes.reduce(
      (total, classItem) => total + classItem.enrolled,
      0
    );
  }, [classes]);

  const totalCapacity = useMemo(() => {
    return classes.reduce(
      (total, classItem) => total + classItem.capacity,
      0
    );
  }, [classes]);

  const activeClasses = useMemo(() => {
    return classes.filter(
      (classItem) => classItem.statusType === "active"
    ).length;
  }, [classes]);

  const openClasses = useMemo(() => {
    return classes.filter(
      (classItem) => classItem.statusType === "open"
    ).length;
  }, [classes]);

  const emptyCapacity = totalCapacity - totalStudents;

  const occupancyPercent =
    totalCapacity > 0
      ? Math.round((totalStudents / totalCapacity) * 100)
      : 0;

  const getCapacityPercent = (enrolled, capacity) => {
    if (!capacity) return 0;

    return Math.min(
      Math.round((enrolled / capacity) * 100),
      100
    );
  };

  const getProgressClass = (percent) => {
    if (percent >= 100) return "full";
    if (percent >= 80) return "warning";
    return "normal";
  };

  const handleAddClass = () => {
    const newClass = {
      id: Date.now(),
      title: "کلاس جدید",
      code: `CLS-${Date.now().toString().slice(-4)}`,
      category: "زبان انگلیسی",
      level: "مقدماتی",
      teacher: "مدرس جدید",
      schedule: "شنبه و دوشنبه",
      time: "۱۶:۰۰ تا ۱۸:۰۰",
      room: "کلاس جدید",
      capacity: 20,
      enrolled: 0,
      startDate: "۱۴۰۵/۰۷/۰۱",
      status: "ثبت‌نام آزاد",
      statusType: "open",
      colorType: "orange",
    };

    setClasses((prev) => [newClass, ...prev]);
  };

  const handleDeleteClass = (id) => {
    setClasses((prev) =>
      prev.filter((classItem) => classItem.id !== id)
    );
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
          />

          <StatCard
            title="کلاس‌های فعال"
            value={`${activeClasses} کلاس`}
            hint="در حال برگزاری"
            icon={<CheckCircle2 />}
          />

          <StatCard
            title="دانش‌آموزان"
            value={`${totalStudents} نفر`}
            hint="ثبت‌نام‌شده"
            icon={<Users />}
          />

          <StatCard
            title="ظرفیت خالی"
            value={`${emptyCapacity} نفر`}
            hint={`${openClasses} کلاس آماده ثبت‌نام`}
            icon={<CalendarDays />}
          />
        </div>

        {/* =========================================
            Main Section
        ========================================== */}

        <section className="secretary-classes-x9k3-section">

          {/* Header */}

          <div className="secretary-classes-x9k3-header">
            <div className="secretary-classes-x9k3-heading">
              <h3 className="secretary-classes-x9k3-title">
                لیست کلاس‌ها
              </h3>

              <p className="secretary-classes-x9k3-description">
                مدیریت کلاس‌ها، مدرس‌ها، ظرفیت و وضعیت ثبت‌نام
              </p>
            </div>

            <AnimatedButton
              variant="primary"
              onClick={handleAddClass}
            >
              <Plus size={18} />
              افزودن کلاس جدید
            </AnimatedButton>
          </div>

          {/* =========================================
              Filters
          ========================================== */}

          <div className="secretary-classes-x9k3-filters">

            <div className="secretary-classes-x9k3-search">
              <Search
                size={18}
                className="secretary-classes-x9k3-search-icon"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
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
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="secretary-classes-x9k3-select"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">
                  در حال برگزاری
                </option>
                <option value="open">
                  ثبت‌نام آزاد
                </option>
                <option value="full">
                  تکمیل ظرفیت
                </option>
              </select>
            </div>

            <select
              value={levelFilter}
              onChange={(event) =>
                setLevelFilter(event.target.value)
              }
              className="secretary-classes-x9k3-level-select"
            >
              <option value="all">همه سطوح</option>
              <option value="مقدماتی">مقدماتی</option>
              <option value="متوسط">متوسط</option>
              <option value="پیشرفته">پیشرفته</option>
              <option value="تخصصی">تخصصی</option>
            </select>
          </div>

          {/* Result */}

          <div className="secretary-classes-x9k3-result">
            <span>
              نمایش{" "}
              <strong>{filteredClasses.length}</strong>{" "}
              کلاس از{" "}
              <strong>{classes.length}</strong>
            </span>

            <span>
              ظرفیت استفاده‌شده:{" "}
              <strong>{occupancyPercent}٪</strong>
            </span>
          </div>

          {/* =========================================
              Table
          ========================================== */}

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
                      classItem.capacity
                    );

                    const progressClass =
                      getProgressClass(percent);

                    return (
                      <tr key={classItem.id}>

                        {/* Class */}

                        <td data-label="کلاس">
                          <div className="secretary-classes-x9k3-class">

                            <div
                              className={`secretary-classes-x9k3-class-icon ${classItem.colorType}`}
                            >
                              <GraduationCap size={19} />
                            </div>

                            <div className="secretary-classes-x9k3-class-info">
                              <strong>
                                {classItem.title}
                              </strong>

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

                        {/* Teacher */}

                        <td data-label="مدرس">
                          <div className="secretary-classes-x9k3-teacher">

                            <div className="secretary-classes-x9k3-teacher-avatar">
                              {classItem.teacher.charAt(0)}
                            </div>

                            <span>
                              {classItem.teacher}
                            </span>

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

                            <small>
                              {classItem.room}
                            </small>

                          </div>
                        </td>

                        {/* Capacity */}

                        <td data-label="ظرفیت">
                          <div className="secretary-classes-x9k3-capacity">

                            <div className="secretary-classes-x9k3-capacity-number">
                              <strong>
                                {classItem.enrolled}
                              </strong>

                              <span>
                                از {classItem.capacity} نفر
                              </span>
                            </div>

                            <div className="secretary-classes-x9k3-progress">
                              <span
                                className={progressClass}
                                style={{
                                  width: `${percent}%`,
                                }}
                              />
                            </div>

                            <small>
                              {percent}٪ تکمیل
                            </small>

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
                              onClick={() =>
                                handleDeleteClass(classItem.id)
                              }
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

                        <strong>
                          کلاسی پیدا نشد
                        </strong>

                        <span>
                          عبارت جستجو یا فیلتر انتخابی را
                          تغییر دهید.
                        </span>
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