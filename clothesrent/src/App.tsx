import { useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "./App.css";
import ShopPage from "./pages/shopPage";
import SellerUploadPosting from "./pages/sellerUploadPosting";
import ProfilePage from "./pages/profilePage";
import OutfitPage from "./pages/outfitPage";
import HowItWorksPage from "./pages/howItWorksPage";
import ListingDetailPage from "./pages/listingDetailPage";
import CartPage from "./pages/cartPage";
import SavesPage from "./pages/savesPage";
import {
  loadUserProfile,
  PROFILE_UPDATED_EVENT,
  type UserProfileData,
} from "./utils/profileStorage";
import { geocodeAddressToCoords, useUserLocation } from "./utils/location";
import { onNavigate } from "./utils/navigate";
import { fetchListings, fetchPublicUserProfile } from "./api/listings";
import type { Listing } from "./types/listing";
import { buildDisplayUrl } from "./utils/cloudinaryUrl";
import StyleSearchModal from "./components/StyleSearchModal";
import GatePage from "./pages/GatePage";
import OnboardingPage from "./pages/OnboardingPage";

const FOOTER_LINKS: Record<string, string[]> = {
  Navigate: ["Home", "Shop", "Profile", "Sign In"],
};

const DEFAULT_MAP_CENTER: [number, number] = [43.6518, -79.3832];


function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

function ListingCard({ listing }: { listing: Listing }) {
  const t = listing.transformations;
  const badge = t?.badge || undefined;
  const displayUrl = listing.cloudinaryUrl
    ? buildDisplayUrl(listing.cloudinaryUrl, {
      width: 400,
      height: 533,
      removeBg: t?.removeBg,
      replaceBg: t?.replaceBg ?? undefined,
      badge,
      badgeColor: t?.badgeColor,
    })
    : "";

  return (
    <a href={`/listing/${listing._id}`} className="product-card product-card-link">
      <div className="card-img-wrap">
        {displayUrl ? (
          <img src={displayUrl} alt={listing.title} className="card-img-inner" loading="lazy" />
        ) : (
          <div className="card-img-inner">IMAGE</div>
        )}
        {badge && <span className="card-badge">{badge}</span>}
      </div>
      <div className="card-body">
        <div>
          <div className="card-name">{listing.title}</div>
          <div className="card-cat">{listing.tags.slice(0, 2).join(" · ") || "Fashion"}</div>
          {listing.size && (listing.size.letter || listing.size.waist || listing.size.shoe) && (
            <div className="card-sizes">
              {listing.size.letter && <span className="card-size-pill">{listing.size.letter}</span>}
              {listing.size.waist && <span className="card-size-pill">W{listing.size.waist}</span>}
              {listing.size.shoe && <span className="card-size-pill">US{listing.size.shoe}</span>}
            </div>
          )}
          <div className="card-availability">
            {listing.status === "Live" ? "Available" : listing.status}
          </div>
        </div>
        <div className="card-side-meta">
          <div className="card-price">${listing.price}</div>
          {listing.dailyRate > 0 && (
            <div className="card-distance">${listing.dailyRate}/day</div>
          )}
        </div>
      </div>
    </a>
  );
}

function ProductShowcase({
  recommendations,
  onClearRecommendations,
  dbListings,
}: {
  recommendations: Listing[];
  onClearRecommendations: () => void;
  dbListings: Listing[];
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isPaused = useRef(false);

  const hasRecommendations = recommendations.length > 0;
  const displayListings = hasRecommendations ? recommendations : dbListings;
  const doubled =
    displayListings.length > 0
      ? [...displayListings, ...displayListings]
      : [];

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || doubled.length === 0) return;

    let animationFrame = 0;
    const speed = 0.45;

    const tick = () => {
      if (!isHovered && !isPaused.current) {
        viewport.scrollLeft += speed;
        const halfWidth = viewport.scrollWidth / 2;
        if (viewport.scrollLeft >= halfWidth) {
          viewport.scrollLeft -= halfWidth;
        }
      }
      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [isHovered]);

  const slideBy = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Pause auto-scroll so it doesn't fight the manual scroll
    isPaused.current = true;

    const cardStep = 324;
    const target = viewport.scrollLeft + direction * cardStep;
    const halfWidth = viewport.scrollWidth / 2;

    // Animate manually over 400ms
    const start = viewport.scrollLeft;
    const startTime = performance.now();
    const duration = 400;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      viewport.scrollLeft = start + (target - start) * eased;

      // Wrap around for infinite loop
      if (viewport.scrollLeft >= halfWidth) {
        viewport.scrollLeft -= halfWidth;
      } else if (viewport.scrollLeft < 0) {
        viewport.scrollLeft += halfWidth;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Resume auto-scroll after animation
        isPaused.current = false;
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <section className="showcase showcase-elevated">
      <div className="showcase-head">
        <div>
          <div className="section-eyebrow showcase-eyebrow">
            {hasRecommendations ? "Your Style" : "Near You"}
          </div>
          <h2 className="font-display showcase-title">
            {hasRecommendations ? (
              <>Matched <em>For You</em></>
            ) : (
              <>Rentable Looks <em>Close By</em></>
            )}
          </h2>
          <p className="showcase-subtitle">
            {hasRecommendations
              ? `${recommendations.length} listing(s) matching your style preference.`
              : "Local picks within a short distance of your current location."}
          </p>
        </div>
        <div className="showcase-actions">
          {hasRecommendations ? (
            <button
              type="button"
              className="btn-outline showcase-link"
              onClick={onClearRecommendations}>
              Show All
            </button>
          ) : (
            <a href="/shop" className="showcase-link">
              Browse Shop
            </a>
          )}
        </div>
      </div>

      {doubled.length === 0 ? (
        <p className="showcase-subtitle" style={{ textAlign: "center", padding: "2rem 0" }}>
          No listings yet. Be the first to post!
        </p>
      ) : (
        <div className="carousel-shell">
          <button
            type="button"
            className="carousel-btn carousel-btn-left"
            aria-label="Scroll left through clothing items"
            onClick={() => slideBy(-1)}>
            &#8592;
          </button>
          <div
            className="marquee-wrapper marquee-pad carousel-viewport"
            ref={viewportRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
            <div className="marquee-track">
              {doubled.map((listing, index) => (
                <ListingCard key={`${listing._id}-${index}`} listing={listing} />
              ))}
            </div>
          </div>
          <button
            type="button"
            className="carousel-btn carousel-btn-right"
            aria-label="Scroll right through clothing items"
            onClick={() => slideBy(1)}>
            &#8594;
          </button>
        </div>
      )}
    </section>
  );
}

interface ListingPin {
  id: string;
  title: string;
  price: number;
  dailyRate: number;
  lat: number;
  lng: number;
  href: string;
  imgUrl: string;
}

function NearbyMapSection({ listings }: { listings: Listing[] }) {
  const gpsCoords = useUserLocation();
  const [listingPins, setListingPins] = useState<ListingPin[]>([]);

  // Geocode listing addresses
  useEffect(() => {
    if (!listings.length) return;
    let cancelled = false;
    const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

    const geocodeAll = async () => {
      const pins: ListingPin[] = [];
      for (const l of listings) {
        if (!l.location?.trim()) continue;
        let coords = geocodeCache.get(l.location);
        if (coords === undefined) {
          const result = await geocodeAddressToCoords(l.location);
          coords = result ?? null;
          geocodeCache.set(l.location, coords);
        }
        if (cancelled || !coords) continue;
        pins.push({
          id: l._id,
          title: l.title,
          price: l.price,
          dailyRate: l.dailyRate,
          lat: coords.lat,
          lng: coords.lng,
          href: `/listing/${l._id}`,
          imgUrl: l.cloudinaryUrl
            ? buildDisplayUrl(l.cloudinaryUrl, { width: 160, height: 160, removeBg: false })
            : "",
        });
      }
      if (!cancelled) setListingPins(pins);
    };

    geocodeAll();
    return () => { cancelled = true; };
  }, [listings]);

  // Priority: 1. browser GPS  2. Toronto fallback
  const center: [number, number] = gpsCoords
    ? [gpsCoords.lat, gpsCoords.lng]
    : DEFAULT_MAP_CENTER;

  return (
    <section className="map-section">
      <div className="map-section-head">
        <div className="section-eyebrow map-eyebrow">Map View</div>
        <h3 className="font-display map-title">
          Rentals Around <em>You</em>
        </h3>
        <p className="map-subtitle">
          Browse listings near your current location.
        </p>
      </div>

      <div className="map-shell">
        <MapContainer
          center={center}
          zoom={11}
          scrollWheelZoom={false}
          className="leaflet-map">
          <MapRecenter center={center} />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {listingPins.map((pin) => {
            const icon = L.divIcon({
              className: "",
              html: `<div class="listing-marker-wrap"><div class="listing-marker">${pin.imgUrl ? `<img src="${pin.imgUrl}" alt="" loading="lazy" />` : `<span class="listing-marker-dot"></span>`
                }</div></div>`,
              iconSize: [80, 80],
              iconAnchor: [40, 40],
              popupAnchor: [0, -42],
            });
            return (
              <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={icon}>
                <Popup className="map-popup">
                  <strong>{pin.title}</strong>
                  {pin.dailyRate > 0 && <span className="map-popup-meta">${pin.dailyRate}/day &middot; </span>}
                  <span className="map-popup-meta">${pin.price} buy</span>
                  <a href={pin.href} className="map-popup-link">View &rarr;</a>
                </Popup>
              </Marker>
            );
          })}

          {/* GPS "You are here" pin */}
          {gpsCoords && (() => {
            const youIcon = L.divIcon({
              className: "",
              html: `<div class="you-marker-wrap"><div class="you-marker"><div class="you-marker-pulse"></div><span>You</span></div></div>`,
              iconSize: [80, 80],
              iconAnchor: [40, 40],
              popupAnchor: [0, -42],
            });
            return (
              <Marker position={[gpsCoords.lat, gpsCoords.lng]} icon={youIcon}>
                <Popup className="map-popup"><strong>You are here</strong></Popup>
              </Marker>
            );
          })()}

        </MapContainer>
      </div>
    </section>
  );
}


function Footer() {
  const toHref = (link: string) => {
    if (link === "Home") return "/";
    if (link === "Shop") return "/shop";
    if (link === "Profile") return "/profile";
    if (link === "Sign In") return "/signin";
    return "#";
  };

  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div className="footer-brand">PFIFFLE</div>
          <div className="footer-tagline">Crafted for the considered.</div>
          <p className="footer-copy">
            A slow-fashion label rooted in timeless design, responsible
            sourcing, and uncompromising craft.
          </p>
          <div className="social-row">
            {["IG", "TW", "TK", "YT"].map((social) => (
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
              <a key={link} href={toHref(link)} className="footer-link">
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span>(c) 2025 Pfiffle. All rights reserved.</span>
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
  );
}

function SignInPage() {
  const {
    isLoading,
    isAuthenticated,
    error,
    loginWithRedirect: login,
    logout: auth0Logout,
    user,
  } = useAuth0();

  const profileRedirect = `${window.location.origin}/profile`;

  useEffect(() => {
    if (isAuthenticated && window.location.pathname === "/signin") {
      window.location.replace("/profile");
    }
  }, [isAuthenticated]);

  const signup = () =>
    login({
      authorizationParams: {
        screen_hint: "signup",
        redirect_uri: profileRedirect,
      },
    });

  const logout = () =>
    auth0Logout({
      logoutParams: { returnTo: `${window.location.origin}/signin` },
    });

  if (isLoading) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1 className="font-display auth-title">Loading...</h1>
        </section>
      </main>
    );
  }

  if (isAuthenticated) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="auth-subtitle">
            Logged in as {user?.email ?? "your account"}
          </p>
          <h1 className="font-display auth-title">Redirecting to Profile...</h1>
          <button type="button" className="btn-outline auth-btn" onClick={logout}>
            Logout
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a href="/" className="auth-home-link">
          Back to Home
        </a>
        <p className="auth-subtitle">Pfiffle Account</p>
        <h1 className="font-display auth-title">Sign In</h1>
        {error && <p className="auth-error">Error: {error.message}</p>}
        <div className="auth-actions">
          <button
            type="button"
            className="btn-primary auth-btn"
            onClick={signup}>
            Signup
          </button>
          <button
            type="button"
            className="btn-outline auth-btn"
            onClick={() =>
              login({ authorizationParams: { redirect_uri: profileRedirect } })
            }>
            Login
          </button>
        </div>
      </section>
    </main>
  );
}

function LandingPage({
  recommendations,
  onClearRecommendations,
  onRecommendations,
  auth0Id,
}: {
  recommendations: Listing[];
  onClearRecommendations: () => void;
  onRecommendations: (listings: Listing[]) => void;
  auth0Id: string;
}) {
  const [styleSearchOpen, setStyleSearchOpen] = useState(false);
  const [dbListings, setDbListings] = useState<Listing[]>([]);

  useEffect(() => {
    fetchListings("Live")
      .then((data) => setDbListings(data))
      .catch(() => { });
  }, []);

  // Reset recommendations every time the user navigates back to Explore
  useEffect(() => {
    onClearRecommendations();
  }, []);

  const handleRecommendations = (listings: Listing[]) => {
    onRecommendations(listings);
    setStyleSearchOpen(false);
  };

  return (
    <>
      <main>
        <button
          type="button"
          className="style-search-floating"
          onClick={() => setStyleSearchOpen(true)}>
          &#9733; Style Search
        </button>
        <ProductShowcase
          recommendations={recommendations}
          onClearRecommendations={onClearRecommendations}
          dbListings={dbListings}
        />
        <NearbyMapSection listings={dbListings} />
        <div className="divider" />
      </main>
      <Footer />
      <StyleSearchModal
        isOpen={styleSearchOpen}
        onClose={() => setStyleSearchOpen(false)}
        auth0Id={auth0Id}
        onRecommendations={handleRecommendations}
      />
    </>
  );
}

export default function App({
  recommendations = [],
  onClearRecommendations = () => { },
  onRecommendations = () => { },
}: {
  recommendations?: Listing[];
  onClearRecommendations?: () => void;
  onRecommendations?: (listings: Listing[]) => void;
}) {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    return onNavigate(() => setPath(window.location.pathname));
  }, []);

  const profileMatch = path.match(/^\/profile\/(.+)$/);
  const profileUserId = profileMatch ? decodeURIComponent(profileMatch[1]) : null;
  const [isCheckingRequiredProfile, setIsCheckingRequiredProfile] = useState(true);
  const [mustSetProfileName, setMustSetProfileName] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadRequiredNameState = async () => {
      if (!isAuthenticated || !user?.sub) {
        setMustSetProfileName(false);
        setIsCheckingRequiredProfile(false);
        return;
      }

      try {
        const publicProfile = await fetchPublicUserProfile(user.sub);
        if (!cancelled) {
          const noName = !publicProfile.name.trim();
          setMustSetProfileName(noName);
          setNeedsOnboarding(noName);
        }
      } catch {
        if (!cancelled) {
          // New user — profile doesn't exist yet, trigger onboarding
          setMustSetProfileName(true);
          setNeedsOnboarding(true);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingRequiredProfile(false);
        }
      }
    };

    loadRequiredNameState();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.sub]);

  // Protect routes that require authentication
  const protectedRoutes = ["/shop/new-listing", "/shop", "/profile"];
  const isAccessingProtectedRoute = protectedRoutes.some(
    (route) => path === route,
  );


  // Show gate landing page for unauthenticated users at root (after Auth0 finishes loading)
  if (!isLoading && !isAuthenticated && path === "/") {
    return <GatePage />;
  }

  // Redirect unauthenticated users away from protected routes (only after Auth0 has finished loading)
  if (!isLoading && !isAuthenticated && isAccessingProtectedRoute) {
    return <SignInPage />;
  }

  // Show onboarding for new users who haven't set up their profile yet
  if (isAuthenticated && !isCheckingRequiredProfile && needsOnboarding && !path.startsWith("/profile")) {
    return (
      <OnboardingPage
        onComplete={() => {
          setNeedsOnboarding(false);
          setMustSetProfileName(false);
          window.history.replaceState({}, "", "/");
          setPath("/");
        }}
      />
    );
  }

  if (path === "/signin") {
    return <SignInPage />;
  }

  if (path === "/onboarding") {
    return (
      <OnboardingPage
        onComplete={() => {
          setNeedsOnboarding(false);
          setMustSetProfileName(false);
          window.history.replaceState({}, "", "/");
          setPath("/");
        }}
      />
    );
  }

  if (path === "/shop/new-listing") {
    return <SellerUploadPosting />;
  }

  if (path === "/shop") {
    return <ShopPage />;
  }

  if (path === "/profile") {
    return <ProfilePage requireName={mustSetProfileName} />;
  }

  if (profileUserId) {
    return <ProfilePage profileUserId={profileUserId} />;
  }

  if (path === "/outfit" || path === "/wardrobe") {
    return <OutfitPage />;
  }

  if (path === "/how-it-works") {
    return <HowItWorksPage />;
  }

  if (path.startsWith("/listing/")) {
    return <ListingDetailPage />;
  }

  if (path === "/cart") {
    return <CartPage />;
  }

  if (path === "/saves") {
    return <SavesPage />;
  }

  return <LandingPage recommendations={recommendations} onClearRecommendations={onClearRecommendations} onRecommendations={onRecommendations} auth0Id={user?.sub ?? ""} />;
}
