import React from "react";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock3,
  FileText,
  Award,
  Target,
  BarChart3,
  CircleHelp,
  ChevronDown,
} from "lucide-react";
import "./StudentExamResult.css";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";

const StudentExamResult = () => {
  const exam = {
    title: "آزمون میانترم",
    subject: "English A2",
    teacher: "استاد احمدی",
    date: "۱۴۰۵/۰۵/۲۲",
    duration: "۴۵ دقیقه",
    score: 17.5,
    totalScore: 20,
    percentage: 87.5,
    totalQuestions: 20,
    correct: 17,
    wrong: 2,
    unanswered: 1,
    status: "قبول شده",
  };

  const questions = [
    {
      number: 1,
      question: "حاصل عبارت زیر کدام است؟",
      answer: "گزینه ۲",
      correctAnswer: "گزینه ۲",
      status: "correct",
    },
    {
      number: 2,
      question: "کدام گزینه یک عدد اول است؟",
      answer: "گزینه ۳",
      correctAnswer: "گزینه ۱",
      status: "wrong",
    },
    {
      number: 3,
      question: "حاصل جمع دو عدد صحیح چیست؟",
      answer: "گزینه ۱",
      correctAnswer: "گزینه ۱",
      status: "correct",
    },
    {
      number: 4,
      question: "کدام عبارت صحیح است؟",
      answer: "بدون پاسخ",
      correctAnswer: "گزینه ۴",
      status: "unanswered",
    },
  ];

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title="نتیجه آزمون"
      menuType="student"
    >
      <div className="student-exam-result-p">
        <section className="student-exam-result-p__score-card">
          <div className="student-exam-result-p__score-main">
            <div className="student-exam-result-p__score-circle">
              <div className="student-exam-result-p__score-circle-inner">
                <strong>{exam.percentage}%</strong>
                <span>درصد</span>
              </div>
            </div>

            <div className="student-exam-result-p__score-info">
              <span className="student-exam-result-p__score-label">
                نمره کسب شده
              </span>

              <strong className="student-exam-result-p__score-number">
                {exam.score}
                <small> / {exam.totalScore}</small>
              </strong>

              <span className="student-exam-result-p__score-status">
                عملکرد شما بسیار خوب بوده است.
              </span>
            </div>
          </div>

          <div className="student-exam-result-p__score-meta">
            <div className="student-exam-result-p__meta-item">
              <FileText size={19} />
              <div>
                <span>درس</span>
                <strong>{exam.subject}</strong>
              </div>
            </div>

            <div className="student-exam-result-p__meta-item">
              <Clock3 size={19} />
              <div>
                <span>مدت آزمون</span>
                <strong>{exam.duration}</strong>
              </div>
            </div>

            <div className="student-exam-result-p__meta-item">
              <Award size={19} />
              <div>
                <span>وضعیت</span>
                <strong>{exam.status}</strong>
              </div>
            </div>
          </div>
        </section>
        <div className="student-exam-result-p__stats">
          <StatCard
            title="کل سؤالات"
            value={exam.totalQuestions}
            icon={<CircleHelp />}
            color="light-blue"
          />
          <StatCard
            title="پاسخ صحیح"
            value={exam.correct}
            icon={<CheckCircle2 />}
            color="light-green"
          />
          <StatCard
            title="پاسخ غلط"
            value={exam.wrong}
            icon={<XCircle />}
            color="red"
          />
          <StatCard
            title="بدون پاسخ"
            value={exam.unanswered}
            icon={<Target />}
            color="orange"
          />
        </div>
        <section className="student-exam-result-p__section">
          <div className="student-exam-result-p__section-header">
            <div>
              <span className="student-exam-result-p__section-kicker">
                بررسی عملکرد
              </span>

              <h2>جزئیات پاسخ‌ها</h2>

              <p>وضعیت پاسخ‌های ثبت شده برای هر سؤال را مشاهده کنید.</p>
            </div>
          </div>

          <div className="student-exam-result-p__questions">
            {questions.map((item) => (
              <div
                key={item.number}
                className={`student-exam-result-p__question ${item.status}`}
              >
                <div className="student-exam-result-p__question-number">
                  {item.number}
                </div>

                <div className="student-exam-result-p__question-content">
                  <strong>{item.question}</strong>

                  <div className="student-exam-result-p__answers">
                    <span>
                      پاسخ شما:
                      <b>{item.answer}</b>
                    </span>

                    <span>
                      پاسخ صحیح:
                      <b>{item.correctAnswer}</b>
                    </span>
                  </div>
                </div>

                <div className="student-exam-result-p__question-status">
                  {item.status === "correct" && (
                    <>
                      <CheckCircle2 size={17} />
                      صحیح
                    </>
                  )}

                  {item.status === "wrong" && (
                    <>
                      <XCircle size={17} />
                      غلط
                    </>
                  )}

                  {item.status === "unanswered" && (
                    <>
                      <CircleHelp size={17} />
                      بدون پاسخ
                    </>
                  )}
                </div>

                <ChevronDown
                  className="student-exam-result-p__question-arrow"
                  size={18}
                />
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================
          Footer Summary
      ===================================================== */}

        <div className="student-exam-result-p__footer">
          <div>
            <strong>نتیجه نهایی آزمون</strong>
            <span>
              شما {exam.correct} سؤال از {exam.totalQuestions} سؤال را به درستی
              پاسخ داده‌اید.
            </span>
          </div>

          <div className="student-exam-result-p__footer-score">
            <span>نمره نهایی</span>
            <strong>
              {exam.score}
              <small> / {exam.totalScore}</small>
            </strong>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentExamResult;
