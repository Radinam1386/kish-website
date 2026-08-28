import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Sparkles } from "lucide-react";
import {
  gregorianToJalali,
  getPersianMonthNames,
  toPersianDigits,
  toEnglishDigits,
  toGregorianIsoDate,
  getTodayJalali,
} from "../utils/dateUtils";
import "./JalaliDatePicker.css";

const MONTHS = getPersianMonthNames();

export default function JalaliDatePicker({
  value,
  onChange,
  label,
  required = false,
  minYear = 1330,
  maxYear = 1415,
  showQuickButtons = true,
  placeholder = "انتخاب تاریخ...",
}) {
  const today = getTodayJalali();

  const [selectedYear, setSelectedYear] = useState(today.jy);
  const [selectedMonth, setSelectedMonth] = useState(today.jm);
  const [selectedDay, setSelectedDay] = useState(today.jd);

  // Sync internal state with external value if provided
  useEffect(() => {
    if (!value) return;

    const clean = toEnglishDigits(String(value).trim());
    if (clean.includes("-") && clean.split("-").length === 3) {
      // Gregorian ISO YYYY-MM-DD
      const [gy, gm, gd] = clean.split("-").map(Number);
      if (!isNaN(gy) && !isNaN(gm) && !isNaN(gd)) {
        const j = gregorianToJalali(gy, gm, gd);
        setSelectedYear(j.jy);
        setSelectedMonth(j.jm);
        setSelectedDay(j.jd);
      }
    } else if (clean.includes("/") && clean.split("/").length === 3) {
      // Jalali YYYY/MM/DD
      const [jy, jm, jd] = clean.split("/").map(Number);
      if (!isNaN(jy) && !isNaN(jm) && !isNaN(jd)) {
        setSelectedYear(jy);
        setSelectedMonth(jm);
        setSelectedDay(jd);
      }
    }
  }, [value]);

  const maxDaysInMonth = selectedMonth <= 6 ? 31 : selectedMonth <= 11 ? 30 : 29;

  const handleYearChange = (y) => {
    const yr = Number(y);
    setSelectedYear(yr);
    emitChange(yr, selectedMonth, Math.min(selectedDay, maxDaysInMonth));
  };

  const handleMonthChange = (m) => {
    const mo = Number(m);
    const maxD = mo <= 6 ? 31 : mo <= 11 ? 30 : 29;
    const newD = Math.min(selectedDay, maxD);
    setSelectedMonth(mo);
    setSelectedDay(newD);
    emitChange(selectedYear, mo, newD);
  };

  const handleDayChange = (d) => {
    const dy = Number(d);
    setSelectedDay(dy);
    emitChange(selectedYear, selectedMonth, dy);
  };

  const emitChange = (jy, jm, jd) => {
    const jalaliFormatted = `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
    const gregorianIso = toGregorianIsoDate(jy, jm, jd);
    if (onChange) {
      onChange(gregorianIso, jalaliFormatted);
    }
  };

  const handleSetToday = () => {
    setSelectedYear(today.jy);
    setSelectedMonth(today.jm);
    setSelectedDay(today.jd);
    emitChange(today.jy, today.jm, today.jd);
  };

  const handleSetTomorrow = () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const gy = tom.getFullYear();
    const gm = tom.getMonth() + 1;
    const gd = tom.getDate();
    const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
    setSelectedYear(jy);
    setSelectedMonth(jm);
    setSelectedDay(jd);
    emitChange(jy, jm, jd);
  };

  const handleSetNextWeek = () => {
    const nextW = new Date();
    nextW.setDate(nextW.getDate() + 7);
    const gy = nextW.getFullYear();
    const gm = nextW.getMonth() + 1;
    const gd = nextW.getDate();
    const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
    setSelectedYear(jy);
    setSelectedMonth(jm);
    setSelectedDay(jd);
    emitChange(jy, jm, jd);
  };

  const years = [];
  for (let y = minYear; y <= maxYear; y++) {
    years.push(y);
  }

  const days = [];
  for (let d = 1; d <= maxDaysInMonth; d++) {
    days.push(d);
  }

  const formattedDisplay = `${toPersianDigits(selectedDay)} ${MONTHS[selectedMonth - 1]} ${toPersianDigits(selectedYear)}`;

  return (
    <div className="jalali-datepicker-wrapper">
      {label && (
        <label className="jalali-datepicker-label">
          <CalendarIcon size={16} />
          <span>{label}</span>
          {required && <span className="req-star">*</span>}
        </label>
      )}

      <div className="jalali-datepicker-controls">
        {/* Day Picker */}
        <select
          value={selectedDay}
          onChange={(e) => handleDayChange(e.target.value)}
          className="date-select day-select"
          aria-label="روز"
        >
          {days.map((d) => (
            <option key={d} value={d}>
              {toPersianDigits(d)}
            </option>
          ))}
        </select>

        {/* Month Picker */}
        <select
          value={selectedMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="date-select month-select"
          aria-label="ماه"
        >
          {MONTHS.map((m, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {m}
            </option>
          ))}
        </select>

        {/* Year Picker */}
        <select
          value={selectedYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className="date-select year-select"
          aria-label="سال"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {toPersianDigits(y)}
            </option>
          ))}
        </select>
      </div>

      <div className="jalali-datepicker-footer">
        <div className="formatted-preview">
          <Sparkles size={14} className="preview-icon" />
          <span>تاریخ انتخابی:</span>
          <strong>{formattedDisplay}</strong>
        </div>

        {showQuickButtons && (
          <div className="quick-presets">
            <button
              type="button"
              className="preset-btn"
              onClick={handleSetToday}
            >
              امروز
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={handleSetTomorrow}
            >
              فردا
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={handleSetNextWeek}
            >
              هفته بعد
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
