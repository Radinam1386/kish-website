import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Save,
  UserCheck,
  Check,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import DatabaseErrorHandler from "../components/DatabaseErrorHandler";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { AnimatedButton } from "../components/AnimatedButton";
import { api } from "../services/api";

import "./SecretaryStudentForm.css";

function AdminSecretaryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [databaseError, setDatabaseError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

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
    status: "active",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (databaseError) setDatabaseError(null);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    let alive = true;

    async function loadSecretary() {
      if (!id) return;

      try {
        setLoading(true);
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
          username: user.username || "",
          password: user.plain_password || "",
          confirmPassword: user.plain_password || "",
          status: user.is_active ? "active" : "inactive",
        }));
      } catch (error) {
        if (alive) setDatabaseError(error);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadSecretary();

    return () => {
      alive = false;
    };
  }, [id]);

  const generatePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789#@!";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

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
      setTimeout(() => setPasswordCopied(false), 1800);
    } catch (error) {
      console.error("Password copy failed:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEdit && !formData.password) {
      alert("لطفاً رمز عبور را وارد کنید.");
      return;
    }

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      alert("رمز عبور و تکرار آن یکسان نیستند.");
      return;
    }

    setDatabaseError(null);
    setSubmitting(true);

    try {
      const payload = {
        username: formData.username.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone.trim(),
        national_code: formData.nationalId.trim(),
        birth_date: formData.birthDate,
        address: formData.address.trim(),
        role: "secretary",
        is_active: formData.status === "active",
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (isEdit) {
        await api.users.update(id, payload);
        alert("اطلاعات منشی با موفقیت به‌روزرسانی شد.");
      } else {
        await api.users.create(payload);
        alert("منشی جدید با موفقیت در سیستم ثبت گردید.");
      }

      navigate("/panel/admin/secretaries");
    } catch (error) {
      setDatabaseError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      role="پنل مدیریت"
      title={isEdit ? "ویرایش مشخصات منشی" : "افزودن منشی جدید"}
      menuType="admin"
    >
      <div className="secretary-student-form-page">
        <div className="secretary-student-form-top">
          <Link
            to="/panel/admin/secretaries"
            className="secretary-student-form-back"
          >
            <ArrowRight size={18} />
            <span>بازگشت به لیست منشی‌ها</span>
          </Link>
        </div>

        {databaseError && <DatabaseErrorHandler error={databaseError} />}

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "oklch(55% 0 0)",
            }}
          >
            در حال دریافت اطلاعات...
          </div>
        ) : (
          <form className="secretary-student-form" onSubmit={handleSubmit}>
            {/* Personal Info Card */}
            <section className="secretary-student-form-card">
              <div className="secretary-student-form-card-header">
                <div className="secretary-student-form-card-icon">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h2>اطلاعات فردی و شناسنامه‌ای</h2>
                  <p>
                    نام، شماره تماس و اطلاعات هویتی پرسنل منشی را وارد کنید.
                  </p>
                </div>
              </div>

              <div className="secretary-student-form-grid">
                <div className="secretary-student-form-field">
                  <span>
                    نام <b>*</b>
                  </span>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="مثلاً: سارا"
                    required
                  />
                </div>

                <div className="secretary-student-form-field">
                  <span>
                    نام خانوادگی <b>*</b>
                  </span>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="مثلاً: محمدی"
                    required
                  />
                </div>

                <div className="secretary-student-form-field">
                  <span>کد ملی</span>
                  <input
                    type="text"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                    placeholder="0012345678"
                  />
                </div>

                <div className="secretary-student-form-field">
                  <JalaliDatePicker
                    label="تاریخ تولد (شمسی)"
                    value={formData.birthDate}
                    onChange={(iso) =>
                      setFormData((prev) => ({ ...prev, birthDate: iso }))
                    }
                    placeholder="انتخاب تاریخ تولد..."
                  />
                </div>

                <div className="secretary-student-form-field">
                  <span>
                    شماره همراه <b>*</b>
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="09123456789"
                    required
                  />
                </div>

                <div className="secretary-student-form-field">
                  <span>پست الکترونیک (ایمیل)</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="secretary@kish.edu"
                  />
                </div>

                <div className="secretary-student-form-field full">
                  <span>آدرس محل سکونت</span>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="آدرس، خیابان، پلاک..."
                  />
                </div>
              </div>
            </section>

            {/* Account & Access Card */}
            <section className="secretary-student-form-card">
              <div className="secretary-student-form-card-header">
                <div className="secretary-student-form-card-icon account">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2>اطلاعات حساب کاربری و دسترسی</h2>
                  <p>
                    شناسه کاربری، کلمه عبور و وضعیت فعالیت در پنل را تعیین کنید.
                  </p>
                </div>
              </div>

              <div className="secretary-student-form-grid">
                <div className="secretary-student-form-field">
                  <span>
                    نام کاربری <b>*</b>
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="مثلاً: sara_mohammadi"
                    required
                  />
                </div>

                <div className="secretary-student-form-field">
                  <span>
                    وضعیت حساب کاربری <b>*</b>
                  </span>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">فعال (امکان ورود به سیستم)</option>
                    <option value="inactive">غیرفعال (مسدودشده)</option>
                  </select>
                </div>

                <div className="secretary-student-form-field full">
                  <span>
                    رمز عبور {!isEdit && <b>*</b>}
                  </span>

                  <div className="secretary-student-form-password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={
                        isEdit
                          ? "در صورت تمایل به تغییر رمز، رمز جدید را وارد کنید..."
                          : "حداقل ۶ کاراکتر یا تولید رمز تصادفی..."
                      }
                      required={!isEdit}
                      dir="ltr"
                    />

                    <button
                      type="button"
                      className="secretary-student-form-icon-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      title={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                    >
                      {showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="secretary-student-form-password-actions full">
                  <button
                    type="button"
                    className="secretary-student-form-action-btn"
                    onClick={generatePassword}
                  >
                    <RefreshCw size={15} />
                    <span>تولید رمز تصادفی</span>
                  </button>

                  <button
                    type="button"
                    className={`secretary-student-form-action-btn ${
                      passwordCopied ? "copied" : ""
                    }`}
                    onClick={copyPassword}
                  >
                    {passwordCopied ? <Check size={15} /> : <Copy size={15} />}
                    <span>{passwordCopied ? "کپی شد" : "کپی رمز"}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="secretary-student-form-actions">
              <Link
                to="/panel/admin/secretaries"
                className="secretary-student-form-cancel"
              >
                انصراف
              </Link>

              <AnimatedButton
                variant="primary"
                type="submit"
                disabled={submitting}
                icon={<Save size={18} />}
              >
                {submitting
                  ? "در حال ذخیره..."
                  : isEdit
                  ? "ثبت تغییرات"
                  : "ایجاد حساب منشی"}
              </AnimatedButton>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AdminSecretaryForm;
