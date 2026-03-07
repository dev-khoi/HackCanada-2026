import { useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
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
import { geocodeAddressToCoords } from "./utils/location";
import { onNavigate } from "./utils/navigate";
import { fetchListings, fetchPublicUserProfile } from "./api/listings";
import type { Listing } from "./types/listing";
import { buildDisplayUrl } from "./utils/cloudinaryUrl";

const FOOTER_LINKS: Record<string, string[]> = {
  Navigate: ["Home", "Shop", "Profile", "Sign In"],
};

const NEARBY_RENTAL_SPOTS = [
  {
    id: 1,
    name: "Downtown Wardrobe Hub",
    lat: 43.6524,
    lng: -79.3839,
    eta: "12 min",
  },
  {
    id: 2,
    name: "Queen St Rental Closet",
    lat: 43.6467,
    lng: -79.3936,
    eta: "8 min",
  },
  {
    id: 3,
    name: "Harbourfront Style Point",
    lat: 43.6388,
    lng: -79.3817,
    eta: "15 min",
  },
];

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
    <div className="product-card">
      <div className="card-img-wrap">
        {displayUrl ? (
          <img src={displayUrl} alt={listing.title} className="card-img-inner" loading="lazy" />
        ) : (
          <div className="card-img-inner">IMAGE</div>
        )}
        {badge && <span className="card-badge">{badge}</span>}
        <div className="card-overlay">
          <a href={`/listing/${listing._id}`} className="btn-primary quick-add">View</a>
        </div>
      </div>
      <div className="card-body">
        <div>
          <div className="card-name">{listing.title}</div>
          <div className="card-cat">{listing.tags.slice(0, 2).join(" · ") || "Fashion"}</div>
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
    </div>
  );
}

function ProductShowcase({
  recommendations,
  onClearRecommendations,
}: {
  recommendations: Listing[];
  onClearRecommendations: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [dbListings, setDbListings] = useState<Listing[]>([]);

  useEffect(() => {
    fetchListings("Live")
      .then((data) => setDbListings(data))
      .catch(() => { });
  }, []);

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
      if (!isHovered) {
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

    const cardStep = 324;
    viewport.scrollBy({ left: direction * cardStep, behavior: "smooth" });
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

function NearbyMapSection() {
  const { user } = useAuth0();
  const [userMapSpot, setUserMapSpot] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refreshUserSpot = async () => {
      if (!user?.sub) {
        setUserMapSpot(null);
        return;
      }

      const fallbackProfile: UserProfileData = {
        name: user?.name ?? user?.nickname ?? "You",
        style: "",
        picture: user?.picture ?? "",
        location: "",
      };
      const profile = loadUserProfile(user.sub, fallbackProfile);
      if (!profile.location.trim()) {
        setUserMapSpot(null);
        return;
      }

      const coords = await geocodeAddressToCoords(profile.location);
      if (cancelled || !coords) return;

      setUserMapSpot({
        name: profile.name || "Your profile",
        address: profile.location,
        lat: coords.lat,
        lng: coords.lng,
      });
    };

    const onProfileUpdated = () => {
      refreshUserSpot();
    };

    refreshUserSpot();
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, [user?.name, user?.nickname, user?.picture, user?.sub]);

  return (
    <section className="map-section">
      <div className="map-section-head">
        <div className="section-eyebrow map-eyebrow">Map View</div>
        <h3 className="font-display map-title">
          Rentals Around <em>You</em>
        </h3>
        <p className="map-subtitle">
          Nearby rental spots plus your saved profile location.
        </p>
      </div>

      <div className="map-shell">
        {/*
          Keep map centered on profile location when available;
          fallback to Toronto center otherwise.
        */}
        {(() => {
          const center: [number, number] = userMapSpot
            ? [userMapSpot.lat, userMapSpot.lng]
            : DEFAULT_MAP_CENTER;

          return (
            <MapContainer
              center={center}
              zoom={13}
              scrollWheelZoom={false}
              className="leaflet-map">
              <MapRecenter center={center} />
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {NEARBY_RENTAL_SPOTS.map((spot) => (
                <CircleMarker
                  key={spot.id}
                  center={[spot.lat, spot.lng]}
                  radius={9}
                  pathOptions={{
                    color: "#251f33",
                    fillColor: "#7dd6c1",
                    fillOpacity: 0.95,
                    weight: 2,
                  }}>
                  <Popup>
                    <strong>{spot.name}</strong>
                    <br />
                    Pickup ETA: {spot.eta}
                  </Popup>
                </CircleMarker>
              ))}
              {userMapSpot && (
                <CircleMarker
                  key={`profile-marker-${userMapSpot.lat}-${userMapSpot.lng}`}
                  center={[userMapSpot.lat, userMapSpot.lng]}
                  radius={12}
                  pathOptions={{
                    color: "#0f172a",
                    fillColor: "#38bdf8",
                    fillOpacity: 0.95,
                    weight: 2,
                  }}>
                  <Popup>
                    <strong>{userMapSpot.name} (You)</strong>
                    <br />
                    {userMapSpot.address}
                  </Popup>
                </CircleMarker>
              )}
            </MapContainer>
          );
        })()}
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
          <div className="footer-brand">MAISON ORE</div>
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
        <p className="auth-subtitle">Maison Ore Account</p>
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
}: {
  recommendations: Listing[];
  onClearRecommendations: () => void;
}) {
  return (
    <>
      <main>
        <ProductShowcase
          recommendations={recommendations}
          onClearRecommendations={onClearRecommendations}
        />
        <NearbyMapSection />
        <div className="divider" />
      </main>
      <Footer />
    </>
  );
}

export default function App({
  recommendations = [],
  onClearRecommendations = () => { },
}: {
  recommendations?: Listing[];
  onClearRecommendations?: () => void;
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
          setMustSetProfileName(!publicProfile.name.trim());
        }
      } catch {
        if (!cancelled) {
          setMustSetProfileName(false);
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


  // Redirect unauthenticated users away from protected routes (only after Auth0 has finished loading)
  if (!isLoading && !isAuthenticated && isAccessingProtectedRoute) {
    return <SignInPage />;
  }

  // Only redirect to profile AFTER check completes (no blocking loading screen)
  if (isAuthenticated && !isCheckingRequiredProfile && mustSetProfileName && !path.startsWith("/profile")) {
    return <ProfilePage requireName />;
  }

  if (path === "/signin") {
    return <SignInPage />;
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

  return <LandingPage recommendations={recommendations} onClearRecommendations={onClearRecommendations} />;
}
