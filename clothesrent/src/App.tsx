import { useEffect, useRef, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import './App.css'

type Product = {
  id: number
  name: string
  category: string
  price: string
  distance: string
  availability: string
  badge: string | null
}

const NAV_LINKS = ['Home', 'Shop', 'New Arrivals', 'Men', 'Women', 'Contact']

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Obsidian Trench',
    category: 'Women - Outerwear',
    price: '$485',
    distance: '1.2 mi',
    availability: 'Available Today',
    badge: 'Popular',
  },
  {
    id: 2,
    name: 'Ivory Linen Shirt',
    category: 'Men - Tops',
    price: '$210',
    distance: '2.4 mi',
    availability: 'Available Tomorrow',
    badge: null,
  },
  {
    id: 3,
    name: 'Slate Wool Blazer',
    category: 'Men - Tailoring',
    price: '$620',
    distance: '0.9 mi',
    availability: 'Available Today',
    badge: 'Popular',
  },
  {
    id: 4,
    name: 'Cream Slip Dress',
    category: 'Women - Dresses',
    price: '$340',
    distance: '1.8 mi',
    availability: 'Available Today',
    badge: null,
  },
  {
    id: 5,
    name: 'Charcoal Wide-Leg',
    category: 'Men - Trousers',
    price: '$295',
    distance: '3.2 mi',
    availability: 'Available Tomorrow',
    badge: 'New',
  },
  {
    id: 6,
    name: 'Ecru Knit Set',
    category: 'Women - Knitwear',
    price: '$375',
    distance: '1.5 mi',
    availability: 'Available Today',
    badge: null,
  },
  {
    id: 7,
    name: 'Bone Leather Jacket',
    category: 'Women - Outerwear',
    price: '$890',
    distance: '2.0 mi',
    availability: 'Available Today',
    badge: 'Limited',
  },
  {
    id: 8,
    name: 'Ash Cashmere Coat',
    category: 'Men - Outerwear',
    price: '$1,150',
    distance: '4.1 mi',
    availability: 'Weekend Pickup',
    badge: 'Limited',
  },
]

const FOOTER_LINKS: Record<string, string[]> = {
  Shop: ['New Arrivals', 'Women', 'Men', 'Accessories', 'Sale'],
  Help: ['Size Guide', 'Shipping', 'Returns', 'Contact Us', 'FAQ'],
  Brand: ['Our Story', 'Sustainability', 'Press', 'Careers', 'Stockists'],
}

const NEARBY_RENTAL_SPOTS = [
  { id: 1, name: 'Downtown Wardrobe Hub', lat: 43.6524, lng: -79.3839, eta: '12 min' },
  { id: 2, name: 'Queen St Rental Closet', lat: 43.6467, lng: -79.3936, eta: '8 min' },
  { id: 3, name: 'Harbourfront Style Point', lat: 43.6388, lng: -79.3817, eta: '15 min' },
]

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <a href="/" className="brand">
        MAISON ORE
      </a>

      <div className="nav-links">
        {NAV_LINKS.map((link) => (
          <a key={link} href="#" className="nav-link">
            {link}
          </a>
        ))}
      </div>

      <a href="/signin" className="btn-outline nav-signin nav-signin-link">
        Sign In
      </a>
    </nav>
  )
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="product-card">
      <div className="card-img-wrap">
        <div className="card-img-inner">IMAGE</div>
        {product.badge && <span className="card-badge">{product.badge}</span>}
        <div className="card-overlay">
          <button className="btn-primary quick-add">Reserve</button>
        </div>
      </div>
      <div className="card-body">
        <div>
          <div className="card-name">{product.name}</div>
          <div className="card-cat">{product.category}</div>
          <div className="card-availability">{product.availability}</div>
        </div>
        <div className="card-side-meta">
          <div className="card-price">{product.price}</div>
          <div className="card-distance">{product.distance}</div>
        </div>
      </div>
    </div>
  )
}

function ProductShowcase() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const doubled = [...PRODUCTS, ...PRODUCTS]

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    let animationFrame = 0
    const speed = 0.45

    const tick = () => {
      if (!isHovered) {
        viewport.scrollLeft += speed
        const halfWidth = viewport.scrollWidth / 2
        if (viewport.scrollLeft >= halfWidth) {
          viewport.scrollLeft -= halfWidth
        }
      }
      animationFrame = window.requestAnimationFrame(tick)
    }

    animationFrame = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(animationFrame)
  }, [isHovered])

  const slideBy = (direction: -1 | 1) => {
    const viewport = viewportRef.current
    if (!viewport) return

    const cardStep = 324
    viewport.scrollBy({ left: direction * cardStep, behavior: 'smooth' })
  }

  return (
    <section
      className="showcase showcase-elevated"
    >
      <div className="showcase-head">
        <div>
          <div className="section-eyebrow showcase-eyebrow">Near You</div>
          <h2 className="font-display showcase-title">
            Rentable Looks <em>Close By</em>
          </h2>
          <p className="showcase-subtitle">Local picks within a short distance of your current location.</p>
        </div>
        <div className="showcase-actions">
          <a href="#" className="showcase-link">
            See Nearby
          </a>
        </div>
      </div>

      <div className="carousel-shell">
        <button
          type="button"
          className="carousel-btn carousel-btn-left"
          aria-label="Scroll left through clothing items"
          onClick={() => slideBy(-1)}
        >
          &#8592;
        </button>
        <div
          className="marquee-wrapper marquee-pad carousel-viewport"
          ref={viewportRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="marquee-track">
            {doubled.map((product, index) => (
              <ProductCard key={`${product.id}-${index}`} product={product} />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="carousel-btn carousel-btn-right"
          aria-label="Scroll right through clothing items"
          onClick={() => slideBy(1)}
        >
          &#8594;
        </button>
      </div>
    </section>
  )
}

function NearbyMapSection() {
  return (
    <section className="map-section">
      <div className="map-section-head">
        <div className="section-eyebrow map-eyebrow">Map View</div>
        <h3 className="font-display map-title">
          Rentals Around <em>You</em>
        </h3>
        <p className="map-subtitle">Frontend-only placeholder map for nearby inventory. Plug in geolocation logic later.</p>
      </div>

      <div className="map-shell">
        <MapContainer center={[43.6518, -79.3832]} zoom={13} scrollWheelZoom={false} className="leaflet-map">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {NEARBY_RENTAL_SPOTS.map((spot) => (
            <CircleMarker
              key={spot.id}
              center={[spot.lat, spot.lng]}
              radius={9}
              pathOptions={{ color: '#251f33', fillColor: '#7dd6c1', fillOpacity: 0.95, weight: 2 }}
            >
              <Popup>
                <strong>{spot.name}</strong>
                <br />
                Pickup ETA: {spot.eta}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
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

function SignInPage() {
  const { isLoading, isAuthenticated, error, loginWithRedirect: login, logout: auth0Logout, user } = useAuth0()

  const signup = () => login({ authorizationParams: { screen_hint: 'signup' } })

  const logout = () => auth0Logout({ logoutParams: { returnTo: `${window.location.origin}/signin` } })

  if (isLoading) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1 className="font-display auth-title">Loading...</h1>
        </section>
      </main>
    )
  }

  if (isAuthenticated) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <a href="/" className="auth-home-link">
            Back to Home
          </a>
          <p className="auth-subtitle">Logged in as {user?.email ?? 'your account'}</p>
          <h1 className="font-display auth-title">User Profile</h1>
          <pre className="auth-pre">{JSON.stringify(user, null, 2)}</pre>
          <button type="button" className="btn-primary auth-btn" onClick={logout}>
            Logout
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a href="/" className="auth-home-link">
          Back to Home
        </a>
        <p className="auth-subtitle">Maison Ore Account</p>
        <h1 className="font-display auth-title">Sign In</h1>
        {error && <p className="auth-error">Error: {error.message}</p>}
        <div className="auth-actions">
          <button type="button" className="btn-primary auth-btn" onClick={signup}>
            Signup
          </button>
          <button type="button" className="btn-outline auth-btn" onClick={() => login()}>
            Login
          </button>
        </div>
      </section>
    </main>
  )
}

function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <ProductShowcase />
        <NearbyMapSection />
        <div className="divider" />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return window.location.pathname === '/signin' ? <SignInPage /> : <LandingPage />
}
