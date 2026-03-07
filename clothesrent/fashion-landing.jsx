import { useState, useEffect, useRef } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const NAV_LINKS = ["Home", "Shop", "New Arrivals", "Men", "Women", "Contact"];

const PRODUCTS = [
  { id: 1, name: "Obsidian Trench", category: "Women · Outerwear", price: "$485", badge: "New" },
  { id: 2, name: "Ivory Linen Shirt", category: "Men · Tops", price: "$210", badge: null },
  { id: 3, name: "Slate Wool Blazer", category: "Men · Tailoring", price: "$620", badge: "New" },
  { id: 4, name: "Cream Slip Dress", category: "Women · Dresses", price: "$340", badge: null },
  { id: 5, name: "Charcoal Wide-Leg", category: "Men · Trousers", price: "$295", badge: "New" },
  { id: 6, name: "Ecru Knit Set", category: "Women · Knitwear", price: "$375", badge: null },
  { id: 7, name: "Bone Leather Jacket", category: "Women · Outerwear", price: "$890", badge: "Limited" },
  { id: 8, name: "Ash Cashmere Coat", category: "Men · Outerwear", price: "$1,150", badge: "Limited" },
];

const FOOTER_LINKS = {
  Shop: ["New Arrivals", "Women", "Men", "Accessories", "Sale"],
  Help: ["Size Guide", "Shipping", "Returns", "Contact Us", "FAQ"],
  Brand: ["Our Story", "Sustainability", "Press", "Careers", "Stockists"],
};

// ─── PALETTE COLOURS (inline style helpers) ──────────────────────────────────
// Tailwind classes are used for layout; CSS vars for brand palette.

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');

  :root {
    --cream: #F7F4EF;
    --parchment: #EDE8DF;
    --charcoal: #1C1C1C;
    --warm-grey: #9A948A;
    --mid-grey: #C8C4BC;
    --accent: #B8A898;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--cream);
    color: var(--charcoal);
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    overflow-x: hidden;
  }

  .font-display { font-family: 'Cormorant Garamond', serif; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: var(--parchment); }
  ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 2px; }

  /* ── Navbar ── */
  .navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 0 3rem;
    height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease;
  }
  .navbar.scrolled {
    background: rgba(247, 244, 239, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 1px 0 rgba(28,28,28,0.07);
  }
  .nav-link {
    font-size: 0.72rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--charcoal);
    text-decoration: none;
    position: relative;
    padding-bottom: 2px;
    transition: opacity 0.2s;
  }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 0; height: 1px;
    background: var(--charcoal);
    transition: width 0.3s ease;
  }
  .nav-link:hover::after { width: 100%; }

  /* ── Hero ── */
  .hero {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding-top: 68px;
    position: relative;
    overflow: hidden;
  }
  .hero-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 6rem 4rem 6rem 4rem;
  }
  .hero-right {
    background: var(--parchment);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .hero-eyebrow {
    font-size: 0.68rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--warm-grey);
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .hero-eyebrow::before {
    content: '';
    display: block;
    width: 32px;
    height: 1px;
    background: var(--warm-grey);
  }
  .hero-title {
    font-size: clamp(3.2rem, 5.5vw, 6rem);
    font-weight: 300;
    line-height: 1.02;
    letter-spacing: -0.02em;
    margin-bottom: 2rem;
  }
  .hero-title em {
    font-style: italic;
    color: var(--warm-grey);
  }
  .hero-sub {
    font-size: 0.9rem;
    line-height: 1.8;
    color: var(--warm-grey);
    max-width: 380px;
    margin-bottom: 3rem;
    font-weight: 300;
    letter-spacing: 0.03em;
  }
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--charcoal);
    color: var(--cream);
    font-family: 'Jost', sans-serif;
    font-size: 0.72rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    padding: 1rem 2.25rem;
    border: none;
    cursor: pointer;
    transition: background 0.3s, transform 0.2s, gap 0.3s;
    font-weight: 400;
  }
  .btn-primary:hover {
    background: #2e2e2e;
    gap: 1.25rem;
  }
  .btn-primary svg { transition: transform 0.3s; }
  .btn-primary:hover svg { transform: translateX(4px); }

  .btn-outline {
    display: inline-flex;
    align-items: center;
    background: transparent;
    color: var(--charcoal);
    font-family: 'Jost', sans-serif;
    font-size: 0.72rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--charcoal);
    cursor: pointer;
    transition: background 0.3s, color 0.3s;
    font-weight: 400;
  }
  .btn-outline:hover {
    background: var(--charcoal);
    color: var(--cream);
  }

  /* hero image placeholder */
  .hero-img-placeholder {
    width: 72%;
    aspect-ratio: 3/4;
    background: linear-gradient(160deg, var(--mid-grey) 0%, var(--accent) 100%);
    position: relative;
    overflow: hidden;
  }
  .hero-img-placeholder::before {
    content: 'IMAGE';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    letter-spacing: 0.25em;
    color: rgba(255,255,255,0.5);
    font-family: 'Jost', sans-serif;
  }
  /* decorative circle */
  .hero-deco-circle {
    position: absolute;
    width: 320px; height: 320px;
    border-radius: 50%;
    border: 1px solid rgba(28,28,28,0.08);
    top: -80px; right: -80px;
    pointer-events: none;
  }

  /* ── Section header ── */
  .section-eyebrow {
    font-size: 0.68rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--warm-grey);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .section-eyebrow::before {
    content: '';
    display: inline-block;
    width: 24px; height: 1px;
    background: var(--warm-grey);
  }

  /* ── Marquee / Product Slider ── */
  .marquee-wrapper {
    overflow: hidden;
    position: relative;
    padding: 1.5rem 0;
  }
  .marquee-track {
    display: flex;
    gap: 1.5rem;
    will-change: transform;
    animation: marquee 40s linear infinite;
  }
  .marquee-track:hover { animation-play-state: paused; }
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  /* ── Product Card ── */
  .product-card {
    flex: 0 0 300px;
    background: var(--cream);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    border: 1px solid transparent;
  }
  .product-card:hover {
    transform: translateY(-6px);
    border-color: var(--mid-grey);
  }
  .product-card:hover .card-overlay { opacity: 1; }
  .product-card:hover .card-img-inner { transform: scale(1.04); }

  .card-img-wrap {
    width: 100%;
    aspect-ratio: 3/4;
    overflow: hidden;
    position: relative;
  }
  .card-img-inner {
    width: 100%;
    height: 100%;
    background: linear-gradient(160deg, var(--parchment) 0%, var(--mid-grey) 100%);
    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    color: rgba(28,28,28,0.25);
    font-family: 'Jost', sans-serif;
  }
  .card-overlay {
    position: absolute;
    inset: 0;
    background: rgba(28,28,28,0.18);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 1.5rem;
    opacity: 0;
    transition: opacity 0.35s ease;
  }

  .card-badge {
    position: absolute;
    top: 1rem; left: 1rem;
    background: var(--charcoal);
    color: var(--cream);
    font-size: 0.58rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 0.28rem 0.6rem;
    font-family: 'Jost', sans-serif;
  }
  .card-body {
    padding: 1.1rem 0.75rem 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .card-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem;
    font-weight: 400;
    letter-spacing: 0.01em;
  }
  .card-cat {
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    color: var(--warm-grey);
    margin-top: 0.2rem;
    text-transform: uppercase;
  }
  .card-price {
    font-size: 0.82rem;
    letter-spacing: 0.06em;
    font-weight: 400;
    color: var(--charcoal);
  }

  /* ── Divider ── */
  .divider {
    height: 1px;
    background: var(--parchment);
    margin: 0 4rem;
  }

  /* ── Footer ── */
  footer {
    background: var(--charcoal);
    color: var(--cream);
    padding: 5rem 4rem 2.5rem;
  }
  .footer-brand {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    font-weight: 300;
    letter-spacing: 0.08em;
    margin-bottom: 0.5rem;
  }
  .footer-tagline {
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 3rem;
  }
  .footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 2rem;
    padding-bottom: 3rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .footer-col-head {
    font-size: 0.65rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 1.25rem;
    font-weight: 400;
  }
  .footer-link {
    display: block;
    font-size: 0.82rem;
    color: rgba(247,244,239,0.55);
    text-decoration: none;
    margin-bottom: 0.65rem;
    letter-spacing: 0.04em;
    transition: color 0.2s;
    font-weight: 300;
  }
  .footer-link:hover { color: var(--cream); }
  .footer-bottom {
    padding-top: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.68rem;
    color: rgba(247,244,239,0.3);
    letter-spacing: 0.08em;
  }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .anim-1 { animation: fadeUp 0.8s ease both; animation-delay: 0.1s; }
  .anim-2 { animation: fadeUp 0.8s ease both; animation-delay: 0.28s; }
  .anim-3 { animation: fadeUp 0.8s ease both; animation-delay: 0.46s; }
  .anim-4 { animation: fadeUp 0.8s ease both; animation-delay: 0.64s; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .hero { grid-template-columns: 1fr; }
    .hero-right { display: none; }
    .footer-grid { grid-template-columns: 1fr 1fr; }
    .navbar { padding: 0 1.5rem; }
    .hero-left { padding: 5rem 1.5rem 4rem; }
  }
`;

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
      {/* Brand */}
      <a href="#" className="font-display" style={{ fontSize: "1.45rem", fontWeight: 300, letterSpacing: "0.1em", textDecoration: "none", color: "var(--charcoal)" }}>
        MAISON·ORÉ
      </a>

      {/* Links */}
      <div style={{ display: "flex", gap: "2.25rem" }}>
        {NAV_LINKS.map((l) => (
          <a key={l} href="#" className="nav-link">{l}</a>
        ))}
      </div>

      {/* CTA */}
      <button className="btn-outline" style={{ padding: "0.55rem 1.25rem", fontSize: "0.68rem" }}>
        Sign In
      </button>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="hero">
      {/* Left copy */}
      <div className="hero-left">
        <div className="hero-eyebrow anim-1">SS 2025 Collection</div>

        <h1 className="hero-title font-display anim-2">
          Wear the<br />
          <em>Silence</em><br />
          Between
        </h1>

        <p className="hero-sub anim-3">
          Elevated wardrobe essentials crafted for those who move through the world with quiet intention.
          Every piece, a conversation between fabric and form.
        </p>

        <div className="anim-4" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button className="btn-primary">
            Shop Now
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M1 5h12M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="btn-outline">Explore</button>
        </div>
      </div>

      {/* Right image */}
      <div className="hero-right">
        <div className="hero-deco-circle" />
        <div className="hero-img-placeholder">IMAGE</div>
        {/* floating pill */}
        <div style={{
          position: "absolute", bottom: "2.5rem", left: "2rem",
          background: "var(--cream)", padding: "1rem 1.4rem",
          boxShadow: "0 4px 24px rgba(28,28,28,0.08)",
          maxWidth: 200,
        }}>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--warm-grey)", marginBottom: "0.3rem" }}>Featured</div>
          <div className="font-display" style={{ fontSize: "1rem", fontWeight: 400 }}>Obsidian Trench</div>
          <div style={{ fontSize: "0.75rem", color: "var(--warm-grey)", marginTop: "0.2rem" }}>$485</div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: typeof PRODUCTS[number] }) {
  return (
    <div className="product-card">
      <div className="card-img-wrap">
        <div className="card-img-inner">IMAGE</div>
        {product.badge && <span className="card-badge">{product.badge}</span>}
        <div className="card-overlay">
          <button className="btn-primary" style={{ fontSize: "0.65rem", padding: "0.7rem 1.5rem" }}>
            Quick Add
          </button>
        </div>
      </div>
      <div className="card-body">
        <div>
          <div className="card-name">{product.name}</div>
          <div className="card-cat">{product.category}</div>
        </div>
        <div className="card-price">{product.price}</div>
      </div>
    </div>
  );
}

function ProductShowcase() {
  // Duplicate for seamless infinite scroll
  const doubled = [...PRODUCTS, ...PRODUCTS];

  return (
    <section style={{ paddingTop: "5rem", paddingBottom: "5rem" }}>
      {/* Header */}
      <div style={{ padding: "0 4rem", marginBottom: "2.5rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div className="section-eyebrow" style={{ marginBottom: "0.75rem" }}>New Arrivals</div>
          <h2 className="font-display" style={{ fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 300, letterSpacing: "-0.01em" }}>
            The Edit, <em style={{ color: "var(--warm-grey)", fontStyle: "italic" }}>Spring 2025</em>
          </h2>
        </div>
        <a href="#" style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", color: "var(--warm-grey)", borderBottom: "1px solid var(--mid-grey)", paddingBottom: "2px" }}>
          View All
        </a>
      </div>

      {/* Marquee */}
      <div className="marquee-wrapper" style={{ padding: "1rem 4rem 1rem 4rem" }}>
        <div className="marquee-track">
          {doubled.map((p, i) => (
            <ProductCard key={`${p.id}-${i}`} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        {/* Brand col */}
        <div>
          <div className="footer-brand">MAISON·ORÉ</div>
          <div className="footer-tagline">Crafted for the considered.</div>
          <p style={{ fontSize: "0.78rem", color: "rgba(247,244,239,0.45)", lineHeight: 1.85, maxWidth: 260, fontWeight: 300 }}>
            A slow-fashion label rooted in timeless design, responsible sourcing, and uncompromising craft.
          </p>
          {/* Social icons row */}
          <div style={{ display: "flex", gap: "0.85rem", marginTop: "1.75rem" }}>
            {["IG", "TW", "TK", "YT"].map((s) => (
              <a key={s} href="#" style={{
                width: 34, height: 34, border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.6rem", letterSpacing: "0.08em", color: "rgba(247,244,239,0.4)",
                textDecoration: "none", transition: "border-color 0.2s, color 0.2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.45)"; (e.currentTarget as HTMLElement).style.color = "var(--cream)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "rgba(247,244,239,0.4)"; }}
              >{s}</a>
            ))}
          </div>
        </div>

        {/* Link cols */}
        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading}>
            <div className="footer-col-head">{heading}</div>
            {links.map((l) => <a key={l} href="#" className="footer-link">{l}</a>)}
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span>© 2025 Maison·Oré. All rights reserved.</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <a href="#" className="footer-link" style={{ marginBottom: 0 }}>Privacy</a>
          <a href="#" className="footer-link" style={{ marginBottom: 0 }}>Terms</a>
          <a href="#" className="footer-link" style={{ marginBottom: 0 }}>Cookies</a>
        </div>
      </div>
    </footer>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Navbar />
      <main>
        <HeroSection />
        <div className="divider" />
        <ProductShowcase />
      </main>
      <Footer />
    </>
  );
}
