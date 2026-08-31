import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  Eye,
  AlertTriangle,
  FileCheck2,
  CircleHelp,
  BadgeCheck,
  Award,
  Hourglass,
  Timer,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import StatCard from "../components/StatCard";
import { api, storage } from "../services/api";
import { toPersianDigits, toJalaliDateString } from "../utils/dateUtils";
import "./ExamPage.css";

function StudentExam() {
  const { examId } = useParams();
  const currentUser = storage.getUser();
  const userId = currentUser?.id || "guest";

  const storageKey = `kish_exam_start_time_${examId}_${userId}`;
  const draftKey = `kish_exam_draft_answers_${examId}_${userId}`;

  const [answers, setAnswers] = useState({});
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Timer states
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [autoSubmittedDueToTime, setAutoSubmittedDueToTime] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Restore saved draft answers on initial load
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === "object") {
          setAnswers(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to parse saved exam draft:", e);
    }
  }, [draftKey]);

  // Load Exam Data
  useEffect(() => {
    let alive = true;

    async function loadExam() {
      try {
        setLoading(true);
        setError("");

        const [examData, submissionsData] = await Promise.all([
          api.exams.studentView(examId).catch(() => api.exams.get(examId)),
          api.submissions.list().catch(() => []),
        ]);

        if (!alive) return;

        const currentExam = examData.exam || examData;
        setExam(currentExam);
        setQuestions(examData.questions || currentExam.questions || []);

        const sub = (submissionsData || []).find(
          (s) =>
            (s.exam === Number(examId) || s.exam?.id === Number(examId)) &&
            (!currentUser?.id || s.student === currentUser.id || s.student?.id === currentUser.id),
        );

        if (sub) {
          setExistingSubmission(sub);
          localStorage.removeItem(storageKey);
          localStorage.removeItem(draftKey);
        }
      } catch (err) {
        if (alive) setError(err.message || "دریافت اطلاعات آزمون ناموفق بود.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadExam();

    return () => {
      alive = false;
    };
  }, [examId, currentUser?.id, storageKey, draftKey]);

  // Execute Auto Submit when time expires
  const triggerAutoSubmit = useCallback(async () => {
    if (submitted || existingSubmission || saving) return;

    setIsTimeUp(true);
    setSaving(true);
    setAutoSubmittedDueToTime(true);

    try {
      const user = storage.getUser();
      const submissionPayload = {
        exam: Number(examId),
      };
      if (user?.id) {
        submissionPayload.student = user.id;
      }

      const submission = await api.submissions.create(submissionPayload);
      const currentAnswers = answersRef.current;

      await Promise.all(
        questions.map((question) => {
          const ans = currentAnswers[question.id];
          const isMultiple = question.question_type === "multiple_choice";

          const answerPayload = {
            submission: submission.id,
            question: question.id,
          };

          if (isMultiple) {
            if (ans !== undefined && ans !== null && ans !== "") {
              answerPayload.selected_choice = Number(ans);
            }
          } else {
            answerPayload.essay_text = ans ? String(ans) : "";
          }

          return api.answers.create(answerPayload);
        }),
      );

      localStorage.removeItem(storageKey);
      localStorage.removeItem(draftKey);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "خطا در ثبت خودکار پاسخ‌های آزمون پس از پایان زمان");
    } finally {
      setSaving(false);
    }
  }, [submitted, existingSubmission, saving, examId, questions, storageKey, draftKey]);

  // Timer Countdown Effect (Real absolute wall-clock countdown)
  useEffect(() => {
    if (!exam || submitted || existingSubmission || loading) return;

    // Use duration_minutes specified by teacher, fallback to 45 if not set
    const durMinutes = Number(exam.duration_minutes) || 45;
    const durSeconds = durMinutes * 60;

    let startTime = localStorage.getItem(storageKey);
    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(storageKey, startTime);
    }

    const calcRemaining = () => {
      const elapsed = Math.floor((Date.now() - Number(startTime)) / 1000);
      const remaining = Math.max(0, durSeconds - elapsed);
      return remaining;
    };

    const initialRemaining = calcRemaining();
    setTimeLeft(initialRemaining);

    if (initialRemaining <= 0) {
      triggerAutoSubmit();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calcRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        triggerAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [exam, submitted, existingSubmission, loading, storageKey, triggerAutoSubmit]);

  function handleSelect(questionId, value) {
    if (submitted || existingSubmission || isTimeUp || saving) return;
    setAnswers((prev) => {
      const next = {
        ...prev,
        [questionId]: value,
      };
      try {
        localStorage.setItem(draftKey, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist draft answers:", e);
      }
      return next;
    });
  }

  const totalQuestions = questions.length;
  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const val = answers[q.id];
      if (val === undefined || val === null) return false;
      if (typeof val === "string" && !val.trim()) return false;
      return true;
    }).length;
  }, [questions, answers]);

  const isAllAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  async function handleSubmit() {
    if (isTimeUp || saving) return;

    if (answeredCount === 0) {
      alert("لطفاً حداقل به یک سوال پاسخ دهید.");
      return;
    }

    if (!isAllAnswered) {
      const confirmSubmit = window.confirm(
        `شما به ${toPersianDigits(answeredCount)} سوال از ${toPersianDigits(
          totalQuestions,
        )} سوال پاسخ داده‌اید. آیا از ثبت نهایی پاسخ‌ها اطمینان دارید؟`,
      );
      if (!confirmSubmit) return;
    }

    setSaving(true);
    setError("");

    try {
      const user = storage.getUser();
      const submissionPayload = {
        exam: Number(examId),
      };
      if (user?.id) {
        submissionPayload.student = user.id;
      }

      const submission = await api.submissions.create(submissionPayload);

      // Submit answers for all questions
      await Promise.all(
        questions.map((question) => {
          const ans = answers[question.id];
          const isMultiple = question.question_type === "multiple_choice";

          const answerPayload = {
            submission: submission.id,
            question: question.id,
          };

          if (isMultiple) {
            if (ans !== undefined && ans !== null && ans !== "") {
              answerPayload.selected_choice = Number(ans);
            }
          } else {
            answerPayload.essay_text = ans ? String(ans) : "";
          }

          return api.answers.create(answerPayload);
        }),
      );

      localStorage.removeItem(storageKey);
      localStorage.removeItem(draftKey);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "ثبت پاسخ‌ها ناموفق بود. لطفاً مجدداً تلاش نمایید.");
    } finally {
      setSaving(false);
    }
  }

  const totalDurationMinutes = Number(exam?.duration_minutes) || 45;
  const totalDurationSeconds = totalDurationMinutes * 60;

  // Format digital countdown string
  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return "--:--";
    const s = Math.max(0, secs);
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    const pad = (n) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `${toPersianDigits(pad(hours))}:${toPersianDigits(pad(minutes))}:${toPersianDigits(pad(seconds))}`;
    }
    return `${toPersianDigits(pad(minutes))}:${toPersianDigits(pad(seconds))}`;
  };

  const progressPercent =
    timeLeft !== null && totalDurationSeconds > 0
      ? Math.max(0, Math.min(100, (timeLeft / totalDurationSeconds) * 100))
      : 100;

  const isUrgent = timeLeft !== null && timeLeft > 60 && timeLeft <= 300;
  const isCritical = timeLeft !== null && timeLeft <= 60;
  const timerBannerClass = isCritical
    ? "student-exam-timer-banner critical"
    : isUrgent
      ? "student-exam-timer-banner warning"
      : "student-exam-timer-banner";

  if (loading) {
    return (
      <DashboardLayout role="پنل دانش‌آموز" title="آزمون" menuType="student">
        <div style={{ textAlign: "center", padding: "4rem", color: "oklch(50% 0 0)" }}>
          در حال بارگذاری سوالات آزمون...
        </div>
      </DashboardLayout>
    );
  }

  if (error && !exam) {
    return (
      <DashboardLayout role="پنل دانش‌آموز" title="آزمون" menuType="student">
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <p style={{ color: "var(--danger, #ef4444)", marginBottom: "1.5rem" }}>{error}</p>
          <Link to="/panel/student/exams">
            <AnimatedButton variant="primary">بازگشت به لیست آزمون‌ها</AnimatedButton>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // If the student already completed this exam previously:
  if (existingSubmission && !submitted) {
    return (
      <DashboardLayout
        role="پنل دانش‌آموز"
        title={`آزمون: ${exam?.title || ""}`}
        menuType="student"
      >
        <div className="exam-page">
          <section className="exam-result-hero">
            <div className="exam-result-icon">
              <CheckCircle2 size={44} />
            </div>

            <span className="exam-result-kicker">آزمون تکمیل‌شده</span>
            <h2>شما قبلاً در این آزمون شرکت کرده‌اید</h2>
            <p>
              پاسخ‌های شما برای آزمون «{exam?.title}» در تاریخ{" "}
              {toJalaliDateString(existingSubmission.submitted_at?.split("T")[0])} ثبت شده است.
            </p>

            <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
              <Link to={`/panel/student/examresult/${examId}`}>
                <AnimatedButton variant="primary">
                  <Award size={18} />
                  مشاهده کارنامه و نتیجه آزمون
                </AnimatedButton>
              </Link>

              <Link to="/panel/student/exams">
                <AnimatedButton variant="secondary">
                  بازگشت به آزمون‌ها
                </AnimatedButton>
              </Link>
            </div>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title={`آزمون: ${exam?.title || ""}`}
      menuType="student"
    >
      <div className="exam-page">
        {!submitted ? (
          <>
            {/* Live Countdown Timer Widget */}
            <div className={timerBannerClass}>
              <div className="timer-main-row">
                <div className="timer-info-box">
                  <div className="timer-icon-circle">
                    {isCritical ? <Hourglass size={24} /> : <Timer size={24} />}
                  </div>
                  <div className="timer-title-group">
                    <h4>زمان باقی‌مانده آزمون</h4>
                    <p>
                      مدت کل آزمون: {toPersianDigits(totalDurationMinutes)} دقیقه
                      {isCritical
                        ? " — کمتر از یک دقیقه فرصت دارید!"
                        : isUrgent
                          ? " — زمان روبه‌اتمام است"
                          : " — پس از اتمام زمان، پاسخ‌ها خودکار ثبت می‌شوند"}
                    </p>
                  </div>
                </div>

                <div className="timer-countdown-display">
                  <span
                    className={`timer-status-chip ${
                      isCritical ? "critical" : isUrgent ? "warning" : "normal"
                    }`}
                  >
                    {isCritical ? "لحظات پایانی" : isUrgent ? "هشدار زمان" : "زمان کافی"}
                  </span>
                  <div className="timer-digits-badge">{formatTime(timeLeft)}</div>
                </div>
              </div>

              {/* Smooth Progress Bar */}
              <div className="timer-progress-track">
                <div
                  className="timer-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Expired / Auto submit banner if timeout triggered */}
            {isTimeUp && (
              <div className="exam-time-expired-card">
                <AlertCircle size={24} />
                <div>
                  <h4>زمان آزمون به پایان رسید</h4>
                  <p>در حال ارسال و ثبت خودکار پاسخ‌های پاسخ‌داده‌شده شما به سرور...</p>
                </div>
              </div>
            )}

            <section className="exam-stats-grid">
              <StatCard
                title="تعداد کل سوالات"
                value={`${toPersianDigits(totalQuestions)} سوال`}
                icon={<Clock3 size={23} />}
                color="red"
              />
              <StatCard
                title="وضعیت پاسخ‌دهی"
                value={`${toPersianDigits(answeredCount)} از ${toPersianDigits(totalQuestions)}`}
                icon={<Eye size={23} />}
                color="blue"
              />
              <StatCard
                title="وضعیت آزمون"
                value={isAllAnswered ? "آماده ثبت نهایی" : "در حال پاسخ‌دهی"}
                icon={<FileCheck2 size={23} />}
                color="orange"
              />
            </section>

            {error && (
              <div
                style={{
                  background: "oklch(95% 0.05 25 / 0.8)",
                  border: "1px solid oklch(75% 0.15 25 / 0.3)",
                  color: "oklch(45% 0.18 25)",
                  padding: "0.85rem 1.25rem",
                  borderRadius: "14px",
                  marginBottom: "1.5rem",
                  fontWeight: "700",
                }}
              >
                {error}
              </div>
            )}

            <section className="exam-questions-list">
              {questions.map((question, questionIndex) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  questionIndex={questionIndex}
                  selectedAnswer={answers[question.id]}
                  onSelect={handleSelect}
                  disabled={isTimeUp || saving || submitted}
                />
              ))}
            </section>

            <section className="exam-submit-card">
              <div className="exam-submit-note">
                {!isAllAnswered ? (
                  <>
                    <AlertTriangle size={18} />
                    <span>
                      {answeredCount === 0
                        ? "لطفاً به سوالات آزمون پاسخ دهید."
                        : `به ${toPersianDigits(answeredCount)} سوال از ${toPersianDigits(
                            totalQuestions,
                          )} سوال پاسخ داده‌اید.`}
                    </span>
                  </>
                ) : (
                  <>
                    <BadgeCheck size={18} />
                    <span>همه سوالات پاسخ داده شده‌اند و آزمون آماده ثبت است.</span>
                  </>
                )}
              </div>

              <div className="exam-submit-actions">
                <div className="exam-progress-chip">
                  {toPersianDigits(answeredCount)} / {toPersianDigits(totalQuestions)}
                </div>

                <AnimatedButton
                  variant={answeredCount > 0 ? "primary" : "soft"}
                  disabled={answeredCount === 0 || saving || isTimeUp}
                  onClick={handleSubmit}
                >
                  {saving
                    ? isTimeUp
                      ? "در حال ثبت خودکار..."
                      : "در حال ثبت نهایی..."
                    : "ثبت و پایان آزمون"}
                </AnimatedButton>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="exam-result-hero">
              <div className="exam-result-icon">
                <CheckCircle2 size={44} />
              </div>

              <span className="exam-result-kicker">
                {autoSubmittedDueToTime ? "پایان زمان و ثبت خودکار" : "ثبت موفق"}
              </span>
              <h2>
                {autoSubmittedDueToTime
                  ? "زمان آزمون به پایان رسید و پاسخ‌های شما با موفقیت ثبت شدند"
                  : "آزمون با موفقیت ثبت شد"}
              </h2>
              <p>
                {autoSubmittedDueToTime
                  ? "پاسخ‌هایی که تا لحظه پایان زمان آزمون وارد کرده بودید ذخیره شدند و امکان ویرایش بیشتر وجود ندارد."
                  : "پاسخ‌های شما ذخیره شد. نتیجه نهایی پس از تصحیح سوال‌های تشریحی توسط مدرس در بخش نتایج نمایش داده می‌شود."}
              </p>

              <div className="exam-score-pill">
                تعداد پاسخ‌های ثبت‌شده: {toPersianDigits(answeredCount)} از{" "}
                {toPersianDigits(totalQuestions)}
              </div>

              <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
                <Link to={`/panel/student/examresult/${examId}`}>
                  <AnimatedButton variant="primary">
                    <Award size={18} />
                    مشاهده نتیجه و کارنامه
                  </AnimatedButton>
                </Link>

                <Link to="/panel/student/exams">
                  <AnimatedButton variant="secondary">
                    بازگشت به آزمون‌ها
                  </AnimatedButton>
                </Link>
              </div>
            </section>

            <section className="exam-review-section">
              <div className="exam-section-header">
                <div>
                  <span className="exam-section-kicker">
                    <CircleHelp size={15} />
                    مرور پاسخ‌ها
                  </span>
                  <h3 className="exam-section-title">بررسی سوالات آزمون</h3>
                  <p className="exam-section-desc">
                    وضعیت پاسخ شما برای هر سوال در این بخش نمایش داده می‌شود.
                  </p>
                </div>
              </div>

              <div className="exam-review-list">
                {questions.map((question, questionIndex) => {
                  const userAnswer = answers[question.id];
                  const userAnswerText =
                    question.question_type === "multiple_choice"
                      ? question.choices?.find((choice) => choice.id === userAnswer)?.text ||
                        "بدون پاسخ"
                      : userAnswer || "بدون پاسخ";

                  return (
                    <article
                      key={question.id}
                      className="review-card review-correct"
                    >
                      <div className="review-top">
                        <div className="review-title-wrap">
                          <div className="review-icon">
                            <CheckCircle2 size={20} />
                          </div>

                          <div>
                            <h4>سوال {toPersianDigits(questionIndex + 1)}</h4>
                            <span>{userAnswer ? "پاسخ شما ثبت شد" : "پاسخی ثبت نشد"}</span>
                          </div>
                        </div>

                        <span className="review-status-badge is-correct">
                          {userAnswer ? "ثبت‌شده" : "بدون پاسخ"}
                        </span>
                      </div>

                      <p className="review-question-text">{question.text}</p>

                      <div className="review-answer-boxes">
                        <div className="review-answer-item">
                          <span className="label">پاسخ شما</span>
                          <strong>{userAnswerText}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function QuestionCard({
  question,
  questionIndex,
  selectedAnswer,
  onSelect,
  disabled,
}) {
  const isEssay = question.question_type === "essay";
  const isAnswered =
    selectedAnswer !== undefined &&
    selectedAnswer !== null &&
    (typeof selectedAnswer !== "string" || selectedAnswer.trim() !== "");

  return (
    <article className={`question-card ${disabled ? "disabled-card" : ""}`}>
      <div className="question-card-header">
        <div className="question-number-badge">
          سوال {toPersianDigits(questionIndex + 1)}
          {question.max_score && ` (${toPersianDigits(question.max_score)} نمره)`}
        </div>

        <div className={`question-status-dot ${isAnswered ? "answered" : ""}`}>
          {isAnswered ? "پاسخ داده شده" : "بدون پاسخ"}
        </div>
      </div>

      <h3 className="question-text" dir="rtl">
        {question.text}
      </h3>

      {isEssay ? (
        <textarea
          className="question-essay-input"
          rows="5"
          value={selectedAnswer || ""}
          onChange={(event) => onSelect(question.id, event.target.value)}
          disabled={disabled}
          placeholder={
            disabled
              ? "زمان آزمون به پایان رسیده است."
              : "پاسخ تشریحی خود را اینجا تایپ کنید..."
          }
        />
      ) : (
        <div className="question-options-grid">
          {(question.choices || []).map((option, optionIndex) => {
            const isSelected = selectedAnswer === option.id;

            return (
              <button
                key={option.id}
                type="button"
                className={`question-option-btn ${isSelected ? "selected" : ""}`}
                onClick={() => onSelect(question.id, option.id)}
                disabled={disabled}
              >
                <span className="option-label" dir="rtl">
                  {option.text}
                </span>
                <span className="option-letter">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}

export default StudentExam;
