
import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Clock3,
  UserRound,
  BookOpen,
  Video,
  MapPin,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import "./AdminTimetable.css";

const STORAGE_KEY = "kish_admin_timetable_v1";

const DAYS = [
  { id: "saturday", label: "شنبه" },
  { id: "sunday", label: "یکشنبه" },
  { id: "monday", label: "دوشنبه" },
  { id: "tuesday", label: "سه‌شنبه" },
  { id: "wednesday", label: "چهارشنبه" },
  { id: "thursday", label: "پنجشنبه" },
  { id: "friday", label: "جمعه" },
];

const EMPTY_FORM = {
  title: "",
  classroom: "",
  teacher: "",
  day: "saturday",
  startTime: "16:00",
  endTime: "17:30",
  type: "offline",
  link: "",
  location: "",
  description: "",
  status: "active",
};

const SAMPLE_DATA = [
  {
    id: 1,
    title: "زبان انگلیسی سطح مقدماتی",
    classroom: "A1",
    teacher: "علی محمدی",
    day: "saturday",
    startTime: "16:00",
    endTime: "17:30",
    type: "offline",
    link: "",
    location: "کلاس ۱۰۱",
    description: "",
    status: "active",
  },
  {
    id: 2,
    title: "مکالمه پیشرفته",
    classroom: "B2",
    teacher: "سارا احمدی",
    day: "sunday",
    startTime: "18:00",
    endTime: "19:30",
    type: "online",
    link: "https://meet.google.com/",
    location: "",
    description: "لطفاً پنج دقیقه زودتر وارد شوید.",
    status: "active",
  },
];

function readTimetable() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return SAMPLE_DATA;

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : SAMPLE_DATA;
  } catch {
    return SAMPLE_DATA;
  }
}

function AdminTimetable() {
  const [items, setItems] = useState(readTimetable);
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const query = search.trim().toLowerCase();

        const matchesSearch =
          !query ||
          [
            item.title,
            item.classroom,
            item.teacher,
            item.location,
          ].some((value) =>
            String(value || "").toLowerCase().includes(query)
          );

        const matchesDay =
          selectedDay === "all" || item.day === selectedDay;

        const matchesType =
          selectedType === "all" || item.type === selectedType;

        return matchesSearch && matchesDay && matchesType;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [items, search, selectedDay, selectedType]);

  const onlineCount = items.filter(
    (item) => item.type === "online" && item.status === "active"
  ).length;

  const offlineCount = items.filter(
    (item) => item.type === "offline" && item.status === "active"
  ).length;

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({ ...EMPTY_FORM, ...item });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.classroom.trim() ||
      !form.teacher.trim()
    ) {
      alert("لطفاً عنوان کلاس، نام کلاس و استاد را وارد کنید.");
      return;
    }

    if (form.startTime >= form.endTime) {
      alert("ساعت پایان باید بعد از ساعت شروع باشد.");
      return;
    }

    if (form.type === "online" && !form.link.trim()) {
      alert("لطفاً لینک کلاس آنلاین را وارد کنید.");
      return;
    }

    if (editingId !== null) {
      setItems((previous) =>
        previous.map((item) =>
          item.id === editingId
            ? { ...form, id: editingId }
            : item
        )
      );
    } else {
      setItems((previous) => [
        ...previous,
        {
          ...form,
          id: Date.now(),
        },
      ]);
    }

    closeModal();
  };

  const deleteItem = (id) => {
    if (!window.confirm("از حذف این برنامه مطمئن هستید؟")) return;

    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  const copyLink = async (item) => {
    try {
      await navigator.clipboard.writeText(item.link);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      alert("کپی لینک انجام نشد. لینک را به‌صورت دستی کپی کنید.");
    }
  };

  const getDayLabel = (dayId) =>
    DAYS.find((day) => day.id === dayId)?.label || dayId;

  return (
    <DashboardLayout>
      <div className="att-page" dir="rtl">
        <div className="att-header">
          <div>
            <div className="att-eyebrow">
              <CalendarDays size={16} />
              مدیریت زمان‌بندی
            </div>

            <h1>برنامه هفتگی کلاس‌ها</h1>
            <p>
              زمان‌بندی کلاس‌ها، مدیریت جلسات و لینک کلاس‌های آنلاین
            </p>
          </div>

          <button className="att-primary-btn" onClick={openCreateModal}>
            <Plus size={19} />
            افزودن برنامه جدید
          </button>
        </div>

        <div className="att-stats">
          <div className="att-stat-card">
            <div className="att-stat-icon purple">
              <CalendarDays size={21} />
            </div>
            <div>
              <span>کل برنامه‌ها</span>
              <strong>{items.length}</strong>
            </div>
          </div>

          <div className="att-stat-card">
            <div className="att-stat-icon blue">
              <Video size={21} />
            </div>
            <div>
              <span>کلاس‌های آنلاین</span>
              <strong>{onlineCount}</strong>
            </div>
          </div>

          <div className="att-stat-card">
            <div className="att-stat-icon orange">
              <MapPin size={21} />
            </div>
            <div>
              <span>کلاس‌های حضوری</span>
              <strong>{offlineCount}</strong>
            </div>
          </div>
        </div>

        <div className="att-toolbar">
          <div className="att-search">
            <Search size={19} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجوی نام کلاس، استاد یا شماره کلاس..."
            />
          </div>

          <div className="att-filter">
            <Filter size={17} />
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
            >
              <option value="all">همه نوع کلاس‌ها</option>
              <option value="online">آنلاین</option>
              <option value="offline">حضوری</option>
            </select>
          </div>
        </div>

        <div className="att-days">
          <button
            className={selectedDay === "all" ? "active" : ""}
            onClick={() => setSelectedDay("all")}
          >
            همه روزها
          </button>

          {DAYS.map((day) => (
            <button
              key={day.id}
              className={selectedDay === day.id ? "active" : ""}
              onClick={() => setSelectedDay(day.id)}
            >
              {day.label}
            </button>
          ))}
        </div>

        <div className="att-list-header">
          <div>
            <h2>برنامه کلاس‌ها</h2>
            <span>{filteredItems.length} برنامه یافت شد</span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="att-empty">
            <CalendarDays size={42} />
            <h3>برنامه‌ای پیدا نشد</h3>
            <p>فیلترها را تغییر دهید یا یک برنامه جدید اضافه کنید.</p>
            <button onClick={openCreateModal}>
              <Plus size={17} />
              افزودن برنامه
            </button>
          </div>
        ) : (
          <div className="att-table-wrap">
            <table className="att-table">
              <thead>
                <tr>
                  <th>عنوان کلاس</th>
                  <th>روز</th>
                  <th>ساعت</th>
                  <th>کلاس / استاد</th>
                  <th>نوع برگزاری</th>
                  <th>لینک / مکان</th>
                  <th>عملیات</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="att-course-cell">
                        <strong>{item.title}</strong>
                        <span>کلاس {item.classroom}</span>
                      </div>
                    </td>

                    <td>
                      <span className="att-day-badge">
                        {getDayLabel(item.day)}
                      </span>
                    </td>

                    <td>
                      <div className="att-time">
                        <Clock3 size={15} />
                        {item.startTime} تا {item.endTime}
                      </div>
                    </td>

                    <td>
                      <div className="att-teacher">
                        <UserRound size={15} />
                        {item.teacher}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`att-type-badge ${
                          item.type === "online" ? "online" : "offline"
                        }`}
                      >
                        {item.type === "online" ? (
                          <Video size={14} />
                        ) : (
                          <MapPin size={14} />
                        )}
                        {item.type === "online" ? "آنلاین" : "حضوری"}
                      </span>
                    </td>

                    <td>
                      {item.type === "online" ? (
                        <div className="att-link-actions">
                          <button
                            onClick={() => copyLink(item)}
                            title="کپی لینک"
                          >
                            {copiedId === item.id ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
                            {copiedId === item.id ? "کپی شد" : "کپی لینک"}
                          </button>

                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            title="ورود به کلاس"
                          >
                            <ExternalLink size={15} />
                          </a>
                        </div>
                      ) : (
                        <span className="att-location">
                          {item.location || "ثبت نشده"}
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="att-actions">
                        <button
                          className="edit"
                          onClick={() => openEditModal(item)}
                          title="ویرایش"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          className="delete"
                          onClick={() => deleteItem(item.id)}
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalOpen && (
          <div className="att-modal-overlay" onMouseDown={closeModal}>
            <div
              className="att-modal"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="att-modal-header">
                <div>
                  <h2>
                    {editingId !== null
                      ? "ویرایش برنامه کلاس"
                      : "افزودن برنامه جدید"}
                  </h2>
                  <p>اطلاعات زمان‌بندی و نحوه برگزاری کلاس را وارد کنید.</p>
                </div>

                <button onClick={closeModal} className="att-close-btn">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="att-form-grid">
                  <label className="att-field full">
                    عنوان کلاس
                    <input
                      value={form.title}
                      onChange={(event) =>
                        updateField("title", event.target.value)
                      }
                      placeholder="مثلاً زبان انگلیسی مقدماتی"
                      required
                    />
                  </label>

                  <label className="att-field">
                    نام یا کد کلاس
                    <input
                      value={form.classroom}
                      onChange={(event) =>
                        updateField("classroom", event.target.value)
                      }
                      placeholder="مثلاً A1"
                      required
                    />
                  </label>

                  <label className="att-field">
                    نام استاد
                    <input
                      value={form.teacher}
                      onChange={(event) =>
                        updateField("teacher", event.target.value)
                      }
                      placeholder="نام استاد"
                      required
                    />
                  </label>

                  <label className="att-field">
                    روز هفته
                    <select
                      value={form.day}
                      onChange={(event) =>
                        updateField("day", event.target.value)
                      }
                    >
                      {DAYS.map((day) => (
                        <option key={day.id} value={day.id}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="att-field">
                    نوع برگزاری
                    <select
                      value={form.type}
                      onChange={(event) =>
                        updateField("type", event.target.value)
                      }
                    >
                      <option value="offline">حضوری</option>
                      <option value="online">آنلاین</option>
                    </select>
                  </label>

                  <label className="att-field">
                    ساعت شروع
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(event) =>
                        updateField("startTime", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="att-field">
                    ساعت پایان
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(event) =>
                        updateField("endTime", event.target.value)
                      }
                      required
                    />
                  </label>

                  {form.type === "online" ? (
                    <label className="att-field full">
                      لینک ورود به کلاس
                      <input
                        type="url"
                        value={form.link}
                        onChange={(event) =>
                          updateField("link", event.target.value)
                        }
                        placeholder="https://meet.google.com/..."
                        required
                      />
                    </label>
                  ) : (
                    <label className="att-field full">
                      محل برگزاری
                      <input
                        value={form.location}
                        onChange={(event) =>
                          updateField("location", event.target.value)
                        }
                        placeholder="مثلاً ساختمان اصلی، کلاس ۱۰۱"
                      />
                    </label>
                  )}

                  <label className="att-field full">
                    توضیحات
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      placeholder="توضیحات تکمیلی برای این برنامه..."
                      rows={3}
                    />
                  </label>
                </div>

                <div className="att-modal-footer">
                  <button
                    type="button"
                    className="att-cancel-btn"
                    onClick={closeModal}
                  >
                    انصراف
                  </button>

                  <button type="submit" className="att-primary-btn">
                    <CheckCircle2 size={17} />
                    {editingId !== null ? "ذخیره تغییرات" : "ثبت برنامه"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AdminTimetable;
