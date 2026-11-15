import React from "react";
import {
  Construction,
  Clock3,
  ArrowLeft,
  Code2,
  Sparkles,
} from "lucide-react";
import "./pool.css";

export default function UnderConstruction() {
  return (
    <main className="uc-page" dir="rtl">
      <div className="uc-glow uc-glow-one" />
      <div className="uc-glow uc-glow-two" />

      <nav className="uc-navbar">
        <div className="uc-logo">
          <Code2 size={23} />
          <span>WEBSITE</span>
        </div>
        <span className="uc-status">
          <span className="uc-status-dot" />
          در حال توسعه
        </span>
      </nav>

      <section className="uc-content">
        <div className="uc-illustration">
          <div className="uc-orbit uc-orbit-one" />
          <div className="uc-orbit uc-orbit-two" />

          <div className="uc-icon-box">
            <Construction size={65} strokeWidth={1.4} />
          </div>

          <Sparkles className="uc-sparkle uc-sparkle-one" size={23} />
          <Sparkles className="uc-sparkle uc-sparkle-two" size={17} />
        </div>

        <span className="uc-eyebrow">
          <span />
          WE'LL BE BACK SOON
        </span>

        <h1>
          چیزی جدید
          <br />
          <strong>در راه است!</strong>
        </h1>

        <p className="uc-description">
          در حال انجام تغییرات و به‌روزرسانی‌های جدید روی وب‌سایت هستیم.
          به‌زودی با تجربه‌ای بهتر و امکانات جدید بازخواهیم گشت.
        </p>

        <div className="uc-progress">
          <div className="uc-progress-heading">
            <span>وضعیت توسعه وب‌سایت</span>
            <span>در حال انجام</span>
          </div>
          <div className="uc-progress-track">
            <div className="uc-progress-fill" />
          </div>
        </div>

        <div className="uc-info">
          <div className="uc-info-icon">
            <Clock3 size={20} />
          </div>
          <div>
            <strong>لطفاً کمی صبور باشید</strong>
            <span>تا پایان عملیات به‌روزرسانی، سایت در دسترس نخواهد بود.</span>
          </div>
        </div>

        <div className="uc-footer">
          <span>THANK YOU FOR YOUR PATIENCE</span>
          <span className="uc-footer-line" />
          <span>© {new Date().getFullYear()} ALL RIGHTS RESERVED</span>
        </div>
      </section>
    </main>
  );
}
