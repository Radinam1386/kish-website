import React from "react";
import "./CoursesPage.css";
import { AnimatedButton } from "../components/AnimatedButton";
import { Link } from "react-router-dom";
import { Phone } from "lucide-react";

const CoursesPage = () => {
  const courses = [
    {
      id: "beginner",
      title: "انگلیسی مقدماتی",
      description:
        "برای افرادی که تازه می‌خواهند یادگیری زبان انگلیسی را شروع کنند",
      duration: "3 ماه",
      level: "مبتدی",
      sessions: "24 جلسه",
      price: "تماس بگیرید",
      icon: "📚",
    },
    {
      id: "intermediate",
      title: "انگلیسی متوسط",
      description: "تقویت مهارت‌های مکالمه، نوشتن و درک مطلب برای سطح متوسط",
      duration: "4 ماه",
      level: "متوسط",
      sessions: "32 جلسه",
      price: "تماس بگیرید",
      icon: "🎓",
    },
    {
      id: "advanced",
      title: "انگلیسی پیشرفته",
      description:
        "تسلط بر زبان انگلیسی در سطح پیشرفته با تمرکز بر محاوره روان",
      duration: "5 ماه",
      level: "پیشرفته",
      sessions: "40 جلسه",
      price: "تماس بگیرید",
      icon: "🏆",
    },
    {
      id: "private",
      title: "کلاس خصوصی",
      description: "آموزش یک‌به‌یک با برنامه‌ریزی مخصوص نیاز شما",
      duration: "انعطاف‌پذیر",
      level: "همه سطوح",
      sessions: "دلخواه",
      price: "تماس بگیرید",
      icon: "👤",
    },
    {
      id: "ielts",
      title: "آمادگی IELTS",
      description: "آمادگی کامل برای آزمون IELTS با تمرین‌های جامع",
      duration: "3 ماه",
      level: "متوسط به بالا",
      sessions: "36 جلسه",
      price: "تماس بگیرید",
      icon: "🌍",
    },
    {
      id: "toefl",
      title: "آمادگی TOEFL",
      description: "دوره تخصصی برای کسب نمره بالا در آزمون TOEFL",
      duration: "3 ماه",
      level: "متوسط به بالا",
      sessions: "36 جلسه",
      price: "تماس بگیرید",
      icon: "🎯",
    },
  ];

  return (
    <div className="klc-page">
      <div className="klc-hero">
        <div className="klc-blob klc-blob-1" aria-hidden="true" />
        <div className="klc-blob klc-blob-2" aria-hidden="true" />
        {/* <div className="klc-blob klc-blob-3" aria-hidden="true" /> */}

        <div className="klc-hero-content">
          <h1 className="klc-hero-title">دوره‌های آموزشی</h1>
          <p className="klc-hero-subtitle">
            با بهترین اساتید و جدیدترین متدهای آموزشی، زبان انگلیسی را بیاموزید
          </p>
        </div>
      </div>

      <div className="klc-container">
        <div className="klc-grid">
          {courses.map((course) => (
            <article key={course.id} id={course.id} className="klc-card">
              <div className="klc-icon" aria-hidden="true">
                {course.icon}
              </div>
              <h3 className="klc-title">{course.title}</h3>
              <p className="klc-desc">{course.description}</p>

              <div className="klc-details">
                <div className="klc-detail-item">
                  <span className="klc-label">مدت دوره:</span>
                  <span className="klc-value">{course.duration}</span>
                </div>
                <div className="klc-detail-item">
                  <span className="klc-label">سطح:</span>
                  <span className="klc-value">{course.level}</span>
                </div>
                <div className="klc-detail-item">
                  <span className="klc-label">تعداد جلسات:</span>
                  <span className="klc-value">{course.sessions}</span>
                </div>
              </div>

              <div className="klc-footer">
                <Link className="klc-link" to="/contact">
                  <AnimatedButton
                    // variant="secondary"
                    size="medium"
                    icon={<Phone size={18} aria-hidden="true" />}
                  >
                    تماس
                  </AnimatedButton>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
