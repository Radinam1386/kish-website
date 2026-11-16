import React, { useMemo, useState } from "react";
import {
  Bell,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  Users,
  Megaphone,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  Satellite,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import "./AdminAnnouncements.css";
import { AnimatedButton } from "../components/AnimatedButton";
import StatCard from "../components/StatCard";

const STORAGE_KEY = "kish_admin_announcements_v1";

const AUDIENCES = [
  { value: "all", label: "همه کاربران" },
  { value: "students", label: "زبان‌آموزان" },
  { value: "teachers", label: "استادان" },
  { value: "secretaries", label: "منشی‌ها" },
];

const EMPTY_FORM = {
  title: "",
  content: "",
  audience: "all",
  priority: "normal",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
};

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 1,
    title: "شروع ثبت‌نام ترم جدید",
    content:
      "ثبت‌نام ترم جدید آموزشگاه آغاز شده است. برای اطلاع از شرایط و برنامه کلاس‌ها با دفتر آموزشگاه تماس بگیرید.",
    audience: "all",
    priority: "important",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    createdAt: new Date().toISOString(),
  },
];

function readAnnouncements() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  } catch {
    return INITIAL_ANNOUNCEMENTS;
  }
}

function getAudienceLabel(value) {
  return AUDIENCES.find((item) => item.value === value)?.label || "همه کاربران";
}

function getAnnouncementStatus(item) {
  const today = new Date().toISOString().slice(0, 10);

  if (item.startDate && item.startDate > today) return "scheduled";
  if (item.endDate && item.endDate < today) return "expired";

  return "active";
}

function formatDate(value) {
  if (!value) return "بدون تاریخ پایان";

  return new Date(`${value}T00:00:00`).toLocaleDateString("fa-IR");
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState(readAnnouncements);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const saveAnnouncements = (items) => {
    setAnnouncements(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const stats = useMemo(() => {
    const active = announcements.filter(
      (item) => getAnnouncementStatus(item) === "active",
    ).length;

    const scheduled = announcements.filter(
      (item) => getAnnouncementStatus(item) === "scheduled",
    ).length;

    const expired = announcements.filter(
      (item) => getAnnouncementStatus(item) === "expired",
    ).length;

    return {
      total: announcements.length,
      active,
      scheduled,
      expired,
    };
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter((item) => {
        const matchesSearch =
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.content.toLowerCase().includes(search.toLowerCase());

        const status = getAnnouncementStatus(item);
        const matchesStatus = statusFilter === "all" || statusFilter === status;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [announcements, search, statusFilter]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      audience: item.audience,
      priority: item.priority,
      startDate: item.startDate || "",
      endDate: item.endDate || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setFormError("عنوان و متن اطلاعیه را وارد کنید.");
      return;
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setFormError("تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.");
      return;
    }

    if (editingId !== null) {
      const updated = announcements.map((item) =>
        item.id === editingId
          ? {
              ...item,
              ...form,
              title: form.title.trim(),
              content: form.content.trim(),
            }
          : item,
      );

      saveAnnouncements(updated);
    } else {
      const newItem = {
        id: Date.now(),
        ...form,
        title: form.title.trim(),
        content: form.content.trim(),
        createdAt: new Date().toISOString(),
      };

      saveAnnouncements([newItem, ...announcements]);
    }

    closeModal();
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm("از حذف این اطلاعیه مطمئن هستید؟");
    if (!confirmed) return;

    saveAnnouncements(announcements.filter((item) => item.id !== id));
  };

  const getStatusInfo = (item) => {
    const status = getAnnouncementStatus(item);

    if (status === "scheduled") {
      return {
        label: "زمان‌بندی‌شده",
        className: "kaa-status-scheduled",
        icon: <Clock3 size={14} />,
      };
    }

    if (status === "expired") {
      return {
        label: "منقضی‌شده",
        className: "kaa-status-expired",
        icon: <AlertCircle size={14} />,
      };
    }

    return {
      label: "فعال",
      className: "kaa-status-active",
      icon: <CheckCircle2 size={14} />,
    };
  };

  return (
    <DashboardLayout role="admin" title="مدیریت اطلاعیه‌ها" menuType="admin">
      <div className="kaa-page" dir="rtl">
        <div className="admin-students-x7k2-header">
          <div className="admin-students-x7k2-heading">
            <div className="admin-students-x7k2-heading-icon">
              <Satellite size={25} />
            </div>

            <div>
              <h3 className="admin-students-x7k2-title">مدیریت ارتباطات</h3>

              <p className="admin-students-x7k2-description">
                اطلاعیه‌های موردنیاز زبان‌آموزان و کارکنان را مدیریت کنید.
              </p>
            </div>
          </div>
          <AnimatedButton
            variant="primary"
            icon={<Plus size={18} />}
            onClick={openCreateModal}
          >
            اطلاعیه جدید
          </AnimatedButton>
        </div>

        <div className="kaa-stats">
          <StatCard
            title="کل اطلاعیه‌ها"
            value={stats.total}
            icon={<Bell size={23} />}
            color="red"
          />
          <StatCard
            title="اطلاعیه‌های فعال"
            value={stats.active}
            icon={<CheckCircle2 size={23} />}
            color="green"
          />
          <StatCard
            title="در انتظار انتشار"
            value={stats.scheduled}
            icon={<Clock3 size={23} />}
            color="blue"
          />
          <StatCard
            title="منقضی‌شده"
            value={stats.expired}
            icon={<AlertCircle size={23} />}
            color="orange"
          />
        </div>

        <section className="kaa-panel">
          <div className="kaa-toolbar">
            <div className="kaa-search">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جست‌وجوی عنوان یا متن اطلاعیه..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="kaa-filter"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="scheduled">زمان‌بندی‌شده</option>
              <option value="expired">منقضی‌شده</option>
            </select>
          </div>

          <div className="kaa-list-heading">
            <div>
              <h3>فهرست اطلاعیه‌ها</h3>
              <span>{filteredAnnouncements.length} مورد</span>
            </div>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <div className="kaa-empty">
              <span>
                <Megaphone size={30} />
              </span>
              <strong>اطلاعیه‌ای پیدا نشد</strong>
              <p>برای شروع، یک اطلاعیه جدید ثبت کنید.</p>
              <button className="kaa-primary-btn" onClick={openCreateModal}>
                <Plus size={17} />
                ثبت اطلاعیه
              </button>
            </div>
          ) : (
            <div className="kaa-announcement-list">
              {filteredAnnouncements.map((item) => {
                const status = getStatusInfo(item);

                return (
                  <article className="kaa-announcement" key={item.id}>
                    <div className="kaa-announcement-main">
                      <div className="kaa-announcement-title-row">
                        <h4>{item.title}</h4>

                        {item.priority === "important" && (
                          <span className="kaa-priority">مهم</span>
                        )}
                      </div>

                      <p>{item.content}</p>

                      <div className="kaa-meta">
                        <span>
                          <Users size={14} />
                          {getAudienceLabel(item.audience)}
                        </span>

                        <span>
                          <CalendarDays size={14} />
                          شروع: {formatDate(item.startDate)}
                        </span>

                        <span>
                          <CalendarDays size={14} />
                          پایان: {formatDate(item.endDate)}
                        </span>
                      </div>
                    </div>

                    <div className="kaa-announcement-side">
                      <span className={`kaa-status ${status.className}`}>
                        {status.icon}
                        {status.label}
                      </span>

                      <div className="kaa-actions">
                        <button
                          type="button"
                          title="پیش‌نمایش"
                          onClick={() => setPreviewItem(item)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          title="ویرایش"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          title="حذف"
                          className="kaa-delete"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="kaa-modal-backdrop" onMouseDown={closeModal}>
          <div
            className="kaa-modal"
            dir="rtl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="kaa-modal-header">
              <div>
                <span>مدیریت اطلاعیه</span>
                <h3>
                  {editingId !== null ? "ویرایش اطلاعیه" : "ثبت اطلاعیه جدید"}
                </h3>
              </div>

              <button type="button" onClick={closeModal}>
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="kaa-form-group">
                <label>عنوان اطلاعیه</label>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="مثلاً شروع ثبت‌نام ترم جدید"
                  maxLength={120}
                />
              </div>

              <div className="kaa-form-group">
                <label>متن اطلاعیه</label>
                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm({ ...form, content: event.target.value })
                  }
                  placeholder="متن کامل اطلاعیه را وارد کنید..."
                  rows={5}
                />
              </div>

              <div className="kaa-form-grid">
                <div className="kaa-form-group">
                  <label>مخاطبان</label>
                  <select
                    value={form.audience}
                    onChange={(event) =>
                      setForm({ ...form, audience: event.target.value })
                    }
                  >
                    {AUDIENCES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="kaa-form-group">
                  <label>اولویت</label>
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value })
                    }
                  >
                    <option value="normal">عادی</option>
                    <option value="important">مهم</option>
                  </select>
                </div>

                <div className="kaa-form-group">
                  <label>تاریخ شروع انتشار</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setForm({ ...form, startDate: event.target.value })
                    }
                  />
                </div>

                <div className="kaa-form-group">
                  <label>تاریخ پایان انتشار</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      setForm({ ...form, endDate: event.target.value })
                    }
                  />
                </div>
              </div>

              {formError && <div className="kaa-form-error">{formError}</div>}

              <div className="kaa-modal-footer">
                <button
                  type="button"
                  className="kaa-secondary-btn"
                  onClick={closeModal}
                >
                  انصراف
                </button>

                <button type="submit" className="kaa-primary-btn">
                  {editingId !== null ? "ذخیره تغییرات" : "ثبت اطلاعیه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewItem && (
        <div
          className="kaa-modal-backdrop"
          onMouseDown={() => setPreviewItem(null)}
        >
          <div
            className="kaa-preview-modal"
            dir="rtl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="kaa-modal-header">
              <div>
                <span>پیش‌نمایش اطلاعیه</span>
                <h3>{previewItem.title}</h3>
              </div>

              <button type="button" onClick={() => setPreviewItem(null)}>
                <X size={21} />
              </button>
            </div>

            <div className="kaa-preview-content">
              <p>{previewItem.content}</p>
              <div className="kaa-preview-details">
                <span>مخاطب: {getAudienceLabel(previewItem.audience)}</span>
                <span>شروع: {formatDate(previewItem.startDate)}</span>
                <span>پایان: {formatDate(previewItem.endDate)}</span>
              </div>
            </div>

            <button
              className="kaa-secondary-btn kaa-preview-close"
              onClick={() => setPreviewItem(null)}
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
