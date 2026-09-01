import { useEffect, useState } from "react";
import {
  PlusCircle,
  Trash2,
  Save,
  FileText,
  ListChecks,
  ImagePlus,
  Pencil,
  X,
  FileTextIcon,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import "./TeacherCreateExam.css";
import { AnimatedButton } from "../components/AnimatedButton";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { api } from "../services/api";
import { getTodayJalali, toPersianDigits } from "../utils/dateUtils";

function TeacherCreateExam() {
  const today = getTodayJalali();
  const [examTitle, setExamTitle] = useState("");
  const [examDate, setExamDate] = useState(today.isoGregorian);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [classroomId, setClassroomId] = useState("");
  const [classrooms, setClassrooms] = useState([]);
  const [questionType, setQuestionType] = useState("multiple");
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  const [questionText, setQuestionText] = useState("");
  const [descriptiveImage, setDescriptiveImage] = useState(null);

  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);
  const [questionScore, setQuestionScore] = useState(1);

  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadClasses() {
      try {
        const [classes, terms] = await Promise.all([
          api.classrooms.list(),
          api.terms.list(),
        ]);
        if (!alive) return;
        const activeTermIds = (terms || [])
          .filter((t) => t.is_active)
          .map((t) => t.id);
        const activeClasses = (classes || []).filter(
          (c) =>
            activeTermIds.length === 0 ||
            activeTermIds.includes(c.term || c.term?.id),
        );
        setClassrooms(activeClasses || []);
        setClassroomId(activeClasses[0]?.id || "");
      } catch (err) {
        if (alive) setMessage(err.message || "دریافت کلاس‌ها ناموفق بود.");
      }
    }

    loadClasses();

    return () => {
      alive = false;
    };
  }, []);

  const resetQuestionForm = () => {
    setQuestionType("multiple");
    setQuestionText("");
    setDescriptiveImage(null);
    setOptions(["", "", "", ""]);
    setCorrectOption(0);
    setQuestionScore(1);
    setEditingQuestionId(null);
  };

  const handleTypeChange = (type) => {
    setQuestionType(type);

    // هنگام تغییر نوع سؤال، اطلاعات فرم قبلی پاک می‌شود
    setQuestionText("");
    setDescriptiveImage(null);
    setOptions(["", "", "", ""]);
    setCorrectOption(0);
    setQuestionScore(1);
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setDescriptiveImage({
      file,
      preview: URL.createObjectURL(file),
    });
  };

  const handleAddQuestion = () => {
    if (!questionText.trim()) {
      alert("لطفاً متن سؤال را وارد کنید.");
      return;
    }

    if (
      questionType === "multiple" &&
      options.some((option) => !option.trim())
    ) {
      alert("لطفاً تمام گزینه‌ها را تکمیل کنید.");
      return;
    }

    const parsedScore = Math.max(0.25, parseFloat(questionScore) || 1);

    const newQuestion = {
      id: editingQuestionId || Date.now(),
      type: questionType,
      text: questionText,
      image: descriptiveImage,
      score: parsedScore,
      options: questionType === "multiple" ? [...options] : [],
      correctOption: questionType === "multiple" ? correctOption : null,
    };

    if (editingQuestionId) {
      setQuestions((previousQuestions) =>
        previousQuestions.map((question) =>
          question.id === editingQuestionId ? newQuestion : question,
        ),
      );
    } else {
      setQuestions((previousQuestions) => [...previousQuestions, newQuestion]);
    }

    resetQuestionForm();
  };

  const handleEditQuestion = (question) => {
    setEditingQuestionId(question.id);
    setQuestionType(question.type);
    setQuestionText(question.text);
    setDescriptiveImage(question.image || null);
    setQuestionScore(question.score || 1);

    if (question.type === "multiple") {
      setOptions(question.options);
      setCorrectOption(question.correctOption);
    } else {
      setOptions(["", "", "", ""]);
      setCorrectOption(0);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteQuestion = (id) => {
    setQuestions((previousQuestions) =>
      previousQuestions.filter((question) => question.id !== id),
    );

    if (editingQuestionId === id) {
      resetQuestionForm();
    }
  };

  const handleSaveExam = async () => {
    if (!examTitle.trim() || !examDate || !classroomId) {
      setMessage("عنوان، کلاس و تاریخ آزمون الزامی است.");
      return;
    }

    if (questions.length === 0) {
      setMessage("حداقل یک سؤال برای آزمون اضافه کنید.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const exam = await api.exams.create({
        title: examTitle,
        date: examDate,
        classroom: Number(classroomId),
        duration_minutes: Number(durationMinutes) || 45,
      });

      for (const [index, question] of questions.entries()) {
        await api.questions.create({
          exam: exam.id,
          text: question.text,
          question_type:
            question.type === "multiple" ? "multiple_choice" : "essay",
          max_score: Number(question.score) || 1,
          order: index + 1,
          choices:
            question.type === "multiple"
              ? question.options.map((option, optionIndex) => ({
                  text: option,
                  is_correct: optionIndex === question.correctOption,
                }))
              : [],
        });
      }

      setExamTitle("");
      setExamDate("");
      setQuestions([]);
      resetQuestionForm();
      setMessage("آزمون با موفقیت در بک‌اند ثبت شد.");
    } catch (err) {
      setMessage(err.message || "ثبت آزمون ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="پنل معلم" title="ایجاد امتحان" menuType="teacher">
      {/* ================= اطلاعات امتحان ================= */}

      <section className="xqv-teacher-exam-section">
        <section className="secretary-terms-header">
          <div className="secretary-terms-heading">
            <div className="secretary-terms-avatar">
              <FileTextIcon size={25} />
            </div>

            <div className="secretary-terms-heading-content">
              <h3>مشخصات امتحان</h3>

              <p> اطلاعات کلی آزمون را وارد کنید</p>
            </div>
          </div>
        </section>
        <div className="xqv-teacher-exam-info-card">
          <div className="xqv-teacher-exam-form-grid">
            <div className="xqv-teacher-exam-field">
              <label>عنوان امتحان</label>

              <input
                className="xqv-teacher-exam-input"
                type="text"
                value={examTitle}
                onChange={(event) => setExamTitle(event.target.value)}
                placeholder="مثلاً Quiz Unit 4"
              />
            </div>

            <div className="xqv-teacher-exam-field">
              <label>انتخاب کلاس</label>

              <select
                className="xqv-teacher-exam-input"
                value={classroomId}
                onChange={(event) => setClassroomId(event.target.value)}
              >
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="xqv-teacher-exam-field">
              <label>مدت زمان امتحان (دقیقه)</label>

              <input
                className="xqv-teacher-exam-input"
                type="number"
                min="1"
                max="300"
                placeholder="مثلاً 45 دقیقه"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                required
              />
            </div>

            <div className="xqv-teacher-exam-field full-width">
              <JalaliDatePicker
                label="تاریخ برگزاری آزمون (شمسی)"
                value={examDate}
                onChange={(iso) => setExamDate(iso)}
                required
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= ساخت سؤال ================= */}

      <section className="xqv-teacher-exam-section">
        <section className="secretary-terms-header">
          <div className="secretary-terms-heading">
            <div className="secretary-terms-avatar">
              <FileTextIcon size={25} />
            </div>
            <div className="secretary-terms-heading-content">
              <h3>{editingQuestionId ? "ویرایش سؤال" : "ساخت سؤال جدید"}</h3>
              <p> نوع سؤال را انتخاب کرده و محتوای آن را وارد کنید</p>
            </div>
            {editingQuestionId && (
              <AnimatedButton small="small" onClick={resetQuestionForm}>
                <X size={17} />
                لغو ویرایش
              </AnimatedButton>
            )}
          </div>
        </section>
        <div className="xqv-teacher-exam-builder-card">
          <div className="xqv-teacher-exam-type-title">نوع سؤال</div>
          <div className="xqv-teacher-exam-type-selector">
            <button
              type="button"
              className={`xqv-teacher-exam-type-option ${
                questionType === "multiple"
                  ? "xqv-teacher-exam-type-option--active"
                  : ""
              }`}
              onClick={() => handleTypeChange("multiple")}
            >
              <div className="xqv-teacher-exam-type-icon">
                <ListChecks size={24} />
              </div>

              <div className="xqv-teacher-exam-type-content">
                <strong>سؤال تستی</strong>

                <span>چهار گزینه و یک پاسخ صحیح</span>
              </div>

              <div className="xqv-teacher-exam-radio">
                {questionType === "multiple" && <span />}
              </div>
            </button>

            <button
              type="button"
              className={`xqv-teacher-exam-type-option ${
                questionType === "descriptive"
                  ? "xqv-teacher-exam-type-option--active"
                  : ""
              }`}
              onClick={() => handleTypeChange("descriptive")}
            >
              <div className="xqv-teacher-exam-type-icon">
                <FileText size={24} />
              </div>

              <div className="xqv-teacher-exam-type-content">
                <strong>سؤال تشریحی</strong>

                <span>پاسخ آزاد همراه با امکان درج تصویر</span>
              </div>

              <div className="xqv-teacher-exam-radio">
                {questionType === "descriptive" && <span />}
              </div>
            </button>
          </div>

          {/* متن سؤال */}

          <div className="xqv-teacher-exam-field xqv-teacher-exam-question-field">
            <label>
              متن سؤال <span style={{ color: "red" }}>*</span>
            </label>

            <input
              className="xqv-teacher-exam-input"
              value={questionText}
              dir="ltr"
              placeholder="متن سؤال را اینجا وارد کنید..."
              onChange={(event) => setQuestionText(event.target.value)}
            />
          </div>

          {/* بارم نمره این سؤال */}

          <div
            className="xqv-teacher-exam-field"
            style={{ marginBottom: "1.25rem" }}
          >
            <label>
              بارم نمره این سؤال <span style={{ color: "red" }}>*</span>
            </label>

            <input
              className="xqv-teacher-exam-input"
              type="number"
              min="0.25"
              max="100"
              step="0.25"
              placeholder="مثلاً 1 یا 2 یا 1.5"
              value={questionScore}
              onChange={(event) => setQuestionScore(event.target.value)}
              required
            />
          </div>

          {/* ================= تستی ================= */}

          {questionType === "multiple" && (
            <div className="xqv-teacher-exam-multiple-area">
              <div className="xqv-teacher-exam-options-title">
                <span>گزینه‌های پاسخ</span>

                <small>یکی از گزینه‌ها را به عنوان پاسخ صحیح انتخاب کنید</small>
              </div>

              <div className="xqv-teacher-exam-options-grid">
                {options.map((option, index) => (
                  <div
                    className={`xqv-teacher-exam-option-field ${
                      correctOption === index
                        ? "xqv-teacher-exam-option-field--correct"
                        : ""
                    }`}
                    key={index}
                  >
                    <button
                      type="button"
                      className="xqv-teacher-exam-option-radio"
                      onClick={() => setCorrectOption(index)}
                      aria-label={`انتخاب گزینه ${index + 1} به عنوان پاسخ صحیح`}
                    >
                      {correctOption === index && <span />}
                    </button>

                    <span className="xqv-teacher-exam-option-number">
                      {index + 1}
                    </span>

                    <input
                      className="xqv-teacher-exam-input"
                      type="text"
                      dir="ltr"
                      value={option}
                      onChange={(event) =>
                        handleOptionChange(index, event.target.value)
                      }
                      placeholder={`متن گزینه ${index + 1}`}
                    />

                    {correctOption === index && (
                      <span className="xqv-teacher-exam-correct-label">
                        پاسخ صحیح
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= تشریحی ================= */}

          {questionType === "descriptive" && (
            <div className="xqv-teacher-exam-descriptive-area">
              <div className="xqv-teacher-exam-descriptive-info">
                <FileText size={20} />

                <div>
                  <strong>سؤال تشریحی</strong>

                  <span>
                    می‌توانید سؤال را به صورت متنی بنویسید و در صورت نیاز یک
                    تصویر نیز اضافه کنید.
                  </span>
                </div>
              </div>

              <label className="xqv-teacher-exam-upload-box">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />

                <div className="xqv-teacher-exam-upload-icon">
                  <ImagePlus size={25} />
                </div>

                <div className="xqv-teacher-exam-upload-text">
                  <strong>افزودن تصویر به سؤال</strong>

                  <span>JPG، PNG یا WEBP</span>
                </div>
              </label>

              {descriptiveImage && (
                <div className="xqv-teacher-exam-image-preview">
                  <img
                    src={descriptiveImage.preview}
                    alt="پیش‌نمایش تصویر سؤال"
                  />

                  <button
                    type="button"
                    onClick={() => setDescriptiveImage(null)}
                    aria-label="حذف تصویر"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="xqv-teacher-exam-builder-footer">
            <AnimatedButton
              variant="danger"
              icon={
                editingQuestionId ? (
                  <Save size={18} />
                ) : (
                  <PlusCircle size={18} />
                )
              }
              onClick={handleAddQuestion}
            >
              {editingQuestionId
                ? "ذخیره تغییرات سؤال"
                : "افزودن سؤال به آزمون"}
            </AnimatedButton>
          </div>
        </div>
      </section>

      <section className="xqv-teacher-exam-section">
        <div className="xqv-teacher-exam-section-head">
          <div>
            <h3 className="xqv-teacher-exam-section-title">سؤالات آزمون</h3>

            <p className="xqv-teacher-exam-section-subtitle">
              سؤالات اضافه‌شده را مشاهده، ویرایش یا حذف کنید
            </p>
          </div>

          <div
            className="xqv-teacher-exam-question-counter"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <span>{toPersianDigits(questions.length)} سؤال</span>
            <span>•</span>
            <span
              style={{ color: "var(--primary, #e74c3c)", fontWeight: "800" }}
            >
              مجموع بارم:{" "}
              {toPersianDigits(
                questions.reduce((sum, q) => sum + (Number(q.score) || 1), 0),
              )}{" "}
              نمره
            </span>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="xqv-teacher-exam-empty">
            <div className="xqv-teacher-exam-empty-icon">
              <FileText size={28} />
            </div>

            <strong>هنوز سؤالی به آزمون اضافه نشده است</strong>

            <span>اولین سؤال خود را از بخش بالا ایجاد کنید.</span>
          </div>
        ) : (
          <div className="xqv-teacher-exam-question-list">
            {questions.map((question, index) => (
              <article
                className="xqv-teacher-exam-question-card"
                key={question.id}
              >
                <div className="xqv-teacher-exam-question-card-head">
                  <div className="xqv-teacher-exam-question-number">
                    <span>سؤال</span>
                    <strong>{index + 1}</strong>
                  </div>

                  <div
                    className={`xqv-teacher-exam-question-type-badge ${
                      question.type === "multiple"
                        ? "xqv-teacher-exam-question-type-badge--multiple"
                        : "xqv-teacher-exam-question-type-badge--descriptive"
                    }`}
                  >
                    {question.type === "multiple" ? (
                      <>
                        <ListChecks size={16} />
                        تستی
                      </>
                    ) : (
                      <>
                        <FileText size={16} />
                        تشریحی
                      </>
                    )}
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      background: "oklch(96% 0.04 29)",
                      border: "1px solid oklch(60% 0.19 29 / 0.2)",
                      borderRadius: "8px",
                      fontSize: "0.78rem",
                      fontWeight: "800",
                      color: "var(--primary, #e74c3c)",
                    }}
                  >
                    بارم: {toPersianDigits(question.score || 1)} نمره
                  </span>

                  <div className="xqv-teacher-exam-question-actions">
                    <button
                      type="button"
                      className="xqv-teacher-exam-edit-button"
                      onClick={() => handleEditQuestion(question)}
                    >
                      <Pencil size={17} />
                      ویرایش
                    </button>

                    <button
                      type="button"
                      className="xqv-teacher-exam-delete-button"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                <div className="xqv-teacher-exam-question-body">
                  <p className="xqv-teacher-exam-question-text">
                    {question.text}
                  </p>

                  {question.type === "multiple" && (
                    <div className="xqv-teacher-exam-saved-options">
                      {question.options.map((option, optionIndex) => (
                        <div
                          className={`xqv-teacher-exam-saved-option ${
                            optionIndex === question.correctOption
                              ? "xqv-teacher-exam-saved-option--correct"
                              : ""
                          }`}
                          key={optionIndex}
                        >
                          <span>{optionIndex + 1}</span>

                          <p>{option}</p>

                          {optionIndex === question.correctOption && (
                            <strong>پاسخ صحیح</strong>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === "descriptive" && question.image && (
                    <div className="xqv-teacher-exam-saved-image">
                      <img
                        src={question.image.preview}
                        alt="تصویر سؤال تشریحی"
                      />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {questions.length > 0 && (
          <div className="xqv-teacher-exam-final-actions">
            {/* <AnimatedButton
              variant="danger"
              icon={<PlusCircle size={18} />}
              onClick={resetQuestionForm}
            >
              افزودن سؤال جدید
            </AnimatedButton> */}

            <AnimatedButton
              variant="danger"
              icon={<Save size={18} />}
              onClick={handleSaveExam}
              disabled={saving}
            >
              {saving ? "در حال ثبت..." : "ثبت نهایی امتحان"}
            </AnimatedButton>
          </div>
        )}

        {message && (
          <div className="xqv-teacher-exam-empty">
            <span>{message}</span>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

export default TeacherCreateExam;
