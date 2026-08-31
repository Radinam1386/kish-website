import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  UserCheck,
  ChevronLeft,
  Phone,
  Edit3,
  Trash2,
  Power,
  Sparkles,
  ShieldCheck,
  Mail,
  UserCheckIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import StatCard from "../components/StatCard";
import { api, getFullName } from "../services/api";
import { toPersianDigits } from "../utils/dateUtils";

import "./AdminSecretaries.css";

function AdminSecretaries() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const usersData = await api.users.list();

      setUsers(usersData || []);
    } catch (err) {
      setError(err.message || "دریافت اطلاعات منشی‌ها ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (secretary) => {
    try {
      const nextStatus = !secretary.isActive;

      await api.users.update(secretary.id, {
        is_active: nextStatus,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === secretary.id ? { ...u, is_active: nextStatus } : u,
        ),
      );

      setSuccessMsg(
        `وضعیت حساب منشی «${secretary.name}» به ${
          nextStatus ? "فعال" : "غیرفعال"
        } تغییر یافت.`,
      );

      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert(err.message || "خطا در تغییر وضعیت حساب منشی");
    }
  };

  const handleDeleteSecretary = async (secretary) => {
    if (
      !window.confirm(
        `آیا از حذف حساب کاربری منشی «${secretary.name}» اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`,
      )
    ) {
      return;
    }

    try {
      await api.users.remove(secretary.id);

      setUsers((prev) => prev.filter((u) => u.id !== secretary.id));

      setSuccessMsg(
        `حساب کاربری منشی «${secretary.name}» با موفقیت حذف گردید.`,
      );

      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert(err.message || "خطا در حذف حساب منشی");
    }
  };

  const secretaries = useMemo(
    () =>
      users
        .filter((user) => user.role === "secretary")
        .map((user) => ({
          id: user.id,
          name: getFullName(user) || user.username,
          username: user.username,
          phone: user.phone_number || "-",
          email: user.email || "ثبت نشده",
          isActive: Boolean(user.is_active),
          status: user.is_active ? "فعال" : "غیرفعال",
          statusType: user.is_active ? "active" : "warning",
          avatar: (getFullName(user) || user.username).charAt(0) || "م",
        })),
    [users],
  );

  const filteredSecretaries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return secretaries.filter((sec) => {
      const matchesSearch =
        sec.name.toLowerCase().includes(normalizedSearch) ||
        sec.username.toLowerCase().includes(normalizedSearch) ||
        sec.phone.includes(normalizedSearch) ||
        sec.email.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && sec.isActive) ||
        (selectedStatus === "inactive" && !sec.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [secretaries, searchTerm, selectedStatus]);

  const activeCount = secretaries.filter((s) => s.isActive).length;

  const inactiveCount = secretaries.length - activeCount;

  return (
    <DashboardLayout role="پنل مدیریت" title="مدیریت منشی‌ها" menuType="admin">
      <div className="admin-secretaries-x8m4-root">
        {/* ================= HEADER ================= */}

        <div className="admin-students-x7k2-header">
          <div className="admin-students-x7k2-heading">
            <div className="admin-students-x7k2-heading-icon">
              <UserCheckIcon size={26} />
            </div>

            <div>
              <h3 className="admin-students-x7k2-title">
                مدیریت منشی‌های آموزشگاه
              </h3>

              <p className="admin-students-x7k2-description">
                مدیریت اطلاعات، دسترسی‌ها و وضعیت فعالیت پرسنل اداری
              </p>
            </div>
          </div>
          <Link to="/panel/admin/secretaries/new">
            <AnimatedButton variant="primary" icon={<UserPlus size={18} />}>
              افزودن منشی جدید
            </AnimatedButton>
          </Link>
        </div>
        {/* ================= STATS ================= */}

        <div className="admin-secretaries-x8m4-stats">
          <StatCard
            title="کل پرسنل منشی"
            value={`${toPersianDigits(secretaries.length)} نفر`}
            icon={<Users size={23} />}
            color="blue"
          />

          <StatCard
            title="منشی‌های فعال"
            value={`${toPersianDigits(activeCount)} نفر`}
            icon={<UserCheck size={23} />}
            color="green"
          />

          <StatCard
            title="منشی‌های غیرفعال"
            value={`${toPersianDigits(inactiveCount)} نفر`}
            icon={<Power size={23} />}
            color="orange"
          />

          <StatCard
            title="نقش سیستمی"
            value="پرسنل اداری"
            hint="دسترسی منشی"
            icon={<ShieldCheck size={23} />}
            color="red"
          />
        </div>

        {/* ================= SUCCESS ================= */}

        {successMsg && (
          <div className="admin-secretaries-x8m4-success">
            <Sparkles size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= MAIN SECTION ================= */}

        <section className="admin-secretaries-x8m4-section">
          <div className="admin-secretaries-x8m4-section-header">
            <div className="admin-secretaries-x8m4-section-heading">
              <h3 className="admin-secretaries-x8m4-section-title">
                لیست منشی‌های آموزشگاه
              </h3>

              <p className="admin-secretaries-x8m4-section-description">
                مشاهده، ویرایش و مدیریت حساب‌های پرسنل مسئول ثبت‌نام، کلاس‌ها و
                شهریه‌ها
              </p>
            </div>
          </div>

          {/* ================= FILTERS ================= */}

          <div className="admin-secretaries-x8m4-filters">
            <div className="admin-secretaries-x8m4-search-wrapper">
              <Search
                size={18}
                className="admin-secretaries-x8m4-search-icon"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو بر اساس نام، نام کاربری، شماره یا ایمیل..."
                className="admin-secretaries-x8m4-search-input"
              />
            </div>

            <div className="admin-secretaries-x8m4-select-wrapper">
              <Filter
                size={18}
                className="admin-secretaries-x8m4-filter-icon"
              />

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="admin-secretaries-x8m4-select"
              >
                <option value="all">همه وضعیت‌ها</option>

                <option value="active">فقط حساب‌های فعال</option>

                <option value="inactive">فقط حساب‌های غیرفعال</option>
              </select>
            </div>
          </div>

          {/* ================= CONTENT ================= */}

          {loading ? (
            <div className="admin-secretaries-x8m4-state">
              <div className="admin-secretaries-x8m4-loading-icon">
                <Users size={32} />
              </div>

              <h4>در حال دریافت اطلاعات منشی‌ها...</h4>

              <p>لطفاً چند لحظه منتظر بمانید.</p>
            </div>
          ) : error ? (
            <div className="admin-secretaries-x8m4-state error">
              <div className="admin-secretaries-x8m4-state-icon">
                <Users size={38} />
              </div>

              <h4>{error}</h4>

              <p>دریافت اطلاعات با مشکل مواجه شد.</p>
            </div>
          ) : filteredSecretaries.length > 0 ? (
            <div className="admin-secretaries-x8m4-grid">
              {filteredSecretaries.map((sec) => (
                <article key={sec.id} className="admin-secretaries-x8m4-card">
                  {/* CARD HEADER */}

                  <div className="admin-secretaries-x8m4-card-top">
                    <div className="admin-secretaries-x8m4-avatar">
                      {sec.avatar}
                    </div>

                    <div className="admin-secretaries-x8m4-main-info">
                      <h4>{sec.name}</h4>

                      <span className="admin-secretaries-x8m4-username">
                        نام کاربری: {sec.username}
                      </span>
                    </div>

                    <span
                      className={`admin-secretaries-x8m4-status ${sec.statusType}`}
                    >
                      {sec.status}
                    </span>
                  </div>

                  <div className="admin-secretaries-x8m4-divider" />

                  {/* INFORMATION */}

                  <div className="admin-secretaries-x8m4-info-list">
                    <div className="admin-secretaries-x8m4-info-item">
                      <div className="admin-secretaries-x8m4-info-icon">
                        <Phone size={16} />
                      </div>

                      <div>
                        <span>شماره تماس</span>

                        <strong className="admin-secretaries-x8m4-number">
                          {sec.phone}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-secretaries-x8m4-info-item">
                      <div className="admin-secretaries-x8m4-info-icon">
                        <Mail size={16} />
                      </div>

                      <div>
                        <span>پست الکترونیک</span>

                        <strong className="admin-secretaries-x8m4-email">
                          {sec.email}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-secretaries-x8m4-info-item">
                      <div className="admin-secretaries-x8m4-info-icon">
                        <ShieldCheck size={16} />
                      </div>

                      <div>
                        <span>مسئولیت‌ها</span>

                        <strong>ثبت‌نام، کلاس‌ها، شهریه‌ها</strong>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="admin-secretaries-x8m4-actions">
                    <div className="admin-secretaries-x8m4-action-group">
                      <Link to={`/panel/admin/secretaries/${sec.id}/edit`}>
                        <button
                          type="button"
                          className="admin-secretaries-x8m4-action edit"
                          title="ویرایش مشخصات منشی"
                        >
                          <Edit3 size={15} />
                        </button>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(sec)}
                        className={`admin-secretaries-x8m4-action toggle ${
                          sec.isActive ? "active" : "inactive"
                        }`}
                        title={
                          sec.isActive ? "غیرفعال‌سازی حساب" : "فعال‌سازی حساب"
                        }
                      >
                        <Power size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSecretary(sec)}
                        className="admin-secretaries-x8m4-action delete"
                        title="حذف حساب منشی"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <Link to={`/panel/admin/secretaries/${sec.id}`}>
                      <AnimatedButton
                        size="small"
                        variant="primary"
                        icon={<ChevronLeft size={16} />}
                      >
                        مشاهده جزئیات
                      </AnimatedButton>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-secretaries-x8m4-state">
              <div className="admin-secretaries-x8m4-state-icon">
                <Users size={40} />
              </div>

              <h4>منشی‌ای با این مشخصات یافت نشد</h4>

              <p>عبارت جستجو یا فیلتر انتخابی را تغییر دهید.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default AdminSecretaries;
