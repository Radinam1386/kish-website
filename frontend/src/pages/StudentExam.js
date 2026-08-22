import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  Eye,
  AlertTriangle,
  FileCheck2,
  CircleHelp,
  BadgeCheck,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import "./ExamPage.css";
import StatCard from "../components/StatCard";
import { api, storage } from "../services/api";

function ExamPage() {
  const { examId } = useParams();
  const [answers, setAnswers] = useState({});
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const isAllAnswered = answeredCount === totalQuestions;

  useEffect(() => {
    let alive = true;

    async function loadExam() {
      try {
        const data = await api.exams.studentView(examId);
        if (!alive) return;
        setExam(data.exam);
        setQuestions(data.questions || []);
      } catch (err) {
        if (alive) setError(err.message || "دریافت آزمون ناموفق بود.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadExam();

    return () => {
      alive = false;
    };
  }, [examId]);

  function handleSelect(questionId, value) {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  async function handleSubmit() {
    if (!isAllAnswered) return;
    setSaving(true);
    setError("");

    try {
      const user = storage.getUser();
      const submission = await api.submissions.create({
        exam: Number(examId),
        ...(user?.role === "student" ? {} : { student: user?.id }),
      });

      await Promise.all(
        questions.map((question) => {
          const answer = answers[question.id];
          return api.answers.create({
            submission: submission.id,
            question: question.id,
            selected_choice:
              question.question_type === "multiple_choice" ? answer : null,
            essay_text: question.question_type === "essay" ? answer : "",
          });
        }),
      );

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "ثبت پاسخ‌ها ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="پنل دانش‌آموز" title="آزمون" menuType="student">
        <div className="exam-page">در حال دریافت آزمون...</div>
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
            <section className="exam-stats-grid">
              <StatCard
                title="زمان باقی‌مانده"
                value="۴۵ دقیقه"
                icon={<Clock3 size={23} />}
                color="red"
              />
              <StatCard
                title="وضعیت پاسخ‌دهی"
                value={`${answeredCount} از ${totalQuestions} سوال`}
                icon={<Eye size={23} />}
                color="blue"
              />
              <StatCard
                title="وضعیت آزمون"
                value={isAllAnswered ? "آماده ثبت نهایی" : "در حال تکمیل"}
                icon={<FileCheck2 size={23} />}
                color="orange"
              />
            </section>

            <section className="exam-questions-list">
              {questions.map((question, questionIndex) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  questionIndex={questionIndex}
                  selectedAnswer={answers[question.id]}
                  onSelect={handleSelect}
                />
              ))}
            </section>

            <section className="exam-submit-card">
              <div className="exam-submit-note">
                {!isAllAnswered ? (
                  <>
                    <AlertTriangle size={18} />
                    <span>لطفاً برای ثبت نهایی به همه سوالات پاسخ دهید.</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck size={18} />
                    <span>
                      همه سوالات پاسخ داده شده‌اند و آزمون آماده ثبت است.
                    </span>
                  </>
                )}
              </div>

              <div className="exam-submit-actions">
                <div className="exam-progress-chip">
                  {answeredCount} / {totalQuestions}
                </div>

                {error && <div className="exam-progress-chip">{error}</div>}

                <AnimatedButton
                  variant={isAllAnswered ? "primary" : "soft"}
                  disabled={!isAllAnswered || saving}
                  onClick={handleSubmit}
                >
                  {saving ? "در حال ثبت..." : "ثبت و پایان آزمون"}
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

              <span className="exam-result-kicker">ثبت موفق</span>

              <h2>آزمون با موفقیت ثبت شد</h2>

              <p>
                پاسخ‌های شما ذخیره شد. نتیجه نهایی پس از تصحیح سوال‌های
                تشریحی در بخش نتایج نمایش داده می‌شود.
              </p>

              <div className="exam-score-pill">
                تعداد پاسخ‌های ثبت‌شده: {answeredCount} از {totalQuestions}
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
                      ? question.choices.find((choice) => choice.id === userAnswer)
                          ?.text || "بدون پاسخ"
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
                            <h4>سوال {questionIndex + 1}</h4>
                            <span>پاسخ شما ثبت شد</span>
                          </div>
                        </div>

                        <span
                          className={`review-status-badge ${
                            "is-correct"
                          }`}
                        >
                          ثبت‌شده
                        </span>
                      </div>

                      <p className="review-question-text">{question.text}</p>

                      <div className="review-answer-boxes">
                        <div className="review-answer-item">
                          <span className="label">پاسخ شما</span>
                          <strong>
                            {userAnswerText}
                          </strong>
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

function QuestionCard({ question, questionIndex, selectedAnswer, onSelect }) {
  const isEssay = question.question_type === "essay";

  return (
    <article className="question-card">
      <div className="question-card-header">
        <div className="question-number-badge">سوال {questionIndex + 1}</div>

        <div className="question-status-dot">
          {selectedAnswer ? "پاسخ داده شده" : "بدون پاسخ"}
        </div>
      </div>

      <h3 className="question-text" dir="ltr">
        {question.text}
      </h3>

      {isEssay ? (
        <textarea
          className="question-option-btn"
          rows="5"
          value={selectedAnswer || ""}
          onChange={(event) => onSelect(question.id, event.target.value)}
          placeholder="پاسخ تشریحی خود را وارد کنید..."
        />
      ) : (
        <div className="question-options-grid">
        {question.choices.map((option, optionIndex) => {
          const isSelected = selectedAnswer === option.id;

          return (
            <button
              key={option.id}
              type="button"
              className={`question-option-btn ${isSelected ? "selected" : ""}`}
              onClick={() => onSelect(question.id, option.id)}
            >
              <span className="option-label" dir="ltr">{option.text}</span>
              {/* <ChevronLeft size={18} className="option-arrow" /> */}
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

export default ExamPage;
