import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useAuth0 } from "@auth0/auth0-react";
import "./GatePage.css";

/* ─── Fade-up reveal wrapper ─── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Simple button ─── */
function GateBtn({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline";
}) {
  return (
    <button
      className={`gate-btn gate-btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* ─── Stats ─── */
const STATS = [
  { value: "92%", label: "Less water than fast fashion" },
  { value: "3×", label: "Longer garment lifespan" },
  { value: "0 kg", label: "Extra textile waste generated" },
];

/* ─── Marquee items ─── */
const MARQUEE_WORDS = [
  "Pre-loved", "Sustainable", "Circular", "Curated",
  "Thrift", "Rent", "Re-wear", "Conscious", "Archive",
];

export default function GatePage() {
  const { loginWithRedirect } = useAuth0();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  // Parallax layers
  const yTitle = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const yImg1 = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const yImg2 = useTransform(scrollYProgress, [0, 1], ["0%", "-28%"]);

  const origin = window.location.origin;

  const goSignup = () =>
    loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
        redirect_uri: `${origin}/`,
      },
    });

  const goLogin = () =>
    loginWithRedirect({ authorizationParams: { redirect_uri: `${origin}/` } });

  return (
    <div className="gate-root">
      {/* ── Minimal nav ── */}
      <header className="gate-nav">
        <span className="gate-nav-brand">MAISON ORE</span>
        <div className="gate-nav-actions">
          <GateBtn variant="outline" onClick={goLogin}>Log In</GateBtn>
          <GateBtn variant="primary" onClick={goSignup}>Sign Up</GateBtn>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="gate-hero" ref={heroRef}>
        {/* Big title behind images */}
        <motion.h1 className="gate-hero-title" style={{ y: yTitle }}>
          MAISON<br />ORE
        </motion.h1>

        {/* Floating image 1 */}
        <motion.div className="gate-hero-img gate-hero-img-1" style={{ y: yImg1 }}>
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=480&q=80"
            alt="Fashion item"
          />
        </motion.div>

        {/* Floating image 2 */}
        <motion.div className="gate-hero-img gate-hero-img-2" style={{ y: yImg2 }}>
          <img
            src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&q=80"
            alt="Fashion item"
          />
        </motion.div>

        {/* Hero copy */}
        <div className="gate-hero-copy">
          <motion.p
            className="gate-hero-sub"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            Rent. Thrift. Repeat.
          </motion.p>
          <motion.p
            className="gate-hero-desc"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            High-fashion looks at low environmental cost.<br />
            Borrow what you love, return what you don't.
          </motion.p>
          <motion.div
            className="gate-hero-btns"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <GateBtn variant="primary" onClick={goSignup}>Start for Free →</GateBtn>
            <GateBtn variant="outline" onClick={goLogin}>Already a member</GateBtn>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="gate-scroll-hint"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <span>scroll</span>
          <div className="gate-scroll-line" />
        </motion.div>
      </section>

      {/* ── Marquee ── */}
      <div className="gate-marquee-wrap">
        <div className="gate-marquee">
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
            <span key={i} className="gate-marquee-item">
              {word} <span className="gate-marquee-dot">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <section className="gate-stats">
        <Reveal>
          <p className="gate-section-eyebrow">By the numbers</p>
          <h2 className="gate-section-title">Fashion without<br /><em>the footprint</em></h2>
        </Reveal>
        <div className="gate-stats-grid">
          {STATS.map((stat, i) => (
            <Reveal key={stat.value} delay={i * 0.12}>
              <div className="gate-stat-card">
                <div className="gate-stat-value">{stat.value}</div>
                <div className="gate-stat-label">{stat.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="gate-how">
        <Reveal>
          <p className="gate-section-eyebrow">Simple by design</p>
          <h2 className="gate-section-title">Three steps.<br /><em>Infinite style.</em></h2>
        </Reveal>
        <div className="gate-how-steps">
          {[
            { n: "01", head: "Browse & discover", body: "Search thousands of pre-loved pieces filtered by size, style, and proximity." },
            { n: "02", head: "Rent or buy", body: "Pay per day or purchase outright. No subscriptions, no minimum commitment." },
            { n: "03", head: "Wear & return", body: "Use it, love it, send it back. Every item goes on to its next adventure." },
          ].map((step, i) => (
            <Reveal key={step.n} delay={i * 0.12}>
              <div className="gate-step">
                <span className="gate-step-num">{step.n}</span>
                <h3 className="gate-step-head">{step.head}</h3>
                <p className="gate-step-body">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="gate-cta-band">
        <Reveal>
          <h2 className="gate-cta-title">Your wardrobe.<br />Reimagined.</h2>
          <GateBtn variant="primary" onClick={goSignup}>
            Join Maison Ore →
          </GateBtn>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="gate-footer">
        <span className="gate-footer-brand">MAISON ORE</span>
        <span className="gate-footer-copy">© 2026 Maison Ore. All rights reserved.</span>
      </footer>
    </div>
  );
}
