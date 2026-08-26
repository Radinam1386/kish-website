import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock3,
  FileText,
  Award,
  Target,
  CircleHelp,
} from "lucide-react";
import "./StudentExamResult.css";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";

const StudentExamResult = () => {
  const { examResultId } = useParams();

  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadData() {
      if (!examResultId) return;

      try {
        setLoading(true);
        setError("");

        const [submissionsData, classroomsData] = await Promise.all([
          api.submissions.list(),
          api.classrooms.list(),
        ]);

        const foundSubmission = (submissionsData || []).find(
          (s) => s.exam === Number(examResultId) || s.id === Number(examResultId),
        );

        const examIdToFetch = foundSubmission ? foundSubmission.exam : Number(examResultId);

        let examData = null;
        try {
          examData = await api.exams.get(examIdToFetch);
        } catch {
          examData = await api.exams.studentView(examIdToFetch);
        }

        if (!alive) return;

        setSubmission(foundSubmission || null);
        setExam(examData);

        const cls = (classroomsData || []).find(
          (c) => c.id === examData?.classroom,
        );
        setClassroom(cls || null);
      } catch (err) {
        if (alive) setError(err.message || "دریافت نتیجه آزمون ناموفق بود.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();

    return () => {
      alive = false;
    };
  }, [examResultId]);

  const questionsAnalysis = useMemo(() => {
    if (!exam || !exam.questions) return [];

    const answers = submission?.answers || [];

    return exam.questions.map((q, idx) => {
      const studentAnswer = answers.find(
        (a) => a.question === q.id || a.question?.id === q.id,
      );

      let studentAnswerText = "بدون پاسخ";
      let correctAnswerText = "-";
      let status = "unanswered";

      if (q.question_type === "multiple_choice") {
        const selectedChoice = q.choices?.find(
          (c) => c.id === studentAnswer?.selected_choice,
        );
        if (selectedChoice) {
          studentAnswerText = selectedChoice.text;
        }

        const correctChoice = q.choices?.find((c) => c.is_correct);
        if (correctChoice) {
          correctAnswerText = correctChoice.text;
        }

        if (!studentAnswer || !studentAnswer.selected_choice) {
          status = "unanswered";
        } else if (correctChoice && studentAnswer.selected_choice === correctChoice.id) {
          status = "correct";
        } else if (studentAnswer.score !== null && studentAnswer.score > 0) {
          status = "correct";
        } else {
          status = "wrong";
        }
      } else {
        studentAnswerText = studentAnswer?.text_answer || "بدون پاسخ";
        correctAnswerText = "پاسخ تشریحی";
        if (!studentAnswer?.text_answer) {
          status = "unanswered";
        } else if (studentAnswer.score !== null && studentAnswer.score > 0) {
          status = "correct";
        } else if (studentAnswer.score === 0) {
          status = "wrong";
        } else {
          status = "unanswered";
        }
      }

      return {
        number: idx + 1,
        question: q.text,
        points: q.points,
        score: studentAnswer?.score,
        answer: studentAnswerText,
        correctAnswer: correctAnswerText,
        status,
      };
    });
  }, [exam, submission]);

  const stats = useMemo(() => {
    const totalQuestions = questionsAnalysis.length;
    const correct = questionsAnalysis.filter((q) => q.status === "correct").length;
    const wrong = questionsAnalysis.filter((q) => q.status === "wrong").length;
    const unanswered = questionsAnalysis.filter((q) => q.status === "unanswered").length;

    const totalPossibleScore =
      (exam?.questions || []).reduce(
        (acc, q) => acc + Number(q.max_score || q.points || 1),
        0,
      ) || 20;

    const actualScore =
      submission?.total_score !== null && submission?.total_score !== undefined
        ? Number(submission.total_score)
        : correct;

    const percentage = totalPossibleScore > 0 ? Math.round((actualScore / totalPossibleScore) * 100) : 0;

    return {
      totalQuestions,
      correct,
      wrong,
      unanswered,
      score: actualScore,
      totalScore: totalPossibleScore,
      percentage,
      isGraded: submission?.is_graded,
    };
  }, [questionsAnalysis, exam, submission]);

  if (loading) {
    return (
      <DashboardLayout role="پنل دانش‌آموز" title="نتیجه آزمون" menuType="student">
        <div style={{ padding: "3rem", textAlign: "center" }}>
          در حال بارگذاری نتایج آزمون...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !exam) {
    return (
      <DashboardLayout role="پنل دانش‌آموز" title="نتیجه آزمون" menuType="student">
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--danger, #ef4444)", marginBottom: "1.5rem" }}>
            {error || "آزمون یا نتیجه‌ای یافت نشد."}
          </p>
          <Link to="/panel/student/exams">
            <AnimatedButton variant="primary">
              <ArrowRight size={17} />
              بازگشت به آزمون‌ها
            </AnimatedButton>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title="نتیجه آزمون"
      menuType="student"
    >
      <div className="student-exam-result-p">
        <div style={{ marginBottom: "1.5rem" }}>
          <Link to="/panel/student/exams" style={{ textDecoration: "none" }}>
            <AnimatedButton variant="ghost" size="small">
              <ArrowRight size={16} />
              بازگشت به لیست آزمون‌ها
            </AnimatedButton>
          </Link>
        </div>

        <section className="student-exam-result-p__score-card">
          <div className="student-exam-result-p__score-main">
            <div className="student-exam-result-p__score-circle">
              <div className="student-exam-result-p__score-circle-inner">
                <strong>{stats.percentage}%</strong>
                <span>درصد</span>
              </div>
            </div>

            <div className="student-exam-result-p__score-info">
              <span className="student-exam-result-p__score-label">
                نمره کسب شده
              </span>

              <strong className="student-exam-result-p__score-number">
                {stats.score}
                <small> / {stats.totalScore}</small>
              </strong>

              <span className="student-exam-result-p__score-status">
                {submission?.is_graded
                  ? stats.percentage >= 60
                    ? "آزمون با موفقیت پاس شد."
                    : "نمره کمتر از حد نصاب قبولی است."
                  : "آزمون ثبت شد (در انتظار تصحیح سوالات تشریحی)."}
              </span>
            </div>
          </div>

          <div className="student-exam-result-p__score-meta">
            <div className="student-exam-result-p__meta-item">
              <FileText size={19} />
              <div>
                <span>آزمون</span>
                <strong>{exam.title}</strong>
              </div>
            </div>

            <div className="student-exam-result-p__meta-item">
              <Clock3 size={19} />
              <div>
                <span>کلاس</span>
                <strong>{classroom?.name || `کلاس ${exam.classroom}`}</strong>
              </div>
            </div>

            <div className="student-exam-result-p__meta-item">
              <Award size={19} />
              <div>
                <span>مدرس</span>
                <strong>{getFullName(classroom?.teacher_detail) || "-"}</strong>
              </div>
            </div>
          </div>
        </section>

        <div className="student-exam-result-p__stats">
          <StatCard
            title="کل سؤالات"
            value={stats.totalQuestions}
            icon={<CircleHelp />}
            color="light-blue"
          />
          <StatCard
            title="پاسخ صحیح"
            value={stats.correct}
            icon={<CheckCircle2 />}
            color="light-green"
          />
          <StatCard
            title="پاسخ غلط"
            value={stats.wrong}
            icon={<XCircle />}
            color="red"
          />
          <StatCard
            title="بدون پاسخ"
            value={stats.unanswered}
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
            {questionsAnalysis.map((item) => (
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
                      پاسخ شما: <b>{item.answer}</b>
                    </span>

                    {item.correctAnswer !== "-" && (
                      <span>
                        پاسخ صحیح: <b>{item.correctAnswer}</b>
                      </span>
                    )}
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
              شما {stats.correct} سؤال از {stats.totalQuestions} سؤال را به درستی
              پاسخ داده‌اید.
            </span>
          </div>

          <div className="student-exam-result-p__footer-score">
            <span>نمره نهایی</span>
            <strong>
              {stats.score}
              <small> / {stats.totalScore}</small>
            </strong>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentExamResult;
