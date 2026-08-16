import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Eye,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import "./StudentTuition.css";

function StudentTuition() {
  const financeSummary = {
    totalTuition: "۱۲,۵۰۰,۰۰۰ ریال",
    paidAmount: "۸,۵۰۰,۰۰۰ ریال",
    remainingDebt: "۴,۰۰۰,۰۰۰ ریال",
    statusText: "بدهکار (نیاز به تسویه)",
    statusClass: "debt-warning",
  };

  const invoices = [
    {
      id: "INV-40501",
      title: "شهریه ترم بهار ۱۴۰۵",
      course: "دوره English A2",
      amount: "۷,۵۰۰,۰۰۰ ریال",
      dueDate: "۱۴۰۵/۰۲/۱۵",
      status: "پرداخت شده",
      statusClass: "status-paid",
    },
    {
      id: "INV-40502",
      title: "شهریه ترم تابستان ۱۴۰۵",
      course: "دوره Conversation B1",
      amount: "۵,۰۰۰,۰۰۰ ریال",
      dueDate: "۱۴۰۵/۰۵/۱۰",
      status: "پرداخت ناموفق / معلق",
      statusClass: "status-pending",
    },
  ];

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title="وضعیت شهریه و مالی"
      menuType="student"
    >
      <div className="student-tuition-stats">
        <StatCard
          title="کل شهریه ترم"
          value={financeSummary.totalTuition}
          icon={<DollarSign size={23} />}
        />

        <StatCard
          title="مجموع پرداخت‌شده"
          value={financeSummary.paidAmount}
          icon={<CheckCircle2 size={23} />}
        />

        <StatCard
          title="باقیمانده بدهی"
          value={financeSummary.remainingDebt}
          icon={<AlertTriangle size={23} />}
        />
      </div>

      <section className="admin-section tuition-invoices-section">
        <div className="admin-section-header tuition-section-header mb-4">
          <div className="tuition-section-heading">
            <div className="tuition-section-icon">
              <Receipt size={20} />
            </div>

            <div>
              <h3 className="admin-section-title mt-4">
                فاکتورهای صادر شده
              </h3>

              <p className="admin-section-description">
                لیست صورت‌حساب‌های آموزشی دوره شما
              </p>
            </div>
          </div>

        </div>

        <div className="tuition-table-wrapper">
          <table className="admin-table tuition-table">
            <thead>
              <tr>
                <th>فاکتور</th>
                <th>دوره</th>
                <th>مبلغ</th>
                <th>مهلت پرداخت</th>
                <th>وضعیت</th>
                <th>عملیات</th>
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

                        <span>
                          {invoice.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="tuition-course">
                      {invoice.course}
                    </span>
                  </td>

                  <td>
                    <strong className="tuition-amount">
                      {invoice.amount}
                    </strong>
                  </td>

                  <td>
                    <span className="tuition-date">
                      {invoice.dueDate}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${invoice.statusClass}`}
                    >
                      {invoice.status}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="tuition-view-btn"
                      title="مشاهده فاکتور"
                    >
                      <Eye size={16} />
                      <span>مشاهده</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default StudentTuition;