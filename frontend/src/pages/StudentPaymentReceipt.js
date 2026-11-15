
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Printer,
  ArrowRight,
  CheckCircle2,
  ReceiptText,
  GraduationCap,
} from "lucide-react";
import "./StudentPaymentReceipt.css";

const formatPrice = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return "نامشخص";
  return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
};

export default function StudentPaymentReceipt() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const receipt = {
    trackingCode: params.get("trackingCode") || "KP-1405-00125",
    className: params.get("className") || "زبان انگلیسی سطح Elementary",
    term: params.get("term") || "ترم پاییز ۱۴۰۵",
    amount: params.get("amount") || "2500000",
    date: params.get("date") || "۱۴۰۵/۰۸/۱۰",
    time: params.get("time") || "۱۴:۳۵",
    gateway: params.get("gateway") || "زرین‌پال",
    studentName: params.get("studentName") || "نام دانشجو",
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="student-payment-receipt-page">
      <div className="receipt-top-actions">
        <button
          type="button"
          className="receipt-back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowRight size={17} />
          بازگشت
        </button>

        <button
          type="button"
          className="receipt-print-button"
          onClick={handlePrint}
        >
          <Printer size={17} />
          چاپ رسید / ذخیره PDF
        </button>
      </div>

      <div className="payment-receipt">
        <div className="receipt-success-banner">
          <div className="receipt-success-icon">
            <CheckCircle2 size={27} />
          </div>
          <div>
            <strong>پرداخت موفق</strong>
            <span>رسید پرداخت شهریه</span>
          </div>
          <div className="receipt-success-check">
            <CheckCircle2 size={30} />
          </div>
        </div>

        <div className="receipt-brand">
          <div className="receipt-brand-logo">
            <GraduationCap size={31} />
          </div>
          <div>
            <h1>آموزشگاه کیش خوبان</h1>
            <p>رسید رسمی پرداخت شهریه</p>
          </div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-amount-section">
          <span>مبلغ پرداخت‌شده</span>
          <strong>{formatPrice(receipt.amount)}</strong>
          <small>پرداخت از طریق درگاه اینترنتی</small>
        </div>

        <div className="receipt-section-heading">
          <ReceiptText size={18} />
          <h2>مشخصات تراکنش</h2>
        </div>

        <div className="receipt-information">
          <div className="receipt-info-row">
            <span>نام دانشجو</span>
            <strong>{receipt.studentName}</strong>
          </div>

          <div className="receipt-info-row">
            <span>عنوان کلاس</span>
            <strong>{receipt.className}</strong>
          </div>

          <div className="receipt-info-row">
            <span>ترم آموزشی</span>
            <strong>{receipt.term}</strong>
          </div>

          <div className="receipt-info-row">
            <span>تاریخ پرداخت</span>
            <strong>{receipt.date}</strong>
          </div>

          <div className="receipt-info-row">
            <span>ساعت پرداخت</span>
            <strong>{receipt.time}</strong>
          </div>

          <div className="receipt-info-row">
            <span>درگاه پرداخت</span>
            <strong>{receipt.gateway}</strong>
          </div>

          <div className="receipt-info-row tracking">
            <span>کد پیگیری</span>
            <strong>{receipt.trackingCode}</strong>
          </div>
        </div>

        <div className="receipt-total-row">
          <span>مبلغ نهایی پرداخت</span>
          <strong>{formatPrice(receipt.amount)}</strong>
        </div>

        <div className="receipt-footer">
          <CheckCircle2 size={17} />
          <span>
            این رسید جهت ثبت سوابق پرداخت صادر شده است.
          </span>
        </div>

        <div className="receipt-footer-brand">
          آموزشگاه کیش خوبان
        </div>
      </div>

      <p className="receipt-page-note">
        برای نگهداری رسید، گزینه «چاپ رسید / ذخیره PDF» را انتخاب کنید.
      </p>
    </div>
  );
}
