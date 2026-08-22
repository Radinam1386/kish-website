import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Save, Users, Calendar, Hash, UserCircle } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import "./TeacherAttendance.css";
import StatCard from "../components/StatCard";
import { api, getFullName } from "../services/api";

function TeacherAttendance() {
  const { classId } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [notes, setNotes] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let alive = true;

    async function loadClassroom() {
      try {
        const data = await api.classrooms.get(classId);
        if (!alive) return;
        setClassroom(data);
        setStatuses(
          Object.fromEntries(
            (data.enrollments || []).map((item) => [item.student, "present"]),
          ),
        );
      } catch (err) {
        if (alive) setMessage(err.message || "دریافت کلاس ناموفق بود.");
      }
    }

    loadClassroom();

    return () => {
      alive = false;
    };
  }, [classId]);

  const students = useMemo(
    () => (classroom?.enrollments || []).map((item) => item.student_detail),
    [classroom],
  );

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const session = await api.sessions.create({
        classroom: Number(classId),
        date: today,
      });

      await Promise.all(
        students.map((student) =>
          api.attendance.create({
            session: session.id,
            student: student.id,
            status: statuses[student.id] || "present",
            note: notes[student.id] || "",
          }),
        ),
      );

      setMessage("حضور و غیاب با موفقیت ثبت شد.");
    } catch (err) {
      setMessage(err.message || "ثبت حضور و غیاب ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      role="پنل معلم"
      title="حضور و غیاب کلاس"
      menuType="teacher"
    >
      <div className="teacher-attendance-q9m4-root">
        <section className="teacher-attendance-q9m4-section">
          <div className="teacher-attendance-q9m4-section-head">
            <div className="teacher-attendance-q9m4-heading">
              <div className="teacher-attendance-q9m4-avatar">
                <Users size={24} />
              </div>

              <div className="teacher-attendance-q9m4-heading-content">
                <h3 className="teacher-attendance-q9m4-title">
                  مدیریت حضور و غیاب
                </h3>

                <p className="teacher-attendance-q9m4-class-code">
                  کد سیستمی کلاس: {classId}
                </p>
              </div>
            </div>

            <AnimatedButton
              variant="danger"
              icon={<Save size={18} />}
              onClick={handleSave}
              disabled={saving || !students.length}
            >
              {saving ? "در حال ثبت..." : "ثبت نهایی لیست"}
            </AnimatedButton>
          </div>

          <div className="teacher-attendance-q9m4-meta-grid">
            <StatCard
              title="نام کلاس"
              value={classroom?.name || "-"}
              icon={<Hash size={23} />}
              color="red"
            />
            <StatCard
              title="تاریخ جلسه"
              value={today}
              icon={<Calendar size={23} />}
              color="light-blue"
            />
            <StatCard
              title="شماره جلسه"
              value="جلسه امروز"
              icon={<Hash size={23} />}
              color="light-green"
            />
            <StatCard
              title="استاد مربوطه"
              value={getFullName(classroom?.teacher_detail)}
              icon={<UserCircle size={23} />}
              color="red"
            />
          </div>
        </section>

        <section className="teacher-attendance-q9m4-section">
          <div className="teacher-attendance-q9m4-section-head teacher-attendance-q9m4-list-head">
            <h3 className="teacher-attendance-q9m4-title">لیست دانش‌آموزان</h3>

            <span className="teacher-attendance-q9m4-count-badge">
              تعداد: {students.length} نفر
            </span>
          </div>

          <div className="teacher-attendance-q9m4-table-shell">
            <div className="teacher-attendance-q9m4-table-scroll">
              <table className="teacher-attendance-q9m4-table">
                <thead>
                  <tr>
                    <th>نام دانش‌آموز</th>
                    <th>شماره موبایل</th>
                    <th>سطح</th>
                    <th className="teacher-attendance-q9m4-status-column">
                      وضعیت حضور
                    </th>
                    <th>توضیحات تکمیلی</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="teacher-attendance-q9m4-student-name">
                          {getFullName(student)}
                        </div>
                      </td>

                      <td>
                        <span className="teacher-attendance-q9m4-phone">
                          {student.phone}
                        </span>
                      </td>

                      <td>
                        <span className="teacher-attendance-q9m4-level-badge">
                          {student.username}
                        </span>
                      </td>

                      <td>
                        <select
                          className="teacher-attendance-q9m4-select"
                          value={statuses[student.id] || "present"}
                          onChange={(event) =>
                            setStatuses((prev) => ({
                              ...prev,
                              [student.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="present">حاضر</option>
                          <option value="absent">غایب</option>
                          <option value="late">تاخیر</option>
                          <option value="excused">غیبت موجه</option>
                        </select>
                      </td>

                      <td>
                        <input
                          className="teacher-attendance-q9m4-input"
                          type="text"
                          value={notes[student.id] || ""}
                          onChange={(event) =>
                            setNotes((prev) => ({
                              ...prev,
                              [student.id]: event.target.value,
                            }))
                          }
                          placeholder="مثلاً: تاخیر با هماهنگی..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {message && <div className="teacher-attendance-q9m4-count-badge">{message}</div>}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default TeacherAttendance;
