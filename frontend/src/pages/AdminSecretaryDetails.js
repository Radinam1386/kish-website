import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  UserCheck,
  Phone,
  Mail,
  CalendarDays,
  ShieldCheck,
  Edit3,
  Trash2,
  Power,
  Users,
  CreditCard,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";

import "./AdminTeacherDetails.css";

function AdminSecretaryDetails() {
  const { secretaryId } = useParams();
  const navigate = useNavigate();

  const [secretaryUser, setSecretaryUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadData() {
      if (!secretaryId) return;

      try {
        setLoading(true);
        setError("");

        const userData = await api.users.get(secretaryId);
        if (!alive) return;
        setSecretaryUser(userData);
      } catch (err) {
        if (alive) setError(err.message || "دریافت اطلاعات منشی ناموفق بود.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, [secretaryId]);

  const handleToggleStatus = async () => {
    if (!secretaryUser) return;
    try {
      const nextStatus = !secretaryUser.is_active;
      await api.users.update(secretaryUser.id, { is_active: nextStatus });
      setSecretaryUser((prev) => ({ ...prev, is_active: nextStatus }));
      setSuccessMsg(`وضعیت حساب به ${nextStatus ? "فعال" : "غیرفعال"} تغییر یافت.`);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert(err.message || "خطا در تغییر وضعیت حساب");
    }
  };

  const handleDelete = async () => {
    if (!secretaryUser) return;
    if (!window.confirm(`آیا از حذف حساب کاربری منشی «${getFullName(secretaryUser)}» اطمینان دارید؟`)) {
      return;
    }

    try {
      await api.users.remove(secretaryUser.id);
      navigate("/panel/admin/secretaries");
    } catch (err) {
      alert(err.message || "خطا در حذف منشی");
    }
  };

  const secretaryName = getFullName(secretaryUser) || secretaryUser?.username || "منشی";

  if (loading) {
    return (
      <DashboardLayout role="پنل مدیریت" title="جزئیات منشی" menuType="admin">
        <div style={{ padding: "3rem", textAlign: "center", color: "oklch(55% 0 0)" }}>
          در حال بارگذاری اطلاعات منشی...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !secretaryUser) {
    return (
      <DashboardLayout role="پنل مدیریت" title="جزئیات منشی" menuType="admin">
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--danger, #ef4444)", marginBottom: "1rem" }}>
            {error || "منشی مورد نظر یافت نشد."}
          </p>
          <Link to="/panel/admin/secretaries">
            <AnimatedButton variant="primary">بازگشت به لیست منشی‌ها</AnimatedButton>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="پنل مدیریت"
      title={`جزئیات ${secretaryName}`}
      menuType="admin"
    >
      <div className="admin-teacher-details-x7k2-page">
        {/* Header */}
        <div className="admin-teacher-details-x7k2-header">
          <div className="admin-teacher-details-x7k2-header-right">
            <Link
              to="/panel/admin/secretaries"
              className="admin-teacher-details-x7k2-back-button"
              style={{ textDecoration: "none" }}
            >
              <ArrowRight size={18} />
              بازگشت به لیست منشی‌ها
            </Link>

            <div className="admin-teacher-details-x7k2-avatar">
              {secretaryName.charAt(0)}
            </div>

            <div className="admin-teacher-details-x7k2-heading">
              <div className="admin-teacher-details-x7k2-name-row">
                <h2>{secretaryName}</h2>
              </div>

              <p>{secretaryUser.email || "بدون ایمیل"}</p>

              <span className="admin-teacher-details-x7k2-teacher-id">
                شناسه کاربری: {secretaryUser.username}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Link to={`/panel/admin/secretaries/${secretaryId}/edit`}>
              <AnimatedButton variant="primary">
                <Edit3 size={17} />
                ویرایش مشخصات
              </AnimatedButton>
            </Link>
          </div>
        </div>

        {successMsg && (
          <div style={{
            background: "oklch(95% 0.05 145 / 0.85)",
            border: "1px solid oklch(75% 0.15 145 / 0.3)",
            color: "oklch(35% 0.15 145)",
            padding: "0.85rem 1.25rem",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: "700"
          }}>
            <Sparkles size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Info Grid */}
        <section className="admin-teacher-details-x7k2-section">
          <div className="admin-teacher-details-x7k2-section-header">
            <div>
              <h3>
                <UserCheck size={20} />
                مشخصات حساب کاربری و تماس
              </h3>
              <p>اطلاعات ارتباطی و سطح دسترسی منشی در سیستم مدیریت آموزشگاه</p>
            </div>
          </div>

          <div className="admin-teacher-details-x7k2-info-grid">
            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <Phone size={18} />
              </div>
              <div>
                <span>شماره تماس</span>
                <strong>{secretaryUser.phone_number || "-"}</strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <Mail size={18} />
              </div>
              <div>
                <span>ایمیل</span>
                <strong className="admin-teacher-details-x7k2-email">
                  {secretaryUser.email || "-"}
                </strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <span>سطح دسترسی</span>
                <strong>منشی (پرسنل اداری)</strong>
              </div>
            </div>

            <div className="admin-teacher-details-x7k2-info-card">
              <div className="admin-teacher-details-x7k2-info-icon">
                <Power size={18} />
              </div>
              <div>
                <span>وضعیت حساب</span>
                <strong style={{ color: secretaryUser.is_active ? "oklch(40% 0.15 145)" : "oklch(45% 0.18 25)" }}>
                  {secretaryUser.is_active ? "فعال" : "غیرفعال"}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Responsibilities & Permissions Card */}
        <section className="admin-teacher-details-x7k2-section">
          <div className="admin-teacher-details-x7k2-section-header">
            <div>
              <h3>
                <ShieldCheck size={20} />
                اختیارات و حوزه‌های دسترسی منشی
              </h3>
              <p>بخش‌های مجاز جهت مدیریت و نظارت توسط این حساب کاربری</p>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem"
          }}>
            <div style={{
              background: "oklch(100% 0 0 / 0.88)",
              border: "1px solid oklch(0% 0 0 / 0.055)",
              borderRadius: "16px",
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              boxShadow: "0 4px 16px oklch(0% 0 0 / 0.02)"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "oklch(96% 0.02 29)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <CalendarDays size={20} />
              </div>
              <div>
                <strong style={{ fontSize: "0.95rem", color: "oklch(25% 0 0)", display: "block" }}>
                  مدیریت کلاس‌ها و ترم‌ها
                </strong>
                <span style={{ fontSize: "0.75rem", color: "oklch(55% 0 0)" }}>
                  تعریف، ویرایش و مشاهده دوره‌ها
                </span>
              </div>
            </div>

            <div style={{
              background: "oklch(100% 0 0 / 0.88)",
              border: "1px solid oklch(0% 0 0 / 0.055)",
              borderRadius: "16px",
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              boxShadow: "0 4px 16px oklch(0% 0 0 / 0.02)"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "oklch(96% 0.02 29)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Users size={20} />
              </div>
              <div>
                <strong style={{ fontSize: "0.95rem", color: "oklch(25% 0 0)", display: "block" }}>
                  ثبت‌نام دانش‌آموزان و اساتید
                </strong>
                <span style={{ fontSize: "0.75rem", color: "oklch(55% 0 0)" }}>
                  پذیرش، ثبت و ویرایش مشخصات
                </span>
              </div>
            </div>

            <div style={{
              background: "oklch(100% 0 0 / 0.88)",
              border: "1px solid oklch(0% 0 0 / 0.055)",
              borderRadius: "16px",
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              boxShadow: "0 4px 16px oklch(0% 0 0 / 0.02)"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "oklch(96% 0.02 29)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <CreditCard size={20} />
              </div>
              <div>
                <strong style={{ fontSize: "0.95rem", color: "oklch(25% 0 0)", display: "block" }}>
                  امور شهریه‌ها و مالی
                </strong>
                <span style={{ fontSize: "0.75rem", color: "oklch(55% 0 0)" }}>
                  پیگیری وضعیت پرداخت شهریه
                </span>
              </div>
            </div>

            <div style={{
              background: "oklch(100% 0 0 / 0.88)",
              border: "1px solid oklch(0% 0 0 / 0.055)",
              borderRadius: "16px",
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              boxShadow: "0 4px 16px oklch(0% 0 0 / 0.02)"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "oklch(96% 0.02 29)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <ClipboardCheck size={20} />
              </div>
              <div>
                <strong style={{ fontSize: "0.95rem", color: "oklch(25% 0 0)", display: "block" }}>
                  نظارت بر حضور و آزمون‌ها
                </strong>
                <span style={{ fontSize: "0.75rem", color: "oklch(55% 0 0)" }}>
                  مشاهده حضور و غیاب و امتحانات
                </span>
              </div>
            </div>
          </div>

          {/* Danger zone actions */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid oklch(0% 0 0 / 0.06)"
          }}>
            <button
              type="button"
              onClick={handleToggleStatus}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "10px",
                border: "1px solid oklch(0% 0 0 / 0.1)",
                background: secretaryUser.is_active ? "oklch(96% 0.08 85 / 0.7)" : "oklch(95% 0.05 145 / 0.7)",
                color: secretaryUser.is_active ? "oklch(45% 0.15 85)" : "oklch(35% 0.15 145)",
                fontSize: "0.85rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <Power size={16} />
              <span>{secretaryUser.is_active ? "غیرفعال‌سازی حساب منشی" : "فعال‌سازی حساب منشی"}</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "10px",
                border: "1px solid oklch(60% 0.19 25 / 0.3)",
                background: "oklch(97% 0.05 25 / 0.6)",
                color: "oklch(45% 0.18 25)",
                fontSize: "0.85rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <Trash2 size={16} />
              <span>حذف دائمی حساب منشی</span>
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default AdminSecretaryDetails;
