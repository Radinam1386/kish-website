import React, { useMemo, useState } from "react";
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

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";

import "./AdminTuition.css";
import StatCard from "../components/StatCard";

function AdminTuition() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [students, setStudents] = useState([
    {
      id: 1,
      name: "علی محمدی",
      phone: "۰۹۱۲۰۰۰۰۰۰۰",
      className: "English A2",
      tuition: 4500000,
      paid: 4500000,
      remaining: 0,
      status: "پرداخت شده",
      statusType: "paid",
      paymentDate: "۱۴۰۳/۰۹/۱۸",
    },
    {
      id: 2,
      name: "سارا احمدی",
      phone: "۰۹۱۲۱۱۱۱۱۱۱",
      className: "Kids Starter",
      tuition: 3800000,
      paid: 2000000,
      remaining: 1800000,
      status: "در انتظار",
      statusType: "pending",
      paymentDate: "۱۴۰۳/۰۹/۱۰",
    },
    {
      id: 3,
      name: "محمد کریمی",
      phone: "۰۹۱۲۲۲۲۲۲۲۲",
      className: "English B1",
      tuition: 5200000,
      paid: 5200000,
      remaining: 0,
      status: "پرداخت شده",
      statusType: "paid",
      paymentDate: "۱۴۰۳/۰۹/۱۹",
    },
    {
      id: 4,
      name: "نگار رضایی",
      phone: "۰۹۱۲۳۳۳۳۳۳۳",
      className: "Conversation B1",
      tuition: 4800000,
      paid: 2500000,
      remaining: 2300000,
      status: "بدهکار",
      statusType: "debt",
      paymentDate: "۱۴۰۳/۰۹/۰۵",
    },
    {
      id: 5,
      name: "امیرحسین اکبری",
      phone: "۰۹۱۲۴۴۴۴۴۴۴",
      className: "English A2",
      tuition: 4500000,
      paid: 0,
      remaining: 4500000,
      status: "پرداخت نشده",
      statusType: "unpaid",
      paymentDate: "-",
    },
    {
      id: 6,
      name: "فاطمه کریمی",
      phone: "۰۹۱۲۵۵۵۵۵۵۵",
      className: "Kids Starter",
      tuition: 3800000,
      paid: 3800000,
      remaining: 0,
      status: "پرداخت شده",
      statusType: "paid",
      paymentDate: "۱۴۰۳/۰۹/۲۰",
    },
  ]);

  /* ========================================
     Statistics
  ======================================== */

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

  const paidStudents = students.filter(
    (student) => student.statusType === "paid",
  ).length;

  const pendingStudents = students.filter(
    (student) => student.statusType !== "paid",
  ).length;

  const paymentPercentage =
    totalTuition > 0 ? Math.round((totalPaid / totalTuition) * 100) : 0;

  /* ========================================
     Filtering
  ======================================== */

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim();

    return students.filter((student) => {
      const matchesSearch =
        student.name.includes(normalizedSearch) ||
        student.phone.includes(normalizedSearch) ||
        student.className.includes(normalizedSearch);

      const matchesStatus =
        selectedStatus === "all" || student.statusType === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, selectedStatus]);

  /* ========================================
     Format Price
  ======================================== */

  const formatPrice = (price) => {
    return price.toLocaleString("fa-IR");
  };

  /* ========================================
     Change Payment Status
  ======================================== */

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
    <DashboardLayout role="پنل مدیریت" title="مدیریت شهریه‌ها" menuType="admin">
      <div className="admin-tuition-x8p4-root">
        {/* ========================================
            Statistics
        ======================================== */}

        <div className="admin-tuition-x8p4-stats">
          <StatCard
            title="کل شهریه"
            value={`${formatPrice(totalTuition)} تومان`}
            icon={<CreditCard size={23} />}
          />
          <StatCard
            title="دریافتی"
            value={`${formatPrice(totalPaid)} تومان`}
            icon={<CheckCircle2 size={23} />}
          />
          <StatCard
            title="مانده"
            value={`${formatPrice(totalRemaining)} تومان`}
            icon={<Clock3 size={23} />}
          />
          <StatCard
            title="درصد وصول"
            value={`${paymentPercentage}٪`}
            icon={<Users size={23} />}
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

            <div className="admin-tuition-x8p4-header-badge">
              <Users size={17} />

              <span>{students.length} دانش‌آموز</span>
            </div>
          </div>

          {/* ========================================
              Filters
          ======================================== */}

          <div className="admin-tuition-x8p4-filters">
            <div className="admin-tuition-x8p4-search-wrapper">
              <Search size={18} className="admin-tuition-x8p4-search-icon" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="جستجو بر اساس نام، شماره تماس یا کلاس..."
                className="admin-tuition-x8p4-search-input"
              />
            </div>

            <div className="admin-tuition-x8p4-select-wrapper">
              <Filter size={18} className="admin-tuition-x8p4-filter-icon" />

              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="admin-tuition-x8p4-select"
              >
                <option value="all">همه وضعیت‌ها</option>

                <option value="paid">پرداخت شده</option>

                <option value="pending">در انتظار</option>

                <option value="debt">بدهکار</option>

                <option value="unpaid">پرداخت نشده</option>
              </select>
            </div>
          </div>

          {/* ========================================
              Summary
          ======================================== */}

          <div className="admin-tuition-x8p4-summary">
            <div>
              <span>پرداخت شده</span>
              <strong className="green">{paidStudents} نفر</strong>
            </div>

            <div>
              <span>نیازمند پیگیری</span>
              <strong className="orange">{pendingStudents} نفر</strong>
            </div>
          </div>

          {/* ========================================
              Table
          ======================================== */}

          {filteredStudents.length > 0 ? (
            <div className="admin-tuition-x8p4-table-wrapper">
              <table className="admin-tuition-x8p4-table">
                <thead>
                  <tr>
                    <th>دانش‌آموز</th>
                    <th>کلاس</th>
                    <th>شهریه</th>
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
                        <div className="admin-tuition-x8p4-student">
                          <div className="admin-tuition-x8p4-avatar">
                            {student.name.charAt(0)}
                          </div>

                          <div>
                            <strong>{student.name}</strong>

                            <span>
                              <Phone size={13} />
                              {student.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td data-label="کلاس">
                        <span className="admin-tuition-x8p4-class-badge">
                          <BookOpen size={14} />
                          {student.className}
                        </span>
                      </td>

                      <td data-label="شهریه">
                        <strong className="admin-tuition-x8p4-price">
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

                          <AnimatedButton variant="secondary" size="small">
                            <Eye size={15} />
                            مشاهده
                          </AnimatedButton>
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

export default AdminTuition;
