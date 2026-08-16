import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import { AnimatedButton } from "./AnimatedButton";

const links = [
  { to: "/", label: "خانه" },
  { to: "/about", label: "درباره ما" },
  { to: "/courses", label: "دوره ها" },
  { to: "/contact", label: "ارتباط با ما" },
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

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand">
          <img className="navbar__logo" src="/logo.png" alt="لوگو" />
          <div className="navbar__brand-text">
            <span>آموزشگاه زبان کیش</span>
            <span style={{ fontSize: "11px", display: "block" }}>
              خوبان زنجان
            </span>
          </div>
        </Link>

        <nav className={`navbar__links${open ? " navbar__links--open" : ""}`}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`navbar__link${pathname === l.to ? " navbar__link--active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          <div className="navbar__mobile-cta">
            <AnimatedButton variant="danger">
              <Link to="/login">ورود</Link>
            </AnimatedButton>
          </div>
        </nav>

        <div className="navbar__desktop-cta">
          <Link to="/login">
            <AnimatedButton variant="danger">ورود</AnimatedButton>
          </Link>
        </div>

        <button
          className={`navbar__burger${open ? " navbar__burger--open" : ""}`}
          aria-label="منو"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
