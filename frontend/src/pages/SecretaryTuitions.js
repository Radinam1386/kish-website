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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paymentModalData, setPaymentModalData] = useState(null);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [changeClassModalData, setChangeClassModalData] = useState(null);
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

        const [
          termsData,
          usersData,
          classroomsData,
          enrollmentsData,
        ] = await Promise.all([
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
        if (alive) {
          setError(
            err.message || "خطا در دریافت اطلاعات مالی و شهریه"
          );
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);
  const activeTermObj = useMemo(() => {
    if (selectedTermId === "all") return null;

    return terms.find(
      (t) => String(t.id) === String(selectedTermId)
    );
  }, [terms, selectedTermId]);
  const termClassrooms = useMemo(() => {
    if (selectedTermId === "all") {
      return classrooms;
    }

    return classrooms.filter(
      (c) =>
        String(c.term || c.term?.id) ===
        String(selectedTermId)
    );
  }, [classrooms, selectedTermId]);

  const termClassIds = useMemo(
    () => termClassrooms.map((c) => c.id),
    [termClassrooms]
  );
  const tuitionItems = useMemo(() => {
    return enrollments
      .filter((enr) => {
        if (selectedTermId === "all") {
          return true;
        }

        return termClassIds.includes(
          enr.classroom || enr.classroom?.id
        );
      })
      .map((enr) => {
        const studentId =
          enr.student || enr.student?.id;

        const student = users.find(
          (u) => u.id === studentId
        );

        const clsId =
          enr.classroom || enr.classroom?.id;

        const cls = classrooms.find(
          (c) => c.id === clsId
        );

        const term = terms.find(
          (t) =>
            t.id ===
            (cls?.term || cls?.term?.id)
        );

        const tuitionFee =
          cls?.tuition_fee !== undefined
            ? Number(cls.tuition_fee)
            : 2500000;

        return {
          id: enr.id,
          enrollment: enr,
          studentId,
          student,

          studentName: student
            ? getFullName(student)
            : "دانش‌آموز نامشخص",

          username:
            student?.username || "-",

          phone:
            student?.phone_number || "-",

          classId: clsId,

          className:
            cls?.name ||
            enr.classroom_name ||
            `کلاس کد ${clsId}`,

          teacherName:
            getFullName(cls?.teacher_detail) ||
            "استاد نامشخص",

          termName:
            term?.name || "ترم نامشخص",

          tuitionFee,

          isPaid: Boolean(enr.is_paid),

          paidAt: enr.paid_at,

          paymentNotes:
            enr.payment_notes || "",
        };
      });
  }, [
    enrollments,
    users,
    classrooms,
    terms,
    selectedTermId,
    termClassIds,
  ]);
  const filteredItems = useMemo(() => {
    const q = searchTerm
      .trim()
      .toLowerCase();

    return tuitionItems.filter((item) => {
      const matchSearch =
        !q ||
        item.studentName
          .toLowerCase()
          .includes(q) ||
        item.username
          .toLowerCase()
          .includes(q) ||
        item.phone.includes(q) ||
        item.className
          .toLowerCase()
          .includes(q);

      const matchClass =
        selectedClassId === "all" ||
        String(item.classId) ===
          String(selectedClassId);

      const matchStatus =
        selectedStatus === "all" ||
        (selectedStatus === "paid" &&
          item.isPaid) ||
        (selectedStatus === "pending" &&
          !item.isPaid);

      return (
        matchSearch &&
        matchClass &&
        matchStatus
      );
    });
  }, [
    tuitionItems,
    searchTerm,
    selectedClassId,
    selectedStatus,
  ]);
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredItems.length / itemsPerPage
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedItems = useMemo(() => {
    const start =
      (safeCurrentPage - 1) *
      itemsPerPage;

    const end =
      start + itemsPerPage;

    return filteredItems.slice(
      start,
      end
    );
  }, [
    filteredItems,
    safeCurrentPage,
    itemsPerPage,
  ]);

  const paginationStart =
    filteredItems.length === 0
      ? 0
      : (safeCurrentPage - 1) *
          itemsPerPage +
        1;

  const paginationEnd = Math.min(
    safeCurrentPage * itemsPerPage,
    filteredItems.length
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedClassId,
    selectedStatus,
    selectedTermId,
    itemsPerPage,
  ]);
  const stats = useMemo(() => {
    const totalCount =
      tuitionItems.length;

    const totalExpected =
      tuitionItems.reduce(
        (sum, i) =>
          sum + Number(i.tuitionFee || 0),
        0
      );

    const totalCollected =
      tuitionItems
        .filter((i) => i.isPaid)
        .reduce(
          (sum, i) =>
            sum +
            Number(i.tuitionFee || 0),
          0
        );

    const totalPending =
      totalExpected -
      totalCollected;

    const paidCount =
      tuitionItems.filter(
        (i) => i.isPaid
      ).length;

    const pendingCount =
      totalCount - paidCount;

    return {
      totalCount,
      totalExpected,
      totalCollected,
      totalPending,
      paidCount,
      pendingCount,
    };
  }, [tuitionItems]);
  const showSuccess = (message) => {
    setSuccessMsg(message);

    window.setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
  };
  const handleTogglePayment = async (
    enrollmentId,
    targetPaidStatus,
    notes = ""
  ) => {
    try {
      setSavingPayment(true);

      const updated =
        await api.enrollments.update(
          enrollmentId,
          {
            is_paid:
              targetPaidStatus,
            payment_notes: notes,
          }
        );

      setEnrollments((prev) =>
        prev.map((e) =>
          e.id === enrollmentId
            ? {
                ...e,
                ...updated,
              }
            : e
        )
      );

      showSuccess(
        targetPaidStatus
          ? "دریافت شهریه با موفقیت ثبت شد و وضعیت به «تسویه شده» تغییر یافت."
          : "وضعیت شهریه به «در انتظار پرداخت» بازگردانده شد."
      );

      setPaymentModalData(null);
    } catch (err) {
      alert(
        err.message ||
          "خطا در به‌روزرسانی وضعیت پرداخت"
      );
    } finally {
      setSavingPayment(false);
    }
  };
  const handleChangeClass = async (e) => {
    e.preventDefault();

    if (
      !changeClassModalData ||
      !newClassIdTarget
    ) {
      return;
    }

    try {
      setSavingClassChange(true);

      const updated =
        await api.enrollments.update(
          changeClassModalData.enrollment.id,
          {
            classroom:
              Number(newClassIdTarget),
          }
        );

      setEnrollments((prev) =>
        prev.map((item) =>
          item.id ===
          changeClassModalData.enrollment.id
            ? {
                ...item,
                ...updated,
              }
            : item
        )
      );

      showSuccess(
        "کلاس دانش‌آموز با موفقیت تغییر داده شد."
      );

      setChangeClassModalData(null);
      setNewClassIdTarget("");
    } catch (err) {
      alert(
        err.message ||
          "خطا در تغییر کلاس دانش‌آموز"
      );
    } finally {
      setSavingClassChange(false);
    }
  };
  const handleCreateEnrollment = async (
    e
  ) => {
    e.preventDefault();

    if (
      !newEnrollStudentId ||
      !newEnrollClassId
    ) {
      return;
    }

    try {
      setSavingNewEnroll(true);

      const newEnr =
        await api.enrollments.create({
          student:
            Number(newEnrollStudentId),

          classroom:
            Number(newEnrollClassId),

          is_paid: newEnrollPaid,
        });

      setEnrollments((prev) => [
        ...prev,
        newEnr,
      ]);

      setShowNewEnrollModal(false);

      setNewEnrollStudentId("");
      setNewEnrollClassId("");
      setNewEnrollPaid(false);

      showSuccess(
        "دانش‌آموز با موفقیت در کلاس ثبت‌نام شد."
      );
    } catch (err) {
      alert(
        err.message ||
          "خطا در ثبت‌نام دانش‌آموز در کلاس"
      );
    } finally {
      setSavingNewEnroll(false);
    }
  };

  const studentUsersList = useMemo(
    () =>
      users.filter(
        (u) => u.role === "student"
      ),
    [users]
  );
  const getPaginationPages = () => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    if (safeCurrentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (
      safeCurrentPage >=
      totalPages - 2
    ) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      safeCurrentPage - 2,
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      safeCurrentPage + 2,
    ];
  };

  return (
    <DashboardLayout
      role={roleTitle}
      title="مدیریت شهریه‌ها و تسویه"
      menuType={menuType}
    >
      <div className="secretary-tuitions-page">
        <div className="term-selector-banner">
          <div className="term-banner-info">
            <div className="term-icon-circle-tit">
              <CreditCard size={25} />
            </div>
            <div className="term-banner-text">
              <h3>
                ترم تحصیلی انتخابی:{" "}
                <span className="term-highlight-text">
                  {activeTermObj
                    ? activeTermObj.name
                    : selectedTermId === "all"
                    ? "همه ترم‌ها"
                    : "ترم نامشخص"}
                </span>
              </h3>

              <p>
                {activeTermObj?.is_active
                  ? "شهریه‌ها و وضعیت تسویه ثبت‌نام‌های ترم فعال جاری در حال نمایش است."
                  : activeTermObj
                  ? "شهریه‌ها و سوابق مالی مربوط به این ترم بایگانی‌شده در حال نمایش است."
                  : "نمایش سوابق شهریه تمامی دوره‌ها"}
              </p>
            </div>
          </div>

          <div className="term-dropdown-wrapper">
            <label>
              انتخاب ترم:
            </label>

            <select
              value={selectedTermId}
              onChange={(e) => {
                setSelectedTermId(
                  e.target.value
                );
                setSelectedClassId("all");
              }}
              className="term-select-input"
            >
              {terms.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                >
                  {t.name}{" "}
                  {t.is_active
                    ? "(ترم فعال جاری)"
                    : "(به پایان رسیده)"}
                </option>
              ))}

              <option value="all">
                همه ترم‌ها (مشاهده کامل)
              </option>
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
        <div className="secretary-tuition-stats-grid">
          <StatCard
            title="کل شهریه مصوب ترم"
            value={`${toPersianDigits(
              stats.totalExpected.toLocaleString(
                "fa-IR"
              )
            )} تومان`}
            hint={`${toPersianDigits(
              stats.totalCount
            )} ثبت‌نام کلاسی`}
            icon={<CreditCard />}
            color="blue"
          />

          <StatCard
            title="شهریه وصول‌شده"
            value={`${toPersianDigits(
              stats.totalCollected.toLocaleString(
                "fa-IR"
              )
            )} تومان`}
            hint={`${toPersianDigits(
              stats.paidCount
            )} نفر تسویه کامل`}
            icon={<CheckCircle2 />}
            color="green"
          />

          <StatCard
            title="مانده در انتظار وصول"
            value={`${toPersianDigits(
              stats.totalPending.toLocaleString(
                "fa-IR"
              )
            )} تومان`}
            hint={`${toPersianDigits(
              stats.pendingCount
            )} نفر بدهکار`}
            icon={<Clock3 />}
            color={
              stats.totalPending === 0
                ? "green"
                : "red"
            }
          />

          <StatCard
            title="نسبت وصولی"
            value={`${toPersianDigits(
              stats.totalCount > 0
                ? Math.round(
                    (stats.paidCount /
                      stats.totalCount) *
                      100
                  )
                : 100
            )}٪`}
            hint="درصد تسویه حساب‌ها"
            icon={<Users />}
            color="light-blue"
          />
        </div>
        <section className="tuitions-main-section">

          <div className="tuitions-section-header">
            <div className="tuitions-heading-info">
              <h3 className="tuitions-section-title">
                لیست ثبت‌نام‌ها و وضعیت شهریه
              </h3>

              <p className="tuitions-section-desc">
                مبالغ شهریه مصوب به تفکیک کلاس و وضعیت پرداخت
              </p>
            </div>

            <span className="tuitions-count-badge">
              {toPersianDigits(
                filteredItems.length
              )}{" "}
              مورد ثبت‌نام
            </span>
          </div>
          <div className="tuitions-filters-row">

            <div className="tuitions-search-wrapper">
              <Search
                size={18}
                className="tuitions-search-icon"
              />

              <input
                type="text"
                placeholder="جستجوی نام، نام کاربری یا شماره تماس..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                className="tuitions-search-input"
              />
            </div>

            <div className="tuitions-select-wrapper">
              <BookOpen
                size={16}
                className="tuitions-filter-icon"
              />

              <select
                value={selectedClassId}
                onChange={(e) =>
                  setSelectedClassId(
                    e.target.value
                  )
                }
                className="tuitions-select"
              >
                <option value="all">
                  همه کلاس‌های این ترم
                </option>

                {termClassrooms.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name} -{" "}
                    {toPersianDigits(
                      (
                        c.tuition_fee ||
                        2500000
                      ).toLocaleString(
                        "fa-IR"
                      )
                    )}{" "}
                    تومان
                  </option>
                ))}
              </select>
            </div>

            <div className="tuitions-select-wrapper">
              <Filter
                size={16}
                className="tuitions-filter-icon"
              />

              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(
                    e.target.value
                  )
                }
                className="tuitions-select"
              >
                <option value="all">
                  همه وضعیت‌های پرداخت
                </option>

                <option value="paid">
                  پرداخت شده (تسویه)
                </option>

                <option value="pending">
                  در انتظار پرداخت
                </option>
              </select>
            </div>

            <AnimatedButton
              variant="primary"
              icon={<Plus size={18} />}
              onClick={() =>
                setShowNewEnrollModal(true)
              }
            >
              تعیین کلاس برای دانش‌آموز
            </AnimatedButton>
          </div>
          {!loading &&
            filteredItems.length > 0 && (
              <div className="tuitions-results-toolbar">
                <div className="tuitions-results-info">
                  نمایش{" "}
                  <strong>
                    {toPersianDigits(
                      paginationStart
                    )}
                  </strong>{" "}
                  تا{" "}
                  <strong>
                    {toPersianDigits(
                      paginationEnd
                    )}
                  </strong>{" "}
                  از{" "}
                  <strong>
                    {toPersianDigits(
                      filteredItems.length
                    )}
                  </strong>{" "}
                  مورد
                </div>

                <div className="tuitions-page-size">
                  <span>
                    تعداد در صفحه
                  </span>

                  <select
                    value={itemsPerPage}
                    onChange={(e) =>
                      setItemsPerPage(
                        Number(
                          e.target.value
                        )
                      )
                    }
                  >
                    <option value={10}>
                      ۱۰
                    </option>

                    <option value={20}>
                      ۲۰
                    </option>

                    <option value={50}>
                      ۵۰
                    </option>
                  </select>
                </div>
              </div>
            )}
          {loading ? (
            <div className="tuition-loading-state">
              <div className="tuition-loading-spinner" />

              <span>
                در حال بارگذاری اطلاعات شهریه‌ها...
              </span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="tuition-empty-state">
              <CreditCard size={44} />

              <h4>
                هیچ ثبت‌نامی یافت نشد
              </h4>

              <p>
                موردی مطابق با فیلترهای انتخابی شما وجود ندارد.
              </p>
            </div>
          ) : (
            <>
              <div className="tuitions-table-wrapper">
                <table className="tuitions-table">
                  <thead>
                    <tr>
                      <th>دانش‌آموز</th>
                      <th>کلاس و ترم</th>
                      <th>مدرس دوره</th>
                      <th>شهریه مصوب</th>
                      <th>وضعیت پرداخت</th>
                      <th>تاریخ پرداخت</th>
                      <th>رسید / توضیحات</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedItems.map(
                      (item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="student-profile-cell">
                              <div className="student-avatar-circle">
                                {item.studentName.charAt(
                                  0
                                )}
                              </div>

                              <div>
                                <strong>
                                  {
                                    item.studentName
                                  }
                                </strong>

                                <small>
                                  {item.phone}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="class-badge-cell">
                              <span className="class-name-text">
                                {
                                  item.className
                                }
                              </span>

                              <small>
                                {
                                  item.termName
                                }
                              </small>
                            </div>
                          </td>

                          <td>
                            <span className="teacher-text">
                              {
                                item.teacherName
                              }
                            </span>
                          </td>

                          <td>
                            <strong className="tuition-amount-text">
                              {toPersianDigits(
                                item.tuitionFee.toLocaleString(
                                  "fa-IR"
                                )
                              )}
                              تومان
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`payment-pill ${
                                item.isPaid
                                  ? "paid"
                                  : "pending"
                              }`}
                            >
                              {item.isPaid
                                ? "پرداخت شده"
                                : "در انتظار پرداخت"}
                            </span>
                          </td>

                          <td>
                            <span className="date-sub-text">
                              {item.paidAt
                                ? toJalaliDateString(
                                    item.paidAt
                                  )
                                : "-"}
                            </span>
                          </td>

                          <td>
                            <span className="notes-text">
                              {item.paymentNotes ||
                                "-"}
                            </span>
                          </td>

                          <td>
                            <TuitionActions
                              item={item}
                              basePath={basePath}
                              onPayment={() => {
                                setPaymentModalData(
                                  item
                                );
                                setPaymentNotes(
                                  item.paymentNotes ||
                                    ""
                                );
                              }}
                              onRevert={() =>
                                handleTogglePayment(
                                  item.id,
                                  false,
                                  ""
                                )
                              }
                              onChangeClass={() => {
                                setChangeClassModalData(
                                  item
                                );
                                setNewClassIdTarget(
                                  String(
                                    item.classId
                                  )
                                );
                              }}
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
              <div className="tuitions-mobile-list">
                {paginatedItems.map(
                  (item) => (
                    <div
                      className="tuition-mobile-card"
                      key={item.id}
                    >
                      <div className="mobile-card-top">
                        <div className="student-profile-cell">
                          <div className="student-avatar-circle">
                            {item.studentName.charAt(
                              0
                            )}
                          </div>

                          <div>
                            <strong>
                              {
                                item.studentName
                              }
                            </strong>

                            <small>
                              {item.phone}
                            </small>
                          </div>
                        </div>

                        <span
                          className={`payment-pill ${
                            item.isPaid
                              ? "paid"
                              : "pending"
                          }`}
                        >
                          {item.isPaid
                            ? "تسویه"
                            : "بدهکار"}
                        </span>
                      </div>

                      <div className="mobile-card-divider" />

                      <div className="mobile-card-grid">
                        <div>
                          <span>
                            کلاس
                          </span>

                          <strong>
                            {
                              item.className
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            ترم
                          </span>

                          <strong>
                            {
                              item.termName
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            مدرس
                          </span>

                          <strong>
                            {
                              item.teacherName
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            شهریه
                          </span>

                          <strong className="mobile-price">
                            {toPersianDigits(
                              item.tuitionFee.toLocaleString(
                                "fa-IR"
                              )
                            )}{" "}
                            تومان
                          </strong>
                        </div>

                        <div>
                          <span>
                            تاریخ پرداخت
                          </span>

                          <strong>
                            {item.paidAt
                              ? toJalaliDateString(
                                  item.paidAt
                                )
                              : "-"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            رسید / توضیحات
                          </span>

                          <strong className="mobile-note">
                            {item.paymentNotes ||
                              "-"}
                          </strong>
                        </div>
                      </div>

                      <div className="mobile-card-actions">
                        <TuitionActions
                          item={item}
                          basePath={basePath}
                          onPayment={() => {
                            setPaymentModalData(
                              item
                            );
                            setPaymentNotes(
                              item.paymentNotes ||
                                ""
                            );
                          }}
                          onRevert={() =>
                            handleTogglePayment(
                              item.id,
                              false,
                              ""
                            )
                          }
                          onChangeClass={() => {
                            setChangeClassModalData(
                              item
                            );
                            setNewClassIdTarget(
                              String(
                                item.classId
                              )
                            );
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
              {totalPages > 1 && (
                <div className="tuitions-pagination">

                  <button
                    type="button"
                    className="pagination-nav-btn"
                    disabled={
                      safeCurrentPage === 1
                    }
                    onClick={() =>
                      setCurrentPage(1)
                    }
                    title="صفحه اول"
                  >
                    <ChevronsRight size={17} />
                  </button>

                  <button
                    type="button"
                    className="pagination-nav-btn"
                    disabled={
                      safeCurrentPage === 1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (prev) =>
                          Math.max(
                            1,
                            prev - 1
                          )
                      )
                    }
                    title="صفحه قبل"
                  >
                    <ChevronRight size={17} />
                  </button>

                  <div className="pagination-pages">
                    {getPaginationPages().map(
                      (page) => (
                        <button
                          type="button"
                          key={page}
                          className={`pagination-page-btn ${
                            page ===
                            safeCurrentPage
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setCurrentPage(
                              page
                            )
                          }
                        >
                          {toPersianDigits(
                            page
                          )}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    className="pagination-nav-btn"
                    disabled={
                      safeCurrentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (prev) =>
                          Math.min(
                            totalPages,
                            prev + 1
                          )
                      )
                    }
                    title="صفحه بعد"
                  >
                    <ChevronLeft size={17} />
                  </button>

                  <button
                    type="button"
                    className="pagination-nav-btn"
                    disabled={
                      safeCurrentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        totalPages
                      )
                    }
                    title="آخرین صفحه"
                  >
                    <ChevronsLeft size={17} />
                  </button>

                  <span className="pagination-current-info">
                    صفحه{" "}
                    <strong>
                      {toPersianDigits(
                        safeCurrentPage
                      )}
                    </strong>{" "}
                    از{" "}
                    <strong>
                      {toPersianDigits(
                        totalPages
                      )}
                    </strong>
                  </span>
                </div>
              )}
            </>
          )}
        </section>

        {/* =====================================================
            Payment Modal
            ===================================================== */}

        {paymentModalData && (
          <div
            className="tuition-modal-backdrop"
            onClick={() =>
              setPaymentModalData(null)
            }
          >
            <div
              className="tuition-modal-container"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="tuition-modal-header">
                <div className="modal-header-info">
                  <div className="exam-icon-circle payment">
                    <CheckCircle2 size={20} />
                  </div>

                  <div>
                    <h4>
                      ثبت دریافت شهریه
                    </h4>

                    <p>
                      {
                        paymentModalData.studentName
                      }{" "}
                      -{" "}
                      {
                        paymentModalData.className
                      }
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() =>
                    setPaymentModalData(null)
                  }
                >
                  <X size={20} />
                </button>
              </div>

              <div className="tuition-modal-body">
                <div className="payment-summary-box">
                  <div>
                    <span>
                      دانش‌آموز
                    </span>

                    <strong>
                      {
                        paymentModalData.studentName
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      کلاس
                    </span>

                    <strong>
                      {
                        paymentModalData.className
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      مبلغ شهریه
                    </span>

                    <strong className="modal-price">
                      {toPersianDigits(
                        paymentModalData.tuitionFee.toLocaleString(
                          "fa-IR"
                        )
                      )}{" "}
                      تومان
                    </strong>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>
                    شماره پیگیری / رسید / یادداشت
                    <span>
                      اختیاری
                    </span>
                  </label>

                  <input
                    type="text"
                    placeholder="مثال: پرداخت نقدی / کارتخوان دفتر - پیگیری ۱۲۳۴۵"
                    value={paymentNotes}
                    onChange={(e) =>
                      setPaymentNotes(
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="tuition-modal-footer">
                <AnimatedButton
                  variant="secondary"
                  type="button"
                  onClick={() =>
                    setPaymentModalData(null)
                  }
                >
                  انصراف
                </AnimatedButton>

                <AnimatedButton
                  variant="primary"
                  type="button"
                  disabled={savingPayment}
                  onClick={() =>
                    handleTogglePayment(
                      paymentModalData.id,
                      true,
                      paymentNotes
                    )
                  }
                >
                  {savingPayment
                    ? "در حال ثبت..."
                    : "تایید و ثبت تسویه"}
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            Change Class Modal
            ===================================================== */}

        {changeClassModalData && (
          <div
            className="tuition-modal-backdrop"
            onClick={() =>
              setChangeClassModalData(null)
            }
          >
            <div
              className="tuition-modal-container"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="tuition-modal-header">
                <div className="modal-header-info">
                  <div className="exam-icon-circle">
                    <ArrowRightLeft size={20} />
                  </div>

                  <div>
                    <h4>
                      تغییر کلاس دانش‌آموز
                    </h4>

                    <p>
                      {
                        changeClassModalData.studentName
                      }
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() =>
                    setChangeClassModalData(
                      null
                    )
                  }
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={
                  handleChangeClass
                }
              >
                <div className="tuition-modal-body">
                  <div className="current-class-box">
                    <span>
                      کلاس فعلی
                    </span>

                    <strong>
                      {
                        changeClassModalData.className
                      }
                    </strong>
                  </div>

                  <div className="modal-form-group">
                    <label>
                      کلاس جدید
                    </label>

                    <select
                      value={
                        newClassIdTarget
                      }
                      onChange={(e) =>
                        setNewClassIdTarget(
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        انتخاب کلاس جدید...
                      </option>

                      {termClassrooms.map(
                        (c) => (
                          <option
                            key={c.id}
                            value={c.id}
                          >
                            {c.name} -{" "}
                            {toPersianDigits(
                              (
                                c.tuition_fee ||
                                2500000
                              ).toLocaleString(
                                "fa-IR"
                              )
                            )}{" "}
                            تومان
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div className="tuition-modal-footer">
                  <AnimatedButton
                    variant="secondary"
                    type="button"
                    onClick={() =>
                      setChangeClassModalData(
                        null
                      )
                    }
                  >
                    انصراف
                  </AnimatedButton>

                  <AnimatedButton
                    variant="primary"
                    type="submit"
                    disabled={
                      savingClassChange ||
                      !newClassIdTarget
                    }
                  >
                    {savingClassChange
                      ? "در حال تغییر..."
                      : "ثبت تغییر کلاس"}
                  </AnimatedButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================
            New Enrollment Modal
            ===================================================== */}

        {showNewEnrollModal && (
          <div
            className="tuition-modal-backdrop"
            onClick={() =>
              setShowNewEnrollModal(false)
            }
          >
            <div
              className="tuition-modal-container"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="tuition-modal-header">
                <div className="modal-header-info">
                  <div className="exam-icon-circle">
                    <Plus size={20} />
                  </div>

                  <div>
                    <h4>
                      تعیین کلاس برای دانش‌آموز
                    </h4>

                    <p>
                      ثبت‌نام در کلاس و تنظیم وضعیت اولیه شهریه
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() =>
                    setShowNewEnrollModal(
                      false
                    )
                  }
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={
                  handleCreateEnrollment
                }
              >
                <div className="tuition-modal-body">

                  <div className="modal-form-group">
                    <label>
                      انتخاب دانش‌آموز
                      <span className="required">
                        *
                      </span>
                    </label>

                    <select
                      value={
                        newEnrollStudentId
                      }
                      onChange={(e) =>
                        setNewEnrollStudentId(
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        انتخاب دانش‌آموز...
                      </option>

                      {studentUsersList.map(
                        (st) => (
                          <option
                            key={st.id}
                            value={st.id}
                          >
                            {getFullName(
                              st
                            )}{" "}
                            ({st.username}) -{" "}
                            {st.phone_number ||
                              "بدون شماره"}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="modal-form-group">
                    <label>
                      انتخاب کلاس در این ترم
                      <span className="required">
                        *
                      </span>
                    </label>

                    <select
                      value={
                        newEnrollClassId
                      }
                      onChange={(e) =>
                        setNewEnrollClassId(
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        انتخاب کلاس...
                      </option>

                      {termClassrooms.map(
                        (c) => (
                          <option
                            key={c.id}
                            value={c.id}
                          >
                            {c.name} -{" "}
                            {toPersianDigits(
                              (
                                c.tuition_fee ||
                                2500000
                              ).toLocaleString(
                                "fa-IR"
                              )
                            )}{" "}
                            تومان
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <label className="payment-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        newEnrollPaid
                      }
                      onChange={(e) =>
                        setNewEnrollPaid(
                          e.target.checked
                        )
                      }
                    />

                    <span>
                      شهریه این کلاس هم‌اکنون به صورت نقدی/کارتخوان تسویه شد.
                    </span>
                  </label>
                </div>

                <div className="tuition-modal-footer">
                  <AnimatedButton
                    variant="secondary"
                    type="button"
                    onClick={() =>
                      setShowNewEnrollModal(
                        false
                      )
                    }
                  >
                    انصراف
                  </AnimatedButton>

                  <AnimatedButton
                    variant="primary"
                    type="submit"
                    disabled={
                      savingNewEnroll ||
                      !newEnrollStudentId ||
                      !newEnrollClassId
                    }
                  >
                    {savingNewEnroll
                      ? "در حال ثبت..."
                      : "ثبت‌نام در کلاس"}
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

/* =========================================================
   Tuition Actions
   ========================================================= */

function TuitionActions({
  item,
  basePath,
  onPayment,
  onRevert,
  onChangeClass,
}) {
  return (
    <div className="tuition-row-actions">
      {item.isPaid ? (
        <button
          type="button"
          className="tuition-action-btn revert"
          onClick={onRevert}
          title="لغو وضعیت تسویه"
        >
          <X size={14} />
          لغو تسویه
        </button>
      ) : (
        <button
          type="button"
          className="tuition-action-btn pay"
          onClick={onPayment}
          title="ثبت دریافت وجه"
        >
          <Check size={14} />
          ثبت دریافت وجه
        </button>
      )}

      <button
        type="button"
        className="tuition-action-btn change-class"
        onClick={onChangeClass}
        title="تغییر کلاس دانش‌آموز"
      >
        <ArrowRightLeft size={14} />
        تغییر کلاس
      </button>

      <Link
        to={`${basePath}/students/${item.studentId}`}
        className="tuition-view-link"
      >
        <span className="tuition-action-btn view">
          <Eye size={14} />
          پرونده
        </span>
      </Link>
    </div>
  );
}

export default SecretaryTuitions;