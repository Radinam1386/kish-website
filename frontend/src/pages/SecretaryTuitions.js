import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
  CalendarDays,
  CreditCard,
  Hash,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import "./SecretaryTuitions.css";
import StatCard from "../components/StatCard";
import { redirect } from "react-router-dom";

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

  const transactions = [
    {
      id: "TRX-85021",
      title: "پرداخت شهریه",
      description: "شهریه ترم بهار ۱۴۰۵",
      date: "۱۴۰۵/۰۲/۱۰",
      method: "درگاه آنلاین",
      amount: "۷,۵۰۰,۰۰۰ ریال",
      status: "موفق",
      statusClass: "status-paid",
    },
    {
      id: "TRX-85022",
      title: "پرداخت شهریه",
      description: "بخشی از شهریه ترم تابستان",
      date: "۱۴۰۵/۰۵/۰۸",
      method: "درگاه آنلاین",
      amount: "۱,۰۰۰,۰۰۰ ریال",
      status: "موفق",
      statusClass: "status-paid",
    },
  ];

  return (
    <DashboardLayout
      role="پنل منشی"
      title="وضعیت شهریه و مالی"
      menuType="secretary"
    >
      <div className="student-tuition-page">
        <section className="tuition-stats-grid">
          <StatCard
            title="کل شهریه ترم"
            value={financeSummary.totalTuition}
            icon={<DollarSign />}
            color="red"
          />
          <StatCard
            title="مجموع پرداخت‌شده"
            value={financeSummary.paidAmount}
            icon={<CheckCircle2 />}
            color="green"
          />
          <StatCard
            title="باقیمانده بدهی"
            value={financeSummary.remainingDebt}
            icon={<AlertTriangle />}
            color="light-orange"
          />
        </section>
        <section className="tuition-section">
          <div className="tuition-section-header">
            <div className="tuition-heading-box">
              <span className="tuition-kicker">
                <Receipt size={15} />
                فاکتورها
              </span>

              <h3 className="tuition-section-title">فاکتورهای صادر شده</h3>

              <p className="tuition-section-desc">
                لیست صورت‌حساب‌های آموزشی دوره شما
              </p>
            </div>

            <span
              className={`tuition-status-pill ${financeSummary.statusClass}`}
            >
              {financeSummary.statusText}
            </span>
          </div>

          <div className="invoice-list">
            {invoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </section>

        {/* ==============================
            Transactions
        ============================== */}

        <section className="tuition-section">
          <div className="tuition-section-header">
            <div className="tuition-heading-box">
              <span className="tuition-kicker">
                <CreditCard size={15} />
                تراکنش‌ها
              </span>

              <h3 className="tuition-section-title">سوابق پرداخت</h3>

              <p className="tuition-section-desc">
                تاریخچه پرداخت‌های ثبت‌شده برای حساب شما
              </p>
            </div>
          </div>

          <div className="transaction-list">
            {transactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

/* =====================================================
   Invoice Card
===================================================== */

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

          <span className="invoice-course">{invoice.course}</span>

          <span className="invoice-id">
            <Hash size={12} />
            {invoice.id}
          </span>
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

        <button type="button" className="invoice-download-btn">
          <Download size={15} />
          دانلود فاکتور
        </button>
      </div>
    </article>
  );
}

/* =====================================================
   Transaction Card
===================================================== */

function TransactionCard({ transaction }) {
  return (
    <article className="transaction-card">
      <div className="transaction-main">
        <div className="trx-icon-wrap">
          <CreditCard size={21} />
        </div>

        <div className="trx-info">
          <div className="trx-title-row">
            <strong>{transaction.title}</strong>

            <span className={`status-badge ${transaction.statusClass}`}>
              {transaction.status}
            </span>
          </div>

          <p>{transaction.description}</p>

          <div className="trx-details">
            <span>
              <CalendarDays size={13} />
              {transaction.date}
            </span>

            <span>
              <CreditCard size={13} />
              {transaction.method}
            </span>

            <span>
              <Hash size={13} />
              {transaction.id}
            </span>
          </div>
        </div>
      </div>

      <div className="trx-amount">
        <strong>{transaction.amount}</strong>

        <button
          type="button"
          className="icon-download-btn"
          aria-label="دانلود رسید"
        >
          <Download size={17} />
        </button>
      </div>
    </article>
  );
}

export default StudentTuition;
