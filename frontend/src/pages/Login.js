// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, rolePanelPath, storage } from "../services/api";
import "./Login.css";

const ROLES = [
  { key: "student", label: "دانش‌آموز", icon: "📘" },
  { key: "teacher", label: "استاد", icon: "🎓" },
  { key: "secretary", label: "منشی", icon: "📋" },
  { key: "admin", label: "مدیریت", icon: "⚙️" },
];

export default function Login() {
  const [role, setRole] = useState("student");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await api.login({ username: phone, password: pass });
      storage.setSession(session);

      if (session.user.role !== role) {
        setError("نقش انتخاب‌شده با حساب کاربری واردشده همخوانی ندارد.");
        storage.clearSession();
        return;
      }

      navigate(rolePanelPath(session.user.role));
    } catch (err) {
      setError(err.message || "ورود ناموفق بود.");
    } finally {
      setLoading(false);
    }
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
              <label htmlFor="phone">نام کاربری</label>
              <div className="input-wrap">
                <span className="input-icon">📱</span>
                <input
                  id="phone"
                  type="text"
                  placeholder="نام کاربری ثبت‌شده"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
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

            {error && <p className="login-error">{error}</p>}

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
