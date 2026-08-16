import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const LINKS = {
  دوره‌ها: [
    { label: "انگلیسی مقدماتی", to: "/courses#beginner" },
    { label: "انگلیسی متوسط", to: "/courses#intermediate" },
    { label: "انگلیسی پیشرفته", to: "/courses#advanced" },
    { label: "کلاس خصوصی", to: "/courses#private" },
    { label: "آمادگی IELTS", to: "/courses#ielts" },
    { label: "آمادگی TOEFL", to: "/courses#toefl" },
  ],
  آموزشگاه: [{ label: "درباره ما", to: "/about" },
    { label: "تماس با ما", to: "/contact" },

  ],
  دانش‌آموزان: [
    { label: "ورود به پنل", to: "/login" },
  ],
};

const SOCIALS = [
  {
    label: "اینستاگرام",
    href: "https://www.instagram.com/kishkhoban/",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "تلگرام",
    href: "https://www.t.me/kishzanjan",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21.5 2.5L2 10l7 2.5 2.5 7L21.5 2.5z" />
        <path d="M9 12.5l3.5 3.5" />
      </svg>
    ),
  },
  {
    label: "واتساپ",
    href: "#",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const revealRefs = useRef([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add("visible"),
        ),
      { threshold: 0.08 },
    );
    revealRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const r = (el) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  };

  return (
    <footer className="footer" key={"footer"} id="footer">
      {/* Wave divider */}
      <div className="footer-wave" aria-hidden>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path
            d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
            fill="var(--footer-bg)"
          />
        </svg>
      </div>

      <div className="footer-body">
        <div className="container footer-grid">
          {/* Brand column */}
          <div className="footer-brand reveal" ref={r}>
            <Link to="/" className="footer-logo">
              <img
                className="footer-logo-mark"
                src="/logo.png"
                alt="آموزشگاه کیش"
              />
              <span> آموزشگاه زبان کیش خوبان زنجان</span>
            </Link>
            <p className="footer-tagline">
              تخصصی‌ترین مرکز آموزش زبان انگلیسی با کلاس‌های خصوصی و نیمه‌خصوصی
            </p>

            <div className="footer-contact-list">
              <a href="tel:02433454315" className="footer-contact-item">
                <span className="footer-contact-icon">📞</span>
                <span>024-3345-4315</span>
              </a>
              <a href="tel:02433470334" className="footer-contact-item">
                <span className="footer-contact-icon">📞</span>
                <span>024-3347-0334</span>
              </a>
              <a href="tel:02433442639" className="footer-contact-item">
                <span className="footer-contact-icon">📞</span>
                <span>024-3344-2639</span>
              </a>
              <div className="footer-contact-item">
                <span className="footer-contact-icon">📍</span>
                <span>زنجان، سعدی شمالی، نرسیده به خیابان بهار</span>
              </div>
            </div>

            <div className="footer-socials">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="footer-social-btn"
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, items], i) => (
            <div
              key={title}
              className="footer-col reveal"
              ref={r}
              style={{ transitionDelay: `${(i + 1) * 80}ms` }}
            >
              <h3 className="footer-col-title">{title}</h3>
              <ul className="footer-col-list">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="footer-col-link">
                      <span className="footer-link-dot" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-copy">
            © {new Date().getFullYear()} آموزشگاه زبان انگلیسی کیش خوبان زنجان — تمامی حقوق
            محفوظ است
          </p>
          <div className="footer-bottom-links">
            <Link to="/privacy" className="footer-bottom-link">
              حریم خصوصی
            </Link>
            <Link to="/terms" className="footer-bottom-link">
              قوانین استفاده
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
