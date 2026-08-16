// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const ROLES = [
  { key: "panel/student", label: "دانش‌آموز", icon: "📘" },
  { key: "panel/teacher", label: "استاد", icon: "🎓" },
  { key: "panel/secretary", label: "منشی", icon: "📋" },
  { key: "panel/admin", label: "مدیریت", icon: "⚙️" },
];

export default function Login() {
  const [role, setRole] = useState("student");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate(`/${role}`), 800);
  }

  return (
    <div className="login-root" dir="rtl">
      {/* Background blobs */}
      <div className="login-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>

      <div className="login-inner">
        <div className="login-brand">
          <div className="brand-icon">🎯</div>
          <div className="brand-content">
            <h1>آموزشگاه زبان کیش</h1>
            <p className="subtitle">خوبان زنجان</p>
            <p className="tagline">یادگیری حرفه‌ای، آینده‌ای روشن</p>
          </div>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="card-header">
            <h2>ورود به حساب کاربری</h2>
            <p>نقش خود را انتخاب کنید</p>
          </div>

          <div className="role-grid">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                className={`role-item ${role === r.key ? "active" : ""}`}
                onClick={() => setRole(r.key)}
              >
                <span className="role-icon">{r.icon}</span>
                <span className="role-label">{r.label}</span>
                {role === r.key && <span className="role-check">✓</span>}
              </button>
            ))}
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="phone">شماره موبایل</label>
              <div className="input-wrap">
                <span className="input-icon">📱</span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="09xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="pass">رمز عبور</label>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  id="pass"
                  type="password"
                  placeholder="رمز عبور خود را وارد کنید"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={`btn-submit ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "ورود به پنل"}
            </button>
          </form>

          <p className="login-footer">
            <a href="#">
              در صورت فراموشی رمز برای گرفتن پسوورد به منشی مراجعه کنید.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
