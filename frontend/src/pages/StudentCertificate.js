import React, { useEffect, useMemo, useState } from "react";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  FileImage,
  FileText,
  Printer,
  RefreshCw,
  Search,
  Star,
  User,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { api, getFullName } from "../services/api";
import { useLocation } from "react-router-dom";

import "./StudentCertificate.css";

const CERTIFICATE_WIDTH = 1280;
const CERTIFICATE_HEIGHT = 960;

const CERTIFICATE_IMAGE = "/certificates/educational-certificate.jpg";
const CERTIFICATE_POSITIONS = {
  name: {
    x: 750,
    y: 475,

    // Preview
    left: "63.23%",
    top: "49%",
  },

  grade: {
    x: 708,
    y: 540,

    // Preview
    left: "55.8%",
    top: "56.08%",
  },

  level: {
    x: 435,
    y: 609,

    // Preview
    left: "38%",
    top: "63%",
  },

  year: {
    x: 350,
    y: 675,

    // Preview
    left: "25%",
    top: "69.8%",
  },
};

/* =========================================================
   Component
========================================================= */

function StudentCertificate() {
  const [students, setStudents] = useState([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [studentSearch, setStudentSearch] = useState("");

  const location = useLocation();
  const isSecretary = location.pathname.includes("/secretary");
  const roleTitle = isSecretary ? "پنل منشی" : "پنل مدیریت";
  const menuType = isSecretary ? "secretary" : "admin";

  const [grade, setGrade] = useState("A");

  const [level, setLevel] = useState("Intermediate");

  const [year, setYear] = useState("2026");

  /* UI State */

  const [loading, setLoading] = useState(true);

  const [exporting, setExporting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  /* =========================================================
     Load Students
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadStudents = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await api.users.list();

        if (!mounted) return;

        const studentList = (data || [])
          .filter((item) => String(item.role || "").toLowerCase() === "student")
          .sort((a, b) => getFullName(a).localeCompare(getFullName(b), "fa"));

        setStudents(studentList);

        if (studentList.length > 0) {
          setSelectedStudentId(String(studentList[0].id));
        }
      } catch (error) {
        console.error(error);

        if (mounted) {
          setErrorMessage(
            error?.message || "دریافت لیست دانش‌آموزان انجام نشد.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStudents();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     Selected Student
  ========================================================= */

  const selectedStudent = useMemo(() => {
    return (
      students.find(
        (student) => String(student.id) === String(selectedStudentId),
      ) || null
    );
  }, [students, selectedStudentId]);

  /* =========================================================
     Auto Student Level
  ========================================================= */

  useEffect(() => {
    if (!selectedStudent) return;

    const studentLevel =
      selectedStudent.level ||
      selectedStudent.language_level ||
      selectedStudent.current_level;

    if (studentLevel) {
      setLevel(studentLevel);
    }
  }, [selectedStudent]);

  /* =========================================================
     Search Students
  ========================================================= */

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const name = getFullName(student).toLowerCase();

      const username = String(student.username || "").toLowerCase();

      const nationalCode = String(student.national_code || "").toLowerCase();

      const phone = String(
        student.phone_number || student.phone || "",
      ).toLowerCase();

      return (
        name.includes(query) ||
        username.includes(query) ||
        nationalCode.includes(query) ||
        phone.includes(query)
      );
    });
  }, [students, studentSearch]);

  /* =========================================================
     Success Message
  ========================================================= */

  const showSuccess = (message) => {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);
  };

  /* =========================================================
     File Name
  ========================================================= */

  const getCertificateFileName = () => {
    const studentName = selectedStudent
      ? getFullName(selectedStudent)
      : "student";

    return String(studentName)
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-");
  };

  /* =========================================================
     Load Certificate Image
  ========================================================= */

  const loadCertificateImage = () => {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        resolve(image);
      };

      image.onerror = () => {
        reject(new Error("تصویر قالب گواهی پیدا نشد."));
      };

      image.src = `${CERTIFICATE_IMAGE}?v=${Date.now()}`;
    });
  };

  /* =========================================================
     Draw Centered Text
  ========================================================= */

  const drawCenteredText = (ctx, text, x, y, options = {}) => {
    const {
      font = '500 30px Georgia, "Times New Roman", serif',
      color = "#151515",
      maxWidth = null,
    } = options;

    if (text === undefined || text === null || String(text).trim() === "") {
      return;
    }

    ctx.save();

    ctx.font = font;

    ctx.fillStyle = color;

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    let finalText = String(text);

    if (maxWidth) {
      while (
        ctx.measureText(finalText).width > maxWidth &&
        finalText.length > 1
      ) {
        finalText = finalText.slice(0, -1);
      }
    }

    ctx.fillText(finalText, x, y);

    ctx.restore();
  };

  /* =========================================================
     Create Final Certificate Canvas
  ========================================================= */

  const createCertificateCanvas = async () => {
    if (!selectedStudent) {
      throw new Error("دانش‌آموزی انتخاب نشده است.");
    }

    const image = await loadCertificateImage();

    const canvas = document.createElement("canvas");

    canvas.width = CERTIFICATE_WIDTH;

    canvas.height = CERTIFICATE_HEIGHT;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas مرورگر در دسترس نیست.");
    }

    /* -----------------------------------------
       Draw Template
    ----------------------------------------- */

    ctx.drawImage(image, 0, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);

    /* -----------------------------------------
       Student Name
    ----------------------------------------- */

    drawCenteredText(
      ctx,
      getFullName(selectedStudent),
      CERTIFICATE_POSITIONS.name.x,
      CERTIFICATE_POSITIONS.name.y,
      {
        font: '500 34px Georgia, "Times New Roman", serif',
        maxWidth: 430,
      },
    );

    /* -----------------------------------------
       Grade
    ----------------------------------------- */

    drawCenteredText(
      ctx,
      grade,
      CERTIFICATE_POSITIONS.grade.x,
      CERTIFICATE_POSITIONS.grade.y,
      {
        font: '700 27px Georgia, "Times New Roman", serif',
        maxWidth: 100,
      },
    );

    /* -----------------------------------------
       Level
    ----------------------------------------- */

    drawCenteredText(
      ctx,
      level,
      CERTIFICATE_POSITIONS.level.x,
      CERTIFICATE_POSITIONS.level.y,
      {
        font: '700 27px Georgia, "Times New Roman", serif',
        maxWidth: 180,
      },
    );

    /* -----------------------------------------
       Year
    ----------------------------------------- */

    drawCenteredText(
      ctx,
      year,
      CERTIFICATE_POSITIONS.year.x,
      CERTIFICATE_POSITIONS.year.y,
      {
        font: '700 27px Georgia, "Times New Roman", serif',
        maxWidth: 100,
      },
    );

    return canvas;
  };

  /* =========================================================
     Download PNG
  ========================================================= */

  const handleDownloadPNG = async () => {
    if (!selectedStudent) {
      alert("لطفاً ابتدا یک دانش‌آموز انتخاب کنید.");
      return;
    }

    try {
      setExporting(true);

      setErrorMessage("");

      const canvas = await createCertificateCanvas();

      const link = document.createElement("a");

      link.download = `${getCertificateFileName()}-certificate.png`;

      link.href = canvas.toDataURL("image/png");

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      showSuccess("گواهی با موفقیت دانلود شد.");
    } catch (error) {
      console.error(error);

      setErrorMessage(error?.message || "دانلود گواهی انجام نشد.");
    } finally {
      setExporting(false);
    }
  };

  /* =========================================================
     Print / PDF
  ========================================================= */

  const handlePrint = async () => {
    if (!selectedStudent) {
      alert("لطفاً ابتدا یک دانش‌آموز انتخاب کنید.");
      return;
    }

    let printWindow = null;

    try {
      /*
        اول تب باز می‌شود تا Popup Blocker
        جلوی آن را نگیرد.
      */

      printWindow = window.open("", "_blank");

      if (!printWindow) {
        alert("مرورگر اجازه باز کردن تب جدید را نداد.");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>

        <html lang="fa" dir="rtl">

          <head>

            <meta charset="UTF-8" />

            <title>
              گواهی ${getFullName(selectedStudent)}
            </title>

            <style>

              * {
                box-sizing: border-box;
              }

              html,
              body {
                margin: 0;
                padding: 0;
                width: 100%;
                min-height: 100%;
                background: #fff;
              }

              body {
                display: flex;
                align-items: center;
                justify-content: center;
              }

              img {
                display: block;
                width: 100%;
                max-width: 1280px;
                height: auto;
              }

              @page {
                size: landscape;
                margin: 0;
              }

              @media print {

                html,
                body {
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  padding: 0;
                }

                img {
                  width: 100%;
                  max-width: none;
                }

              }

            </style>

          </head>

          <body>

            <div id="certificate"></div>

          </body>

        </html>
      `);

      printWindow.document.close();

      const canvas = await createCertificateCanvas();

      const image = canvas.toDataURL("image/png");

      const imageElement = printWindow.document.createElement("img");

      imageElement.src = image;

      imageElement.alt = "Certificate";

      printWindow.document
        .getElementById("certificate")
        .appendChild(imageElement);

      imageElement.onload = () => {
        setTimeout(() => {
          printWindow.focus();

          printWindow.print();
        }, 300);
      };
    } catch (error) {
      console.error(error);

      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }

      setErrorMessage(error?.message || "صفحه چاپ ایجاد نشد.");
    }
  };

  /* =========================================================
     Reset
  ========================================================= */

  const handleReset = () => {
    setGrade("A");

    setLevel(
      selectedStudent?.level ||
        selectedStudent?.language_level ||
        selectedStudent?.current_level ||
        "Intermediate",
    );

    setYear("2026");

    showSuccess("اطلاعات گواهی بازگردانی شد.");
  };

  /* =========================================================
     Loading
  ========================================================= */

  if (loading) {
    return (
      <DashboardLayout role={roleTitle} title="صدور گواهی" menuType={menuType}>
        <div className="student-certificate-x8k4-loading">
          <div className="student-certificate-x8k4-spinner" />

          <span>در حال دریافت دانش‌آموزان...</span>
        </div>
      </DashboardLayout>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <DashboardLayout role={roleTitle} title="صدور گواهی" menuType={menuType}>
      <div className="student-certificate-x8k4-root">
        <div className="admin-students-x7k2-header">
          <div className="admin-students-x7k2-heading">
            <div className="admin-students-x7k2-heading-icon">
              <Award size={25} />
            </div>
            <div className="student-certificate-x8k4-header-content">
              <h1>صدور گواهی دانش‌آموز</h1>

              <p>
                دانش‌آموز را انتخاب کنید و گواهی را با اطلاعات او صادر کنید.
              </p>
            </div>
          </div>
        </div>
        {successMessage && (
          <div className="student-certificate-x8k4-alert student-certificate-x8k4-alert-success">
            <CheckCircle2 size={18} />

            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="student-certificate-x8k4-alert student-certificate-x8k4-alert-error">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* =================================================
            Main Layout
        ================================================= */}

        <div className="student-certificate-x8k4-layout">
          {/* =================================================
              LEFT / CONTROLS
          ================================================= */}

          <aside className="student-certificate-x8k4-controls">
            {/* =================================================
                Student Selection
            ================================================= */}

            <section className="student-certificate-x8k4-panel">
              <div className="student-certificate-x8k4-panel-title">
                <div className="student-certificate-x8k4-panel-title-icon">
                  <User size={18} />
                </div>

                <div>
                  <h2>انتخاب دانش‌آموز</h2>

                  <p>دانش‌آموز موردنظر را انتخاب کنید.</p>
                </div>
              </div>

              {/* Search */}

              <div className="student-certificate-x8k4-search">
                <Search size={17} />

                <input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="جستجوی دانش‌آموز..."
                />
              </div>

              {/* Select */}

              <div className="student-certificate-x8k4-select-wrapper">
                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                >
                  <option value="">انتخاب دانش‌آموز</option>

                  {filteredStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {getFullName(student)}
                    </option>
                  ))}
                </select>

                <ChevronDown size={17} />
              </div>

              {/* Selected Student */}

              {selectedStudent && (
                <div className="student-certificate-x8k4-selected-student">
                  <div className="student-certificate-x8k4-student-avatar">
                    {getFullName(selectedStudent)?.charAt(0) || "؟"}
                  </div>

                  <div className="student-certificate-x8k4-student-info">
                    <strong>{getFullName(selectedStudent)}</strong>

                    <span>{selectedStudent.username || "دانش‌آموز"}</span>
                  </div>

                  <CheckCircle2
                    size={19}
                    className="student-certificate-x8k4-student-check"
                  />
                </div>
              )}
            </section>

            {/* =================================================
                Certificate Fields
            ================================================= */}

            <section className="student-certificate-x8k4-panel">
              <div className="student-certificate-x8k4-panel-title">
                <div className="student-certificate-x8k4-panel-title-icon">
                  <FileText size={18} />
                </div>

                <div>
                  <h2>اطلاعات گواهی</h2>

                  <p>اطلاعات روی گواهی را تنظیم کنید.</p>
                </div>
              </div>

              <div className="student-certificate-x8k4-form">
                {/* Grade */}

                <div className="student-certificate-x8k4-field">
                  <label>نمره</label>

                  <div className="student-certificate-x8k4-input-icon-wrapper">
                    <Star size={16} />

                    <select
                      value={grade}
                      onChange={(event) => setGrade(event.target.value)}
                    >
                      <option value="A">A</option>

                      <option value="A+">A+</option>

                      <option value="A-">A-</option>

                      <option value="B">B</option>

                      <option value="B+">B+</option>

                      <option value="B-">B-</option>

                      <option value="C">C</option>
                    </select>
                  </div>
                </div>

                {/* Level */}

                <div className="student-certificate-x8k4-field">
                  <label>سطح</label>

                  <input
                    value={level}
                    onChange={(event) => setLevel(event.target.value)}
                    dir="ltr"
                    placeholder="Intermediate"
                  />
                </div>

                {/* Year */}

                <div className="student-certificate-x8k4-field">
                  <label>سال</label>

                  <input
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                    dir="ltr"
                    inputMode="numeric"
                    placeholder="2026"
                  />
                </div>
              </div>

              <button
                type="button"
                className="student-certificate-x8k4-reset-btn"
                onClick={handleReset}
              >
                <RefreshCw size={16} />
                بازگردانی
              </button>
            </section>
          </aside>

          {/* =================================================
              RIGHT / PREVIEW
          ================================================= */}

          <main className="student-certificate-x8k4-preview-area">
            <div className="student-certificate-x8k4-preview-header">
              <div>
                <span className="student-certificate-x8k4-preview-label">
                  PREVIEW
                </span>

                <h2>پیش‌نمایش گواهی</h2>
              </div>

              {selectedStudent && (
                <div className="student-certificate-x8k4-preview-student">
                  <User size={16} />

                  <span>{getFullName(selectedStudent)}</span>
                </div>
              )}
            </div>

            {/* =================================================
                Certificate Preview
            ================================================= */}

            <div className="student-certificate-x8k4-certificate-wrapper">
              <div className="student-certificate-x8k4-certificate">
                <img
                  className="student-certificate-x8k4-template"
                  src={CERTIFICATE_IMAGE}
                  alt="Certificate Template"
                  draggable="false"
                />

                {/* ============================
                    NAME
                ============================ */}

                <div
                  className="student-certificate-x8k4-overlay-name"
                  style={{
                    left: CERTIFICATE_POSITIONS.name.left,
                    top: CERTIFICATE_POSITIONS.name.top,
                  }}
                >
                  {selectedStudent
                    ? getFullName(selectedStudent)
                    : "Student Name"}
                </div>

                {/* ============================
                    GRADE
                ============================ */}

                <div
                  className="student-certificate-x8k4-overlay-grade"
                  style={{
                    left: CERTIFICATE_POSITIONS.grade.left,
                    top: CERTIFICATE_POSITIONS.grade.top,
                  }}
                >
                  {grade}
                </div>

                {/* ============================
                    LEVEL
                ============================ */}

                <div
                  className="student-certificate-x8k4-overlay-level"
                  style={{
                    left: CERTIFICATE_POSITIONS.level.left,
                    top: CERTIFICATE_POSITIONS.level.top,
                  }}
                >
                  {level}
                </div>

                {/* ============================
                    YEAR
                ============================ */}

                <div
                  className="student-certificate-x8k4-overlay-year"
                  style={{
                    left: CERTIFICATE_POSITIONS.year.left,
                    top: CERTIFICATE_POSITIONS.year.top,
                  }}
                >
                  {year}
                </div>
              </div>
            </div>

            {/* =================================================
                Export
            ================================================= */}

            <section className="student-certificate-x8k4-export-panel">
              <div className="student-certificate-x8k4-export-info">
                <div className="student-certificate-x8k4-export-icon">
                  <Download size={20} />
                </div>

                <div>
                  <h3>دریافت گواهی</h3>

                  <p>گواهی را دانلود یا برای چاپ در تب جدید باز کنید.</p>
                </div>
              </div>

              <div className="student-certificate-x8k4-export-actions">
                {/* PNG */}

                <button
                  type="button"
                  onClick={handleDownloadPNG}
                  disabled={exporting || !selectedStudent}
                  className="student-certificate-x8k4-export-btn student-certificate-x8k4-export-btn-image"
                >
                  <FileImage size={18} />
                  دانلود تصویر
                </button>

                {/* PDF */}

                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={exporting || !selectedStudent}
                  className="student-certificate-x8k4-export-btn student-certificate-x8k4-export-btn-pdf"
                >
                  <FileText size={18} />
                  چاپ / PDF
                </button>

                {/* Print */}

                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={exporting || !selectedStudent}
                  className="student-certificate-x8k4-export-btn student-certificate-x8k4-export-btn-print"
                >
                  <Printer size={18} />
                  چاپ مستقیم
                </button>
              </div>
            </section>

            {/* Export Loading */}

            {exporting && (
              <div className="student-certificate-x8k4-export-loading">
                <RefreshCw
                  size={17}
                  className="student-certificate-x8k4-export-loading-icon"
                />
                در حال آماده‌سازی...
              </div>
            )}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentCertificate;
