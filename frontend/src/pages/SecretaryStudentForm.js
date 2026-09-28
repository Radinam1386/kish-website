import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  Lock,
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

import "./SecretaryStudentForm.css";

function SecretaryStudentForm() {
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
    if (value === null || value === undefined) return "";

    return String(value)
      .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  };

  const normalizePhone = (value) => {
    let phone = normalizeDigits(value).trim().replace(/\D/g, "");

    if (phone.startsWith("98") && phone.length === 12) {
      phone = "0" + phone.slice(2);
    }

    if (phone.length === 10 && phone.startsWith("9")) {
      phone = "0" + phone;
    }

    return phone;
  };

  const isValidIranianMobile = (value) => {
    return /^09\d{9}$/.test(value);
  };

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

  const handleParentPhoneChange = (event) => {
    const value = normalizeDigits(event.target.value);

    if (databaseError) {
      setDatabaseError(null);
    }

    setFormData((prev) => {
      const nextParentPhone = normalizePhone(value);

      return {
        ...prev,
        parentPhone: value,
        username: nextParentPhone,
        password: nextParentPhone,
        confirmPassword: nextParentPhone,
      };
    });

    setPasswordCopied(false);
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
          .map((term) => term.id);

        const activeClasses = (classroomsData || []).filter((classroom) => {
          const classroomTermId =
            typeof classroom.term === "object"
              ? classroom.term?.id
              : classroom.term;

          return (
            activeTermIds.length === 0 ||
            activeTermIds.includes(classroomTermId)
          );
        });

        setClassrooms(activeClasses);

        if (id) {
          const user = await api.users.get(id);

          if (!alive) return;

          const parentPhone = normalizePhone(user.parent_phone || "");

          setFormData({
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            nationalId: user.national_code || "",
            birthDate: user.birth_date || "",
            phone: user.phone_number || "",
            parentPhone,
            email: user.email || "",
            address: user.address || "",
            level: user.level || "",
            username: parentPhone || user.username || "",
            password: parentPhone || user.plain_password || "",
            confirmPassword: parentPhone || user.plain_password || "",
            status: user.is_active ? "active" : "inactive",
          });
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    const parentPhone = normalizePhone(formData.parentPhone);

    if (!isValidIranianMobile(parentPhone)) {
      alert(
        "شماره تماس والدین معتبر نیست.\n\nشماره باید به صورت 09xxxxxxxxx وارد شود.",
      );
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
      /*
       * سیاست حساب دانش‌آموز:
       *
       * username = parent_phone
       * password = parent_phone
       *
       * شماره والدین منبع اصلی اطلاعات ورود است.
       */
      const payload = {
        username: parentPhone,
        password: parentPhone,

        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),

        email: formData.email.trim(),
        phone_number: normalizePhone(formData.phone),
        parent_phone: parentPhone,

        national_code: normalizeDigits(formData.nationalId).trim(),
        birth_date: formData.birthDate,
        address: formData.address,

        level: formData.level,
        role: "student",
        is_active: formData.status === "active",
      };

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
          } catch (enrollmentError) {
            console.error("Enrollment creation error:", enrollmentError);

            alert("دانش‌آموز ثبت شد، اما اتصال او به کلاس با خطا مواجه شد.");
          }
        }
      }

      alert(
        id
          ? "اطلاعات دانش‌آموز با موفقیت ویرایش شد."
          : "دانش‌آموز با موفقیت ثبت شد.",
      );

      navigate("/panel/secretary/students");
    } catch (error) {
      setDatabaseError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = async () => {
    const password = normalizePhone(formData.parentPhone);

    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);

      setPasswordCopied(true);

      setTimeout(() => {
        setPasswordCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Password copy failed:", error);
    }
  };

  const parentPhoneIsValid =
    formData.parentPhone.length === 11 &&
    isValidIranianMobile(normalizePhone(formData.parentPhone));

  return (
    <DashboardLayout
      role="پنل منشی"
      title={id ? "ویرایش دانش‌آموز" : "افزودن دانش‌آموز"}
      menuType="secretary"
    >
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
                <p>اطلاعات هویتی و مشخصات تماس دانش‌آموز را وارد کنید.</p>
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
                <span>شماره موبایل دانش‌آموز</span>

                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09123456789"
                  inputMode="tel"
                  dir="ltr"
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
                  dir="ltr"
                  maxLength="11"
                  required
                  className={
                    formData.parentPhone && !parentPhoneIsValid ? "invalid" : ""
                  }
                />

                {formData.parentPhone && !parentPhoneIsValid && (
                  <small className="secretary-student-form-error-text">
                    شماره والد باید ۱۱ رقم و با 09 شروع شود.
                  </small>
                )}

                {parentPhoneIsValid && (
                  <small className="secretary-student-form-help-text">
                    این شماره به صورت خودکار برای نام کاربری و رمز عبور استفاده
                    می‌شود.
                  </small>
                )}
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
                    کلاس آموزشی ترم جاری را برای دانش‌آموز تعیین کنید (اختیاری)
                  </p>
                </div>
              </div>

              <div className="secretary-student-form-grid">
                <label className="secretary-student-form-field full">
                  <span>انتخاب کلاس آموزشی</span>

                  <select
                    value={selectedClassId}
                    onChange={(event) => setSelectedClassId(event.target.value)}
                  >
                    <option value="">
                      بدون کلاس فعلاً (بعداً در پرونده تعیین شود)
                    </option>

                    {classrooms.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (شهریه:{" "}
                        {toPersianDigits(
                          Number(cls.tuition_fee || 2500000).toLocaleString(
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
                        شهریه این کلاس هم‌اکنون به صورت نقدی/کارتخوان در دفتر
                        تسویه شد.
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
                  readOnly
                  placeholder="شماره تماس والدین"
                  dir="ltr"
                  required
                />

                <small className="secretary-student-form-help-text">
                  نام کاربری به صورت خودکار از شماره والدین تعیین می‌شود.
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
                  <option value="hip1.1">hip1.1</option>
                  <option value="hip1.2">hip1.2</option>
                  <option value="hip2.1">hip2.1</option>
                  <option value="hip2.2">hip2.2</option>
                  <option value="hip2.1">hip3.1</option>
                  <option value="hip2.2">hip3.2</option>
                  <option value="hip2.1">hip4.1</option>
                  <option value="hip2.2">hip4.2</option>
                  <option value="hip2.1">hip5.1</option>
                  <option value="hip2.2">hip5.2</option>
                  <option value="con1.1">con1.1</option>
                  <option value="con1.2">con1.2</option>
                  <option value="con1.3">con1.3</option>
                  <option value="con2.1">con2.1</option>
                  <option value="con2.2">con2.2</option>
                  <option value="con2.3">con2.3</option>
                  <option value="con3.1">con3.1</option>
                  <option value="con3.2">con3.2</option>
                  <option value="con3.3">con3.3</option>
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

              <div className="secretary-student-form-field full">
                <span>
                  رمز عبور <b>*</b>
                </span>

                <div className="secretary-student-form-password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    readOnly
                    placeholder="شماره تماس والدین"
                    dir="ltr"
                    required
                  />

                  <button
                    type="button"
                    className="secretary-student-form-icon-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? "مخفی کردن" : "نمایش رمز"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <small className="secretary-student-form-help-text">
                  رمز عبور اولیه همان شماره تماس والدین است.
                </small>
              </div>

              <div className="secretary-student-form-field full">
                <span>تکرار رمز عبور</span>

                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  readOnly
                  placeholder="شماره تماس والدین"
                  dir="ltr"
                />
              </div>

              <div className="secretary-student-form-password-actions full">
                <div className="secretary-student-form-password-tools-content">
                  <div className="secretary-student-form-password-tools-title">
                    <div className="secretary-student-form-password-tools-icon">
                      <Lock size={17} />
                    </div>

                    <div>
                      <strong>اطلاعات ورود دانش‌آموز</strong>

                      <span>
                        نام کاربری و رمز عبور به صورت خودکار از شماره تماس
                        والدین تعیین می‌شوند.
                      </span>
                    </div>
                  </div>

                  <div className="secretary-student-form-password-buttons">
                    <button
                      type="button"
                      className={`secretary-student-form-action-btn copy ${
                        passwordCopied ? "copied" : ""
                      }`}
                      onClick={copyPassword}
                      disabled={!parentPhoneIsValid}
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
                          {passwordCopied ? "کپی شد" : "کپی اطلاعات ورود"}
                        </strong>

                        <small>
                          {passwordCopied
                            ? "شماره والد در کلیپ‌بورد ذخیره شد"
                            : "کپی سریع نام کاربری و رمز"}
                        </small>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
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
              to="/panel/secretary/students"
              className="secretary-student-form-cancel"
            >
              انصراف
            </Link>

            <AnimatedButton
              variant="primary"
              type="submit"
              disabled={submitting || !parentPhoneIsValid}
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

export default SecretaryStudentForm;
