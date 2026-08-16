import { Link } from "react-router-dom";
import { Home, SearchX } from "lucide-react";
import "./NotFound.css";
import { AnimatedButton } from "../components/AnimatedButton";

function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-blob notfound-blob-1" />
      <div className="notfound-blob notfound-blob-2" />
      <div className="notfound-blob notfound-blob-3" />

      <div className="notfound-content">
        <div className="notfound-icon-wrap">
          <SearchX size={38} />
        </div>

        <h1 className="notfound-code">۴۰۴</h1>
        <h2 className="notfound-title">صفحه‌ای پیدا نشد!</h2>
        <p className="notfound-desc">
          صفحه‌ای که به دنبال آن هستید حذف شده یا هیچ‌وقت وجود نداشته است.
          می‌توانید به صفحه اصلی برگردید و مسیر درست را پیدا کنید.
        </p>
        <AnimatedButton variant="ghost" icon={<Home size={16} />}>
          <Link to="/">بازگشت به صفحه اصلی</Link>
        </AnimatedButton>
      </div>
    </div>
  );
}

export default NotFound;
