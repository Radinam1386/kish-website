import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Edit3,
  Eye,
  Lock,
  Plus,
  Search,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import "./SecretaryStudents.css";
import { AnimatedButton } from "../components/AnimatedButton";
import StatCard from "../components/StatCard";
import { api } from "../services/api";

function SecretaryStudents() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadStudents() {
      try {
        const data = await api.users.list();
        if (!alive) return;
        setUsers(data);
      } catch (err) {
        if (alive) setError(err.message || "دریافت دانش‌آموزان ناموفق بود.");
      }
    }

    loadStudents();

    return () => {
      alive = false;
    };
  }, []);

  const students = useMemo(
    () =>
      users
        .filter((user) => user.role === "student")
        .map((user) => ({
          id: user.id,
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          nationalId: "-",
          phone: user.phone_number || "-",
          email: user.email || "",
          username: user.username,
          level: "",
          status: user.is_active ? "active" : "inactive",
          registeredAt: "-",
        })),
    [users],
  );

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        `${student.firstName} ${student.lastName}`
          .toLowerCase()
          .includes(searchValue) ||
        student.nationalId.includes(searchValue) ||
        student.phone.includes(searchValue) ||
        student.username.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  const handleDelete = async (id) => {
    const student = students.find((item) => item.id === id);

    if (!student) return;

    const confirmed = window.confirm(
      `آیا از حذف ${student.firstName} ${student.lastName} مطمئن هستید؟`,
    );

    if (!confirmed) return;

    try {
      await api.users.remove(id);
      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (err) {
      alert(err.message || "حذف دانش‌آموز ناموفق بود.");
    }
  };

  return (
    <DashboardLayout role="منشی" title="دانش‌آموزان" menuType="secretary">
      <div className="secretary-students-page">
        <section className="secretary-students-header">
          <div className="secretary-students-heading">
            <div className="secretary-students-heading-icon">
              <UsersRound size={24} />
            </div>

            <div>
              <h2>مدیریت دانش‌آموزان</h2>
              <p>مشاهده، ثبت و مدیریت اطلاعات دانش‌آموزان</p>
            </div>
          </div>

          <Link to="/panel/secretary/students/new">
            <AnimatedButton variant="primary" icon={<Plus size={19} />}>
              افزودن دانش‌آموز
            </AnimatedButton>
          </Link>
        </section>
        <section className="secretary-students-stats">
          <StatCard
            title="کل دانش‌آموزان"
            value={`${students.length} دانش آموز`}
            icon={<UsersRound />}
            color="red"
          />
          <StatCard
            title="دانش آموز فعال"
            value={
              students.filter((student) => student.status === "active").length
            }
            icon={<UserRound />}
            color="light-green"
          />
          <StatCard
            title="دانش آموز غیرفعال"
            value={
              students.filter((student) => student.status === "inactive").length
            }
            icon={<UserRound />}
            color="light-orange"
          />
        </section>
        <section className="secretary-students-panel">
          <div className="secretary-students-filters">
            <div className="secretary-students-search">
              <Search size={19} />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو نام، کد ملی، موبایل یا نام کاربری..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="secretary-students-status-filter"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>

          {/* ================= Table ================= */}

          <div className="secretary-students-table-wrapper">
            <table className="secretary-students-table">
              <thead>
                <tr>
                  <th>دانش‌آموز</th>
                  <th>کد ملی</th>
                  <th>شماره موبایل</th>
                  <th>نام کاربری</th>
                  <th>سطح</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>

              <tbody>
                {error ? (
                  <tr>
                    <td colSpan="7" className="secretary-students-empty-row">
                      {error}
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="secretary-students-user">
                          <div className="secretary-students-avatar">
                            {student.firstName.charAt(0)}
                          </div>

                          <div>
                            <strong>
                              {student.firstName} {student.lastName}
                            </strong>

                            <span>ثبت‌نام: {student.registeredAt}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="secretary-students-ltr">
                          {student.nationalId}
                        </span>
                      </td>

                      <td>
                        <span className="secretary-students-ltr">
                          {student.phone}
                        </span>
                      </td>

                      <td>
                        <div className="secretary-students-username">
                          <Lock size={14} />
                          <span>{student.username}</span>
                        </div>
                      </td>

                      <td>
                        {student.level ? (
                          <span className="secretary-students-level">
                            {student.level}
                          </span>
                        ) : (
                          <span className="secretary-students-empty">
                            تعیین نشده
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`secretary-students-status ${
                            student.status === "active"
                              ? "is-active"
                              : "is-inactive"
                          }`}
                        >
                          {student.status === "active" ? "فعال" : "غیرفعال"}
                        </span>
                      </td>

                      <td>
                        <div className="secretary-students-actions">
                          <Link
                            to={`/panel/secretary/students/${student.id}`}
                            className="secretary-students-action view"
                            title="مشاهده"
                          >
                            <Eye size={17} />
                          </Link>

                          <Link
                            to={`/panel/secretary/students/${student.id}/edit`}
                            className="secretary-students-action edit"
                            title="ویرایش"
                          >
                            <Edit3 size={17} />
                          </Link>

                          <button
                            type="button"
                            className="secretary-students-action delete"
                            onClick={() => handleDelete(student.id)}
                            title="حذف"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="secretary-students-empty-row">
                      <UsersRound size={36} />

                      <strong>دانش‌آموزی پیدا نشد</strong>

                      <span>عبارت جستجو یا فیلتر را تغییر دهید.</span>
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

export default SecretaryStudents;
