// src/pages/About.jsx
import { CheckCircle2, HeartHandshake, Target, UsersRound } from "lucide-react";
import "./About.css";

function About() {
  return (
    <main className="inner-page" dir="rtl">
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero__bg">
          <div className="blob b1" /><div className="blob b2" />
        </div>
        <div className="container">
          <span className="eyebrow">Introduction</span>
          <h1>درباره آموزشگاه زبان کیش</h1>
          <p>ما تلاش می‌کنیم یادگیری زبان برای هر زبان‌آموز، منظم، قابل پیگیری و لذت‌بخش باشد.</p>
        </div>
      </section>

      {/* Story */}
      <section className="about-story section-space">
        <div className="container">
          <div className="story-grid">
            <div className="story-visual">
              <div className="story-img-wrap">
                <img className="story-img-placeholder" src="/logo.png" alt="آموزشگاه زبان کیش" />
                <div className="story-badge">
                  <span className="badge-num">۱۸+</span>
                  <span className="badge-lbl">سال تجربه</span>
                </div>
              </div>
            </div>

            <div className="story-text">
              <span className="eyebrow">داستان ما</span>
              <h2>آموزشگاهی برای یادگیری آرام، اصولی و هدفمند</h2>
              <p>
                آموزشگاه زبان کیش با هدف ایجاد فضایی حرفه‌ای برای یادگیری زبان فعالیت می‌کند.
                در این مجموعه، زبان‌آموز فقط در کلاس شرکت نمی‌کند؛ بلکه مسیر آموزشی او از
                ثبت‌نام تا آزمون و پیشرفت دوره‌ای پیگیری می‌شود.
              </p>
              <p>
                ما باور داریم کیفیت آموزش زمانی معنا دارد که نظم، ارتباط مؤثر، استادان همراه
                و برنامه‌ریزی دقیق در کنار هم قرار بگیرند.
              </p>

              <div className="checks-row">
                {["تعیین سطح دقیق","اساتید باتجربه","برنامه‌ریزی منظم","پیگیری وضعیت آموزشی"].map(t => (
                  <div className="check-item" key={t}>
                    <CheckCircle2 size={17} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-values section-space">
        <div className="container">
          <div className="values-grid">
            {[
              { Icon: Target,        title: "ماموریت ما",  text: "کمک به زبان‌آموزان برای یادگیری کاربردی زبان در فضایی منظم و حرفه‌ای." },
              { Icon: HeartHandshake,title: "ارزش‌های ما", text: "احترام، پیگیری، کیفیت آموزشی، نظم کلاسی و ارتباط مؤثر با زبان‌آموز." },
              { Icon: UsersRound,    title: "رویکرد ما",   text: "آموزش زبان با توجه به سطح، هدف، سن و زمان‌بندی هر زبان‌آموز." },
            ].map(({ Icon, title, text }) => (
              <div className="value-card" key={title}>
                <div className="value-icon"><Icon size={28} /></div>
                <h4>{title}</h4>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default About;
