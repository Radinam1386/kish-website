import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Save,
  UserRound,
  BookOpen,
  Check,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import DatabaseErrorHandler from "../components/DatabaseErrorHandler";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { AnimatedButton } from "../components/AnimatedButton";
import { api } from "../services/api";
import { toPersianDigits } from "../utils/dateUtils";

import "./AdminStudentForm.css";

function AdminStudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [databaseError, setDatabaseError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [initialIsPaid, setInitialIsPaid] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nationalId: "",
    birthDate: "",

    // شماره موبایل خود دانش‌آموز
    phone: "",

    // شماره تماس والد
    parentPhone: "",

    email: "",
    address: "",

    // username مستقل از شماره والد
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

    async function loadData() {
      try {
        setDatabaseError(null);

        const [classroomsData, termsData] = await Promise.all([
          api.classrooms.list(),
          api.terms.list(),
        ]);

        if (!alive) return;

        const activeTermIds = (termsData || [])
          .filter((term) => term.is_active)
          .map((term) => Number(term.id));

        const activeClasses = (classroomsData || []).filter((classroom) => {
          const termId =
            typeof classroom.term === "object"
              ? classroom.term?.id
              : classroom.term;

          return (
            activeTermIds.length === 0 ||
            activeTermIds.includes(Number(termId))
          );
        });

        setClassrooms(activeClasses);

        if (id) {
          const user = await api.users.get(id);

          if (!alive) return;

          setFormData((prev) => ({
            ...prev,

            firstName: user.first_name || "",
            lastName: user.last_name || "",

            nationalId: user.national_code || "",
            birthDate: user.birth_date || "",

            phone: user.phone_number || "",
            parentPhone: user.parent_phone || "",

            email: user.email || "",
            address: user.address || "",

            // مهم:
            // username مستقیماً از username خود User خوانده می‌شود
            username: user.username || "",

            password: user.plain_password || "",
            confirmPassword: user.plain_password || "",

            level: user.level || "",
            status: user.is_active ? "active" : "inactive",
          }));
        }
      } catch (error) {
        if (!alive) return;

        console.error("Student form loading error:", error);
        setDatabaseError(error);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    const username = String(formData.username || "").trim();
    const password = String(formData.password || "");
    const confirmPassword = String(formData.confirmPassword || "");

    if (!username) {
      alert("لطفاً نام کاربری را وارد کنید.");
      return;
    }

    if (!id && !password) {
      alert("لطفاً رمز عبور را وارد کنید.");
      return;
    }

    if (password && confirmPassword && password !== confirmPassword) {
      alert("رمز عبور و تکرار رمز عبور یکسان نیستند.");
      return;
    }

    setDatabaseError(null);
    setSubmitting(true);

    try {
      /*
       * بسیار مهم:
       *
       * username مستقیماً از فیلد username می‌آید.
       * شماره والد هیچ نقشی در username ندارد.
       */
      const payload = {
        username,

        first_name: String(formData.firstName || "").trim(),
        last_name: String(formData.lastName || "").trim(),

        email: String(formData.email || "").trim(),

        phone_number: String(formData.phone || "").trim(),

        parent_phone: String(formData.parentPhone || "").trim(),

        national_code: String(formData.nationalId || "").trim(),

        birth_date: formData.birthDate || "",

        address: String(formData.address || "").trim(),

        level: formData.level || "",

        role: "student",

        is_active: formData.status === "active",
      };

      /*
       * هنگام ایجاد یا تغییر رمز عبور
       */
      if (password) {
        payload.password = password;
      }

      console.log("Student payload:", payload);

      if (id) {
        await api.users.update(id, payload);
      } else {
        const createdUser = await api.users.create(payload);

        /*
         * ثبت در کلاس اولیه
         */
        if (selectedClassId) {
          try {
            await api.enrollments.create({
              student: createdUser.id,
              classroom: Number(selectedClassId),
              is_paid: initialIsPaid,
            });
          } catch (enrollmentError) {
            console.error(
              "Enrollment creation failed:",
              enrollmentError,
            );

            /*
             * خود ثبت دانش‌آموز موفق بوده،
             * بنابراین فقط خطای ثبت کلاس را نمایش می‌دهیم.
             */
            alert(
              "دانش‌آموز ثبت شد، اما ثبت کلاس اولیه انجام نشد. " +
                "می‌توانید کلاس را بعداً از پرونده دانش‌آموز تعیین کنید.",
            );
          }
        }
      }

      alert(
        id
          ? "اطلاعات دانش‌آموز با موفقیت ویرایش شد."
          : "دانش‌آموز با موفقیت ثبت شد.",
      );

      navigate("/panel/admin/students");
    } catch (error) {
      console.error("Student save error:", error);

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
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(formData.password);
      } else {
        const textarea = document.createElement("textarea");

        textarea.value = formData.password;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        document.execCommand("copy");

        document.body.removeChild(textarea);
      }

      setPasswordCopied(true);

      setTimeout(() => {
        setPasswordCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Password copy failed:", error);
      alert("کپی رمز عبور انجام نشد.");
    }
  };

  return (
    <DashboardLayout
      role="مدیریت"
      title={id ? "ویرایش دانش‌آموز" : "افزودن دانش‌آموز"}
      menuType="admin"
    >
      <div className="secretary-student-form-page">
        <div className="secretary-student-form-top">
          <Link
            to="/panel/admin/students"
            className="secretary-student-form-back"
          >
            <ArrowRight size={18} />
            <span>بازگشت به دانش‌آموزان</span>
          </Link>
        </div>

        <form
          className="secretary-student-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* اطلاعات شخصی */}

          <section className="secretary-student-form-card">
            <div className="secretary-student-form-card-header">
              <div className="secretary-student-form-card-icon">
                <UserRound size={20} />
              </div>

              <div>
                <h2>اطلاعات شخصی</h2>
                <p>
                  اطلاعات هویتی و اطلاعات تماس دانش‌آموز را وارد کنید.
                </p>
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
                  شماره موبایل دانش‌آموز <b>*</b>
                </span>

                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09123456789"
                  inputMode="tel"
                  dir="ltr"
                  required
                />
              </label>

              <label className="secretary-student-form-field">
                <span>شماره تماس والدین</span>

                <input
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  placeholder="09123456789"
                  inputMode="tel"
                  dir="ltr"
                />

                <small>
                  برای خواهر و برادر می‌تواند یکسان باشد.
                </small>
              </label>

              <div
                className="secretary-student-form-field full"
                style={{ marginTop: "0.25rem" }}
              >
                <JalaliDatePicker
                  label="تاریخ تولد (شمسی)"
                  value={formData.birthDate}
                  onChange={(iso, jalali) =>
                    setFormData((prev) => ({
                      ...prev,
                      birthDate: jalali,
                    }))
                  }
                  minYear={1350}
                  maxYear={1410}
                  showQuickButtons={false}
                />
              </div>

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

          {/* تعیین کلاس اولیه */}

          {!id && (
            <section className="secretary-student-form-card">
              <div className="secretary-student-form-card-header">
                <div
                  className="secretary-student-form-card-icon"
                  style={{ background: "var(--primary)" }}
                >
                  <BookOpen size={20} />
                </div>

                <div>
                  <h2>تعیین کلاس اولیه</h2>

                  <p>
                    کلاس آموزشی ترم جاری را برای دانش‌آموز تعیین کنید
                    (اختیاری)
                  </p>
                </div>
              </div>

              <div className="secretary-student-form-grid">
                <label className="secretary-student-form-field full">
                  <span>انتخاب کلاس آموزشی</span>

                  <select
                    value={selectedClassId}
                    onChange={(event) =>
                      setSelectedClassId(event.target.value)
                    }
                  >
                    <option value="">
                      بدون کلاس فعلاً (بعداً در پرونده تعیین شود)
                    </option>

                    {classrooms.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}{" "}
                        (شهریه:{" "}
                        {toPersianDigits(
                          (cls.tuition_fee || 2500000).toLocaleString(
                            "fa-IR",
                          ),
                        )}{" "}
                        تومان)
                      </option>
                    ))}
                  </select>
                </label>

                {selectedClassId && (
                  <div className="secretary-student-form-field full">
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        fontWeight: "700",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={initialIsPaid}
                        onChange={(event) =>
                          setInitialIsPaid(event.target.checked)
                        }
                      />

                      <span>
                        شهریه این کلاس هم‌اکنون به صورت نقدی/کارتخوان
                        در دفتر تسویه شد.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* حساب کاربری */}

          <section className="secretary-student-form-card">
            <div className="secretary-student-form-card-header">
              <div className="secretary-student-form-card-icon account">
                <Lock size={20} />
              </div>

              <div>
                <h2>اطلاعات حساب کاربری</h2>

                <p>
                  اطلاعات ورود دانش‌آموز به پنل شخصی
                </p>
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
                  autoComplete="username"
                  required
                />

                <small>
                  نام کاربری باید برای هر دانش‌آموز یکتا باشد.
                </small>
              </label>

              <label className="secretary-student-form-field">
                <span>ایمیل</span>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@domain.com"
                  dir="ltr"
                  autoComplete="email"
                />
              </label>

              <label className="secretary-student-form-field">
                <span>سطح زبان</span>

                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                >
                  <option value="">انتخاب سطح</option>
                  <option value="Elementary">Elementary</option>
                  <option value="Pre-Intermediate">
                    Pre-Intermediate
                  </option>
                  <option value="Intermediate">
                    Intermediate
                  </option>
                  <option value="Upper-Intermediate">
                    Upper-Intermediate
                  </option>
                  <option value="Advanced">Advanced</option>
                </select>
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
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        dir="ltr"
                        autoComplete="new-password"
                        required
                      />

                      <button
                        type="button"
                        className="secretary-student-form-icon-btn"
                        onClick={() =>
                          setShowPassword(
                            (prev) => !prev,
                          )
                        }
                        title={
                          showPassword
                            ? "مخفی کردن رمز"
                            : "نمایش رمز"
                        }
                        aria-label={
                          showPassword
                            ? "مخفی کردن رمز"
                            : "نمایش رمز"
                        }
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
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="تکرار رمز عبور"
                      dir="ltr"
                      autoComplete="new-password"
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
                          <strong>
                            ابزارهای رمز عبور
                          </strong>

                          <span>
                            برای امنیت بیشتر می‌توانید
                            یک رمز قوی و تصادفی تولید
                            کنید.
                          </span>
                        </div>
                      </div>

                      <div className="secretary-student-form-password-buttons">
                        <button
                          type="button"
                          className="secretary-student-form-action-btn generate"
                          onClick={generatePassword}
                        >
                          <span className="secretary-student-form-action-icon">
                            <RefreshCw size={16} />
                          </span>

                          <span className="secretary-student-form-action-text">
                            <strong>
                              تولید رمز امن
                            </strong>
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`secretary-student-form-action-btn copy ${
                            passwordCopied
                              ? "copied"
                              : ""
                          }`}
                          onClick={copyPassword}
                          disabled={
                            !formData.password
                          }
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
                              {passwordCopied
                                ? "کپی شد"
                                : "کپی رمز"}
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
              onClose={() =>
                setDatabaseError(null)
              }
            />
          )}

          <div className="secretary-student-form-actions">
            <Link
              to="/panel/admin/students"
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
                ? "در حال ثبت..."
                : id
                  ? "ذخیره تغییرات"
                  : "ثبت دانش‌آموز"}
            </AnimatedButton>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default AdminStudentForm;