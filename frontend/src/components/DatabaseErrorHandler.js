import "./DatabaseErrorHandler.css";

export default function DatabaseErrorHandler({ error, onClose }) {
  if (!error) return null;

  function getErrorInfo(error) {
    const status =
      error?.response?.status ||
      error?.status ||
      error?.statusCode ||
      null;

    const responseData =
      error?.response?.data ||
      error?.data ||
      null;

    const rawMessage =
      responseData?.detail ||
      responseData?.message ||
      responseData?.error ||
      error?.message ||
      "";

    const message = String(rawMessage).toLowerCase();

    // خطاهای دیتابیس
    if (
      status === 500 ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      message.includes("database") ||
      message.includes("db error") ||
      message.includes("db_error") ||
      message.includes("connection") ||
      message.includes("operationalerror") ||
      message.includes("integrityerror") ||
      message.includes("programmingerror") ||
      message.includes("psycopg") ||
      message.includes("mysql") ||
      message.includes("sqlite")
    ) {
      return {
        type: "database",
        title: "خطا در ارتباط با سرور",
        message:
          "در حال حاضر ارتباط با پایگاه داده برقرار نیست. لطفاً چند لحظه بعد دوباره تلاش کنید.",
      };
    }

    // خطای شبکه
    if (
      message.includes("network") ||
      message.includes("failed to fetch") ||
      message.includes("fetch failed") ||
      message.includes("networkerror")
    ) {
      return {
        type: "network",
        title: "خطا در ارتباط با سرور",
        message:
          "ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت یا شبکه را بررسی کنید.",
      };
    }

    // اطلاعات ورود اشتباه
    if (status === 400 || status === 401) {
      return {
        type: "auth",
        title: "ورود ناموفق",
        message:
          rawMessage || "نام کاربری یا رمز عبور واردشده صحیح نیست.",
      };
    }

    // دسترسی غیرمجاز
    if (status === 403) {
      return {
        type: "permission",
        title: "دسترسی غیرمجاز",
        message: "شما اجازه انجام این عملیات را ندارید.",
      };
    }

    // پیدا نشدن سرویس یا API
    if (status === 404) {
      return {
        type: "server",
        title: "سرویس پیدا نشد",
        message:
          "سرویس موردنظر در دسترس نیست. لطفاً بعداً دوباره تلاش کنید.",
      };
    }

    // خطای عمومی
    return {
      type: "error",
      title: "خطایی رخ داد",
      message: rawMessage || "عملیات با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
    };
  }

  const errorInfo = getErrorInfo(error);

  return (
    <div
      className={`database-error-handler ${errorInfo.type}`}
      role="alert"
    >
      <div className="database-error-handler__icon">
        {errorInfo.type === "database" && "⚠️"}
        {errorInfo.type === "network" && "🌐"}
        {errorInfo.type === "auth" && "🔐"}
        {errorInfo.type === "permission" && "🚫"}
        {errorInfo.type === "server" && "🖥️"}
        {errorInfo.type === "error" && "⚠️"}
      </div>

      <div className="database-error-handler__content">
        <strong className="database-error-handler__title">
          {errorInfo.title}
        </strong>

        <p className="database-error-handler__message">
          {errorInfo.message}
        </p>
      </div>

      {onClose && (
        <button
          type="button"
          className="database-error-handler__close"
          onClick={onClose}
          aria-label="بستن پیام خطا"
        >
          ×
        </button>
      )}
    </div>
  );
}
