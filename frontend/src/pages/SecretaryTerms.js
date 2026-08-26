import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Layers,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Search,
  Power,
  Sparkles,
  X,
  Save,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, storage } from "../services/api";
import { toJalaliDateString, toPersianDigits, getTodayJalali } from "../utils/dateUtils";

import "./SecretaryTerms.css";

export default function SecretaryTerms() {
  const currentUser = storage.getUser();
  const role = currentUser?.role === "admin" ? "admin" : "secretary";
  const roleTitle = role === "admin" ? "پنل مدیریت" : "پنل منشی";

  const today = getTodayJalali();

  const [terms, setTerms] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [termName, setTermName] = useState("");
  const [startDate, setStartDate] = useState(today.isoGregorian);
  const [endDate, setEndDate] = useState(today.isoGregorian);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [termsData, classroomsData] = await Promise.all([
        api.terms.list(),
        api.classrooms.list(),
      ]);
      setTerms(termsData || []);
      setClassrooms(classroomsData || []);
    } catch (err) {
      setError(err.message || "خطا در دریافت اطلاعات ترم‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingTerm(null);
    setTermName("");
    setStartDate(today.isoGregorian);
    setEndDate(today.isoGregorian);
    setIsActive(true);
    setModalError("");
    setModalOpen(true);
  };

  const openEditModal = (term) => {
    setEditingTerm(term);
    setTermName(term.name || "");
    setStartDate(term.start_date || today.isoGregorian);
    setEndDate(term.end_date || today.isoGregorian);
    setIsActive(Boolean(term.is_active));
    setModalError("");
    setModalOpen(true);
  };

  const handleSaveTerm = async (e) => {
    e.preventDefault();
    if (!termName.trim()) {
      setModalError("لطفاً عنوان ترم را وارد کنید.");
      return;
    }

    setSaving(true);
    setModalError("");

    try {
      const payload = {
        name: termName.trim(),
        start_date: startDate,
        end_date: endDate,
        is_active: isActive,
      };

      if (editingTerm) {
        await api.terms.update(editingTerm.id, payload);
        setSuccessMsg(`ترم «${termName}» با موفقیت ویرایش شد.`);
      } else {
        await api.terms.create(payload);
        setSuccessMsg(`ترم جدید «${termName}» با موفقیت ایجاد شد.`);
      }

      setModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setModalError(err.message || "خطا در ذخیره‌سازی ترم");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (term) => {
    try {
      const nextStatus = !term.is_active;
      await api.terms.update(term.id, { is_active: nextStatus });
      setTerms((prev) =>
        prev.map((t) => (t.id === term.id ? { ...t, is_active: nextStatus } : t)),
      );
      setSuccessMsg(
        `وضعیت ترم «${term.name}» به ${nextStatus ? "فعال" : "غیرفعال"} تغییر یافت.`,
      );
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert(err.message || "خطا در تغییر وضعیت ترم");
    }
  };

  const handleDeleteTerm = async (term) => {
    const classCount = classrooms.filter((c) => c.term === term.id).length;
    if (classCount > 0) {
      if (
        !window.confirm(
          `این ترم شامل ${classCount} کلاس تعریف‌شده است. در صورت حذف، ممکن است کلاس‌ها دچار مشکل شوند.\nآیا از حذف مطمئن هستید؟ (توصیه می‌شود به جای حذف، ترم را غیرفعال کنید)`,
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`آیا از حذف ترم «${term.name}» اطمینان دارید؟`)) return;
    }

    try {
      await api.terms.remove(term.id);
      setTerms((prev) => prev.filter((t) => t.id !== term.id));
      setSuccessMsg(`ترم «${term.name}» با موفقیت حذف گردید.`);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert(
        err.message ||
          "امکان حذف این ترم به دلیل وجود داده‌های متصل وجود ندارد. لطفاً ترم را غیرفعال کنید.",
      );
    }
  };

  const filteredTerms = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return terms;
    return terms.filter((t) => t.name?.toLowerCase().includes(q));
  }, [terms, searchTerm]);

  const stats = useMemo(() => {
    const total = terms.length;
    const active = terms.filter((t) => t.is_active).length;
    const inactive = total - active;
    const totalClasses = classrooms.length;
    return { total, active, inactive, totalClasses };
  }, [terms, classrooms]);

  return (
    <DashboardLayout role={roleTitle} title="مدیریت ترم‌ها" menuType={role}>
      <div className="secretary-terms-page">
        {/* Header */}
        <div className="secretary-terms-header">
          <div className="secretary-terms-heading">
            <div className="secretary-terms-avatar">
              <Layers size={24} />
            </div>
            <div>
              <h3>مدیریت ترم‌های آموزشی</h3>
              <p>تعریف دوره‌ها، تاریخ شروع و پایان و کنترل ترم‌های فعال آکادمی</p>
            </div>
          </div>

          <AnimatedButton
            variant="primary"
            onClick={openCreateModal}
            icon={<Plus size={18} />}
          >
            افزودن ترم جدید
          </AnimatedButton>
        </div>

        {/* Alerts */}
        {error && (
          <div className="terms-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="terms-alert success">
            <Sparkles size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Stats */}
        <div className="secretary-terms-stats-grid">
          <StatCard
            title="کل ترم‌های تعریف‌شده"
            value={`${toPersianDigits(stats.total)} ترم`}
            icon={<Layers size={20} />}
            color="blue"
          />
          <StatCard
            title="ترم‌های فعال"
            value={`${toPersianDigits(stats.active)} ترم`}
            icon={<CheckCircle2 size={20} />}
            color="green"
          />
          <StatCard
            title="ترم‌های پایان‌یافته"
            value={`${toPersianDigits(stats.inactive)} ترم`}
            icon={<Clock size={20} />}
            color="orange"
          />
          <StatCard
            title="کلاس‌های ثبت‌شده"
            value={`${toPersianDigits(stats.totalClasses)} کلاس`}
            icon={<BookOpen size={20} />}
            color="red"
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="secretary-terms-search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="جستجوی نام ترم (مثلاً: پاییز ۱۴۰۴)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Terms Table */}
        <div className="secretary-terms-card">
          <div className="card-header">
            <h3>لیست دوره‌ها و ترم‌های تحصیلی</h3>
            <span className="count-badge">
              {toPersianDigits(filteredTerms.length)} ترم
            </span>
          </div>

          {loading ? (
            <div className="terms-empty-state">در حال بارگذاری اطلاعات ترم‌ها...</div>
          ) : filteredTerms.length > 0 ? (
            <div className="table-responsive">
              <table className="terms-table">
                <thead>
                  <tr>
                    <th>عنوان ترم</th>
                    <th>تاریخ شروع (شمسی)</th>
                    <th>تاریخ پایان (شمسی)</th>
                    <th>کلاس‌های متصل</th>
                    <th>وضعیت</th>
                    <th>تغییر وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTerms.map((term) => {
                    const classCount = classrooms.filter(
                      (c) => c.term === term.id,
                    ).length;

                    return (
                      <tr key={term.id}>
                        <td>
                          <div className="term-name-cell">
                            <div className="term-cell-icon">
                              <Calendar size={18} />
                            </div>
                            <div>
                              <strong>{term.name}</strong>
                              <small>کد ترم: {toPersianDigits(term.id)}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="shamsi-badge">
                            {toJalaliDateString(term.start_date)}
                          </span>
                        </td>

                        <td>
                          <span className="shamsi-badge">
                            {toJalaliDateString(term.end_date)}
                          </span>
                        </td>

                        <td>
                          <span className="class-count-pill">
                            {toPersianDigits(classCount)} کلاس
                          </span>
                        </td>

                        <td>
                          <span
                            className={`term-status-badge ${
                              term.is_active ? "active" : "inactive"
                            }`}
                          >
                            {term.is_active ? "در حال اجرا (فعال)" : "پایان‌یافته"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={`toggle-status-btn ${
                              term.is_active ? "btn-deactivate" : "btn-activate"
                            }`}
                            onClick={() => handleToggleActive(term)}
                            title={
                              term.is_active
                                ? "غیرفعال کردن این ترم"
                                : "فعال‌سازی این ترم"
                            }
                          >
                            <Power size={14} />
                            <span>{term.is_active ? "غیرفعال‌سازی" : "فعال‌سازی"}</span>
                          </button>
                        </td>

                        <td>
                          <div className="terms-action-btns">
                            <button
                              type="button"
                              className="action-icon-btn edit"
                              onClick={() => openEditModal(term)}
                              title="ویرایش اطلاعات ترم"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn delete"
                              onClick={() => handleDeleteTerm(term)}
                              title="حذف ترم"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="terms-empty-state">
              <Layers size={36} />
              <p>ترمی با این مشخصات یافت نشد.</p>
            </div>
          )}
        </div>

        {/* Create / Edit Term Modal */}
        {modalOpen && (
          <div className="term-modal-backdrop" onClick={() => setModalOpen(false)}>
            <div
              className="term-modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="term-modal-header">
                <div className="modal-header-title">
                  <Layers size={20} />
                  <h4>{editingTerm ? "ویرایش ترم تحصیلی" : "تعریف ترم جدید"}</h4>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div className="modal-alert-error">
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveTerm} className="term-modal-form">
                <div className="form-field-group">
                  <label>
                    عنوان ترم <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً: بهار ۱۴۰۵ یا تابستان دوره اول"
                    value={termName}
                    onChange={(e) => setTermName(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-datepickers-row">
                  <div className="form-field-group">
                    <JalaliDatePicker
                      label="تاریخ شروع دوره (شمسی)"
                      value={startDate}
                      onChange={(iso) => setStartDate(iso)}
                      required
                    />
                  </div>

                  <div className="form-field-group">
                    <JalaliDatePicker
                      label="تاریخ پایان دوره (شمسی)"
                      value={endDate}
                      onChange={(iso) => setEndDate(iso)}
                      required
                    />
                  </div>
                </div>

                <div className="form-field-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span>این ترم به عنوان ترم فعال و جاری در سیستم قرار گیرد</span>
                  </label>
                </div>

                <div className="term-modal-actions">
                  <AnimatedButton
                    type="button"
                    variant="secondary"
                    onClick={() => setModalOpen(false)}
                  >
                    انصراف
                  </AnimatedButton>
                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? "در حال ذخیره..." : "ذخیره اطلاعات ترم"}
                  </AnimatedButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
