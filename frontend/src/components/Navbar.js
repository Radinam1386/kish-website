import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Home, Users, BookOpen, Phone, LogIn } from "lucide-react";
import "./Navbar.css";
import { AnimatedButton } from "./AnimatedButton";

const links = [
  {
    to: "/",
    label: "خانه",
    icon: <Home size={19} />,
  },
  {
    to: "/about",
    label: "درباره ما",
    icon: <Users size={19} />,
  },
  {
    to: "/courses",
    label: "دوره ها",
    icon: <BookOpen size={19} />,
  },
  {
    to: "/contact",
    label: "ارتباط با ما",
    icon: <Phone size={19} />,
  },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <header className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
        <div className="container navbar__inner">

          {/* =========================
              Brand
          ========================== */}
          <Link
            to="/"
            className="navbar__brand"
            onClick={handleClose}
          >
            <img
              className="navbar__logo"
              src="/logo.png"
              alt="لوگو آموزشگاه زبان کیش"
            />

            <div className="navbar__brand-text">
              <span>آموزشگاه زبان کیش</span>

              <span
                style={{
                  fontSize: "11px",
                  display: "block",
                }}
              >
                خوبان زنجان
              </span>
            </div>
          </Link>

          {/* =========================
              Desktop Navigation
          ========================== */}
          <nav className="navbar__links">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`navbar__link${
                  pathname === link.to
                    ? " navbar__link--active"
                    : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* =========================
              Desktop Login
          ========================== */}
          <div className="navbar__desktop-cta">
            <Link to="/login">
              <AnimatedButton variant="danger">
                ورود
              </AnimatedButton>
            </Link>
          </div>

          {/* =========================
              Mobile Menu Button
          ========================== */}
          <button
            className={`navbar__burger${
              open ? " navbar__burger--open" : ""
            }`}
            aria-label="باز کردن منو"
            aria-expanded={open}
            type="button"
            onClick={() => setOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* =====================================================
          Mobile Navigation Drawer
      ====================================================== */}

      {open && (
        <div
          className="navbar__mobile-overlay"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`navbar__mobile-drawer${
          open ? " navbar__mobile-drawer--open" : ""
        }`}
        aria-hidden={!open}
      >
        {/* =========================
            Mobile Brand
        ========================== */}
        <div className="navbar__mobile-brand">
          <div className="navbar__mobile-brand-flex">
            <img
              src="/logo.png"
              className="navbar__mobile-logo"
              alt="Kish Institute"
            />

            <div className="navbar__mobile-brand-text">
              <strong>آموزشگاه زبان کیش</strong>

              <small>خوبان زنجان</small>
            </div>
          </div>

          <button
            className="navbar__mobile-close"
            type="button"
            onClick={handleClose}
            aria-label="بستن منو"
          >
            <X size={22} />
          </button>
        </div>

        {/* =========================
            Mobile Navigation
        ========================== */}
        <nav className="navbar__mobile-nav">
          <div className="navbar__mobile-nav-label">
            منوی اصلی
          </div>

          {links.map((link) => {
            const active = pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`navbar__mobile-link${
                  active
                    ? " navbar__mobile-link--active"
                    : ""
                }`}
                onClick={handleClose}
              >
                <span className="navbar__mobile-link-icon">
                  {link.icon}
                </span>

                <span className="navbar__mobile-link-text">
                  {link.label}
                </span>

                <span className="navbar__mobile-link-indicator" />
              </Link>
            );
          })}
        </nav>

        {/* =========================
            Mobile Login
        ========================== */}
        <div className="navbar__mobile-bottom">
          <Link
            to="/login"
            className="navbar__mobile-login"
            onClick={handleClose}
          >
            <span className="navbar__mobile-login-icon">
              <LogIn size={19} />
            </span>

            <span>ورود به پنل کاربری</span>
          </Link>

          <div className="navbar__mobile-footer">
            <span>آموزشگاه زبان کیش</span>
            <small>خوبان زنجان</small>
          </div>
        </div>
      </aside>
    </>
  );
}
