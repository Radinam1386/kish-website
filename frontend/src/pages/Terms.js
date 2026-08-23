import { Link } from "react-router-dom";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import "./LegalPages.css";

export default function Terms() {
  return (
    <div className="legal-page">
      <div className="legal-bg">
        <div className="legal-orb legal-orb-1" />
        <div className="legal-orb legal-orb-2" />
        <div className="legal-orb legal-orb-3" />
      </div>

      <main className="legal-container">
        <div className="legal-top">
          <Link to="/" className="legal-back">
            <ArrowRight size={18} />
            <span>بازگشت به صفحه اصلی</span>
          </Link>
        </div>

        <section className="legal-header">
          <div className="legal-icon">
            <FileText size={28} />
          </div>

          <span className="legal-badge">
            قوانین و مقررات
          </span>

          <h1 className="legal-title">
            شرایط استفاده از خدمات
          </h1>

          <p className="legal-description">
            لطفاً پیش از استفاده از خدمات آموزشگاه، شرایط و قوانین زیر را
            با دقت مطالعه کنید.
          </p>
        </section>

        <section className="legal-card">
          <div className="legal-section">
            <div className="legal-section-title">
              <span>۱</span>
              <h2>مقدمه</h2>
            </div>

            <p>
              استفاده از وب‌سایت و خدمات آموزشگاه به منزله پذیرش کامل شرایط
              و قوانین مندرج در این صفحه است. در صورتی که با هر یک از این
              شرایط موافق نیستید، لطفاً از استفاده از خدمات خودداری کنید.
            </p>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">
              <span>۲</span>
              <h2>ثبت‌نام و حساب کاربری</h2>
            </div>

            <p>
              اطلاعاتی که هنگام ثبت‌نام وارد می‌کنید باید صحیح و متعلق به
              خودتان باشد. مسئولیت حفظ نام کاربری و رمز عبور حساب بر عهده
              صاحب حساب است.
            </p>

            <p>
              هرگونه استفاده غیرمجاز از حساب کاربری باید در سریع‌ترین زمان
              ممکن به آموزشگاه اطلاع داده شود.
            </p>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">
              <span>۳</span>
              <h2>کلاس‌ها و خدمات آموزشی</h2>
            </div>

            <p>
              زمان‌بندی کلاس‌ها، نحوه برگزاری، استاد و سایر جزئیات آموزشی
              ممکن است بر اساس شرایط آموزشی و برنامه آموزشگاه تغییر کند.
            </p>

            <p>
              دانش‌آموز موظف است قوانین مربوط به حضور، غیبت و نظم کلاس را
              رعایت کند.
            </p>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">
              <span>۴</span>
              <h2>پرداخت و هزینه‌ها</h2>
            </div>

            <p>
              هزینه دوره‌ها و خدمات آموزشی مطابق تعرفه اعلام‌شده توسط
              آموزشگاه دریافت می‌شود. شرایط پرداخت و بازگشت وجه ممکن است
              برای هر دوره متفاوت باشد.
            </p>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">
              <span>۵</span>
              <h2>مالکیت محتوا</h2>
            </div>

            <p>
              تمامی محتوای آموزشی، متون، تصاویر، طراحی و سایر محتوای
              منتشرشده در وب‌سایت متعلق به آموزشگاه بوده و استفاده،
              بازنشر یا توزیع آن بدون اجازه مجاز نیست.
            </p>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">
              <span>۶</span>
              <h2>تغییر شرایط</h2>
            </div>

            <p>
              آموزشگاه می‌تواند در صورت نیاز شرایط و قوانین استفاده از
              خدمات را به‌روزرسانی کند. نسخه جدید قوانین پس از انتشار در
              همین صفحه قابل مشاهده خواهد بود.
            </p>
          </div>

          <div className="legal-footer-note">
            <ShieldCheck size={20} />
            <span>
              آخرین به‌روزرسانی قوانین: مرداد ۱۴۰۵
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}