import React from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MessageCircleWarning,
  Send,
} from "lucide-react";
import "./pool.css";

const PaymentRequest = () => {
  const amount = "۲۴,۰۰۰,۰۰۰";
  const daysOverdue = 18;

  return (
    <div className="payment-page" dir="rtl">
      <div className="payment-container">
        <div className="payment-alert">
          <div className="payment-alert-icon">
            <AlertTriangle size={26} />
          </div>

          <div>
            <h1>پولمو بده کصکش .</h1>
          </div>
        </div>

        <section className="payment-hero">
          <div className="payment-hero-content">
            <span className="payment-eyebrow">
              <MessageCircleWarning size={17} />
              پیام مستقیم به کارفرما
            </span>

            <h2>
              کار انجام شده،
              <br />
              <strong>حالا نوبت پرداخت شماست.</strong>
            </h2>

            <p>
              پروژه طبق توافق انجام شده و کار تحویل داده شده است. با این حال،
              مبلغ توافق‌شده هنوز پرداخت نشده و مدت زیادی از موعد تسویه گذشته
              است.
            </p>

            <p className="payment-critical">
              لطفاً این موضوع را بیشتر از این به «فردا واریز می‌کنم» و «تا چند
              روز دیگه» موکول نکنید. من برای انجام کار وقت، انرژی و تخصص
              گذاشته‌ام و انتظار غیرمنطقی هم ندارم؛
              <strong> فقط پول کاری را که انجام داده‌ام می‌خواهم.</strong>
            </p>

            <div className="payment-actions">
              <button className="payment-primary">
                <Send size={18} />
                شماره کارتا تو گروه هست
              </button>

              <button className="payment-secondary">
                <Banknote size={18} />
                 همین الان پول کیری رو بزن🥀🥀🥀 
              </button>
            </div>
          </div>

          <div className="payment-amount-card">
            <div className="amount-icon">
              <Banknote size={25} />
            </div>

            <span>مبلغ قابل پرداخت</span>

            <strong>{amount}</strong>

            <small>تومان</small>

            <div className="amount-divider" />

            <div className="amount-status">
              <Clock3 size={17} />
              <span>{daysOverdue} روز از موعد پرداخت گذشته</span>
            </div>
          </div>
        </section>

        <section className="payment-message">
          <div className="message-title">
            <CheckCircle2 size={21} />
            <h3>حرف آخر</h3>
          </div>

          <p>
            من برای دریافت پول کاری که انجام داده‌ام، قرار نیست هر بار پیگیری
            کنم یا منتظر وعده‌های جدید باشم. اگر پروژه انجام شده و مورد تأیید
            بوده، طبیعی است که دستمزد آن هم در موعد مقرر پرداخت شود.
          </p>

          <p>
            <strong>
              لطفاً احترام به زمان و زحمت من را با پرداخت به‌موقع نشان دهید.
            </strong>
          </p>
        </section>

        <div className="payment-footer">
          <CalendarClock size={18} />
          <span>
            این پیام جهت یادآوری و درخواست رسمی تسویه حساب پروژه ارسال شده است.
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentRequest;
