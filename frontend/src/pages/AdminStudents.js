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
} from "lucide-react";
import "./AdminStudents.css";
import { AnimatedButton } from "../components/AnimatedButton";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { api, getFullName } from "../services/api";
import { Link } from "react-router-dom";

function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        const [usersData, enrollmentsData, classroomsData] = await Promise.all([
          api.users.list(),
          api.enrollments.list(),
          api.classrooms.list(),
        ]);

        if (!alive) return;
        setUsers(usersData);
        setEnrollments(enrollmentsData);
        setClassrooms(classroomsData);
      } catch (err) {
        if (alive) setError(err.message || "دریافت دانش‌آموزان ناموفق بود.");
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
          const enrollment = enrollments.find(
            (item) => item.student === user.id,
          );
          const classroom = classrooms.find(
            (item) => item.id === enrollment?.classroom,
          );

          return {
            id: user.id,
            username: user.username,
            name: getFullName(user),
            phone: user.phone_number || "-",
            className: classroom?.name || "بدون کلاس",
            classId: classroom?.id || "none",
            tuitionStatus: "ثبت نشده",
            tuitionStatusClass: "pending",
          };
        }),
    [users, enrollments, classrooms],
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
        student.name.toLowerCase().includes(normalizedSearch) ||
        String(student.id).toLowerCase().includes(normalizedSearch) ||
        student.username.toLowerCase().includes(normalizedSearch) ||
        student.phone.includes(normalizedSearch) ||
        student.className.toLowerCase().includes(normalizedSearch);

      const matchesClass =
        selectedClass === "all" || student.classId === selectedClass;

      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, selectedClass]);

  return (
    <DashboardLayout
      role="پنل مدیریت"
      title="مدیریت دانش آموزان"
      menuType="admin"
    >
      <section className="admin-students-x7k2-section">
        <div className="admin-students-x7k2-header">
          <div className="admin-students-x7k2-heading">
            <div className="admin-students-x7k2-heading-icon">
              <Users size={22} />
            </div>

            <div>
              <h3 className="admin-students-x7k2-title">مدیریت دانش‌آموزان</h3>

              <p className="admin-students-x7k2-description">
                مشاهده و مدیریت اطلاعات دانش‌آموزان ثبت‌نام‌شده
              </p>
            </div>
          </div>
          <Link to={"/panel/admin/students/new"}>
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
            value={`${classes.length - 1} کلاس`}
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
                {error ? (
                  <tr>
                    <td colSpan="6" className="admin-students-x7k2-empty">
                      {error}
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td data-label="شناسه">
                        <span className="admin-students-x7k2-id">
                          {student.id}
                        </span>
                      </td>

                      <td data-label="نام دانش‌آموز">
                        <div className="admin-students-x7k2-name">
                          <div className="admin-students-x7k2-avatar">
                            <GraduationCap size={18} />
                          </div>

                          <strong>{student.name}</strong>
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
                        <Link to={`/panel/admin/students/${student.id}`}>
                          <AnimatedButton variant="secondary" size="small">
                            <Eye size={16} />
                            مشاهده
                          </AnimatedButton>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="admin-students-x7k2-empty">
                      <Search size={36} />

                      <strong>دانش‌آموزی پیدا نشد</strong>

                      <span>عبارت جستجو یا فیلتر کلاس را تغییر دهید.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default AdminStudents;
