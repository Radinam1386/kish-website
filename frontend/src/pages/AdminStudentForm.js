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
    phone: "",
    parentPhone: "",
    email: "",
    address: "",
    username: "",
    password: "",
    confirmPassword: "",
    level: "",
    status: "active",
  });

  const normalizeDigits = (value) => {
    if (!value) return "";

    return String(value)
      .replace(/[۰-۹]/g, (digit) =>
        String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)),
      )
      .replace(/[٠-٩]/g, (digit) =>
        String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)),
      );
  };

  const normalizePhone = (value) => {
    return normalizeDigits(value)
      .replace(/\D/g, "")
      .replace(/^98/, "0")
      .replace(/^9(?=\d{9}$)/, "0$&");
  };

  const isValidIranianMobile = (value) => {
    const phone = normalizePhone(value);
    return /^09\d{9}$/.test(phone);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (databaseError) {
      setDatabaseError(null);
    }

    let newValue = value;

    if (name === "phone" || name === "parentPhone") {
      newValue = normalizePhone(value);
    }

    if (name === "nationalId") {
      newValue = normalizeDigits(value).replace(/\D/g, "").slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
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
          .map((term) =>
            typeof term.id === "string" ? Number(term.id) : term.id,
          );

        const activeClasses = (classroomsData || []).filter((classroom) => {
          const classroomTermId =
            typeof classroom.term === "object"
              ? classroom.term?.id
              : classroom.term;

          return (
            activeTermIds.length === 0 ||
            activeTermIds.includes(Number(classroomTermId))
          );
        });

        setClassrooms(activeClasses);

        if (id) {
          const user = await api.users.get(id);

          if (!alive) return;

          const parentPhone = normalizePhone(
            user.parent_phone || "",
          );

          const username = user.username || parentPhone;

          setFormData((prev) => ({
            ...prev,
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            nationalId: user.national_code || "",
            birthDate: user.birth_date || "",
            phone: normalizePhone(user.phone_number || ""),
            parentPhone,
            email: user.email || "",
            address: user.address || "",
            level: user.level || "",
            username,
            password: user.plain_password || "",
            confirmPassword: user.plain_password || "",
            status: user.is_active ? "active" : "inactive",
          }));
        }
      } catch (error) {
        if (!alive) return;
        setDatabaseError(error);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, [id]);

  const handleParentPhoneChange = (event) => {
    const parentPhone = normalizePhone(event.target.value);

    if (databaseError) {
      setDatabaseError(null);
    }

    setFormData((prev) => ({
      ...prev,
      parentPhone,
      username: parentPhone,
      password: id ? prev.password : parentPhone,
      confirmPassword: id ? prev.confirmPassword : parentPhone,
    }));

    setPasswordCopied(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const parentPhone = normalizePhone(formData.parentPhone);

    if (!isValidIranianMobile(parentPhone)) {
      alert(
        "شماره تماس والدین نامعتبر است.\nشماره باید به صورت 09123456789 وارد شود.",
      );
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert("نام و نام خانوادگی را وارد کنید.");
      return;
    }

    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      alert("رمز عبور و تکرار رمز عبور یکسان نیستند.");
      return;
    }

    setDatabaseError(null);
    setSubmitting(true);

    try {
      const payload = {
        username: parentPhone,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email,
        phone_number: formData.phone,
        parent_phone: parentPhone,
        national_code: formData.nationalId,
        birth_date: formData.birthDate,
        address: formData.address,
        level: formData.level,
        role: "student",
        is_active: formData.status === "active",
      };

      /*
       * برای دانش‌آموز جدید:
       * username = شماره والدین
       * password = شماره والدین
       */
      if (!id) {
        payload.password = parentPhone;
      } else if (formData.password) {
        payload.password = formData.password;
      }

      if (id) {
        await api.users.update(id, payload);
      } else {
        const createdUser = await api.users.create(payload);

        if (selectedClassId) {
          try {
            await api.enrollments.create({
              student: createdUser.id,
              classroom: Number(selectedClassId),
              is_paid: initialIsPaid,
            });
          } catch (enrErr) {
            console.error("Enrollment creation failed:", enrErr);
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
        >
          <section className="secretary-student-form-card">
            <div className="secretary-student-form-card-header">
              <div className="secretary-student-form-card-icon">
                <UserRound size={20} />
              </div>

              <div>
                <h2>اطلاعات شخصی</h2>
                <p>
                  اطلاعات هویتی و تاریخ تولد دانش‌آموز را وارد کنید.
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
                  شماره موبایل <b>*</b>
                </span>

                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09123456789"
                  inputMode="tel"
                  maxLength="11"
                  dir="ltr"
                  required
                />
              </label>

              <label className="secretary-student-form-field">
                <span>
                  شماره تماس والدین <b>*</b>
                </span>

                <input
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleParentPhoneChange}
                  placeholder="09123456789"
                  inputMode="tel"
                  maxLength="11"
                  dir="ltr"
                  required
                />

                <small
                  style={{
                    color: "var(--muted, #64748b)",
                    marginTop: "0.35rem",
                    display: "block",
                  }}
                >
                  نام کاربری و رمز ورود دانش‌آموز بر اساس این شماره تنظیم
                  می‌شود.
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
                    onChange={(e) =>
                      setSelectedClassId(e.target.value)
                    }
                  >
                    <option value="">
                      بدون کلاس فعلاً (بعداً در پرونده تعیین شود)
                    </option>

                    {classrooms.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (شهریه:{" "}
                        {toPersianDigits(
                          (
                            cls.tuition_fee || 2500000
                          ).toLocaleString("fa-IR"),
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
                        onChange={(e) =>
                          setInitialIsPaid(e.target.checked)
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
                  placeholder="شماره والدین"
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
                  placeholder="example@domain.com"
                  dir="ltr"
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
                  <option value="fam1.1">fam1.1</option>
                  <option value="fam1.2">fam1.2</option>
                  <option value="fam1.3">fam1.3</option>
                  <option value="fam1.4">fam1.4</option>
                  <option value="top1.1">top1.1</option>
                  <option value="top1.2">top1.2</option>
                  <option value="top1.3">top1.3</option>
                  <option value="top1.4">top1.4</option>
                  <option value="top2.1">top2.1</option>
                  <option value="top2.2">top2.2</option>
                  <option value="top2.3">top2.3</option>
                  <option value="top2.4">top2.4</option>
                  <option value="top3.1">top3.1</option>
                  <option value="top3.2">top3.2</option>
                  <option value="top3.3">top3.3</option>
                  <option value="top3.4">top3.4</option>
                  <option value="sum1.1">sum1.1</option>
                  <option value="sum1.2">sum1.2</option>
                  <option value="sum1.3">sum1.3</option>
                  <option value="sum1.4">sum1.4</option>
                  <option value="sum2.1">sum2.1</option>
                  <option value="sum2.2">sum2.2</option>
                  <option value="sum2.3">sum2.3</option>
                  <option value="sum2.4">sum2.4</option>
                  <option value="fce1">fce1</option>
                  <option value="fce2">fce2</option>
                  <option value="fce3">fce3</option>
                  <option value="fce4">fce4</option>
                  <option value="IELTS1">IELTS1</option>
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
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        dir="ltr"
                        required
                      />

                      <button
                        type="button"
                        className="secretary-student-form-icon-btn"
                        onClick={() =>
                          setShowPassword((prev) => !prev)
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
                            برای امنیت بیشتر می‌توانید یک رمز قوی و
                            تصادفی تولید کنید.
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
                            <strong>تولید رمز امن</strong>
                          </span>
                        </button>

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
              onClose={() => setDatabaseError(null)}
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