import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import DatabaseErrorHandler from "../components/DatabaseErrorHandler";
import JalaliDatePicker from "../components/JalaliDatePicker";
import "./AdminStudentForm.css";
import { AnimatedButton } from "../components/AnimatedButton";
import { api } from "../services/api";

function AdminTeacherForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const isSecretary = location.pathname.includes("/secretary");
  const roleTitle = isSecretary ? "پنل منشی" : "پنل مدیریت";
  const menuType = isSecretary ? "secretary" : "admin";
  const basePath = isSecretary
    ? "/panel/secretary/teachers"
    : "/panel/admin/teachers";

  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [databaseError, setDatabaseError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (databaseError) {
      setDatabaseError(null);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    let alive = true;

    async function loadTeacher() {
      if (!id) return;

      try {
        setDatabaseError(null);
        const user = await api.users.get(id);

        if (!alive) return;

        setFormData((prev) => ({
          ...prev,
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          nationalId: user.national_code || "",
          birthDate: user.birth_date || "",
          phone: user.phone_number || "",
          email: user.email || "",
          address: user.address || "",
          level: user.level || "",
          username: user.username || "",
          password: user.plain_password || "",
          confirmPassword: user.plain_password || "",
          status: user.is_active ? "active" : "inactive",
        }));
      } catch (error) {
        if (!alive) return;
        setDatabaseError(error);
      }
    }

    loadTeacher();

    return () => {
      alive = false;
    };
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      alert("رمز عبور و تکرار رمز عبور یکسان نیستند.");
      return;
    }

    setDatabaseError(null);
    setSubmitting(true);

    try {
      const payload = {
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
        national_code: formData.nationalId,
        birth_date: formData.birthDate,
        address: formData.address,
        level: formData.level,
        role: "teacher",
        is_active: formData.status === "active",
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (id) {
        await api.users.update(id, payload);
      } else {
        await api.users.create(payload);
      }

      alert(
        id ? "اطلاعات معلم با موفقیت ویرایش شد." : "معلم با موفقیت ثبت شد.",
      );

      navigate(basePath);
    } catch (error) {
      setDatabaseError(error);
    } finally {
      setSubmitting(false);
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
    <DashboardLayout
      role={roleTitle}
      title={id ? "ویرایش معلم" : "افزودن معلم"}
      menuType={menuType}
    >
      <div className="secretary-student-form-page">
        <div className="secretary-student-form-top">
          <Link to={basePath} className="secretary-student-form-back">
            <ArrowRight size={18} />
            <span>بازگشت به معلمان</span>
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
                <p>اطلاعات هویتی و تاریخ تولد مدرس را وارد کنید.</p>
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
                <span>کد ملی</span>
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

              {/* Persian Date Picker for Teacher Birth Date */}
              <div
                className="secretary-student-form-field full"
                style={{ marginTop: "0.25rem" }}
              >
                <JalaliDatePicker
                  label="تاریخ تولد (شمسی)"
                  value={formData.birthDate}
                  onChange={(iso, jalali) =>
                    setFormData((prev) => ({ ...prev, birthDate: jalali }))
                  }
                  minYear={1340}
                  maxYear={1400}
                  showQuickButtons={false}
                />
              </div>

              <label className="secretary-student-form-field full">
                <span>آدرس</span>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="آدرس معلم..."
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
                <p>اطلاعات ورود معلم به پنل شخصی</p>
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
                  placeholder="مثلاً teacher.ali"
                  dir="ltr"
                  required
                />
              </label>

              <label className="secretary-student-form-field">
                <span>ایمیل</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="teacher@domain.com"
                  dir="ltr"
                />
              </label>

              <label className="secretary-student-form-field">
                <span>مدرک و تخصص</span>
                <input
                  type="text"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  placeholder="مثلاً کارشناسی ارشد آموزش زبان انگلیسی"
                />
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

              {!id && (
                <>
                  <div className="secretary-student-form-field">
                    <span>
                      رمز عبور <b>*</b>
                    </span>

                    <div className="secretary-student-form-password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="حداقل ۶ کاراکتر"
                        dir="ltr"
                        required
                      />

                      <button
                        type="button"
                        className="secretary-student-form-icon-btn"
                        onClick={() => setShowPassword((prev) => !prev)}
                        title={showPassword ? "مخفی کردن" : "نمایش رمز"}
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="secretary-student-form-field">
                    <span>
                      تکرار رمز عبور <b>*</b>
                    </span>

                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="تکرار رمز عبور"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="secretary-student-form-password-actions full">
                    <div className="secretary-student-form-password-tools-content">
                      <div className="secretary-student-form-password-tools-title">
                        <div className="secretary-student-form-password-tools-icon">
                          <Lock size={17} />
                        </div>

                        <div>
                          <strong>ابزارهای رمز عبور</strong>

                          <span>
                            برای امنیت بیشتر می‌توانید یک رمز قوی و تصادفی تولید
                            کنید.
                          </span>
                        </div>
                      </div>

                      <div className="secretary-student-form-password-buttons">
                        {/* Generate */}
                        <button
                          type="button"
                          className="secretary-student-form-action-btn generate"
                          onClick={generatePassword}
                        >
                          <span className="secretary-student-form-action-icon">
                            <RefreshCw size={16} />
                          </span>

                          <span className="secretary-student-form-action-text">
                            <strong>تولید رمز امن</strong>
                          </span>
                        </button>

                        {/* Copy */}
                        <button
                          type="button"
                          className={`secretary-student-form-action-btn copy ${
                            passwordCopied ? "copied" : ""
                          }`}
                          onClick={copyPassword}
                          disabled={!formData.password}
                        >
                          <span className="secretary-student-form-action-icon">
                            {passwordCopied ? (
                              <Check size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
                          </span>

                          <span className="secretary-student-form-action-text">
                            <strong>
                              {passwordCopied ? "کپی شد" : "کپی رمز"}
                            </strong>

                            <small>
                              {passwordCopied
                                ? "رمز در کلیپ‌بورد ذخیره شد"
                                : "کپی سریع رمز فعلی"}
                            </small>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {databaseError && (
            <DatabaseErrorHandler
              error={databaseError}
              onClose={() => setDatabaseError(null)}
            />
          )}

          <div className="secretary-student-form-actions">
            <Link to={basePath} className="secretary-student-form-cancel">
              انصراف
            </Link>

            <AnimatedButton
              variant="primary"
              type="submit"
              disabled={submitting}
              icon={<Save size={18} />}
            >
              {submitting ? "در حال ثبت..." : id ? "ذخیره تغییرات" : "ثبت معلم"}
            </AnimatedButton>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default AdminTeacherForm;
