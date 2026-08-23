import { Link } from "react-router-dom";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import "./LegalPages.css";

export default function Privacy() {
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
          <div className="legal-icon legal-icon-security">
            <LockKeyhole size={28} />
          </div>

          <span className="legal-badge">
            حریم خصوصی
          </span>

          <h1 className="legal-title">
            سیاست حفظ حریم خصوصی
          </h1>

          <p className="legal-description">
            حفظ امنیت و حریم خصوصی اطلاعات کاربران برای ما اهمیت زیادی دارد.
          </p>
        </section>

        <section className="legal-card">
          <div className="legal-section">
            <div className="legal-section-title">
              <span>۱</span>
              <h2>اطلاعاتی که جمع‌آوری می‌کنیم</h2>
            </div>

            <p>
              در هنگام ثبت‌نام یا استفاده از خدمات ممکن است اطلاعاتی مانند
              نام و نام خانوادگی، شماره تماس، ایمیل و اطلاعات حساب کاربری
              از شما دریافت شود.
            </p>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">
              <span>۲</span>
              <h2>نحوه استفاده از اطلاعات</h2>
            </div>

            <p>
              اطلاعات کاربران برای ارائه خدمات آموزشی، مدیریت حساب کاربری،
              ارتباط با دانش‌آموزان و بهبود کیفیت خدمات آموزشگاه استفاده
              می‌شود.
            </p>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">
              <span>۳</span>
              <h2>حفاظت از اطلاعات</h2>
            </div>

            <p>
              ما تلاش می‌کنیم اطلاعات کاربران را با استفاده از روش‌های
              مناسب فنی و مدیریتی در برابر دسترسی غیرمجاز، تغییر، افشا یا
              از بین رفتن محافظت کنیم.
            </p>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">
              <span>۴</span>
              <h2>اشتراک‌گذاری اطلاعات</h2>
            </div>

            <p>
              اطلاعات شخصی کاربران بدون مجوز قانونی یا رضایت کاربر در
              اختیار اشخاص ثالث قرار نخواهد گرفت، مگر در مواردی که انجام
              این کار برای ارائه مستقیم خدمات یا رعایت الزامات قانونی
              ضروری باشد.
            </p>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">
              <span>۵</span>
              <h2>امنیت حساب کاربری</h2>
            </div>

            <p>
              کاربران باید از رمز عبور مناسب استفاده کرده و اطلاعات ورود
              خود را در اختیار دیگران قرار ندهند. مسئولیت فعالیت‌هایی که
              از طریق حساب کاربری انجام می‌شود بر عهده صاحب حساب است.
            </p>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">
              <span>۶</span>
              <h2>حقوق کاربران</h2>
            </div>

            <p>
              کاربران می‌توانند در صورت وجود هرگونه سؤال یا درخواست مرتبط
              با اطلاعات شخصی خود، از طریق راه‌های ارتباطی آموزشگاه با
              مدیریت تماس بگیرند.
            </p>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">
              <span>۷</span>
              <h2>به‌روزرسانی سیاست حریم خصوصی</h2>
            </div>

            <p>
              ممکن است این سیاست در آینده برای هماهنگی با تغییرات خدمات،
              قوانین یا الزامات امنیتی به‌روزرسانی شود. نسخه جدید پس از
              انتشار در همین صفحه قابل مشاهده خواهد بود.
            </p>
          </div>

          <div className="legal-footer-note">
            <ShieldCheck size={20} />
            <span>
              آخرین به‌روزرسانی سیاست حریم خصوصی: مرداد ۱۴۰۵
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}