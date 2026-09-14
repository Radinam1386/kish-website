/**
 * Jalali (Shamsi) & Gregorian Date Utilities
 */

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

export function toEnglishDigits(value) {
  if (!value) return "";
  return String(value)
    .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
}

export function getPersianMonthNames() {
  return PERSIAN_MONTHS;
}

export function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm, jd;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

export function jalaliToGregorian(jy, jm, jd) {
  jy = Number(toEnglishDigits(jy));
  jm = Number(toEnglishDigits(jm));
  jd = Number(toEnglishDigits(jd));

  jy += 1595;
  let days =
    -355668 +
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  while (gm < 13 && days >= sal_a[gm]) {
    days -= sal_a[gm];
    gm++;
  }
  const gd = days + 1;
  return { gy, gm, gd };
}

export function toJalaliDateString(gregorianInput, usePersianDigits = false) {
  if (!gregorianInput) return "-";

  let dateObj;
  if (gregorianInput instanceof Date) {
    dateObj = gregorianInput;
  } else if (typeof gregorianInput === "string") {
    const clean = toEnglishDigits(gregorianInput.trim());
    if (/^14\d{2}[/-]\d{1,2}[/-]\d{1,2}/.test(clean)) {
      return usePersianDigits ? toPersianDigits(clean.replace(/-/g, "/")) : clean.replace(/-/g, "/");
    }

    const parts = clean.split("T")[0].split("-");
    if (parts.length === 3) {
      const gy = parseInt(parts[0], 10);
      const gm = parseInt(parts[1], 10);
      const gd = parseInt(parts[2], 10);
      if (!isNaN(gy) && !isNaN(gm) && !isNaN(gd)) {
        const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
        const formatted = `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
        return usePersianDigits ? toPersianDigits(formatted) : formatted;
      }
    }
    dateObj = new Date(gregorianInput);
  } else {
    return "-";
  }

  if (isNaN(dateObj.getTime())) return "-";

  const gy = dateObj.getFullYear();
  const gm = dateObj.getMonth() + 1;
  const gd = dateObj.getDate();
  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
  const formatted = `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
  return usePersianDigits ? toPersianDigits(formatted) : formatted;
}

export function toGregorianIsoDate(jy, jm, jd) {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

export function parseJalaliStringToGregorian(jalaliStr) {
  if (!jalaliStr) return "";
  const clean = toEnglishDigits(jalaliStr.trim()).replace(/\//g, "-");
  const parts = clean.split("-");
  if (parts.length !== 3) return jalaliStr;
  const jy = parseInt(parts[0], 10);
  const jm = parseInt(parts[1], 10);
  const jd = parseInt(parts[2], 10);
  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return jalaliStr;
  return toGregorianIsoDate(jy, jm, jd);
}

export function getTodayJalali() {
  const today = new Date();
  const gy = today.getFullYear();
  const gm = today.getMonth() + 1;
  const gd = today.getDate();
  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
  const formatted = `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
  const isoGregorian = `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
  return {
    jy,
    jm,
    jd,
    formatted,
    isoGregorian,
    monthName: PERSIAN_MONTHS[jm - 1],
  };
}
