import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  BookOpen,
  Info,
  Clock3,
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

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        const [classroomsData, termsData, enrollmentsData] = await Promise.all([
          api.classrooms.list(),
          api.terms.list(),
          api.enrollments.list(),
        ]);

        if (!alive) return;
        setClassrooms(classroomsData || []);
        setTerms(termsData || []);
        setEnrollments(enrollmentsData || []);
      } catch (err) {
        console.error(err);
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
    () => (terms || []).filter((t) => t.is_active).map((t) => t.id),
    [terms],
  );

  // My enrollments in active term classes
  const myEnrichedEnrollments = useMemo(() => {
    if (!currentUser) return [];

    const myEnrs = enrollments.filter(
      (e) => e.student === currentUser.id || e.student?.id === currentUser.id,
    );

    return myEnrs
      .map((enr) => {
        const clsId = enr.classroom || enr.classroom?.id;
        const cls = classrooms.find((c) => c.id === clsId);
        const term = terms.find((t) => t.id === (cls?.term || cls?.term?.id));

        // Filter to active term if terms exist
        const isTermActive = term ? term.is_active : enr.is_term_active;
        if (activeTermIds.length > 0 && !isTermActive) {
          return null;
        }

        const tuitionFee = cls?.tuition_fee !== undefined ? cls.tuition_fee : 2500000;

        return {
          id: enr.id,
          classId: clsId,
          className: cls?.name || enr.classroom_name || `کلاس کد ${clsId}`,
          teacherName: getFullName(cls?.teacher_detail) || "استاد نامشخص",
          termName: term?.name || enr.term_name || "ترم جاری",
          tuitionFee,
          isPaid: Boolean(enr.is_paid),
          paidAt: enr.paid_at,
          paymentNotes: enr.payment_notes || "",
        };
      })
      .filter(Boolean);
  }, [currentUser, enrollments, classrooms, terms, activeTermIds]);

  const totalTuition = useMemo(
    () => myEnrichedEnrollments.reduce((sum, e) => sum + e.tuitionFee, 0),
    [myEnrichedEnrollments],
  );

  const totalPaid = useMemo(
    () =>
      myEnrichedEnrollments
        .filter((e) => e.isPaid)
        .reduce((sum, e) => sum + e.tuitionFee, 0),
    [myEnrichedEnrollments],
  );

  const remainingDebt = totalTuition - totalPaid;

  const isAllPaid = myEnrichedEnrollments.length > 0 && remainingDebt === 0;

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title="وضعیت شهریه و سوابق پرداخت"
      menuType="student"
    >
      <div className="student-tuition-page">
        {/* Notice for Offline Payment */}
        <div className="student-tuition-notice-banner">
          <div className="notice-banner-icon">
            <Info size={22} />
          </div>
          <div>
            <h4>راهنمای پرداخت شهریه آموزشگاه</h4>
            <p>
              شهریه هر کلاس آموزشی به صورت یکجا و حضوری/کارتخوان در محل آموزشگاه دریافت و توسط
              مسئول پذیرش (منشی یا مدیریت) در سیستم ثبت و تسویه می‌گردد. در صورت هرگونه سوال با
              دفتر آموزشگاه تماس حاصل فرمایید.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="student-tuition-stats-grid">
          <StatCard
            title="کل شهریه مصوب"
            value={`${toPersianDigits(totalTuition.toLocaleString("fa-IR"))} تومان`}
            hint={`${toPersianDigits(myEnrichedEnrollments.length)} کلاس فعال`}
            icon={<CreditCard />}
            color="blue"
          />

          <StatCard
            title="مبلغ تسویه‌شده"
            value={`${toPersianDigits(totalPaid.toLocaleString("fa-IR"))} تومان`}
            hint="پرداخت شده به آموزشگاه"
            icon={<CheckCircle2 />}
            color="green"
          />

          <StatCard
            title="مانده در انتظار پرداخت"
            value={`${toPersianDigits(remainingDebt.toLocaleString("fa-IR"))} تومان`}
            hint={isAllPaid ? "تسویه کامل" : "در انتظار پرداخت"}
            icon={isAllPaid ? <CheckCircle2 /> : <Clock3 />}
            color={isAllPaid ? "green" : "red"}
          />
        </div>

        {/* Tuition Details by Class */}
        <section className="student-tuition-classes-section">
          <div className="tuition-section-header">
            <div>
              <h3>شهریه کلاس‌های ثبت‌نامی شما</h3>
              <p>مشاهده مبلغ مصوب شهریه و وضعیت تسویه هر کلاس</p>
            </div>
            <span className="count-badge">
              {toPersianDigits(myEnrichedEnrollments.length)} کلاس
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              در حال بارگذاری اطلاعات شهریه...
            </div>
          ) : myEnrichedEnrollments.length === 0 ? (
            <div className="student-tuition-empty">
              <BookOpen size={42} />
              <h4>در حال حاضر در کلاسی ثبت‌نام نیستید</h4>
              <p>برای ثبت‌نام در کلاس‌های ترم جدید به مسئول پذیرش آموزشگاه مراجعه فرمایید.</p>
            </div>
          ) : (
            <div className="student-tuition-cards-grid">
              {myEnrichedEnrollments.map((item) => (
                <div key={item.id} className="student-tuition-item-card">
                  <div className="tuition-card-top">
                    <div className="class-title-group">
                      <div className="class-icon-circle">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h4>{item.className}</h4>
                        <span className="term-subtext">{item.termName}</span>
                      </div>
                    </div>

                    <span
                      className={`tuition-status-badge ${item.isPaid ? "paid" : "pending"}`}
                    >
                      {item.isPaid ? (
                        <>
                          <CheckCircle2 size={15} />
                          تسویه شده
                        </>
                      ) : (
                        <>
                          <Clock3 size={15} />
                          در انتظار پرداخت
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
                        {toPersianDigits(item.tuitionFee.toLocaleString("fa-IR"))} تومان
                      </strong>
                    </div>

                    {item.isPaid && item.paidAt && (
                      <div className="tuition-info-row">
                        <span className="label">تاریخ ثبت تسویه:</span>
                        <span className="val">{toJalaliDateString(item.paidAt)}</span>
                      </div>
                    )}

                    {item.paymentNotes && (
                      <div className="tuition-info-row">
                        <span className="label">توضیحات رسید:</span>
                        <span className="val notes">{item.paymentNotes}</span>
                      </div>
                    )}
                  </div>

                  <div className="tuition-card-footer">
                    {item.isPaid ? (
                      <span className="paid-confirmation-text">
                        ✓ شهریه این کلاس پرداخت و توسط مسئول آموزشگاه تایید شده است.
                      </span>
                    ) : (
                      <span className="pending-warning-text">
                        ⚠ لطفاً جهت تسویه شهریه به منشی یا دفتر آموزشگاه مراجعه فرمایید.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default StudentTuition;
