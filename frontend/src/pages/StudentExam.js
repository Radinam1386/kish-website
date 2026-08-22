import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Eye,
  AlertTriangle,
  FileCheck2,
  ChevronLeft,
  CircleHelp,
  BadgeCheck,
  XCircle,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { AnimatedButton } from "../components/AnimatedButton";
import "./ExamPage.css";
import StatCard from "../components/StatCard";

const QUESTIONS = [
  {
    id: 1,
    text: "Which sentence is grammatically correct?",
    options: [
      "She don't like coffee.",
      "She doesn't likes coffee.",
      "She doesn't like coffee.",
      "She not like coffee.",
    ],
    answer: 2,
  },
  {
    id: 2,
    text: "Choose the correct past tense of 'go':",
    options: ["goed", "gone", "went", "going"],
    answer: 2,
  },
  {
    id: 3,
    text: "What is the meaning of 'enormous'?",
    options: ["tiny", "very large", "average", "colorful"],
    answer: 1,
  },
];

function ExamPage() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = QUESTIONS.length;
  const isAllAnswered = answeredCount === totalQuestions;

  const score = useMemo(() => {
    if (!submitted) return 0;
    return QUESTIONS.filter((q) => answers[q.id] === q.answer).length;
  }, [submitted, answers]);

  function handleSelect(questionId, optionIndex) {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  }

  function handleSubmit() {
    if (!isAllAnswered) return;
    setSubmitted(true);
  }

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title="آزمون: English A2 — Midterm"
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
              {QUESTIONS.map((question, questionIndex) => (
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

                <AnimatedButton
                  variant={isAllAnswered ? "primary" : "soft"}
                  disabled={!isAllAnswered}
                  onClick={handleSubmit}
                >
                  ثبت و پایان آزمون
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
                پاسخ‌های شما ذخیره شد و نتیجه نهایی بر اساس پاسخ‌های ثبت‌شده
                محاسبه گردید.
              </p>

              <div className="exam-score-pill">
                نمره نهایی شما: {score} از {totalQuestions}
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
                {QUESTIONS.map((question, questionIndex) => {
                  const isCorrect = answers[question.id] === question.answer;
                  const userAnswer = answers[question.id];

                  return (
                    <article
                      key={question.id}
                      className={`review-card ${
                        isCorrect ? "review-correct" : "review-wrong"
                      }`}
                    >
                      <div className="review-top">
                        <div className="review-title-wrap">
                          <div className="review-icon">
                            {isCorrect ? (
                              <CheckCircle2 size={20} />
                            ) : (
                              <XCircle size={20} />
                            )}
                          </div>

                          <div>
                            <h4>سوال {questionIndex + 1}</h4>
                            <span>
                              {isCorrect ? "پاسخ صحیح ثبت شده" : "پاسخ نادرست"}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`review-status-badge ${
                            isCorrect ? "is-correct" : "is-wrong"
                          }`}
                        >
                          {isCorrect ? "✓ صحیح" : "✗ اشتباه"}
                        </span>
                      </div>

                      <p className="review-question-text">{question.text}</p>

                      <div className="review-answer-boxes">
                        <div className="review-answer-item">
                          <span className="label">پاسخ شما</span>
                          <strong>
                            {typeof userAnswer === "number"
                              ? question.options[userAnswer]
                              : "بدون پاسخ"}
                          </strong>
                        </div>

                        {!isCorrect && (
                          <div className="review-answer-item correct-answer">
                            <span className="label">پاسخ صحیح</span>
                            <strong>{question.options[question.answer]}</strong>
                          </div>
                        )}
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
  return (
    <article className="question-card">
      <div className="question-card-header">
        <div className="question-number-badge">سوال {questionIndex + 1}</div>

        <div className="question-status-dot">
          {typeof selectedAnswer === "number" ? "پاسخ داده شده" : "بدون پاسخ"}
        </div>
      </div>

      <h3 className="question-text" dir="ltr">
        {question.text}
      </h3>

      <div className="question-options-grid">
        {question.options.map((option, optionIndex) => {
          const isSelected = selectedAnswer === optionIndex;

          return (
            <button
              key={optionIndex}
              type="button"
              className={`question-option-btn ${isSelected ? "selected" : ""}`}
              onClick={() => onSelect(question.id, optionIndex)}
            >
              <span className="option-label" dir="ltr">{option}</span>
              {/* <ChevronLeft size={18} className="option-arrow" /> */}
              <span className="option-letter">
                {String.fromCharCode(65 + optionIndex)}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

export default ExamPage;
