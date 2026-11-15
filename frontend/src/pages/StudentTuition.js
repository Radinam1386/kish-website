
import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  BookOpen,
  Info,
  Clock3,
  ShieldCheck,
  ReceiptText,
  X,
  ArrowLeft,
  Wallet,
  AlertCircle,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { api, getFullName, storage } from "../services/api";
import { toJalaliDateString, toPersianDigits } from "../utils/dateUtils";

import "./StudentTuition.css";

function StudentTuition() {
  const currentUser = storage.getUser();

  const [classrooms, setClassrooms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [classroomsData, termsData, enrollmentsData] =
          await Promise.all([
            api.classrooms.list(),
            api.terms.list(),
            api.enrollments.list(),
          ]);

        if (!alive) return;

        setClassrooms(classroomsData || []);
        setTerms(termsData || []);
        setEnrollments(enrollmentsData || []);
      } catch (err) {
        if (alive) {
          setError(
            err.message || "دریافت اطلاعات شهریه با خطا مواجه شد.",
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, []);

  const activeTermIds = useMemo(
    () => terms.filter((term) => term.is_active).map((term) => String(term.id)),
    [terms],
  );

  const myEnrichedEnrollments = useMemo(() => {
    if (!currentUser) return [];

    const myEnrollments = enrollments.filter(
      (enrollment) =>
        String(
          typeof enrollment.student === "object"
            ? enrollment.student?.id
            : enrollment.student,
        ) === String(currentUser.id),
    );

    return myEnrollments
      .map((enrollment) => {
        const classId =
          typeof enrollment.classroom === "object"
            ? enrollment.classroom?.id
            : enrollment.classroom;

        const classroom = classrooms.find(
          (item) => String(item.id) === String(classId),
        );

        const termId =
          typeof classroom?.term === "object"
            ? classroom.term?.id
            : classroom?.term;

        const term = terms.find(
          (item) => String(item.id) === String(termId),
        );

        const isTermActive = term
          ? term.is_active
          : enrollment.is_term_active;

        if (activeTermIds.length > 0 && !isTermActive) {
          return null;
        }

        const tuitionFee = Number(
          classroom?.tuition_fee ??
            enrollment.tuition_fee ??
            2500000,
        );

        return {
          id: enrollment.id,
          classId,
          className:
            classroom?.name ||
            enrollment.classroom_name ||
            `کلاس کد ${classId}`,
          teacherName:
            getFullName(classroom?.teacher_detail) || "استاد نامشخص",
          termName: term?.name || enrollment.term_name || "ترم جاری",
          tuitionFee,
          isPaid: Boolean(enrollment.is_paid),
          paidAt: enrollment.paid_at,
          paymentNotes: enrollment.payment_notes || "",
        };
      })
      .filter(Boolean);
  }, [currentUser, enrollments, classrooms, terms, activeTermIds]);

  const totalTuition = useMemo(
    () =>
      myEnrichedEnrollments.reduce(
        (sum, item) => sum + item.tuitionFee,
        0,
      ),
    [myEnrichedEnrollments],
  );

  const totalPaid = useMemo(
    () =>
      myEnrichedEnrollments
        .filter((item) => item.isPaid)
        .reduce((sum, item) => sum + item.tuitionFee, 0),
    [myEnrichedEnrollments],
  );

  const remainingDebt = Math.max(0, totalTuition - totalPaid);

  const unpaidEnrollments = useMemo(
    () => myEnrichedEnrollments.filter((item) => !item.isPaid),
    [myEnrichedEnrollments],
  );

  const isAllPaid =
    myEnrichedEnrollments.length > 0 && unpaidEnrollments.length === 0;

  const formatMoney = (amount) =>
    `${toPersianDigits(Number(amount || 0).toLocaleString("en-US"))} تومان`;

  const handleOpenInvoice = (item) => {
    setSelectedInvoice(item);
  };

  const handleCloseInvoice = () => {
    setSelectedInvoice(null);
  };

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title="وضعیت شهریه"
      menuType="student"
    >
      <div className="student-tuition-page">
        {error && (
          <div className="student-tuition-error">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {/* Online Payment Notice */}
        <div className="student-tuition-notice-banner">
          <div className="notice-banner-icon">
            <ShieldCheck size={23} />
          </div>

          <div className="notice-banner-content">
            <h4>پرداخت آنلاین شهریه</h4>
            <p>
              امکان مشاهده وضعیت شهریه و پرداخت آنلاین از طریق درگاه امن
              پرداخت زرین‌پال برای شما در نظر گرفته شده است. جزئیات هر
              کلاس و مبلغ قابل پرداخت را در بخش زیر مشاهده کنید.
            </p>
          </div>

          <div className="notice-payment-brand">
            <span className="notice-payment-dot" />
            <span>درگاه زرین‌پال</span>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="student-tuition-stats-grid">
          <StatCard
            title="کل شهریه مصوب"
            value={formatMoney(totalTuition)}
            hint={`${toPersianDigits(myEnrichedEnrollments.length)} کلاس ثبت‌نامی`}
            icon={<ReceiptText size={22} />}
            color="blue"
          />

          <StatCard
            title="مبلغ تسویه‌شده"
            value={formatMoney(totalPaid)}
            hint="شهریه‌های تأییدشده"
            icon={<CheckCircle2 size={22} />}
            color="green"
          />

          <StatCard
            title="مانده قابل پرداخت"
            value={formatMoney(remainingDebt)}
            hint={
              isAllPaid
                ? "تمام شهریه‌ها تسویه شده‌اند"
                : `${toPersianDigits(unpaidEnrollments.length)} کلاس در انتظار پرداخت`
            }
            icon={<Wallet size={22} />}
            color={isAllPaid ? "green" : "red"}
          />
        </div>

        {/* Payment Progress */}
        {!loading && myEnrichedEnrollments.length > 0 && (
          <section className="tuition-payment-overview">
            <div className="tuition-overview-top">
              <div>
                <h3>خلاصه وضعیت مالی شما</h3>
                <p>نمای کلی شهریه‌های ثبت‌شده در ترم فعال</p>
              </div>

              <span
                className={`tuition-overview-status ${
                  isAllPaid ? "complete" : "incomplete"
                }`}
              >
                {isAllPaid ? (
                  <>
                    <CheckCircle2 size={15} />
                    تسویه کامل
                  </>
                ) : (
                  <>
                    <Clock3 size={15} />
                    دارای بدهی
                  </>
                )}
              </span>
            </div>

            <div className="tuition-progress-track">
              <div
                className="tuition-progress-fill"
                style={{
                  width: `${
                    totalTuition > 0
                      ? Math.min(100, (totalPaid / totalTuition) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="tuition-progress-labels">
              <span>پرداخت‌شده: {formatMoney(totalPaid)}</span>
              <span>کل شهریه: {formatMoney(totalTuition)}</span>
            </div>
          </section>
        )}

        {/* Tuition Details */}
        <section className="student-tuition-classes-section">
          <div className="tuition-section-header">
            <div>
              <h3>شهریه کلاس‌های ثبت‌نامی شما</h3>
              <p>
                مشاهده جزئیات شهریه، وضعیت پرداخت و پرداخت آنلاین هر کلاس
              </p>
            </div>

            <span className="count-badge">
              {toPersianDigits(myEnrichedEnrollments.length)} کلاس
            </span>
          </div>

          {loading ? (
            <div className="student-tuition-loading">
              <span className="tuition-loading-spinner" />
              در حال دریافت اطلاعات شهریه...
            </div>
          ) : myEnrichedEnrollments.length === 0 ? (
            <div className="student-tuition-empty">
              <BookOpen size={42} />
              <h4>در حال حاضر در کلاسی ثبت‌نام نیستید</h4>
              <p>
                برای ثبت‌نام در کلاس‌های ترم جدید به مسئول پذیرش آموزشگاه
                مراجعه فرمایید.
              </p>
            </div>
          ) : (
            <div className="student-tuition-cards-grid">
              {myEnrichedEnrollments.map((item) => (
                <div
                  key={item.id}
                  className={`student-tuition-item-card ${
                    item.isPaid ? "is-paid" : "is-unpaid"
                  }`}
                >
                  <div className="tuition-card-top">
                    <div className="class-title-group">
                      <div className="class-icon-circle">
                        <BookOpen size={20} />
                      </div>

                      <div>
                        <h4>{item.className}</h4>
                        <span className="term-subtext">
                          {item.termName}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`tuition-status-badge ${
                        item.isPaid ? "paid" : "pending"
                      }`}
                    >
                      {item.isPaid ? (
                        <>
                          <CheckCircle2 size={15} />
                          تسویه شده
                        </>
                      ) : (
                        <>
                          <Clock3 size={15} />
                          پرداخت‌نشده
                        </>
                      )}
                    </span>
                  </div>

                  <div className="tuition-card-body">
                    <div className="tuition-info-row">
                      <span className="label">مدرس دوره:</span>
                      <span className="val">{item.teacherName}</span>
                    </div>

                    <div className="tuition-info-row">
                      <span className="label">شهریه مصوب کلاس:</span>
                      <strong className="val amount">
                        {formatMoney(item.tuitionFee)}
                      </strong>
                    </div>

                    {item.isPaid && item.paidAt && (
                      <div className="tuition-info-row">
                        <span className="label">تاریخ ثبت تسویه:</span>
                        <span className="val">
                          {toJalaliDateString(item.paidAt)}
                        </span>
                      </div>
                    )}

                    {item.paymentNotes && (
                      <div className="tuition-info-row">
                        <span className="label">توضیحات رسید:</span>
                        <span className="val notes">
                          {item.paymentNotes}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="tuition-card-footer">
                    {item.isPaid ? (
                      <div className="tuition-paid-footer">
                        <CheckCircle2 size={17} />
                        <span>
                          شهریه این کلاس پرداخت و توسط آموزشگاه تأیید شده
                          است.
                        </span>
                      </div>
                    ) : (
                      <div className="tuition-unpaid-footer">
                        <div className="tuition-unpaid-message">
                          <Info size={16} />
                          <span>این کلاس دارای بدهی پرداخت‌نشده است.</span>
                        </div>

                        <button
                          type="button"
                          className="tuition-online-pay-button"
                          onClick={() => handleOpenInvoice(item)}
                        >
                          <CreditCard size={18} />
                          <span>پرداخت آنلاین</span>
                          <ArrowLeft size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Payment Invoice Modal */}
        {selectedInvoice && (
          <div
            className="tuition-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                handleCloseInvoice();
              }
            }}
          >
            <div
              className="tuition-payment-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tuition-modal-title"
            >
              <div className="tuition-modal-header">
                <div className="tuition-modal-heading-icon">
                  <CreditCard size={23} />
                </div>

                <button
                  type="button"
                  className="tuition-modal-close"
                  onClick={handleCloseInvoice}
                  aria-label="بستن"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="tuition-modal-title">
                <h3 id="tuition-modal-title">پیش‌فاکتور پرداخت شهریه</h3>
                <p>لطفاً اطلاعات پرداخت را بررسی کنید.</p>
              </div>

              <div className="tuition-invoice-details">
                <div className="tuition-invoice-row">
                  <span>نام دانش‌آموز</span>
                  <strong>{getFullName(currentUser) || "دانش‌آموز"}</strong>
                </div>

                <div className="tuition-invoice-row">
                  <span>کلاس آموزشی</span>
                  <strong>{selectedInvoice.className}</strong>
                </div>

                <div className="tuition-invoice-row">
                  <span>ترم آموزشی</span>
                  <strong>{selectedInvoice.termName}</strong>
                </div>

                <div className="tuition-invoice-row">
                  <span>وضعیت پرداخت</span>
                  <span className="tuition-invoice-unpaid">
                    <Clock3 size={14} />
                    پرداخت‌نشده
                  </span>
                </div>

                <div className="tuition-invoice-total">
                  <span>مبلغ قابل پرداخت</span>
                  <strong>{formatMoney(selectedInvoice.tuitionFee)}</strong>
                </div>
              </div>

              <div className="tuition-gateway-info">
                <div className="gateway-info-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <strong>پرداخت امن از طریق زرین‌پال</strong>
                  <p>
                    پس از فعال‌سازی درگاه، به صفحه پرداخت امن منتقل خواهید
                    شد.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="tuition-modal-pay-button"
                disabled
                title="اتصال بک‌اند درگاه پرداخت هنوز انجام نشده است"
              >
                <CreditCard size={19} />
                درگاه پرداخت هنوز متصل نشده است
              </button>

              <button
                type="button"
                className="tuition-modal-cancel-button"
                onClick={handleCloseInvoice}
              >
                بازگشت
              </button>

              <p className="tuition-modal-security-note">
                <ShieldCheck size={14} />
                اطلاعات پرداخت پس از اتصال درگاه به‌صورت امن پردازش خواهد شد.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StudentTuition;
