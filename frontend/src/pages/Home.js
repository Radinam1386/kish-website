import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";
import { AnimatedButton } from "../components/AnimatedButton";

const TYPING_TEXTS = ["انگلیسی", "English", "برای IELTS", "برای TOEFL"];
const STATS = [
  { value: 1967, suffix: "+", label: "دانش‌آموز موفق" },
  { value: 99, suffix: "%", label: "رضایت دانش‌آموزان" },
  { value: 18, suffix: "+", label: "سال تجربه" },
];

const FEATURES = [
  {
    icon: "🎯",
    title: "کلاس‌های خصوصی",
    desc: "آموزش یک‌به‌یک با بهترین اساتید و برنامه‌ریزی اختصاصی",
  },
  {
    icon: "📚",
    title: "دوره‌های جامع",
    desc: "از مقدماتی تا پیشرفته با جدیدترین متدهای آموزشی",
  },
  {
    icon: "🏆",
    title: "آمادگی آزمون",
    desc: "تضمین قبولی در آزمون‌های IELTS و TOEFL",
  },
];

export default function Landing() {
  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState(STATS.map((s) => ({ ...s, current: 0 })));
  const [statsStarted, setStatsStarted] = useState(false);

  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const revealRefs = useRef([]);

  // Typing animation
  useEffect(() => {
    const currentWord = TYPING_TEXTS[typingIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (typingText.length < currentWord.length) {
            setTypingText(currentWord.slice(0, typingText.length + 1));
          } else {
            setTimeout(() => setIsDeleting(true), 1500);
          }
        } else {
          if (typingText.length > 0) {
            setTypingText(typingText.slice(0, -1));
          } else {
            setIsDeleting(false);
            setTypingIndex((typingIndex + 1) % TYPING_TEXTS.length);
          }
        }
      },
      isDeleting ? 60 : 120,
    );
    return () => clearTimeout(timeout);
  }, [typingText, typingIndex, isDeleting]);

  // Stats counter
  useEffect(() => {
    if (!statsStarted) return;
    const interval = setInterval(() => {
      setStats((prev) =>
        prev.map((s) => {
          if (s.current < s.value) {
            const increment = Math.ceil((s.value - s.current) / 15);
            return { ...s, current: Math.min(s.current + increment, s.value) };
          }
          return s;
        }),
      );
    }, 40);
    return () => clearInterval(interval);
  }, [statsStarted]);

  // Intersection observers
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add("visible"),
        ),
      { threshold: 0.1 },
    );
    revealRefs.current.forEach((el) => el && obs.observe(el));

    const statsObs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && setStatsStarted(true)),
      { threshold: 0.3 },
    );
    if (statsRef.current) statsObs.observe(statsRef.current);

    return () => {
      obs.disconnect();
      statsObs.disconnect();
    };
  }, []);

  const r = (el) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  };

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg">
          <div className="mesh-gradient" />
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-badge reveal" ref={r}>
              <span className="badge-dot" />
              <span>آموزشگاه تخصصی زبان انگلیسی</span>
            </div>

            <h1 className="hero-title reveal" ref={r}>
              زبان
              <span className="typing-wrap">
                <span className="typing-text">{typingText}</span>
                <span className="typing-cursor">|</span>
              </span>
              <br />
              رو با ما حرفه‌ای تر یاد بگیر
            </h1>

            <p className="hero-desc reveal" ref={r}>
              بیش از ۱۸ سال تجربه در آموزش زبان انگلیسی با کلاس‌های خصوصی و
              نیمه‌خصوصی.
              <br />
              از مقدماتی تا پیشرفته، با تضمین نتیجه.
            </p>

            {/* <div className="hero-cta reveal" ref={r}>
              <AnimatedButton variant="danger" size="medium" icon="←">
                <a href="#contact">ثبت‌نام در آموزشگاه</a>
              </AnimatedButton>
              <AnimatedButton variant="ghost" size="medium">
                <a href="#contact">مشاهده دوره‌ها</a>
              </AnimatedButton>
            </div> */}

            <div className="hero-trust reveal" ref={r}>
              <div className="trust-item">
                <span className="trust-icon">✅</span>
                <span>مجوز رسمی از سازمان آموزش و پرورش</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🏆</span>
                <span>اساتید با مدرک بین‌المللی</span>
              </div>
            </div>
          </div>

          <div className="hero-visual reveal" ref={r}>
            <div className="hero-card card-1">
              <div className="card-header">
                <div className="card-icon">📖</div>
                {/* <div className="card-badge">جدید</div> */}
              </div>
              <h3>دوره مکالمه پیشرفته</h3>
              <p>مکالمه ی زبانت رو از رو به اون رو کن!</p>
              <div className="card-progress">
                <div className="progress-bar" style={{ width: "75%" }} />
              </div>
            </div>

            <div className="hero-card card-2">
              <div className="card-header">
                <div className="card-icon">🎯</div>
              </div>
              <h3>آمادگی IELTS</h3>
              <p>تضمین نمره ۷+</p>
              <div className="card-stats">
                <span>۹۸٪ موفقیت</span>
              </div>
            </div>

            <div className="hero-card card-3">
              <div className="card-header">
                <div className="card-icon">👤</div>
              </div>
              <h3>کلاس های خصوصی</h3>
              <p>تجربه ای متفاوت</p>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          <div className="scroll-mouse">
            <div className="scroll-wheel" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section" ref={statsRef}>
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="stat-card reveal"
                ref={r}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="stat-value">
                  {stat.current}
                  {stat.suffix}
                </div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="section-header reveal" ref={r}>
            <span className="section-badge">چرا ما؟</span>
            <h2 className="section-title">
              آموزشگاه زبان با
              <span className="text-accent"> استانداردهای بین‌المللی</span>
            </h2>
            <p className="section-desc">
              تنها آموزشگاه تخصصی زبان انگلیسی با رویکرد شخصی‌سازی کامل
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((feat, i) => (
              <div
                key={i}
                className="feature-card reveal"
                ref={r}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="feature-icon">{feat.icon}</div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.desc}</p>
                <Link to="/courses" className="feature-link">
                  بیشتر بدانید <span>←</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA */}
      <section className="cta-section reveal" ref={r}>
        <div className="container">
          <div className="cta-box">
            <div className="cta-content">
              <h2 className="cta-title">
                آماده‌اید زبان انگلیسی رو تسلط کامل یاد بگیرید؟
              </h2>
              <p className="cta-desc">
                جلسه مشاوره رایگان بگیرید و مسیر یادگیری خودتون رو با ما بسازید
              </p>
              <AnimatedButton variant="danger">
                <Link to="tel:02433454315">
                  تماس با ما
                </Link>
              </AnimatedButton>
            </div>
            <div className="cta-visual">
              <div className="cta-badge">
                <span className="cta-badge-icon">🎓</span>
                <div>
                  <div className="cta-badge-title">مشاوره رایگان</div>
                  <div className="cta-badge-desc">تعیین سطح و برنامه‌ریزی</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
