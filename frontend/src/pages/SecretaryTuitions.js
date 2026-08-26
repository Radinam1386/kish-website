import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Users,
  CheckCircle2,
  Clock3,
  Search,
  Filter,
  Phone,
  BookOpen,
  Eye,
  CircleDollarSign,
  CalendarDays,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import StatCard from "../components/StatCard";
import { api, getFullName } from "../services/api";

import "./SecretaryTuitions.css";

function SecretaryTuitions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [usersData, enrollmentsData, classroomsData] = await Promise.all([
          api.users.list(),
          api.enrollments.list(),
          api.classrooms.list(),
        ]);

        if (!alive) return;

        const studentUsers = (usersData || []).filter((u) => u.role === "student");
        const classrooms = classroomsData || [];
        const enrollments = enrollmentsData || [];

        const studentList = studentUsers.map((u) => {
          const studentEnrollment = enrollments.find(
            (e) => e.student === u.id || e.student?.id === u.id,
          );
          const cls = studentEnrollment
            ? classrooms.find((c) => c.id === studentEnrollment.classroom)
            : null;

          const isPaid = u.is_active;
          const tuitionAmount = 4500000;
          const paidAmount = isPaid ? 4500000 : 0;
          const remainingAmount = isPaid ? 0 : 4500000;

          return {
            id: u.id,
            name: getFullName(u),
            phone: u.phone_number || "-",
            className: cls?.name || "بدون کلاس",
            tuition: tuitionAmount,
            paid: paidAmount,
            remaining: remainingAmount,
            status: isPaid ? "پرداخت شده" : "پرداخت نشده",
            statusType: isPaid ? "paid" : "unpaid",
            paymentDate: isPaid ? "تسویه شده" : "-",
          };
        });

        setStudents(studentList);
      } catch (err) {
        if (alive) setError(err.message || "خطا در دریافت اطلاعات مالی");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const totalTuition = students.reduce(
    (total, student) => total + student.tuition,
    0,
  );

  const totalPaid = students.reduce(
    (total, student) => total + student.paid,
    0,
  );

  const totalRemaining = students.reduce(
    (total, student) => total + student.remaining,
    0,
  );

  const paymentPercentage =
    totalTuition > 0 ? Math.round((totalPaid / totalTuition) * 100) : 0;

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.phone.includes(normalizedSearch) ||
        student.className.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        selectedStatus === "all" || student.statusType === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, selectedStatus]);

  const formatPrice = (price) => {
    return price.toLocaleString("fa-IR");
  };

  const handlePayment = (studentId) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) {
          return student;
        }

        return {
          ...student,
          paid: student.tuition,
          remaining: 0,
          status: "پرداخت شده",
          statusType: "paid",
          paymentDate: "امروز",
        };
      }),
    );
  };

  return (
    <DashboardLayout role="پنل منشی" title="مدیریت شهریه‌ها" menuType="secretary">
      <div className="admin-tuition-x8p4-root">
        {error && (
          <div style={{ color: "var(--danger, #ef4444)", marginBottom: "1rem", textAlign: "center" }}>
            {error}
          </div>
        )}

        <div className="admin-tuition-x8p4-stats">
          <StatCard
            title="کل شهریه"
            value={`${formatPrice(totalTuition)} تومان`}
            icon={<CreditCard size={23} />}
            color="red"
          />
          <StatCard
            title="دریافتی"
            value={`${formatPrice(totalPaid)} تومان`}
            icon={<CheckCircle2 size={23} />}
            color="green"
          />
          <StatCard
            title="مانده"
            value={`${formatPrice(totalRemaining)} تومان`}
            icon={<Clock3 size={23} />}
            color="orange"
          />
          <StatCard
            title="درصد وصول"
            value={`${paymentPercentage}٪`}
            icon={<Users size={23} />}
            color="blue"
          />
        </div>

        <section className="admin-tuition-x8p4-section">
          <div className="admin-tuition-x8p4-section-header">
            <div className="admin-tuition-x8p4-heading">
              <h3 className="admin-tuition-x8p4-title">
                لیست شهریه دانش‌آموزان
              </h3>

              <p className="admin-tuition-x8p4-description">
                مدیریت پرداخت‌ها، بدهی‌ها و وضعیت شهریه دانش‌آموزان
              </p>
            </div>
          </div>

          <div className="admin-tuition-x8p4-filter-bar">
            <div className="admin-tuition-x8p4-search-box">
              <Search size={18} />

              <input
                type="text"
                placeholder="جستجو با نام، شماره تماس یا کلاس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="admin-tuition-x8p4-status-filter">
              <Filter size={18} />

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="paid">پرداخت شده</option>
                <option value="unpaid">پرداخت نشده</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              در حال بارگذاری اطلاعات شهریه‌ها...
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="admin-tuition-x8p4-table-wrapper">
              <table className="admin-tuition-x8p4-table">
                <thead>
                  <tr>
                    <th>دانش‌آموز</th>
                    <th>شماره تماس</th>
                    <th>کلاس</th>
                    <th>مبلغ کل</th>
                    <th>پرداختی</th>
                    <th>مانده</th>
                    <th>وضعیت</th>
                    <th>تاریخ پرداخت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td data-label="دانش‌آموز">
                        <div className="admin-tuition-x8p4-student-cell">
                          <div className="admin-tuition-x8p4-avatar">
                            {student.name.charAt(0)}
                          </div>

                          <div className="admin-tuition-x8p4-student-info">
                            <strong>{student.name}</strong>

                            <span>کد: {student.id}</span>
                          </div>
                        </div>
                      </td>

                      <td data-label="شماره تماس">
                        <span className="admin-tuition-x8p4-phone">
                          <Phone size={14} />
                          {student.phone}
                        </span>
                      </td>

                      <td data-label="کلاس">
                        <span className="admin-tuition-x8p4-class-badge">
                          <BookOpen size={14} />
                          {student.className}
                        </span>
                      </td>

                      <td data-label="مبلغ کل">
                        <strong className="admin-tuition-x8p4-total-price">
                          {formatPrice(student.tuition)}
                        </strong>

                        <small>تومان</small>
                      </td>

                      <td data-label="پرداختی">
                        <strong className="admin-tuition-x8p4-paid-price">
                          {formatPrice(student.paid)}
                        </strong>

                        <small>تومان</small>
                      </td>

                      <td data-label="مانده">
                        <strong
                          className={
                            student.remaining > 0
                              ? "admin-tuition-x8p4-remaining-price"
                              : "admin-tuition-x8p4-zero-price"
                          }
                        >
                          {formatPrice(student.remaining)}
                        </strong>

                        <small>تومان</small>
                      </td>

                      <td data-label="وضعیت">
                        <span
                          className={`admin-tuition-x8p4-status ${student.statusType}`}
                        >
                          {student.status}
                        </span>
                      </td>

                      <td data-label="تاریخ پرداخت">
                        <span className="admin-tuition-x8p4-date">
                          <CalendarDays size={14} />
                          {student.paymentDate}
                        </span>
                      </td>

                      <td data-label="عملیات">
                        <div className="admin-tuition-x8p4-actions">
                          {student.remaining > 0 && (
                            <AnimatedButton
                              variant="primary"
                              size="small"
                              onClick={() => handlePayment(student.id)}
                            >
                              <CircleDollarSign size={15} />
                              ثبت پرداخت
                            </AnimatedButton>
                          )}

                          <Link to={`/panel/secretary/students/${student.id}`}>
                            <AnimatedButton variant="secondary" size="small">
                              <Eye size={15} />
                              مشاهده
                            </AnimatedButton>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-tuition-x8p4-empty">
              <CreditCard size={42} />

              <h4>موردی پیدا نشد</h4>

              <p>عبارت جستجو یا وضعیت انتخابی را تغییر دهید.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default SecretaryTuitions;
