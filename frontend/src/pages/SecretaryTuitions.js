import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  CreditCard,
  Users,
  CheckCircle2,
  Clock3,
  Search,
  Filter,
  BookOpen,
  Eye,
  Plus,
  Check,
  X,
  Sparkles,
  Layers,
  ArrowRightLeft,
  AlertCircle,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import StatCard from "../components/StatCard";
import { api, getFullName } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

import "./SecretaryTuitions.css";

function SecretaryTuitions() {
  const location = useLocation();
  const isSecretary = location.pathname.includes("/secretary");
  const roleTitle = isSecretary ? "پنل منشی" : "پنل مدیریت";
  const menuType = isSecretary ? "secretary" : "admin";
  const basePath = `/panel/${menuType}`;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [terms, setTerms] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals state
  const [paymentModalData, setPaymentModalData] = useState(null); // { enrollment, student, classObj }
  const [paymentNotes, setPaymentNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const [changeClassModalData, setChangeClassModalData] = useState(null); // { enrollment, student, classObj }
  const [newClassIdTarget, setNewClassIdTarget] = useState("");
  const [savingClassChange, setSavingClassChange] = useState(false);

  const [showNewEnrollModal, setShowNewEnrollModal] = useState(false);
  const [newEnrollStudentId, setNewEnrollStudentId] = useState("");
  const [newEnrollClassId, setNewEnrollClassId] = useState("");
  const [newEnrollPaid, setNewEnrollPaid] = useState(false);
  const [savingNewEnroll, setSavingNewEnroll] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [termsData, usersData, classroomsData, enrollmentsData] =
          await Promise.all([
            api.terms.list(),
            api.users.list(),
            api.classrooms.list(),
            api.enrollments.list(),
          ]);

        if (!alive) return;

        const allTerms = termsData || [];
        setTerms(allTerms);
        setUsers(usersData || []);
        setClassrooms(classroomsData || []);
        setEnrollments(enrollmentsData || []);

        const active = allTerms.find((t) => t.is_active);
        if (active) {
          setSelectedTermId(String(active.id));
        } else if (allTerms.length > 0) {
          setSelectedTermId(String(allTerms[0].id));
        } else {
          setSelectedTermId("all");
        }
      } catch (err) {
        if (alive) setError(err.message || "خطا در دریافت اطلاعات مالی و شهریه");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const activeTermObj = useMemo(() => {
    if (selectedTermId === "all") return null;
    return terms.find((t) => String(t.id) === String(selectedTermId));
  }, [terms, selectedTermId]);

  // Filtered Classrooms for the Term
  const termClassrooms = useMemo(() => {
    if (selectedTermId === "all") return classrooms;
    return classrooms.filter(
      (c) => String(c.term || c.term?.id) === String(selectedTermId),
    );
  }, [classrooms, selectedTermId]);

  const termClassIds = useMemo(() => termClassrooms.map((c) => c.id), [termClassrooms]);

  // Enriched items: One item per enrollment
  const tuitionItems = useMemo(() => {
    return enrollments
      .filter((enr) => {
        if (selectedTermId === "all") return true;
        return termClassIds.includes(enr.classroom || enr.classroom?.id);
      })
      .map((enr) => {
        const studentId = enr.student || enr.student?.id;
        const student = users.find((u) => u.id === studentId);
        const clsId = enr.classroom || enr.classroom?.id;
        const cls = classrooms.find((c) => c.id === clsId);
        const term = terms.find((t) => t.id === (cls?.term || cls?.term?.id));

        const tuitionFee = cls?.tuition_fee !== undefined ? cls.tuition_fee : 2500000;

        return {
          id: enr.id,
          enrollment: enr,
          studentId,
          student,
          studentName: student ? getFullName(student) : "دانش‌آموز نامشخص",
          username: student?.username || "-",
          phone: student?.phone_number || "-",
          classId: clsId,
          className: cls?.name || enr.classroom_name || `کلاس کد ${clsId}`,
          teacherName: getFullName(cls?.teacher_detail) || "استاد نامشخص",
          termName: term?.name || "ترم نامشخص",
          tuitionFee,
          isPaid: Boolean(enr.is_paid),
          paidAt: enr.paid_at,
          paymentNotes: enr.payment_notes || "",
        };
      });
  }, [enrollments, users, classrooms, terms, selectedTermId, termClassIds]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return tuitionItems.filter((item) => {
      const matchSearch =
        !q ||
        item.studentName.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.className.toLowerCase().includes(q);

      const matchClass =
        selectedClassId === "all" || String(item.classId) === String(selectedClassId);

      const matchStatus =
        selectedStatus === "all" ||
        (selectedStatus === "paid" && item.isPaid) ||
        (selectedStatus === "pending" && !item.isPaid);

      return matchSearch && matchClass && matchStatus;
    });
  }, [tuitionItems, searchTerm, selectedClassId, selectedStatus]);

  // Stats Calculations
  const stats = useMemo(() => {
    const totalCount = tuitionItems.length;
    const totalExpected = tuitionItems.reduce((sum, i) => sum + i.tuitionFee, 0);
    const totalCollected = tuitionItems
      .filter((i) => i.isPaid)
      .reduce((sum, i) => sum + i.tuitionFee, 0);
    const totalPending = totalExpected - totalCollected;
    const paidCount = tuitionItems.filter((i) => i.isPaid).length;
    const pendingCount = totalCount - paidCount;

    return {
      totalCount,
      totalExpected,
      totalCollected,
      totalPending,
      paidCount,
      pendingCount,
    };
  }, [tuitionItems]);

  // Actions
  const handleTogglePayment = async (enrollmentId, targetPaidStatus, notes = "") => {
    try {
      setSavingPayment(true);
      const updated = await api.enrollments.update(enrollmentId, {
        is_paid: targetPaidStatus,
        payment_notes: notes,
      });

      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? { ...e, ...updated } : e)),
      );

      setSuccessMsg(
        targetPaidStatus
          ? "دریافت شهریه با موفقیت ثبت شد و وضعیت به «تسویه شده» تغییر یافت."
          : "وضعیت شهریه به «در انتظار پرداخت» بازگردانده شد.",
      );
      setPaymentModalData(null);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert(err.message || "خطا در به‌روزرسانی وضعیت پرداخت");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleChangeClass = async (e) => {
    e.preventDefault();
    if (!changeClassModalData || !newClassIdTarget) return;

    try {
      setSavingClassChange(true);
      const updated = await api.enrollments.update(changeClassModalData.enrollment.id, {
        classroom: Number(newClassIdTarget),
      });

      setEnrollments((prev) =>
        prev.map((item) =>
          item.id === changeClassModalData.enrollment.id ? { ...item, ...updated } : item,
        ),
      );

      setSuccessMsg("کلاس دانش‌آموز با موفقیت تغییر داده شد.");
      setChangeClassModalData(null);
      setNewClassIdTarget("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert(err.message || "خطا در تغییر کلاس دانش‌آموز");
    } finally {
      setSavingClassChange(false);
    }
  };

  const handleCreateEnrollment = async (e) => {
    e.preventDefault();
    if (!newEnrollStudentId || !newEnrollClassId) return;

    try {
      setSavingNewEnroll(true);
      const newEnr = await api.enrollments.create({
        student: Number(newEnrollStudentId),
        classroom: Number(newEnrollClassId),
        is_paid: newEnrollPaid,
      });

      setEnrollments((prev) => [...prev, newEnr]);
      setShowNewEnrollModal(false);
      setNewEnrollStudentId("");
      setNewEnrollClassId("");
      setNewEnrollPaid(false);
      setSuccessMsg("دانش‌آموز با موفقیت در کلاس ثبت‌نام شد.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert(err.message || "خطا در ثبت‌نام دانش‌آموز در کلاس");
    } finally {
      setSavingNewEnroll(false);
    }
  };

  const studentUsersList = useMemo(
    () => users.filter((u) => u.role === "student"),
    [users],
  );

  return (
    <DashboardLayout role={roleTitle} title="مدیریت شهریه‌ها و تسویه" menuType={menuType}>
      <div className="secretary-tuitions-page">
        {/* Term Selector Header Banner */}
        <div className="term-selector-banner" style={{ marginBottom: "1.75rem" }}>
          <div className="term-banner-info">
            <div className="term-icon-circle">
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: "800" }}>
                ترم تحصیلی انتخابی:{" "}
                <span className="term-highlight-text" style={{ color: "var(--primary)" }}>
                  {activeTermObj
                    ? activeTermObj.name
                    : selectedTermId === "all"
                    ? "همه ترم‌ها"
                    : "ترم نامشخص"}
                </span>
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "oklch(55% 0 0)" }}>
                {activeTermObj?.is_active
                  ? "شهریه‌ها و وضعیت تسویه ثبت‌نام‌های ترم فعال جاری در حال نمایش است."
                  : activeTermObj
                  ? "شهریه‌ها و سوابق مالی مربوط به این ترم بایگانی‌شده در حال نمایش است."
                  : "نمایش سوابق شهریه تمامی دوره‌ها"}
              </p>
            </div>
          </div>

          <div className="term-dropdown-wrapper" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <label style={{ fontSize: "0.84rem", fontWeight: "700" }}>انتخاب ترم:</label>
            <select
              value={selectedTermId}
              onChange={(e) => {
                setSelectedTermId(e.target.value);
                setSelectedClassId("all");
              }}
              className="term-select-input"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_active ? "(ترم فعال جاری)" : "(به پایان رسیده)"}
                </option>
              ))}
              <option value="all">همه ترم‌ها (مشاهده کامل)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="tuition-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="tuition-alert success">
            <Sparkles size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="secretary-tuition-stats-grid">
          <StatCard
            title="کل شهریه مصوب ترم"
            value={`${toPersianDigits(stats.totalExpected.toLocaleString("fa-IR"))} تومان`}
            hint={`${toPersianDigits(stats.totalCount)} ثبت‌نام کلاسی`}
            icon={<CreditCard />}
            color="blue"
          />

          <StatCard
            title="شهریه وصول‌شده"
            value={`${toPersianDigits(stats.totalCollected.toLocaleString("fa-IR"))} تومان`}
            hint={`${toPersianDigits(stats.paidCount)} نفر تسویه کامل`}
            icon={<CheckCircle2 />}
            color="green"
          />

          <StatCard
            title="مانده در انتظار وصول"
            value={`${toPersianDigits(stats.totalPending.toLocaleString("fa-IR"))} تومان`}
            hint={`${toPersianDigits(stats.pendingCount)} نفر بدهکار`}
            icon={<Clock3 />}
            color={stats.totalPending === 0 ? "green" : "red"}
          />

          <StatCard
            title="نسبت وصولی"
            value={`${toPersianDigits(
              stats.totalCount > 0
                ? Math.round((stats.paidCount / stats.totalCount) * 100)
                : 100,
            )}٪`}
            hint="درصد تسویه حساب‌ها"
            icon={<Users />}
            color="light-blue"
          />
        </div>

        {/* Filters & Actions Bar */}
        <div className="tuitions-filter-section">
          <div className="filter-controls-row">
            <div className="search-field-shell">
              <Search size={18} />
              <input
                type="text"
                placeholder="جستجو بر اساس نام دانش‌آموز، نام کاربری یا شماره تماس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="select-field-shell">
              <BookOpen size={16} />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="all">همه کلاس‌های این ترم</option>
                {termClassrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (شهریه: {toPersianDigits((c.tuition_fee || 2500000).toLocaleString("fa-IR"))} ت)
                  </option>
                ))}
              </select>
            </div>

            <div className="select-field-shell">
              <Filter size={16} />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">همه وضعیت‌های پرداخت</option>
                <option value="paid">پرداخت شده (تسویه)</option>
                <option value="pending">در انتظار پرداخت</option>
              </select>
            </div>

            <AnimatedButton
              variant="primary"
              icon={<Plus size={18} />}
              onClick={() => setShowNewEnrollModal(true)}
            >
              تعیین کلاس برای دانش‌آموز
            </AnimatedButton>
          </div>
        </div>

        {/* Main Table */}
        <div className="tuitions-table-card">
          <div className="tuitions-table-header">
            <div>
              <h3>لیست ثبت‌نام‌ها و وضعیت شهریه</h3>
              <p>مبالغ شهریه به تفکیک کلاس و وضعیت پرداخت نقدی/کارتخوانی به آموزشگاه</p>
            </div>
            <span className="count-badge">
              {toPersianDigits(filteredItems.length)} مورد
            </span>
          </div>

          <div className="table-responsive">
            <table className="tuition-data-table">
              <thead>
                <tr>
                  <th>دانش‌آموز</th>
                  <th>کلاس و ترم</th>
                  <th>مدرس دوره</th>
                  <th>شهریه مصوب کلاس</th>
                  <th>وضعیت پرداخت</th>
                  <th>تاریخ پرداخت</th>
                  <th>توضیحات فیش / رسید</th>
                  <th>عملیات منشی / مدیر</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "3rem" }}>
                      در حال بارگذاری اطلاعات شهریه‌ها...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      style={{ textAlign: "center", padding: "3rem", color: "oklch(55% 0 0)" }}
                    >
                      موردی مطابق با فیلترهای انتخابی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="student-profile-cell">
                          <div className="student-avatar-circle">
                            {item.studentName.charAt(0)}
                          </div>
                          <div>
                            <strong>{item.studentName}</strong>
                            <small>{item.phone}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="class-badge-cell">
                          <span className="class-name-text">{item.className}</span>
                          <small>{item.termName}</small>
                        </div>
                      </td>

                      <td>
                        <span className="teacher-text">{item.teacherName}</span>
                      </td>

                      <td>
                        <strong className="tuition-amount-text">
                          {toPersianDigits(item.tuitionFee.toLocaleString("fa-IR"))} تومان
                        </strong>
                      </td>

                      <td>
                        <span className={`payment-pill ${item.isPaid ? "paid" : "pending"}`}>
                          {item.isPaid ? "پرداخت شده (تسویه)" : "در انتظار پرداخت"}
                        </span>
                      </td>

                      <td>
                        <span className="date-sub-text">
                          {item.paidAt ? toJalaliDateString(item.paidAt) : "-"}
                        </span>
                      </td>

                      <td>
                        <span className="notes-text">
                          {item.paymentNotes || "-"}
                        </span>
                      </td>

                      <td>
                        <div className="tuition-row-actions">
                          {item.isPaid ? (
                            <button
                              type="button"
                              className="tuition-action-btn revert"
                              onClick={() => handleTogglePayment(item.id, false, "")}
                              title="لغو وضعیت تسویه"
                            >
                              <X size={14} />
                              لغو تسویه
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="tuition-action-btn pay"
                              onClick={() => {
                                setPaymentModalData(item);
                                setPaymentNotes(item.paymentNotes || "");
                              }}
                              title="ثبت دریافت وجه نقدی/کارتخوان"
                            >
                              <Check size={14} />
                              ثبت دریافت وجه
                            </button>
                          )}

                          <button
                            type="button"
                            className="tuition-action-btn change-class"
                            onClick={() => {
                              setChangeClassModalData(item);
                              setNewClassIdTarget(String(item.classId));
                            }}
                            title="تغییر کلاس دانش‌آموز"
                          >
                            <ArrowRightLeft size={14} />
                            تغییر کلاس
                          </button>

                          <Link to={`${basePath}/students/${item.studentId}`}>
                            <button
                              type="button"
                              className="tuition-action-btn view-profile"
                              title="مشاهده پرونده"
                            >
                              <Eye size={14} />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal 1: Record / Confirm Payment */}
        {paymentModalData && (
          <div
            className="exam-modal-backdrop"
            onClick={() => setPaymentModalData(null)}
          >
            <div
              className="exam-modal-container"
              style={{ maxWidth: "480px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="exam-icon-circle" style={{ background: "var(--green-5, #10b981)" }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4>ثبت دریافت شهریه آموزشگاه</h4>
                    <p>{paymentModalData.studentName} - {paymentModalData.className}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setPaymentModalData(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="exam-modal-body" style={{ padding: "1.5rem" }}>
                <div style={{ background: "oklch(97% 0 0)", padding: "1rem", borderRadius: "12px", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span>دانش‌آموز:</span>
                    <strong>{paymentModalData.studentName}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span>کلاس انتخابی:</span>
                    <strong>{paymentModalData.className}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>مبلغ شهریه کلاس:</span>
                    <strong style={{ color: "var(--primary)" }}>
                      {toPersianDigits(paymentModalData.tuitionFee.toLocaleString("fa-IR"))} تومان
                    </strong>
                  </div>
                </div>

                <div className="class-form-group full-width">
                  <label style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block" }}>
                    شماره پیگیری / رسید کارتخوان / یادداشت (اختیاری):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: پرداخت نقدی / کارتخوان دفتر - پیگیری ۱۲۳۴۵"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      border: "1px solid oklch(85% 0 0)",
                    }}
                  />
                </div>
              </div>

              <div className="exam-modal-footer">
                <AnimatedButton
                  variant="secondary"
                  type="button"
                  onClick={() => setPaymentModalData(null)}
                >
                  انصراف
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  type="button"
                  disabled={savingPayment}
                  onClick={() => handleTogglePayment(paymentModalData.id, true, paymentNotes)}
                >
                  {savingPayment ? "در حال ثبت..." : "تایید و ثبت تسویه"}
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Change Class */}
        {changeClassModalData && (
          <div
            className="exam-modal-backdrop"
            onClick={() => setChangeClassModalData(null)}
          >
            <div
              className="exam-modal-container"
              style={{ maxWidth: "480px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="exam-icon-circle">
                    <ArrowRightLeft size={20} />
                  </div>
                  <div>
                    <h4>تغییر کلاس دانش‌آموز</h4>
                    <p>{changeClassModalData.studentName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setChangeClassModalData(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleChangeClass}>
                <div className="exam-modal-body" style={{ padding: "1.5rem" }}>
                  <p style={{ fontSize: "0.88rem", marginBottom: "1rem", color: "oklch(45% 0 0)" }}>
                    کلاس فعلی: <strong>{changeClassModalData.className}</strong>
                  </p>

                  <div className="class-form-group full-width">
                    <label style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block" }}>
                      کلاس جدید را انتخاب کنید:
                    </label>
                    <select
                      value={newClassIdTarget}
                      onChange={(e) => setNewClassIdTarget(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "10px",
                        border: "1px solid oklch(85% 0 0)",
                      }}
                    >
                      <option value="">انتخاب کلاس جدید...</option>
                      {termClassrooms.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (شهریه: {toPersianDigits((c.tuition_fee || 2500000).toLocaleString("fa-IR"))} تومان)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="exam-modal-footer">
                  <AnimatedButton
                    variant="secondary"
                    type="button"
                    onClick={() => setChangeClassModalData(null)}
                  >
                    انصراف
                  </AnimatedButton>
                  <AnimatedButton
                    variant="primary"
                    type="submit"
                    disabled={savingClassChange || !newClassIdTarget}
                  >
                    {savingClassChange ? "در حال تغییر..." : "ثبت تغییر کلاس"}
                  </AnimatedButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Add new student to a class */}
        {showNewEnrollModal && (
          <div
            className="exam-modal-backdrop"
            onClick={() => setShowNewEnrollModal(false)}
          >
            <div
              className="exam-modal-container"
              style={{ maxWidth: "520px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="exam-modal-header">
                <div className="modal-header-info">
                  <div className="exam-icon-circle">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h4>تعیین کلاس برای دانش‌آموز</h4>
                    <p>ثبت‌نام دانش‌آموز در کلاس و تنظیم وضعیت اولیه شهریه</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowNewEnrollModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateEnrollment}>
                <div className="exam-modal-body" style={{ padding: "1.5rem" }}>
                  <div className="class-form-group full-width" style={{ marginBottom: "1.25rem" }}>
                    <label style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block" }}>
                      انتخاب دانش‌آموز <span style={{ color: "red" }}>*</span>
                    </label>
                    <select
                      value={newEnrollStudentId}
                      onChange={(e) => setNewEnrollStudentId(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "10px",
                        border: "1px solid oklch(85% 0 0)",
                      }}
                    >
                      <option value="">انتخاب دانش‌آموز...</option>
                      {studentUsersList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {getFullName(st)} ({st.username}) - {st.phone_number || "بدون شماره"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="class-form-group full-width" style={{ marginBottom: "1.25rem" }}>
                    <label style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block" }}>
                      انتخاب کلاس در این ترم <span style={{ color: "red" }}>*</span>
                    </label>
                    <select
                      value={newEnrollClassId}
                      onChange={(e) => setNewEnrollClassId(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "10px",
                        border: "1px solid oklch(85% 0 0)",
                      }}
                    >
                      <option value="">انتخاب کلاس...</option>
                      {termClassrooms.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (شهریه: {toPersianDigits((c.tuition_fee || 2500000).toLocaleString("fa-IR"))} تومان)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="class-form-group full-width">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={newEnrollPaid}
                        onChange={(e) => setNewEnrollPaid(e.target.checked)}
                      />
                      <span>شهریه این کلاس هم‌اکنون به صورت نقدی/کارتخوان تسویه شد.</span>
                    </label>
                  </div>
                </div>

                <div className="exam-modal-footer">
                  <AnimatedButton
                    variant="secondary"
                    type="button"
                    onClick={() => setShowNewEnrollModal(false)}
                  >
                    انصراف
                  </AnimatedButton>
                  <AnimatedButton
                    variant="primary"
                    type="submit"
                    disabled={savingNewEnroll || !newEnrollStudentId || !newEnrollClassId}
                  >
                    {savingNewEnroll ? "در حال ثبت..." : "ثبت‌نام در کلاس"}
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

export default SecretaryTuitions;
