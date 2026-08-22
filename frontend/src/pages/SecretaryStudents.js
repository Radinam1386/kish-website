import { useMemo, useState } from "react";
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

function SecretaryStudents() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [students, setStudents] = useState([
    {
      id: 1,
      firstName: "علی",
      lastName: "محمدی",
      nationalId: "1234567890",
      phone: "09123456789",
      email: "ali@example.com",
      username: "ali.mohammadi",
      password: "jS*dvn8LDsMa",
      level: "Intermediate",
      status: "active",
      registeredAt: "1405/05/12",
    },
    {
      id: 2,
      firstName: "سارا",
      lastName: "احمدی",
      nationalId: "0987654321",
      phone: "09121234567",
      email: "sara@example.com",
      username: "sara.ahmadi",
      password: "TKr!Pz5BuLLx",
      level: "Elementary",
      status: "active",
      registeredAt: "1405/05/18",
    },
    {
      id: 3,
      firstName: "محمد",
      lastName: "رضایی",
      nationalId: "1122334455",
      phone: "09351234567",
      email: "mohammad@example.com",
      username: "m.rezaei",
      password: "o&jEj8UHN*9X",
      level: "inactive",
      registeredAt: "1405/04/21",
    },
  ]);

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

  const handleDelete = (id) => {
    const student = students.find((item) => item.id === id);

    if (!student) return;

    const confirmed = window.confirm(
      `آیا از حذف ${student.firstName} ${student.lastName} مطمئن هستید؟`,
    );

    if (!confirmed) return;

    setStudents((prev) => prev.filter((student) => student.id !== id));
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
                {filteredStudents.length > 0 ? (
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
