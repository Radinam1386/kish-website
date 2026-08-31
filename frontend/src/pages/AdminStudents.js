import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Eye,
  UserPlus,
  Phone,
  GraduationCap,
  Users,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
} from "lucide-react";

import "./AdminStudents.css";
import { AnimatedButton } from "../components/AnimatedButton";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { api, getFullName } from "../services/api";
import { useLocation, Link } from "react-router-dom";

function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");

  const location = useLocation();
  const isSecretary = location.pathname.includes("/secretary");
  const roleTitle = isSecretary ? "پنل منشی" : "پنل مدیریت";
  const menuType = isSecretary ? "secretary" : "admin";

  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [terms, setTerms] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [usersData, enrollmentsData, classroomsData, termsData] =
          await Promise.all([
            api.users.list(),
            api.enrollments.list(),
            api.classrooms.list(),
            api.terms.list(),
          ]);

        if (!alive) return;

        setUsers(usersData || []);
        setEnrollments(enrollmentsData || []);
        setClassrooms(classroomsData || []);
        setTerms(termsData || []);
      } catch (err) {
        if (alive) {
          setError(err.message || "دریافت دانش‌آموزان ناموفق بود.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const students = useMemo(
    () =>
      users
        .filter((user) => user.role === "student")
        .map((user) => {
          const studentEnrollments = enrollments.filter(
            (item) => item.student === user.id || item.student?.id === user.id,
          );

          studentEnrollments.sort((a, b) => {
            const aTerm = terms.find(
              (t) => t.id === (a.term_id || a.classroom?.term),
            );
            const bTerm = terms.find(
              (t) => t.id === (b.term_id || b.classroom?.term),
            );
            const aActive = a.is_term_active ?? aTerm?.is_active;
            const bActive = b.is_term_active ?? bTerm?.is_active;
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;
            return (b.id || 0) - (a.id || 0);
          });

          const currentEnrollment = studentEnrollments[0];

          const classroom = classrooms.find(
            (item) =>
              item.id ===
              (currentEnrollment?.classroom ||
                currentEnrollment?.classroom?.id),
          );

          const className =
            classroom?.name || currentEnrollment?.classroom_name || "بدون کلاس";
          const classId =
            classroom?.id || currentEnrollment?.classroom || "none";

          let tuitionStatus = "بدون کلاس";
          let tuitionStatusClass = "unassigned";

          if (currentEnrollment) {
            if (currentEnrollment.is_paid) {
              tuitionStatus = "پرداخت شده (تسویه)";
              tuitionStatusClass = "paid";
            } else {
              tuitionStatus = "در انتظار پرداخت";
              tuitionStatusClass = "pending";
            }
          }

          return {
            id: user.id,
            username: user.username,
            name: getFullName(user),
            phone: user.phone_number || "-",
            className,
            classId,
            tuitionStatus,
            tuitionStatusClass,
          };
        }),
    [users, enrollments, classrooms, terms],
  );

  const classes = useMemo(() => {
    const uniqueClasses = students.reduce((acc, student) => {
      const exists = acc.some((item) => item.id === student.classId);

      if (!exists) {
        acc.push({
          id: student.classId,
          name: student.className,
        });
      }

      return acc;
    }, []);

    return [
      {
        id: "all",
        name: "همه کلاس‌ها",
      },
      ...uniqueClasses,
    ];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        String(student.id).toLowerCase().includes(normalizedSearch) ||
        student.username.toLowerCase().includes(normalizedSearch) ||
        student.phone.toLowerCase().includes(normalizedSearch) ||
        student.className.toLowerCase().includes(normalizedSearch);

      const matchesClass =
        selectedClass === "all" || student.classId === selectedClass;

      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, selectedClass]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / itemsPerPage),
  );

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageNumbers = useMemo(() => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }, [currentPage, totalPages]);

  const paginationStart =
    filteredStudents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const paginationEnd = Math.min(
    currentPage * itemsPerPage,
    filteredStudents.length,
  );

  return (
    <DashboardLayout
      role={roleTitle}
      title="مدیریت دانش آموزان"
      menuType={menuType}
    >
      <section className="admin-students-x7k2-section">
        <div className="admin-students-x7k2-header">
          <div className="admin-students-x7k2-heading">
            <div className="admin-students-x7k2-heading-icon">
              <Users size={26} />
            </div>

            <div>
              <h3 className="admin-students-x7k2-title">مدیریت دانش‌آموزان</h3>

              <p className="admin-students-x7k2-description">
                مشاهده و مدیریت اطلاعات دانش‌آموزان ثبت‌نام‌شده
              </p>
            </div>
          </div>

          <Link
            to={`/panel/${menuType}/students/new`}
            className="admin-students-x7k2-add-link"
          >
            <AnimatedButton variant="primary">
              <UserPlus size={18} />
              افزودن دانش‌آموز
            </AnimatedButton>
          </Link>
        </div>

        <div className="admin-students-x7k2-stats">
          <StatCard
            title="کل دانش‌آموزان"
            value={`${students.length} نفر`}
            icon={<Users size={23} />}
            color="red"
          />

          <StatCard
            title="کلاس‌های فعال"
            value={`${Math.max(classes.length - 1, 0)} کلاس`}
            icon={<BookOpen size={23} />}
            color="green"
          />

          <StatCard
            title="نمایش فعلی"
            value={`${filteredStudents.length} نفر`}
            icon={<GraduationCap size={23} />}
            color="blue"
          />
        </div>

        {/* ================= MAIN CARD ================= */}

        <div className="admin-students-x7k2-content">
          {/* Section Header */}

          <div className="admin-students-x7k2-content-header">
            <div>
              <h3>لیست دانش‌آموزان</h3>

              <p>اطلاعات دانش‌آموزان و کلاس‌های ثبت‌شده را مدیریت کنید.</p>
            </div>

            <span className="admin-students-x7k2-count">
              {filteredStudents.length} دانش‌آموز
            </span>
          </div>
          <div className="admin-students-x7k2-filters">
            <div className="admin-students-x7k2-search-wrapper">
              <Search size={18} className="admin-students-x7k2-search-icon" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="جستجو بر اساس نام، شناسه، شماره تماس یا کلاس..."
                className="admin-students-x7k2-search-input"
              />

              {searchTerm && (
                <button
                  type="button"
                  className="admin-students-x7k2-clear-search"
                  onClick={() => setSearchTerm("")}
                  aria-label="پاک کردن جستجو"
                >
                  ×
                </button>
              )}
            </div>

            <div className="admin-students-x7k2-select-wrapper">
              <Filter size={18} className="admin-students-x7k2-filter-icon" />

              <select
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
                className="admin-students-x7k2-select"
              >
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!loading && !error && filteredStudents.length > 0 && (
            <div className="admin-students-x7k2-result-info">
              <span>
                نمایش <strong>{paginationStart}</strong>
                {" تا "}
                <strong>{paginationEnd}</strong>
                {" از "}
                <strong>{filteredStudents.length}</strong>
                {" دانش‌آموز"}
              </span>

              {(searchTerm || selectedClass !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedClass("all");
                  }}
                >
                  حذف فیلترها
                </button>
              )}
            </div>
          )}
          {loading ? (
            <div className="admin-students-x7k2-loading">
              <div className="admin-students-x7k2-spinner" />

              <strong>در حال دریافت اطلاعات...</strong>

              <span>لطفاً چند لحظه صبر کنید</span>
            </div>
          ) : error ? (
            /* ================= ERROR ================= */

            <div className="admin-students-x7k2-empty error">
              <Users size={42} />

              <strong>دریافت اطلاعات با خطا مواجه شد</strong>

              <span>{error}</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            /* ================= EMPTY ================= */

            <div className="admin-students-x7k2-empty">
              <Search size={42} />

              <strong>دانش‌آموزی پیدا نشد</strong>

              <span>عبارت جستجو یا فیلتر کلاس را تغییر دهید.</span>

              {(searchTerm || selectedClass !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedClass("all");
                  }}
                >
                  حذف فیلترها
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="admin-students-x7k2-table-shell">
                <div className="admin-students-x7k2-table-scroll">
                  <table className="admin-students-x7k2-table">
                    <thead>
                      <tr>
                        <th>شناسه</th>
                        <th>نام دانش‌آموز</th>
                        <th>شماره موبایل</th>
                        <th>کلاس</th>
                        <th>شهریه</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedStudents.map((student) => (
                        <tr key={student.id}>
                          <td data-label="شناسه">
                            <span className="admin-students-x7k2-id">
                              #{student.id}
                            </span>
                          </td>

                          <td data-label="نام دانش‌آموز">
                            <div className="admin-students-x7k2-name">
                              <div className="admin-students-x7k2-avatar">
                                <GraduationCap size={18} />
                              </div>

                              <div>
                                <strong>{student.name}</strong>

                                <small>@{student.username}</small>
                              </div>
                            </div>
                          </td>

                          <td data-label="شماره موبایل">
                            <span className="admin-students-x7k2-phone">
                              <Phone size={15} />
                              {student.phone}
                            </span>
                          </td>

                          <td data-label="کلاس">
                            <span className="admin-students-x7k2-class-badge">
                              <BookOpen size={14} />
                              {student.className}
                            </span>
                          </td>

                          <td data-label="شهریه">
                            <span
                              className={`admin-students-x7k2-status admin-students-x7k2-status-${student.tuitionStatusClass}`}
                            >
                              {student.tuitionStatus}
                            </span>
                          </td>

                          <td data-label="عملیات">
                            <Link
                              to={`/panel/${menuType}/students/${student.id}`}
                            >
                              <AnimatedButton variant="secondary" size="small">
                                <Eye size={16} />
                                مشاهده
                              </AnimatedButton>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="admin-students-x7k2-mobile-list">
                {paginatedStudents.map((student) => (
                  <article
                    key={student.id}
                    className="admin-students-x7k2-student-card"
                  >
                    <div className="admin-students-x7k2-card-top">
                      <div className="admin-students-x7k2-card-user">
                        <div className="admin-students-x7k2-avatar">
                          <GraduationCap size={19} />
                        </div>

                        <div>
                          <strong>{student.name}</strong>

                          <span>شناسه #{student.id}</span>
                        </div>
                      </div>

                      <span
                        className={`admin-students-x7k2-status admin-students-x7k2-status-${student.tuitionStatusClass}`}
                      >
                        {student.tuitionStatus}
                      </span>
                    </div>

                    <div className="admin-students-x7k2-card-details">
                      <div>
                        <span>شماره موبایل</span>

                        <strong>
                          <Phone size={14} />
                          {student.phone}
                        </strong>
                      </div>

                      <div>
                        <span>کلاس</span>

                        <strong>
                          <BookOpen size={14} />
                          {student.className}
                        </strong>
                      </div>

                      <div>
                        <span>نام کاربری</span>

                        <strong>@{student.username}</strong>
                      </div>
                    </div>

                    <div className="admin-students-x7k2-card-footer">
                      <Link
                        to={`/panel/${menuType}/students/${student.id}`}
                        className="admin-students-x7k2-card-action"
                      >
                        <AnimatedButton
                          variant="secondary"
                          size="small"
                          icon={<ChevronLeft size={16} />}
                        >
                          <Eye size={16} />
                          مشاهده پرونده
                        </AnimatedButton>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="admin-students-x7k2-pagination">
                  <div className="admin-students-x7k2-pagination-info">
                    صفحه
                    <strong>{currentPage}</strong>
                    از
                    <strong>{totalPages}</strong>
                  </div>

                  <div className="admin-students-x7k2-pagination-controls">
                    <button
                      type="button"
                      className="admin-students-x7k2-page-btn admin-students-x7k2-first-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      title="صفحه اول"
                    >
                      <ChevronsRight size={17} />
                    </button>

                    <button
                      type="button"
                      className="admin-students-x7k2-page-btn"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      title="صفحه قبل"
                    >
                      <ChevronRight size={17} />
                    </button>

                    <div className="admin-students-x7k2-page-numbers">
                      {pageNumbers.map((page, index) =>
                        page === "..." ? (
                          <span
                            key={`dots-${index}`}
                            className="admin-students-x7k2-page-dots"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={page}
                            type="button"
                            className={`admin-students-x7k2-page-number ${
                              currentPage === page ? "active" : ""
                            }`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        ),
                      )}
                    </div>

                    <button
                      type="button"
                      className="admin-students-x7k2-page-btn"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      title="صفحه بعد"
                    >
                      <ChevronLeft size={17} />
                    </button>

                    <button
                      type="button"
                      className="admin-students-x7k2-page-btn admin-students-x7k2-first-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      title="صفحه آخر"
                    >
                      <ChevronsLeft size={17} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}

export default AdminStudents;
