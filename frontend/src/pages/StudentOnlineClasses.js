import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Video,
  CalendarDays,
  Clock3,
  UserRound,
  BookOpen,
  ExternalLink,
  Wifi,
  CalendarCheck,
  PlayCircle,
  MonitorPlay,
  RefreshCw,
  Search,
  GraduationCap,
  CalendarClock,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import "./StudentOnlineClasses.css";
import { AnimatedButton } from "../components/AnimatedButton";
import StatCard from "../components/StatCard";

const STORAGE_KEY = "kish_online_classes_v1";

const FILTERS = [
  { id: "all", label: "همه کلاس‌ها" },
  { id: "today", label: "امروز" },
  { id: "upcoming", label: "جلسات آینده" },
  { id: "past", label: "گذشته" },
];

const toLocalDate = (dateString, timeString = "00:00") => {
  if (!dateString) return null;

  const [year, month, day] = String(dateString).split("-").map(Number);
  const [hours, minutes] = String(timeString || "00:00")
    .split(":")
    .map(Number);

  if (![year, month, day].every(Number.isFinite)) return null;

  const date = new Date(
    year,
    month - 1,
    day,
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0,
  );

  return Number.isNaN(date.getTime()) ? null : date;
};

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (dateString) => {
  const date = toLocalDate(dateString);

  if (!date) return "تاریخ نامشخص";

  return new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
};

const getClassStatus = (onlineClass, now = new Date()) => {
  const start = toLocalDate(onlineClass.date, onlineClass.startTime);
  const end = toLocalDate(onlineClass.date, onlineClass.endTime);

  if (!start || !end) return "unknown";

  if (now >= start && now <= end) return "live";
  if (now < start) return "upcoming";

  return "past";
};

const getStatusInfo = (status) => {
  switch (status) {
    case "live":
      return {
        label: "در حال برگزاری",
        className: "sol-status-live",
      };

    case "upcoming":
      return {
        label: "به‌زودی",
        className: "sol-status-upcoming",
      };

    case "past":
      return {
        label: "پایان‌یافته",
        className: "sol-status-past",
      };

    default:
      return {
        label: "نامشخص",
        className: "sol-status-unknown",
      };
  }
};

const readOnlineClasses = () => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (!storedData) return [];

    const parsedData = JSON.parse(storedData);

    if (Array.isArray(parsedData)) return parsedData;

    if (Array.isArray(parsedData?.classes)) {
      return parsedData.classes;
    }

    return [];
  } catch (error) {
    console.error("خطا در خواندن کلاس‌های آنلاین:", error);
    return [];
  }
};

const isValidMeetingUrl = (url) => {
  if (!url || typeof url !== "string") return false;

  try {
    const parsedUrl = new URL(url);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

function StudentOnlineClasses() {
  const [classes, setClasses] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadClasses = useCallback(() => {
    setLoading(true);
    setClasses(readOnlineClasses());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadClasses();

    const handleStorageChange = (event) => {
      if (event.key === STORAGE_KEY) {
        loadClasses();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadClasses]);

  const now = new Date();
  const today = getTodayString();

  const normalizedClasses = useMemo(() => {
    return classes
      .filter((item) => item && typeof item === "object")
      .map((item, index) => ({
        ...item,
        id: item.id ?? `online-class-${index}`,
        title: item.title || item.name || "کلاس بدون عنوان",
        teacher: item.teacher || item.teacherName || "استاد مشخص نشده",
        classroom: item.classroom || item.className || "کلاس عمومی",
        date: item.date || "",
        startTime: item.startTime || "",
        endTime: item.endTime || "",
        meetingUrl: item.meetingUrl || item.meeting_url || "",
        description: item.description || "",
        status: getClassStatus(item, now),
      }))
      .sort((a, b) => {
        const dateA = toLocalDate(a.date, a.startTime)?.getTime() ?? 0;
        const dateB = toLocalDate(b.date, b.startTime)?.getTime() ?? 0;

        return dateA - dateB;
      });
  }, [classes]);

  const statistics = useMemo(() => {
    const todayClasses = normalizedClasses.filter(
      (item) => item.date === today,
    );

    const liveClasses = normalizedClasses.filter(
      (item) => item.status === "live",
    );

    const upcomingClasses = normalizedClasses.filter(
      (item) => item.status === "upcoming",
    );

    return {
      total: normalizedClasses.length,
      today: todayClasses.length,
      live: liveClasses.length,
      upcoming: upcomingClasses.length,
    };
  }, [normalizedClasses, today]);

  const filteredClasses = useMemo(() => {
    return normalizedClasses.filter((item) => {
      const matchesSearch = [item.title, item.teacher, item.classroom].some(
        (value) =>
          String(value)
            .toLowerCase()
            .includes(searchQuery.trim().toLowerCase()),
      );

      let matchesFilter = true;

      if (activeFilter === "today") {
        matchesFilter = item.date === today;
      } else if (activeFilter === "upcoming") {
        matchesFilter = item.status === "upcoming";
      } else if (activeFilter === "past") {
        matchesFilter = item.status === "past";
      }

      return matchesSearch && matchesFilter;
    });
  }, [normalizedClasses, activeFilter, searchQuery, today]);

  const handleJoinClass = (meetingUrl) => {
    if (!isValidMeetingUrl(meetingUrl)) return;

    window.open(meetingUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <DashboardLayout role="پنل دانش‌آموز" title="کلاس های آنلاین" menuType="student">
      <main className="sol-page" dir="rtl">
        <div className="admin-students-x7k2-header">
          <div className="admin-students-x7k2-heading">
            <div className="admin-students-x7k2-heading-icon">
              <Video size={25} />
            </div>

            <div>
              <h3 className="admin-students-x7k2-title">کلاس‌های آنلاین من</h3>
              <p className="admin-students-x7k2-description">
                برنامه جلسات آنلاین خود را مشاهده کنید و در زمان مقرر وارد کلاس
                شوید.
              </p>
            </div>
          </div>
          <AnimatedButton
            variant="primary"
            icon={<RefreshCw size={18} />}
            onClick={loadClasses}
          >
            به‌روزرسانی
          </AnimatedButton>
        </div>
        <section className="sol-stats">
          <StatCard
            title="کل جلسات"
            value={`${statistics.total} نفر`}
            icon={<BookOpen size={23} />}
            color="blue"
          />
          <StatCard
            title="جلسات امروز"
            value={statistics.today}
            icon={<CalendarDays size={23} />}
            color="orange"
          />
          <StatCard
            title="در حال برگزاری"
            value={statistics.live}
            icon={<Wifi size={23} />}
            color="green"
          />
          <StatCard
            title="جلسات آینده"
            value={statistics.upcoming}
            icon={<CalendarClock size={23} />}
            color="blue"
          />
        </section>

        {statistics.live > 0 && (
          <section className="sol-live-banner">
            <div className="sol-live-banner-icon">
              <PlayCircle size={25} />
            </div>

            <div className="sol-live-banner-content">
              <strong>یک کلاس در حال برگزاری است!</strong>
              <span>می‌توانید از بخش جلسات زیر وارد کلاس آنلاین خود شوید.</span>
            </div>

            <span className="sol-live-indicator">
              <span />
              LIVE
            </span>
          </section>
        )}

        <section className="sol-classes-section">
          <div className="sol-section-heading">
            <div>
              <h2>برنامه کلاس‌ها</h2>
              <p>جلسات آموزشی خود را مدیریت کنید.</p>
            </div>

            <div className="sol-search">
              <Search size={17} />
              <input
                type="text"
                placeholder="جستجوی کلاس یا استاد..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="sol-filters">
            {FILTERS.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={
                  activeFilter === filter.id
                    ? "sol-filter active"
                    : "sol-filter"
                }
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="sol-empty-state">
              <RefreshCw className="sol-loading-icon" size={30} />
              <strong>در حال دریافت اطلاعات...</strong>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="sol-empty-state">
              <div className="sol-empty-icon">
                <MonitorPlay size={38} />
              </div>

              <h3>
                {searchQuery
                  ? "کلاسی با این مشخصات پیدا نشد"
                  : activeFilter === "today"
                    ? "امروز کلاسی برای شما ثبت نشده است"
                    : activeFilter === "upcoming"
                      ? "جلسه آینده‌ای ثبت نشده است"
                      : activeFilter === "past"
                        ? "جلسه‌ای در گذشته ثبت نشده است"
                        : "هنوز کلاسی ثبت نشده است"}
              </h3>

              <p>
                پس از ثبت برنامه کلاس‌ها توسط آموزشگاه، جلسات شما در این قسمت
                نمایش داده می‌شوند.
              </p>

              {(searchQuery || activeFilter !== "all") && (
                <button
                  type="button"
                  className="sol-clear-filter"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                >
                  نمایش همه کلاس‌ها
                </button>
              )}
            </div>
          ) : (
            <div className="sol-class-list">
              {filteredClasses.map((onlineClass) => {
                const statusInfo = getStatusInfo(onlineClass.status);
                const canJoin =
                  onlineClass.status === "live" &&
                  isValidMeetingUrl(onlineClass.meetingUrl);

                return (
                  <article className="sol-class-card" key={onlineClass.id}>
                    <div className="sol-class-main">
                      <div className="sol-class-icon">
                        <GraduationCap size={25} />
                      </div>

                      <div className="sol-class-details">
                        <div className="sol-class-title-row">
                          <h3>{onlineClass.title}</h3>

                          <span
                            className={`sol-status ${statusInfo.className}`}
                          >
                            {onlineClass.status === "live" && (
                              <span className="sol-status-dot" />
                            )}
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="sol-class-meta">
                          <span>
                            <BookOpen size={15} />
                            {onlineClass.classroom}
                          </span>

                          <span>
                            <UserRound size={15} />
                            {onlineClass.teacher}
                          </span>

                          <span>
                            <CalendarDays size={15} />
                            {formatDate(onlineClass.date)}
                          </span>

                          <span>
                            <Clock3 size={15} />
                            {onlineClass.startTime || "--:--"}
                            {" تا "}
                            {onlineClass.endTime || "--:--"}
                          </span>
                        </div>

                        {onlineClass.description && (
                          <p className="sol-class-description">
                            {onlineClass.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="sol-class-action">
                      {canJoin ? (
                        <button
                          type="button"
                          className="sol-join-btn"
                          onClick={() =>
                            handleJoinClass(onlineClass.meetingUrl)
                          }
                        >
                          <Video size={17} />
                          ورود به کلاس
                          <ExternalLink size={14} />
                        </button>
                      ) : onlineClass.status === "upcoming" ? (
                        <button
                          type="button"
                          className="sol-disabled-btn"
                          disabled
                        >
                          <CalendarCheck size={17} />
                          منتظر شروع کلاس
                        </button>
                      ) : onlineClass.status === "past" ? (
                        <span className="sol-finished-label">
                          <CalendarCheck size={16} />
                          جلسه به پایان رسیده
                        </span>
                      ) : (
                        <span className="sol-finished-label">
                          لینک جلسه موجود نیست
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="sol-help-card">
          <div className="sol-help-icon">
            <Video size={23} />
          </div>

          <div>
            <strong>راهنمای ورود به کلاس آنلاین</strong>
            <p>
              برای ورود به جلسه، در زمان برگزاری روی دکمه «ورود به کلاس» کلیک
              کنید. بهتر است از اینترنت پایدار و مرورگر به‌روز استفاده کنید.
            </p>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}

export default StudentOnlineClasses;
