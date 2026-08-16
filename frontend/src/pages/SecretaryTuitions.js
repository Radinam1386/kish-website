import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
  CreditCard,
  Landmark,
  Hash,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
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
      title: "شهریه ترم بهار ۱۴۰۵ (دوره English A2)",
      amount: "۷,۵۰۰,۰۰۰ ریال",
      dueDate: "۱۴۰۵/۰۲/۱۵",
      status: "پرداخت شده",
      statusClass: "status-paid",
    },
    {
      id: "INV-40502",
      title: "شهریه ترم تابستان ۱۴۰۵ (دوره Conversation B1)",
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
      <div className="student-tuition-page">
        <section className="tuition-stats-grid">
          <article className="tuition-stat-card first">
            <div className="tuition-stat-icon primary-bg">
              <DollarSign size={24} />
            </div>

            <div className="tuition-stat-content">
              <span>کل شهریه ترم</span>
              <strong>{financeSummary.totalTuition}</strong>
            </div>
          </article>

          <article className="tuition-stat-card second">
            <div className="tuition-stat-icon primary-bg">
              <CheckCircle2 size={24} />
            </div>

            <div className="tuition-stat-content">
              <span>مجموع پرداخت‌شده</span>
              <strong>{financeSummary.paidAmount}</strong>
            </div>
          </article>

          <article className="tuition-stat-card third">
            <div className="tuition-stat-icon debt-bg">
              <AlertTriangle size={24} />
            </div>

            <div className="tuition-stat-content">
              <span>باقیمانده بدهی</span>
              <strong className="debt-highlight">
                {financeSummary.remainingDebt}
              </strong>
            </div>
          </article>
        </section>

        <section className="tuition-section">
          <div className="tuition-section-header">
            <div>
              <span className="tuition-kicker">
                <Receipt size={15} />
                فاکتورها
              </span>

              <h3 className="tuition-section-title">فاکتورهای صادر شده</h3>

              <p className="tuition-section-desc">
                لیست صورت‌حساب‌های آموزشی دوره شما
              </p>
            </div>

            <span className={`tuition-status-pill ${financeSummary.statusClass}`}>
              {financeSummary.statusText}
            </span>
          </div>

          <div className="invoice-list">
            {invoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

/* ===== Invoice Card ===== */
function InvoiceCard({ invoice }) {
  return (
    <article className="invoice-card">
      <div className="invoice-accent" />

      <div className="invoice-head">
        <div className="invoice-icon-wrap">
          <Receipt size={22} />
        </div>

        <div className="invoice-title-box">
          <h4>{invoice.title}</h4>
          <span>شناسه فاکتور: {invoice.id}</span>
        </div>
      </div>

      <div className="invoice-meta">
        <div className="invoice-meta-item">
          <span>
            <DollarSign size={14} />
            مبلغ فاکتور
          </span>
          <strong>{invoice.amount}</strong>
        </div>

        <div className="invoice-meta-item">
          <span>
            <CalendarDays size={14} />
            مهلت پرداخت
          </span>
          <strong>{invoice.dueDate}</strong>
        </div>
      </div>

      <div className="invoice-foot">
        <span className={`status-badge ${invoice.statusClass}`}>
          {invoice.status}
        </span>
      </div>
    </article>
  );
}

export default StudentTuition;
