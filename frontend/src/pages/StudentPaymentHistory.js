import React, { useMemo, useState } from "react";
import {
  Search,
  ReceiptText,
  CheckCircle2,
  XCircle,
  Clock3,
  Eye,
  X,
  CreditCard,
  CalendarDays,
  Hash,
  BookOpen,
  Filter,
} from "lucide-react";
import "./StudentPaymentHistory.css";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

// داده‌های آزمایشی؛ بعداً با API بک‌اند جایگزین می‌شوند.
const DEMO_PAYMENTS = [
  {
    id: 1001,
    trackingCode: "KP-1405-00125",
    className: "زبان انگلیسی سطح Elementary",
    term: "ترم پاییز ۱۴۰۵",
    amount: 2500000,
    date: "۱۴۰۵/۰۸/۱۰",
    time: "۱۴:۳۵",
    status: "success",
    gateway: "زرین‌پال",
  },
  {
    id: 1002,
    trackingCode: "KP-1405-00118",
    className: "زبان انگلیسی سطح Elementary",
    term: "ترم پاییز ۱۴۰۵",
    amount: 2500000,
    date: "۱۴۰۵/۰۸/۰۵",
    time: "۱۱:۲۰",
    status: "failed",
    gateway: "زرین‌پال",
  },
  {
    id: 1003,
    trackingCode: "KP-1405-00092",
    className: "مکالمه پیشرفته",
    term: "ترم تابستان ۱۴۰۵",
    amount: 3200000,
    date: "۱۴۰۵/۰۶/۲۰",
    time: "۱۷:۱۰",
    status: "success",
    gateway: "زرین‌پال",
  },
  {
    id: 1004,
    trackingCode: "KP-1405-00075",
    className: "مکالمه پیشرفته",
    term: "ترم تابستان ۱۴۰۵",
    amount: 3200000,
    date: "۱۴۰۵/۰۶/۱۵",
    time: "۱۰:۴۵",
    status: "pending",
    gateway: "زرین‌پال",
  },
];

const STATUS_CONFIG = {
  success: {
    label: "موفق",
    icon: CheckCircle2,
    className: "success",
  },
  failed: {
    label: "ناموفق",
    icon: XCircle,
    className: "failed",
  },
  pending: {
    label: "در انتظار",
    icon: Clock3,
    className: "pending",
  },
};

function formatPrice(value) {
  return new Intl.NumberFormat("fa-IR").format(value) + " تومان";
}

export default function StudentPaymentHistory() {
  const [payments] = useState(DEMO_PAYMENTS);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesStatus =
        activeFilter === "all" || payment.status === activeFilter;

      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        payment.className.toLowerCase().includes(searchValue) ||
        payment.trackingCode.toLowerCase().includes(searchValue) ||
        payment.term.toLowerCase().includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [payments, activeFilter, search]);

  const successfulPayments = payments.filter(
    (payment) => payment.status === "success",
  );

  const totalPaid = successfulPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  const successCount = successfulPayments.length;
  const failedCount = payments.filter(
    (payment) => payment.status === "failed",
  ).length;

  const navigate = useNavigate();

  const openReceipt = (payment) => {
    const params = new URLSearchParams({
      trackingCode: payment.trackingCode,
      className: payment.className,
      term: payment.term,
      amount: String(payment.amount),
      date: payment.date,
      time: payment.time,
      gateway: payment.gateway,
    });

    navigate(`/panel/student/payment-receipt?${params.toString()}`);
  };

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title="سوابق پرداخت"
      menuType="student"
    >
      <div className="student-payment-history">
        <div className="admin-students-x7k2-header">
          <div className="admin-students-x7k2-heading">
            <div className="admin-students-x7k2-heading-icon">
            <ReceiptText size={25} />
            </div>
            <div className="student-certificate-x8k4-header-content">
            <h1>تاریخچه پرداخت‌ها</h1>
            <p>سوابق پرداخت شهریه و وضعیت تراکنش‌های خود را مشاهده کنید.</p>
            </div>
          </div>
        </div>

        <div className="payment-history-stats">
          <div className="payment-history-stat">
            <div className="payment-stat-icon total">
              <CreditCard size={21} />
            </div>
            <div>
              <span>مجموع پرداخت موفق</span>
              <strong>{formatPrice(totalPaid)}</strong>
            </div>
          </div>

          <div className="payment-history-stat">
            <div className="payment-stat-icon success">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <span>پرداخت‌های موفق</span>
              <strong>{successCount.toLocaleString("fa-IR")}</strong>
            </div>
          </div>

          <div className="payment-history-stat">
            <div className="payment-stat-icon failed">
              <XCircle size={21} />
            </div>
            <div>
              <span>پرداخت‌های ناموفق</span>
              <strong>{failedCount.toLocaleString("fa-IR")}</strong>
            </div>
          </div>
        </div>

        <div className="payment-history-content">
          <div className="payment-history-toolbar">
            <div className="payment-history-toolbar-title">
              <Filter size={18} />
              <h2>لیست تراکنش‌ها</h2>
              <span>{filteredPayments.length.toLocaleString("fa-IR")}</span>
            </div>

            <div className="payment-history-search">
              <Search size={17} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجوی کلاس یا کد پیگیری..."
              />
            </div>
          </div>

          <div className="payment-history-filters">
            {[
              { value: "all", label: "همه تراکنش‌ها" },
              { value: "success", label: "موفق" },
              { value: "failed", label: "ناموفق" },
              { value: "pending", label: "در انتظار" },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={activeFilter === filter.value ? "active" : ""}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {filteredPayments.length > 0 ? (
            <div className="payment-history-table-wrapper">
              <table className="payment-history-table">
                <thead>
                  <tr>
                    <th>کلاس</th>
                    <th>مبلغ</th>
                    <th>تاریخ پرداخت</th>
                    <th>کد پیگیری</th>
                    <th>وضعیت</th>
                    <th>جزئیات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPayments.map((payment) => {
                    const status = STATUS_CONFIG[payment.status];
                    const StatusIcon = status.icon;

                    return (
                      <tr key={payment.id}>
                        <td>
                          <div className="payment-class-cell">
                            <div className="payment-class-icon">
                              <BookOpen size={18} />
                            </div>
                            <div>
                              <strong>{payment.className}</strong>
                              <span>{payment.term}</span>
                            </div>
                          </div>
                        </td>

                        <td className="payment-amount-cell">
                          {formatPrice(payment.amount)}
                        </td>

                        <td>
                          <div className="payment-date-cell">
                            <CalendarDays size={15} />
                            {payment.date}
                          </div>
                        </td>

                        <td>
                          <span className="payment-code-cell">
                            {payment.trackingCode}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`payment-status-badge ${status.className}`}
                          >
                            <StatusIcon size={15} />
                            {status.label}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="payment-detail-button"
                            onClick={() => setSelectedPayment(payment)}
                            aria-label="مشاهده جزئیات پرداخت"
                          >
                            <Eye size={17} />
                            مشاهده
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="payment-history-empty">
              <div>
                <ReceiptText size={30} />
              </div>
              <strong>تراکنشی پیدا نشد</strong>
              <p>عبارت جستجو یا فیلتر انتخاب‌شده را تغییر دهید.</p>
            </div>
          )}
        </div>

        {selectedPayment && (
          <div
            className="payment-history-modal-overlay"
            onClick={() => setSelectedPayment(null)}
          >
            <div
              className="payment-history-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="payment-history-modal-header">
                <div>
                  <span>جزئیات تراکنش</span>
                  <h3>اطلاعات پرداخت</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  aria-label="بستن"
                >
                  <X size={20} />
                </button>
                {selectedPayment.status === "success" && (
                  <button
                    type="button"
                    className="payment-history-modal-close"
                    onClick={() => openReceipt(selectedPayment)}
                  >
                    <ReceiptText size={17} />
                    مشاهده و چاپ رسید
                  </button>
                )}
              </div>

              <div className="payment-history-modal-amount">
                <span>مبلغ تراکنش</span>
                <strong>{formatPrice(selectedPayment.amount)}</strong>
              </div>

              <div className="payment-history-modal-details">
                <div>
                  <span>نام کلاس</span>
                  <strong>{selectedPayment.className}</strong>
                </div>

                <div>
                  <span>ترم</span>
                  <strong>{selectedPayment.term}</strong>
                </div>

                <div>
                  <span>تاریخ</span>
                  <strong>{selectedPayment.date}</strong>
                </div>

                <div>
                  <span>ساعت</span>
                  <strong>{selectedPayment.time}</strong>
                </div>

                <div>
                  <span>درگاه پرداخت</span>
                  <strong>{selectedPayment.gateway}</strong>
                </div>

                <div>
                  <span>کد پیگیری</span>
                  <strong className="payment-modal-tracking">
                    {selectedPayment.trackingCode}
                  </strong>
                </div>

                <div>
                  <span>وضعیت</span>
                  <strong
                    className={`payment-status-text ${selectedPayment.status}`}
                  >
                    {STATUS_CONFIG[selectedPayment.status].label}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="payment-history-modal-close"
                onClick={() => setSelectedPayment(null)}
              >
                بستن جزئیات
              </button>
            </div>
          </div>
        )}

        <div className="payment-history-demo-note">
          <Clock3 size={16} />
          اطلاعات این صفحه در حال حاضر آزمایشی است و هنوز به سرویس تراکنش‌های
          بک‌اند متصل نشده است.
        </div>
      </div>
    </DashboardLayout>
  );
}
