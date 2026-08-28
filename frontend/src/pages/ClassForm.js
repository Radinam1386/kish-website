import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Users,
  Save,
  ArrowRight,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Sparkles,
  CreditCard,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName, storage } from "../services/api";
import { toPersianDigits } from "../utils/dateUtils";

import "./ClassForm.css";

export default function ClassForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const currentUser = storage.getUser();
  const role = currentUser?.role === "admin" ? "admin" : "secretary";
  const roleTitle = role === "admin" ? "پنل مدیریت" : "پنل منشی";
  const basePath = `/panel/${role}`;

  const [name, setName] = useState("");
  const [termId, setTermId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [tuitionFee, setTuitionFee] = useState(2500000);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");

  const [terms, setTerms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [existingEnrollments, setExistingEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadFormData() {
      try {
        setLoading(true);
        setError("");

        const [termsData, usersData] = await Promise.all([
          api.terms.list(),
          api.users.list(),
        ]);

        if (!alive) return;

        setTerms(termsData || []);
        const teacherUsers = (usersData || []).filter((u) => u.role === "teacher");
        const studentUsers = (usersData || []).filter((u) => u.role === "student");

        setTeachers(teacherUsers);
        setAllStudents(studentUsers);

        if (termsData?.length && !termId) {
          const activeTerm = termsData.find((t) => t.is_active) || termsData[0];
          setTermId(activeTerm.id);
        }

        if (teacherUsers?.length && !teacherId) {
          setTeacherId(teacherUsers[0].id);
        }

        if (isEdit) {
          const cls = await api.classrooms.get(id);
          if (!alive) return;

          setName(cls.name || "");
          setTermId(cls.term || "");
          setTeacherId(cls.teacher || "");
          setTuitionFee(cls.tuition_fee !== undefined ? cls.tuition_fee : 2500000);

          const enrollments = cls.enrollments || [];
          setExistingEnrollments(enrollments);
          setSelectedStudentIds(enrollments.map((e) => e.student || e.student_detail?.id));
        }
      } catch (err) {
        if (!alive) return;
        setError(err.message || "خطا در دریافت اطلاعات فرم");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadFormData();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((sId) => sId !== studentId)
        : [...prev, studentId],
    );
  };

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return allStudents;

    return allStudents.filter(
      (s) =>
        getFullName(s).toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q) ||
        s.phone_number?.includes(q),
    );
  }, [allStudents, studentSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("لطفاً نام کلاس را وارد کنید.");
      return;
    }
    if (!termId) {
      setError("لطفاً ترم تحصیلی را انتخاب کنید.");
      return;
    }
    if (!teacherId) {
      setError("لطفاً استاد مربوطه را انتخاب کنید.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: name.trim(),
        term: Number(termId),
        teacher: Number(teacherId),
        tuition_fee: Number(tuitionFee) || 0,
      };

      let classroomId = id;

      if (isEdit) {
        await api.classrooms.update(id, payload);

        // Synchronize enrollments
        const currentStudentIds = existingEnrollments.map(
          (e) => e.student || e.student_detail?.id,
        );

        // Delete removed enrollments
        for (const enrollment of existingEnrollments) {
          const stId = enrollment.student || enrollment.student_detail?.id;
          if (!selectedStudentIds.includes(stId)) {
            await api.enrollments.delete(enrollment.id);
          }
        }

        // Add new enrollments
        for (const stId of selectedStudentIds) {
          if (!currentStudentIds.includes(stId)) {
            await api.enrollments.create({
              classroom: Number(id),
              student: Number(stId),
              is_paid: false,
            });
          }
        }
      } else {
        const newClass = await api.classrooms.create(payload);
        classroomId = newClass.id;

        // Create enrollments for selected students
        for (const stId of selectedStudentIds) {
          await api.enrollments.create({
            classroom: Number(classroomId),
            student: Number(stId),
            is_paid: false,
          });
        }
      }

      setSuccessMsg("اطلاعات کلاس با موفقیت ذخیره شد.");
      setTimeout(() => {
        navigate(`${basePath}/classes`);
      }, 1000);
    } catch (err) {
      setError(err.message || "خطا در ذخیره‌سازی کلاس");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      role={roleTitle}
      title={isEdit ? "ویرایش کلاس" : "افزودن کلاس جدید"}
      menuType={role}
    >
      <div className="class-form-page-container">
        <div className="class-form-top-nav">
          <Link to={`${basePath}/classes`} className="class-form-back-btn">
            <ArrowRight size={18} />
            <span>بازگشت به لیست کلاس‌ها</span>
          </Link>
        </div>

        {error && (
          <div className="classes-alert error" style={{ marginBottom: "1.25rem" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="classes-alert success" style={{ marginBottom: "1.25rem" }}>
            <Sparkles size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "3.5rem", color: "oklch(50% 0 0)" }}>
            در حال بارگذاری اطلاعات فرم...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="class-form-element">
            {/* Card 1: Main & Financial Details */}
            <section className="class-form-card-section">
              <div className="class-form-card-header">
                <div className="class-form-card-icon">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2>مشخصات اصلی و مالی کلاس</h2>
                  <p>نام دوره، ترم تحصیلی، مدرس و مبلغ مصوب شهریه را مشخص کنید.</p>
                </div>
              </div>

              <div className="class-form-grid-layout">
                <label className="class-form-field-wrapper full-col">
                  <span>
                    نام کلاس و روز برگزاری <b>*</b>
                  </span>
                  <input
                    type="text"
                    placeholder="مثال: English Intermediate 2 - شنبه و چهارشنبه ساعت ۱۸"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>

                <label className="class-form-field-wrapper">
                  <span>
                    <Calendar size={14} style={{ marginLeft: "4px" }} />
                    ترم تحصیلی <b>*</b>
                  </span>
                  <select
                    value={termId}
                    onChange={(e) => setTermId(e.target.value)}
                    required
                  >
                    <option value="">انتخاب ترم...</option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.is_active ? "(ترم فعال)" : "(بایگانی)"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="class-form-field-wrapper">
                  <span>
                    <GraduationCap size={14} style={{ marginLeft: "4px" }} />
                    استاد / مدرس دوره <b>*</b>
                  </span>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    required
                  >
                    <option value="">انتخاب استاد...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {getFullName(t)} ({t.username})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="class-form-field-wrapper full-col">
                  <span>
                    <CreditCard size={14} style={{ marginLeft: "4px" }} />
                    مبلغ مصوب شهریه کلاس (تومان) <b>*</b>
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    placeholder="مثال: 2500000"
                    value={tuitionFee}
                    onChange={(e) => setTuitionFee(e.target.value)}
                    required
                  />
                  <small className="tuition-preview-badge">
                    مبلغ شهریه: {tuitionFee ? `${toPersianDigits(Number(tuitionFee).toLocaleString("fa-IR"))} تومان` : "۰ تومان"}
                  </small>
                </label>
              </div>
            </section>

            {/* Card 2: Student Assignment */}
            <section className="class-form-card-section">
              <div className="class-form-card-header flex-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <div className="class-form-card-icon users-icon">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2>انتخاب دانش‌آموزان کلاس</h2>
                    <p>
                      دانش‌آموزانی که در این کلاس شرکت می‌کنند را انتخاب نمایید (
                      {toPersianDigits(selectedStudentIds.length)} نفر انتخاب‌شده).
                    </p>
                  </div>
                </div>

                <div className="student-search-input-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="جستجوی نام یا شماره دانش‌آموز..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="student-picker-grid">
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);

                  return (
                    <div
                      key={student.id}
                      className={`student-card-item ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleStudent(student.id)}
                    >
                      <div className="card-checkbox">
                        {isSelected ? (
                          <CheckSquare size={19} className="check-active" />
                        ) : (
                          <Square size={19} className="check-inactive" />
                        )}
                      </div>

                      <div className="student-info-col">
                        <strong>{getFullName(student)}</strong>
                        <span className="user-tag">{student.username}</span>
                        {student.phone_number && (
                          <small className="phone-tag">{student.phone_number}</small>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Form Actions */}
            <div className="class-form-submit-actions">
              <Link to={`${basePath}/classes`} className="class-form-cancel-btn">
                انصراف
              </Link>

              <AnimatedButton
                variant="primary"
                type="submit"
                disabled={saving}
                icon={<Save size={18} />}
              >
                {saving ? "در حال ذخیره‌سازی..." : isEdit ? "ذخیره تغییرات کلاس" : "ثبت و ایجاد کلاس"}
              </AnimatedButton>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
