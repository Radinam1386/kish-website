// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, rolePanelPath, storage } from "../services/api";
import { Eye, EyeClosed, UserRound } from "lucide-react";
import "./Login.css";
export default function Login() {
  const [role, setRole] = useState("student");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [passvisibility, setPassvisibility] = useState(false);
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
      <div className="login-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>

      <div className="login-inner">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-icon">🎯</div>
            <div className="brand-content">
              <h1>آموزشگاه زبان کیش</h1>
              <p className="subtitle">خوبان زنجان</p>
              <p className="tagline">یادگیری حرفه‌ای، آینده‌ای روشن</p>
            </div>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="phone">نام کاربری</label>
              <div className="input-wrap">
                <span className="input-password-toggle">
                  <UserRound />
                </span>
                <input
                  id="phone"
                  type="text"
                  placeholder="شماره تلفن همراه"
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
                <input
                  id="pass"
                  type={passvisibility ? "text" : "password"}
                  placeholder="رمز عبور خود را وارد کنید"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="input-password-toggle"
                  onClick={() => setPassvisibility((prev) => !prev)}
                  aria-label={
                    passvisibility ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"
                  }
                >
                  {passvisibility ? <EyeClosed size={18} /> : <Eye size={18} />}
                </button>
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
