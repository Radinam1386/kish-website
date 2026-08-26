import React, { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Receipt,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { api, storage } from "../services/api";
import "./StudentTuition.css";

function StudentTuition() {
  const currentUser = storage.getUser();
  const [classrooms, setClassrooms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        const [classroomsData, enrollmentsData] = await Promise.all([
          api.classrooms.list(),
          api.enrollments.list(),
        ]);

        if (!alive) return;
        setClassrooms(classroomsData || []);
        setEnrollments(enrollmentsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const enrolledClasses = useMemo(() => {
    if (!currentUser) return [];
    const myEnrollments = enrollments.filter(
      (e) => e.student === currentUser.id || e.student?.id === currentUser.id,
    );
    return myEnrollments
      .map((e) => classrooms.find((c) => c.id === e.classroom))
      .filter(Boolean);
  }, [currentUser, enrollments, classrooms]);

  const isPaid = currentUser?.is_active;
  const tuitionPerClass = 4500000;
  const count = Math.max(1, enrolledClasses.length);
  const totalAmount = count * tuitionPerClass;
  const paidAmount = isPaid ? totalAmount : 0;
  const remainingDebt = isPaid ? 0 : totalAmount;

  const formatPrice = (val) => new Intl.NumberFormat("fa-IR").format(val);

  const invoices = useMemo(() => {
    if (!enrolledClasses.length) {
      return [
        {
          id: `INV-${currentUser?.id || 101}`,
          title: "شهریه ترم جاری",
          course: "دوره عمومی زبان",
          amount: `${formatPrice(tuitionPerClass)} تومان`,
          dueDate: "پایان ترم",
          status: isPaid ? "پرداخت شده" : "در انتظار پرداخت",
          statusClass: isPaid ? "status-paid" : "status-pending",
        },
      ];
    }

    return enrolledClasses.map((cls) => ({
      id: `INV-${cls.id}-${currentUser?.id || 100}`,
      title: `شهریه ${cls.name}`,
      course: cls.name,
      amount: `${formatPrice(tuitionPerClass)} تومان`,
      dueDate: "پایان ترم",
      status: isPaid ? "پرداخت شده" : "در انتظار پرداخت",
      statusClass: isPaid ? "status-paid" : "status-pending",
    }));
  }, [enrolledClasses, currentUser, isPaid]);

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title="وضعیت شهریه و مالی"
      menuType="student"
    >
      <div className="student-tuition-stats">
        <StatCard
          title="کل شهریه ترم"
          value={`${formatPrice(totalAmount)} تومان`}
          icon={<DollarSign />}
          color="red"
        />

        <StatCard
          title="مجموع پرداخت‌شده"
          value={`${formatPrice(paidAmount)} تومان`}
          icon={<CheckCircle2 />}
          color="green"
        />

        <StatCard
          title="باقیمانده بدهی"
          value={`${formatPrice(remainingDebt)} تومان`}
          icon={<AlertTriangle />}
          color="light-orange"
        />
      </div>

      <section className="admin-section tuition-invoices-section">
        <div className="admin-section-header tuition-section-header mb-4">
          <div className="tuition-section-heading">
            <div className="tuition-section-icon">
              <Receipt size={20} />
            </div>

            <div>
              <h3 className="admin-section-title mt-4">فاکتورهای صادر شده</h3>

              <p className="admin-section-description">
                لیست صورت‌حساب‌های آموزشی دوره‌های ثبت‌نامی شما
              </p>
            </div>
          </div>
        </div>

        <div className="tuition-table-wrapper">
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              در حال بارگذاری فاکتورها...
            </div>
          ) : (
            <table className="admin-table tuition-table">
              <thead>
                <tr>
                  <th>فاکتور</th>
                  <th>دوره</th>
                  <th>مبلغ</th>
                  <th>مهلت پرداخت</th>
                  <th>وضعیت</th>
                </tr>
              </thead>

              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <div className="tuition-invoice-cell">
                        <div className="tuition-invoice-icon">
                          <Receipt size={18} />
                        </div>

                        <div>
                          <strong>{invoice.title}</strong>

                          <span>{invoice.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="tuition-course">{invoice.course}</span>
                    </td>

                    <td>
                      <strong className="tuition-amount">{invoice.amount}</strong>
                    </td>

                    <td>
                      <span className="tuition-date">{invoice.dueDate}</span>
                    </td>

                    <td>
                      <span className={`status-badge ${invoice.statusClass}`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}

export default StudentTuition;
