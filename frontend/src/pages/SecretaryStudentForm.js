import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import "./SecretaryStudentForm.css";
import { AnimatedButton } from "../components/AnimatedButton";
import { api } from "../services/api";

function SecretaryStudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nationalId: "",
    birthDate: "",
    phone: "",
    email: "",
    address: "",
    username: "",
    password: "",
    confirmPassword: "",
    level: "",
    status: "active",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    let alive = true;

    async function loadStudent() {
      if (!id) return;

      try {
        const user = await api.users.get(id);
        if (!alive) return;
        setFormData((prev) => ({
          ...prev,
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          phone: user.phone_number || "",
          email: user.email || "",
          username: user.username || "",
          status: user.is_active ? "active" : "inactive",
        }));
      } catch (error) {
        alert(error.message || "دریافت اطلاعات دانش‌آموز ناموفق بود.");
      }
    }

    loadStudent();

    return () => {
      alive = false;
    };
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!id && formData.password !== formData.confirmPassword) {
      alert("رمز عبور و تکرار رمز عبور یکسان نیستند.");
      return;
    }

    try {
      const payload = {
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
        role: "student",
        is_active: formData.status === "active",
      };

      if (id) {
        await api.users.update(id, payload);
      } else {
        await api.users.create({
          ...payload,
          password: formData.password,
        });
      }

      alert("دانش‌آموز با موفقیت ثبت شد.");
      navigate("/panel/secretary/students");
    } catch (error) {
      alert(error.message || "ثبت دانش‌آموز ناموفق بود.");
    }
  };
  const generatePassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%&*";

    const getRandom = (chars) =>
      chars[Math.floor(Math.random() * chars.length)];

    const allChars = upper + lower + numbers + symbols;

    let password =
      getRandom(upper) +
      getRandom(lower) +
      getRandom(numbers) +
      getRandom(symbols);

    for (let i = password.length; i < 12; i++) {
      password += getRandom(allChars);
    }

    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setFormData((prev) => ({
      ...prev,
      password,
      confirmPassword: password,
    }));

    setShowPassword(true);
    setPasswordCopied(false);
  };

  const copyPassword = async () => {
    if (!formData.password) return;

    try {
      await navigator.clipboard.writeText(formData.password);

      setPasswordCopied(true);

      setTimeout(() => {
        setPasswordCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Password copy failed:", error);
    }
  };

  return (
    <DashboardLayout role="منشی" title="افزودن دانش‌آموز" menuType="secretary">
      <div className="secretary-student-form-page">
        <div className="secretary-student-form-top">
          <Link
            to="/panel/secretary/students"
            className="secretary-student-form-back"
          >
            <ArrowRight size={18} />
            <span>بازگشت به دانش‌آموزان</span>
          </Link>
        </div>

        <form className="secretary-student-form" onSubmit={handleSubmit}>
          <section className="secretary-student-form-card">
            <div className="secretary-student-form-card-header">
              <div className="secretary-student-form-card-icon">
                <UserRound size={20} />
              </div>

              <div>
                <h2>اطلاعات شخصی</h2>
                <p>اطلاعات اصلی دانش‌آموز را وارد کنید.</p>
              </div>
            </div>

            <div className="secretary-student-form-grid">
              <label className="secretary-student-form-field">
                <span>
                  نام <b>*</b>
                </span>

                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="مثلاً علی"
                  required
                />
              </label>

              <label className="secretary-student-form-field">
                <span>
                  نام خانوادگی <b>*</b>
                </span>

                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="مثلاً محمدی"
                  required
                />
              </label>

              <label className="secretary-student-form-field">
                <span>
                  کد ملی
                </span>

                <input
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleChange}
                  placeholder="۱۰ رقم"
                  inputMode="numeric"
                  maxLength="10"
                />
              </label>

              <label className="secretary-student-form-field">
                <span>تاریخ تولد</span>

                <input
                  type="text"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  placeholder="۱۴۰۵/۰۵/۰۵"
                />
              </label>

              <label className="secretary-student-form-field">
                <span>
                  شماره موبایل <b>*</b>
                </span>

                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09123456789"
                  inputMode="tel"
                  required
                />
              </label>

              <label className="secretary-student-form-field full">
                <span>آدرس</span>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="آدرس دانش‌آموز..."
                  rows="3"
                />
              </label>
            </div>
          </section>

          <section className="secretary-student-form-card">
            <div className="secretary-student-form-card-header">
              <div className="secretary-student-form-card-icon account">
                <Lock size={20} />
              </div>

              <div>
                <h2>اطلاعات حساب کاربری</h2>
                <p>اطلاعات ورود دانش‌آموز به پنل شخصی</p>
              </div>
            </div>

            <div className="secretary-student-form-grid">
              <label className="secretary-student-form-field">
                <span>
                  نام کاربری <b>*</b>
                </span>

                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="مثلاً ali.mohammadi"
                  dir="ltr"
                  required
                />
              </label>

              <label className="secretary-student-form-field">
                <span>
                  سطح زبان
                </span>

                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                >
                  <option value="">انتخاب سطح</option>

                  <option value="Elementary">Elementary</option>

                  <option value="Pre-Intermediate">Pre-Intermediate</option>

                  <option value="Intermediate">Intermediate</option>

                  <option value="Upper-Intermediate">Upper-Intermediate</option>

                  <option value="Advanced">Advanced</option>
                </select>
              </label>
              <label className="secretary-student-form-field">
                <span>
                  رمز عبور {!id && <b>*</b>}
                </span>

                <div className="secretary-student-password">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="رمز عبور"
                    dir="ltr"
                    required={!id}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"
                    }
                    className="secretary-student-password-icon"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="secretary-student-password-tools">
                  <button
                    type="button"
                    className="secretary-student-password-generate"
                    onClick={generatePassword}
                  >
                    <RefreshCw size={16} />
                    <span>تولید رمز قوی</span>
                  </button>

                  <button
                    type="button"
                    className="secretary-student-password-copy"
                    onClick={copyPassword}
                    disabled={!formData.password}
                  >
                    {passwordCopied ? (
                      <>
                        <KeyRound size={16} />
                        <span>کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>کپی</span>
                      </>
                    )}
                  </button>
                </div>

                <small className="secretary-student-password-hint">
                  رمز پیشنهادی شامل حروف بزرگ و کوچک، عدد و کاراکتر ویژه است.
                </small>
              </label>

              <label className="secretary-student-form-field">
                <span>وضعیت حساب</span>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">فعال</option>

                  <option value="inactive">غیرفعال</option>
                </select>
              </label>
            </div>
          </section>

          {/* ================= Actions ================= */}

          <div className="secretary-student-form-actions">
            <Link
              to="/panel/secretary/students"
            >
              <AnimatedButton variant="ghost">انصراف</AnimatedButton>
            </Link>

            <AnimatedButton variant="primary">
              <Save size={18} />
              <span>ثبت دانش‌آموز</span>
            </AnimatedButton>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default SecretaryStudentForm;
