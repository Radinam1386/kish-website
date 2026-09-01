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
  AlertCircle,
} from "lucide-react";

import "./StudentExamResult.css";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import { AnimatedButton } from "../components/AnimatedButton";
import { api, getFullName } from "../services/api";
import { toJalaliDateString } from "../utils/dateUtils";


/* =====================================================
   Helpers
===================================================== */

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};


const formatScore = (value) => {
  const number = toNumber(value);

  if (Number.isInteger(number)) {
    return String(number);
  }

  return number
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
};


const toPersianDigits = (value) => {
  return String(value ?? "").replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[digit]);
};


const getAnswerForQuestion = (answers, questionId) => {
  return answers.find((answer) => {
    const answerQuestionId =
      typeof answer.question === "object"
        ? answer.question?.id
        : answer.question;

    return Number(answerQuestionId) === Number(questionId);
  });
};


/* =====================================================
   Component
===================================================== */

const StudentExamResult = () => {
  const { examResultId } = useParams();

  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [classroom, setClassroom] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     Load Data
  ===================================================== */

  useEffect(() => {
    let alive = true;

    const loadData = async () => {
      if (!examResultId) {
        setError("شناسه نتیجه آزمون معتبر نیست.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const requestedId = Number(examResultId);

        if (!Number.isFinite(requestedId)) {
          throw new Error("شناسه آزمون معتبر نیست.");
        }

        const [submissionsData, classroomsData] = await Promise.all([
          api.submissions.list(),
          api.classrooms.list(),
        ]);

        if (!alive) return;

        const submissions = Array.isArray(submissionsData)
          ? submissionsData
          : [];

        const classrooms = Array.isArray(classroomsData)
          ? classroomsData
          : [];

        /*
         * URL ممکن است submission id یا exam id باشد.
         */
        const foundSubmission =
          submissions.find(
            (submissionItem) =>
              Number(submissionItem.id) === requestedId
          ) ||
          submissions.find(
            (submissionItem) =>
              Number(
                typeof submissionItem.exam === "object"
                  ? submissionItem.exam?.id
                  : submissionItem.exam
              ) === requestedId
          );

        const examId = foundSubmission
          ? Number(
              typeof foundSubmission.exam === "object"
                ? foundSubmission.exam?.id
                : foundSubmission.exam
            )
          : requestedId;

        if (!examId) {
          throw new Error("آزمون مربوط به این نتیجه پیدا نشد.");
        }

        let examData = null;

        try {
          examData = await api.exams.get(examId);
        } catch {
          examData = await api.exams.studentView(examId);
        }

        if (!alive) return;

        if (!examData) {
          throw new Error("اطلاعات آزمون پیدا نشد.");
        }

        setExam(examData);
        setSubmission(foundSubmission || null);

        const classroomId =
          typeof examData.classroom === "object"
            ? examData.classroom?.id
            : examData.classroom;

        const foundClassroom = classrooms.find(
          (item) => Number(item.id) === Number(classroomId)
        );

        setClassroom(foundClassroom || null);
      } catch (err) {
        if (!alive) return;

        setError(
          err?.message || "دریافت نتیجه آزمون ناموفق بود."
        );
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      alive = false;
    };
  }, [examResultId]);


  /* =====================================================
     Questions Analysis
  ===================================================== */

  const questionsAnalysis = useMemo(() => {
    if (!exam?.questions?.length) {
      return [];
    }

    const answers = Array.isArray(submission?.answers)
      ? submission.answers
      : [];

    return exam.questions.map((question, index) => {
      const answer = getAnswerForQuestion(
        answers,
        question.id
      );

      const maxScore = toNumber(
        question.max_score ?? question.points,
        1
      );

      /* -------------------------------------------------
         Multiple Choice
      ------------------------------------------------- */

      if (question.question_type === "multiple_choice") {
        const selectedChoiceId =
          typeof answer?.selected_choice === "object"
            ? answer.selected_choice?.id
            : answer?.selected_choice;

        const selectedChoice = (
          question.choices || []
        ).find(
          (choice) =>
            Number(choice.id) === Number(selectedChoiceId)
        );

        const correctChoice = (
          question.choices || []
        ).find((choice) => choice.is_correct === true);

        const hasAnswer =
          selectedChoiceId !== null &&
          selectedChoiceId !== undefined &&
          selectedChoiceId !== "";

        let status = "unanswered";

        if (hasAnswer) {
          if (
            correctChoice &&
            Number(selectedChoiceId) ===
              Number(correctChoice.id)
          ) {
            status = "correct";
          } else {
            status = "wrong";
          }
        }

        /*
         * نمره تستی را از درست/غلط بودن سؤال تعیین می‌کنیم.
         * این باعث می‌شود اگر total_score بک‌اند اشتباه بود،
         * نمایش هر سؤال همچنان درست باشد.
         */
        const score =
          status === "correct"
            ? maxScore
            : 0;

        return {
          id: question.id,
          number: index + 1,
          question: question.text || "بدون متن",
          points: maxScore,
          score,
          answer: selectedChoice?.text || "بدون پاسخ",
          correctAnswer:
            correctChoice?.text || "مشخص نشده",
          status,
          isEssay: false,
        };
      }

      /* -------------------------------------------------
         Essay
      ------------------------------------------------- */

      const essayText = String(
        answer?.essay_text ?? ""
      ).trim();

      const rawScore = answer?.score;

      const hasNumericScore =
        rawScore !== null &&
        rawScore !== undefined &&
        rawScore !== "" &&
        Number.isFinite(Number(rawScore));

      const essayScore = hasNumericScore
        ? Math.max(
            0,
            Math.min(maxScore, Number(rawScore))
          )
        : null;

      let status = "unanswered";

      if (!essayText) {
        status = "unanswered";
      } else if (essayScore === null) {
        status = "pending";
      } else if (essayScore > 0) {
        status = "correct";
      } else {
        status = "wrong";
      }

      return {
        id: question.id,
        number: index + 1,
        question: question.text || "بدون متن",
        points: maxScore,
        score: essayScore,
        answer: essayText || "بدون پاسخ",
        correctAnswer: "پاسخ تشریحی توسط مدرس تصحیح می‌شود",
        status,
        isEssay: true,
      };
    });
  }, [exam, submission]);


  /* =====================================================
     Statistics
  ===================================================== */

  const stats = useMemo(() => {
    const totalQuestions = questionsAnalysis.length;

    const correct = questionsAnalysis.filter(
      (question) => question.status === "correct"
    ).length;

    const wrong = questionsAnalysis.filter(
      (question) => question.status === "wrong"
    ).length;

    const unanswered = questionsAnalysis.filter(
      (question) => question.status === "unanswered"
    ).length;

    const pending = questionsAnalysis.filter(
      (question) => question.status === "pending"
    ).length;

    /*
     * نمره کل واقعی آزمون
     */
    const totalScore = questionsAnalysis.reduce(
      (total, question) =>
        total + toNumber(question.points, 1),
      0
    );

    /*
     * نمره را از تک تک پاسخ‌ها محاسبه می‌کنیم.
     *
     * این قسمت عمداً به total_score وابسته نیست،
     * چون ممکن است total_score در API نمره کل آزمون
     * یا مقدار اشتباه باشد.
     */
    const calculatedScore = questionsAnalysis.reduce(
      (total, question) => {
        return total + toNumber(question.score);
      },
      0
    );

    const percentage =
      totalScore > 0
        ? Math.round(
            (calculatedScore / totalScore) * 100
          )
        : 0;

    const safePercentage = Math.max(
      0,
      Math.min(100, percentage)
    );

    /*
     * اگر سؤال تشریحی هنوز تصحیح نشده باشد،
     * نتیجه کامل هنوز قطعی نیست.
     */
    const isPending =
      pending > 0 ||
      submission?.is_graded === false;

    return {
      totalQuestions,
      correct,
      wrong,
      unanswered,
      pending,
      score: calculatedScore,
      totalScore,
      percentage: safePercentage,
      isPending,
      isGraded: submission?.is_graded === true,
    };
  }, [questionsAnalysis, submission]);


  /* =====================================================
     Result Status
  ===================================================== */

  const resultStatus = useMemo(() => {
    if (stats.isPending) {
      return {
        type: "pending",
        text: "نتیجه در انتظار تکمیل تصحیح است.",
      };
    }

    if (stats.percentage >= 60) {
      return {
        type: "passed",
        text: "آزمون را با موفقیت پشت سر گذاشته‌اید.",
      };
    }

    return {
      type: "failed",
      text: "نمره شما کمتر از حد نصاب قبولی است.",
    };
  }, [stats]);


  /* =====================================================
     Loading
  ===================================================== */

  if (loading) {
    return (
      <DashboardLayout
        role="پنل دانش‌آموز"
        title="نتیجه آزمون"
        menuType="student"
      >
        <div className="student-exam-result-p__state">
          <div className="student-exam-result-p__loader" />

          <strong>
            در حال بارگذاری نتیجه آزمون...
          </strong>

          <span>
            لطفاً چند لحظه صبر کنید.
          </span>
        </div>
      </DashboardLayout>
    );
  }


  /* =====================================================
     Error
  ===================================================== */

  if (error || !exam) {
    return (
      <DashboardLayout
        role="پنل دانش‌آموز"
        title="نتیجه آزمون"
        menuType="student"
      >
        <div className="student-exam-result-p__state student-exam-result-p__state--error">
          <div className="student-exam-result-p__state-icon">
            <AlertCircle size={28} />
          </div>

          <strong>
            نتیجه آزمون در دسترس نیست
          </strong>

          <span>
            {error || "آزمون یا نتیجه‌ای یافت نشد."}
          </span>

          <Link
            to="/panel/student/exams"
            className="student-exam-result-p__state-link"
          >
            <ArrowRight size={17} />
            بازگشت به آزمون‌ها
          </Link>
        </div>
      </DashboardLayout>
    );
  }


  /* =====================================================
     Render
  ===================================================== */

  return (
    <DashboardLayout
      role="پنل دانش‌آموز"
      title="نتیجه آزمون"
      menuType="student"
    >
      <div className="student-exam-result-p">

        {/* Back */}
        <div className="student-exam-result-p__topbar">
          <Link
            to="/panel/student/exams"
            className="student-exam-result-p__back-link"
          >
            <ArrowRight size={16} />
            بازگشت به آزمون‌ها
          </Link>
        </div>


        {/* =================================================
            Score Card
        ================================================= */}

        <section className="student-exam-result-p__score-card">

          <div className="student-exam-result-p__score-main">

            <div
              className="student-exam-result-p__score-circle"
              style={{
                "--exam-result-progress": `${stats.percentage}%`,
              }}
            >
              <div className="student-exam-result-p__score-circle-inner">
                <strong>
                  {toPersianDigits(stats.percentage)}٪
                </strong>

                <span>
                  درصد
                </span>
              </div>
            </div>


            <div className="student-exam-result-p__score-info">

              <span className="student-exam-result-p__score-label">
                نمره کسب‌شده
              </span>

              <strong className="student-exam-result-p__score-number">
                {toPersianDigits(
                  formatScore(stats.score)
                )}

                <small>
                  {" "}
                  /{" "}
                  {toPersianDigits(
                    formatScore(stats.totalScore)
                  )}
                </small>
              </strong>

              <span
                className={`student-exam-result-p__score-status ${resultStatus.type}`}
              >
                {resultStatus.text}
              </span>

            </div>
          </div>


          {/* Meta */}

          <div className="student-exam-result-p__score-meta">

            <div className="student-exam-result-p__meta-item">
              <FileText size={18} />

              <div>
                <span>آزمون</span>

                <strong title={exam.title}>
                  {exam.title || "-"}
                </strong>
              </div>
            </div>


            <div className="student-exam-result-p__meta-item">
              <Target size={18} />

              <div>
                <span>کلاس</span>

                <strong title={classroom?.name}>
                  {classroom?.name ||
                    `کلاس ${exam.classroom || "-"}`}
                </strong>
              </div>
            </div>


            <div className="student-exam-result-p__meta-item">
              <Award size={18} />

              <div>
                <span>مدرس</span>

                <strong>
                  {getFullName(
                    classroom?.teacher_detail
                  ) || "-"}
                </strong>
              </div>
            </div>


            <div className="student-exam-result-p__meta-item">
              <Clock3 size={18} />

              <div>
                <span>تاریخ برگزاری</span>

                <strong>
                  {exam.date
                    ? toJalaliDateString(exam.date)
                    : "-"}
                </strong>
              </div>
            </div>

          </div>

        </section>


        {/* =================================================
            Stats
        ================================================= */}

        <div className="student-exam-result-p__stats">

          <StatCard
            title="کل سؤالات"
            value={toPersianDigits(stats.totalQuestions)}
            icon={<CircleHelp />}
            color="light-blue"
          />

          <StatCard
            title="پاسخ صحیح"
            value={toPersianDigits(stats.correct)}
            icon={<CheckCircle2 />}
            color="light-green"
          />

          <StatCard
            title="پاسخ غلط"
            value={toPersianDigits(stats.wrong)}
            icon={<XCircle />}
            color="red"
          />

          <StatCard
            title="بدون پاسخ"
            value={toPersianDigits(stats.unanswered)}
            icon={<Target />}
            color="orange"
          />

        </div>


        {/* =================================================
            Pending Notice
        ================================================= */}

        {stats.pending > 0 && (
          <div className="student-exam-result-p__pending-notice">

            <AlertCircle size={19} />

            <div>
              <strong>
                {toPersianDigits(stats.pending)} سؤال
                {" "}
                در انتظار تصحیح است
              </strong>

              <span>
                نمره نهایی پس از تصحیح تمام سؤالات
                تشریحی به‌روزرسانی می‌شود.
              </span>
            </div>

          </div>
        )}


        {/* =================================================
            Questions
        ================================================= */}

        <section className="student-exam-result-p__section">

          <div className="student-exam-result-p__section-header">

            <div>
              <span className="student-exam-result-p__section-kicker">
                بررسی عملکرد
              </span>

              <h2>
                جزئیات پاسخ‌ها
              </h2>

              <p>
                وضعیت پاسخ‌های ثبت‌شده برای هر سؤال را
                مشاهده کنید.
              </p>
            </div>

            <div className="student-exam-result-p__question-count">
              {toPersianDigits(stats.totalQuestions)}
              {" "}
              سؤال
            </div>

          </div>


          <div className="student-exam-result-p__questions">

            {questionsAnalysis.map((item) => (

              <article
                key={item.id ?? item.number}
                className={`student-exam-result-p__question ${item.status}`}
              >

                {/* Number */}

                <div className="student-exam-result-p__question-number">
                  {toPersianDigits(item.number)}
                </div>


                {/* Content */}

                <div className="student-exam-result-p__question-content">

                  <div className="student-exam-result-p__question-title">
                    {item.question}
                  </div>


                  <div className="student-exam-result-p__answers">

                    <div className="student-exam-result-p__answer-row">
                      <span>
                        پاسخ شما
                      </span>

                      <strong>
                        {item.answer}
                      </strong>
                    </div>


                    {item.correctAnswer &&
                      item.correctAnswer !== "-" && (
                        <div className="student-exam-result-p__answer-row">
                          <span>
                            {item.isEssay
                              ? "وضعیت تصحیح"
                              : "پاسخ صحیح"}
                          </span>

                          <strong>
                            {item.correctAnswer}
                          </strong>
                        </div>
                      )}

                  </div>

                </div>


                {/* Score */}

                <div className="student-exam-result-p__question-score">

                  <span>
                    نمره
                  </span>

                  <strong>
                    {item.score === null
                      ? "—"
                      : toPersianDigits(
                          formatScore(item.score)
                        )}

                    <small>
                      {" "}
                      /{" "}
                      {toPersianDigits(
                        formatScore(item.points)
                      )}
                    </small>
                  </strong>

                </div>


                {/* Status */}

                <div className="student-exam-result-p__question-status">

                  {item.status === "correct" && (
                    <>
                      <CheckCircle2 size={16} />
                      صحیح
                    </>
                  )}

                  {item.status === "wrong" && (
                    <>
                      <XCircle size={16} />
                      غلط
                    </>
                  )}

                  {item.status === "unanswered" && (
                    <>
                      <CircleHelp size={16} />
                      بدون پاسخ
                    </>
                  )}

                  {item.status === "pending" && (
                    <>
                      <Clock3 size={16} />
                      در انتظار تصحیح
                    </>
                  )}

                </div>

              </article>

            ))}

          </div>

        </section>


        {/* =================================================
            Footer
        ================================================= */}

        <div className="student-exam-result-p__footer">

          <div className="student-exam-result-p__footer-main">

            <strong>
              نتیجه نهایی آزمون
            </strong>

            <span>
              {stats.isPending ? (
                <>
                  نتیجه آزمون پس از تکمیل تصحیح
                  سؤالات تشریحی نهایی می‌شود.
                </>
              ) : (
                <>
                  از{" "}
                  <b>
                    {toPersianDigits(
                      stats.totalQuestions
                    )}
                  </b>{" "}
                  سؤال،{" "}
                  <b>
                    {toPersianDigits(stats.correct)}
                  </b>{" "}
                  سؤال را به‌طور کامل درست پاسخ داده‌اید.
                </>
              )}
            </span>

          </div>


          <div className="student-exam-result-p__footer-score">

            <span>
              نمره نهایی
            </span>

            <strong>
              {toPersianDigits(
                formatScore(stats.score)
              )}

              <small>
                {" "}
                /{" "}
                {toPersianDigits(
                  formatScore(stats.totalScore)
                )}
              </small>
            </strong>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default StudentExamResult;