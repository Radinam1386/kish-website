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
  const basePath = `/panel/${role}`;

  const [name, setName] = useState("");
  const [termId, setTermId] = useState("");
  const [teacherId, setTeacherId] = useState("");
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

          const enrollments = cls.enrollments || [];
          setExistingEnrollments(enrollments);
          setSelectedStudentIds(enrollments.map((e) => e.student || e.student_detail?.id));
        }
      } catch (err) {
        if (alive) setError(err.message || "خطا در دریافت اطلاعات فرم");
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

  const filteredStudents = useMemo(() => {
    const s = studentSearch.trim().toLowerCase();
    if (!s) return allStudents;
    return allStudents.filter(
      (student) =>
        getFullName(student).toLowerCase().includes(s) ||
        (student.username && student.username.toLowerCase().includes(s)) ||
        (student.phone_number && student.phone_number.includes(s)),
    );
  }, [allStudents, studentSearch]);

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((sId) => sId !== studentId)
        : [...prev, studentId],
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map((st) => st.id);
    const allSelected = filteredIds.every((fid) => selectedStudentIds.includes(fid));

    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((sid) => !filteredIds.includes(sid)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("لطفاً نام کلاس را وارد کنید.");
      return;
    }
    if (!termId) {
      setError("لطفاً ترم را انتخاب کنید.");
      return;
    }
    if (!teacherId) {
      setError("لطفاً استاد کلاس را انتخاب کنید.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: name.trim(),
        term: Number(termId),
        teacher: Number(teacherId),
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
      role={role === "admin" ? "پنل مدیریت" : "پنل منشی"}
      title={isEdit ? "ویرایش کلاس" : "ایجاد کلاس جدید"}
      menuType={role}
    >
      <div className="class-form-page">
        <div className="class-form-header">
          <div className="class-form-heading">
            <div className="class-form-avatar">
              <BookOpen size={24} />
            </div>
            <div>
              <h3>{isEdit ? "ویرایش کلاس" : "ایجاد کلاس جدید"}</h3>
              <p>مشخصات دوره آموزشی، استاد و دانش‌آموزان ثبت‌نامی را وارد کنید.</p>
            </div>
          </div>

          <Link to={`${basePath}/classes`}>
            <AnimatedButton variant="secondary" size="small">
              <ArrowRight size={16} />
              بازگشت به کلاس‌ها
            </AnimatedButton>
          </Link>
        </div>

        {error && (
          <div className="class-form-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="class-form-alert success">
            <Sparkles size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            در حال بارگذاری اطلاعات فرم...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="class-form-main">
            <div className="class-form-card">
              <h4 className="card-title">
                <BookOpen size={18} />
                مشخصات اصلی کلاس
              </h4>

              <div className="class-form-grid">
                <div className="class-form-group full-width">
                  <label>
                    نام کلاس و روز برگزاری <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: English A2 - شنبه و چهارشنبه ساعت ۱۸"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="class-form-group">
                  <label>
                    <Calendar size={15} />
                    ترم تحصیلی <span className="req">*</span>
                  </label>
                  <select
                    value={termId}
                    onChange={(e) => setTermId(e.target.value)}
                    required
                  >
                    <option value="">انتخاب ترم...</option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.is_active ? "(فعال)" : "(غیرفعال)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="class-form-group">
                  <label>
                    <GraduationCap size={15} />
                    استاد / مدرس <span className="req">*</span>
                  </label>
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
                </div>
              </div>
            </div>

            {/* Enrolled Students Picker */}
            <div className="class-form-card">
              <div className="card-header-flex">
                <div>
                  <h4 className="card-title">
                    <Users size={18} />
                    دانش‌آموزان ثبت‌نامی در این کلاس
                  </h4>
                  <p className="card-subtitle">
                    تعداد دانش‌آموزان انتخاب‌شده:{" "}
                    <strong>{toPersianDigits(selectedStudentIds.length)}</strong> نفر
                  </p>
                </div>

                <button
                  type="button"
                  className="select-all-btn"
                  onClick={handleSelectAllFiltered}
                >
                  انتخاب / لغو همه نتایج جستجو
                </button>
              </div>

              <div className="student-search-bar">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="جستجوی نام یا شماره دانش‌آموز..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              <div className="students-checkbox-grid">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st) => {
                    const isSelected = selectedStudentIds.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        className={`student-check-item ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleStudent(st.id)}
                      >
                        <div className="check-box-icon">
                          {isSelected ? (
                            <CheckSquare size={19} className="checked-icon" />
                          ) : (
                            <Square size={19} />
                          )}
                        </div>
                        <div className="student-check-info">
                          <strong>{getFullName(st)}</strong>
                          <small>{st.phone_number || st.username}</small>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-students-found">دانش‌آموزی با این مشخصات پیدا نشد.</div>
                )}
              </div>
            </div>

            <div className="class-form-actions">
              <Link to={`${basePath}/classes`}>
                <AnimatedButton variant="secondary" type="button">
                  انصراف
                </AnimatedButton>
              </Link>

              <AnimatedButton
                variant="primary"
                type="submit"
                disabled={saving}
              >
                <Save size={18} />
                {saving ? "در حال ذخیره‌سازی..." : isEdit ? "بروزرسانی کلاس" : "ثبت و ایجاد کلاس"}
              </AnimatedButton>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
