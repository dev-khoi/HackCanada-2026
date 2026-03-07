import { useEffect, useState } from 'react'
import './App.css'

type Product = {
  id: number
  name: string
  category: string
  price: string
  badge: string | null
}

const NAV_LINKS = ['Home', 'Shop', 'New Arrivals', 'Men', 'Women', 'Contact']

const PRODUCTS: Product[] = [
  { id: 1, name: 'Obsidian Trench', category: 'Women - Outerwear', price: '$485', badge: 'New' },
  { id: 2, name: 'Ivory Linen Shirt', category: 'Men - Tops', price: '$210', badge: null },
  { id: 3, name: 'Slate Wool Blazer', category: 'Men - Tailoring', price: '$620', badge: 'New' },
  { id: 4, name: 'Cream Slip Dress', category: 'Women - Dresses', price: '$340', badge: null },
  { id: 5, name: 'Charcoal Wide-Leg', category: 'Men - Trousers', price: '$295', badge: 'New' },
  { id: 6, name: 'Ecru Knit Set', category: 'Women - Knitwear', price: '$375', badge: null },
  { id: 7, name: 'Bone Leather Jacket', category: 'Women - Outerwear', price: '$890', badge: 'Limited' },
  { id: 8, name: 'Ash Cashmere Coat', category: 'Men - Outerwear', price: '$1,150', badge: 'Limited' },
]

const FOOTER_LINKS: Record<string, string[]> = {
  Shop: ['New Arrivals', 'Women', 'Men', 'Accessories', 'Sale'],
  Help: ['Size Guide', 'Shipping', 'Returns', 'Contact Us', 'FAQ'],
  Brand: ['Our Story', 'Sustainability', 'Press', 'Careers', 'Stockists'],
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <a href="#" className="brand">
        MAISON ORE
      </a>

      <div className="nav-links">
        {NAV_LINKS.map((link) => (
          <a key={link} href="#" className="nav-link">
            {link}
          </a>
        ))}
      </div>

      <button className="btn-outline nav-signin">Sign In</button>
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-left">
        <div className="hero-eyebrow anim-1">SS 2025 Collection</div>

        <h1 className="hero-title font-display anim-2">
          Wear the
          <br />
          <em>Silence</em>
          <br />
          Between
        </h1>

        <p className="hero-sub anim-3">
          Elevated wardrobe essentials crafted for those who move through the world with quiet intention. Every
          piece, a conversation between fabric and form.
        </p>

        <div className="hero-actions anim-4">
          <button className="btn-primary">
            Shop Now
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
              <path
                d="M1 5h12M9 1l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button className="btn-outline">Explore</button>
        </div>
      </div>

      <div className="hero-right">
        <div className="hero-deco-circle" />
        <div className="hero-img-frame">
          <img src="/obcoat.jpg" alt="Model wearing the Obsidian Trench" className="hero-photo" />
        </div>
        <div className="featured-pill">
          <div className="featured-label">Featured</div>
          <div className="font-display featured-name">Obsidian Trench</div>
          <div className="featured-price">$485</div>
        </div>
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="product-card">
      <div className="card-img-wrap">
        <div className="card-img-inner">IMAGE</div>
        {product.badge && <span className="card-badge">{product.badge}</span>}
        <div className="card-overlay">
          <button className="btn-primary quick-add">Quick Add</button>
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
  )
}

function ProductShowcase() {
  const doubled = [...PRODUCTS, ...PRODUCTS]

  return (
    <section className="showcase">
      <div className="showcase-head">
        <div>
          <div className="section-eyebrow showcase-eyebrow">New Arrivals</div>
          <h2 className="font-display showcase-title">
            The Edit, <em>Spring 2025</em>
          </h2>
        </div>
        <a href="#" className="showcase-link">
          View All
        </a>
      </div>

      <div className="marquee-wrapper marquee-pad">
        <div className="marquee-track">
          {doubled.map((product, index) => (
            <ProductCard key={`${product.id}-${index}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div className="footer-brand">MAISON ORE</div>
          <div className="footer-tagline">Crafted for the considered.</div>
          <p className="footer-copy">
            A slow-fashion label rooted in timeless design, responsible sourcing, and uncompromising craft.
          </p>
          <div className="social-row">
            {['IG', 'TW', 'TK', 'YT'].map((social) => (
              <a key={social} href="#" className="social-link">
                {social}
              </a>
            ))}
          </div>
        </div>

        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading}>
            <div className="footer-col-head">{heading}</div>
            {links.map((link) => (
              <a key={link} href="#" className="footer-link">
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span>(c) 2025 Maison Ore. All rights reserved.</span>
        <div className="footer-bottom-links">
          <a href="#" className="footer-link footer-inline-link">
            Privacy
          </a>
          <a href="#" className="footer-link footer-inline-link">
            Terms
          </a>
          <a href="#" className="footer-link footer-inline-link">
            Cookies
          </a>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <div className="divider" />
        <ProductShowcase />
      </main>
      <Footer />
    </>
  )
}
