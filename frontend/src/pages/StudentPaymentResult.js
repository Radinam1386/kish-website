
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import "./StudentPaymentResult.css";

const PAYMENT_STATES = {
  success: {
    title: "پرداخت با موفقیت انجام شد",
    description: "درخواست پرداخت شما با موفقیت ثبت شده است.",
    icon: CheckCircle2,
    className: "success",
    buttonText: "بازگشت به صفحه شهریه",
  },
  failed: {
    title: "پرداخت ناموفق بود",
    description: "متأسفانه پرداخت انجام نشد. می‌توانید دوباره تلاش کنید.",
    icon: XCircle,
    className: "failed",
    buttonText: "تلاش مجدد",
  },
  canceled: {
    title: "پرداخت لغو شد",
    description: "فرآیند پرداخت را لغو کرده‌اید و مبلغی پرداخت نشده است.",
    icon: AlertCircle,
    className: "canceled",
    buttonText: "بازگشت به صفحه شهریه",
  },
};

function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "نامشخص";
  }

  return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
}

export default function StudentPaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rawStatus = searchParams.get("status") || "canceled";
  const status = PAYMENT_STATES[rawStatus] ? rawStatus : "canceled";
  const result = PAYMENT_STATES[status];
  const ResultIcon = result.icon;

  const amount = searchParams.get("amount");
  const className = searchParams.get("className");
  const trackingCode = searchParams.get("trackingCode");

  const handleMainAction = () => {
    // در حالت ناموفق نیز فعلاً به صفحه شهریه برمی‌گردیم.
    // اتصال مجدد به درگاه پس از آماده‌شدن API انجام می‌شود.
    navigate(-1);
  };

  return (
    <div className="student-payment-result">
      <div className="payment-result-card">
        <div className={`payment-result-icon ${result.className}`}>
          <ResultIcon size={42} strokeWidth={2} />
        </div>

        <div className="payment-result-heading">
          <span className="payment-result-eyebrow">
            نتیجه پرداخت شهریه
          </span>

          <h1>{result.title}</h1>
          <p>{result.description}</p>
        </div>

        <div className="payment-result-details">
          <div className="payment-result-details-title">
            <ReceiptText size={19} />
            <h3>جزئیات تراکنش</h3>
          </div>

          <div className="payment-result-row">
            <span>وضعیت پرداخت</span>
            <strong className={`payment-result-status ${result.className}`}>
              {status === "success"
                ? "موفق"
                : status === "failed"
                  ? "ناموفق"
                  : "لغوشده"}
            </strong>
          </div>

          {amount && (
            <div className="payment-result-row">
              <span>مبلغ پرداخت</span>
              <strong>{formatPrice(amount)}</strong>
            </div>
          )}

          {className && (
            <div className="payment-result-row">
              <span>کلاس</span>
              <strong>{className}</strong>
            </div>
          )}

          {trackingCode && (
            <div className="payment-result-row">
              <span>کد پیگیری</span>
              <strong className="payment-tracking-code">
                {trackingCode}
              </strong>
            </div>
          )}
        </div>

        {status === "success" && (
          <div className="payment-result-message success">
            <ShieldCheck size={19} />
            <span>
              ثبت نهایی پرداخت در حساب کاربری پس از تأیید سرور انجام می‌شود.
            </span>
          </div>
        )}

        {status !== "success" && (
          <div className="payment-result-message warning">
            <AlertCircle size={19} />
            <span>
              در صورت کسر مبلغ از حساب، وضعیت تراکنش را از طریق آموزشگاه پیگیری کنید.
            </span>
          </div>
        )}

        <button
          type="button"
          className="payment-result-main-button"
          onClick={handleMainAction}
        >
          {status === "failed" ? (
            <RefreshCw size={18} />
          ) : (
            <ArrowRight size={18} />
          )}
          {result.buttonText}
        </button>

        <p className="payment-result-footer">
          آموزشگاه کیش خوبان زنجان
        </p>
      </div>
    </div>
  );
}
