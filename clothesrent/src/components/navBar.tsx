import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useCart } from "../context/CartContext";
import { useSaves } from "../context/SavesContext";

const NAV_LINKS = ["Explore", "Shop", "Wardrobe", "How It Works"];

/* ── SVG Icons ──────────────────────────────────────── */
const IconUpload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconBookmark = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const IconCart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const IconUser = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth0();
  const { cartCount } = useCart();
  const { savedCount } = useSaves();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <a href="/" className="brand">
          PFIFFLE
        </a>

        <div className="nav-links">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href={
                link === "Explore"
                  ? "/"
                  : link === "Shop"
                    ? "/shop"
                    : link === "Wardrobe"
                      ? "/outfit"
                      : link === "How It Works"
                        ? "/how-it-works"
                        : "#"
              }
              className="nav-link">
              {link}
            </a>
          ))}
        </div>

        {/* Right-side icon bar */}
        <div className="nav-icon-bar">
          {/* Upload */}
          {isAuthenticated && (
            <a href="/shop/new-listing" className="nav-icon-btn" title="Upload listing">
              <IconUpload />
              <span className="nav-icon-label">Upload</span>
            </a>
          )}

          {/* Saves */}
          <a href="/saves" className="nav-icon-btn" title="Saved items">
            <IconBookmark />
            {savedCount > 0 && <span className="nav-icon-badge">{savedCount}</span>}
          </a>

          {/* Cart */}
          <a href="/cart" className="nav-icon-btn" title="Cart">
            <IconCart />
            {cartCount > 0 && <span className="nav-icon-badge">{cartCount}</span>}
          </a>

          {/* Profile avatar */}
          <div className="nav-avatar-wrap">
            <button
              type="button"
              className="nav-avatar-btn"
              onClick={() => setProfileOpen((p) => !p)}
              title={isAuthenticated ? user?.name || "Profile" : "Sign in"}
            >
              {isAuthenticated && user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || "Avatar"}
                  className="nav-avatar-img"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="nav-avatar-default"><IconUser /></span>
              )}
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="nav-avatar-dropdown">
                {isAuthenticated && user && (
                  <div className="nav-avatar-info">
                    <span className="nav-avatar-name">{user.nickname ?? user.name ?? user.email}</span>
                  </div>
                )}
                {isAuthenticated ? (
                  <>
                    <a href="/profile" className="nav-dropdown-item" onClick={() => setProfileOpen(false)}>
                      Profile
                    </a>
                    <a href="/shop" className="nav-dropdown-item" onClick={() => setProfileOpen(false)}>
                      My Shop
                    </a>
                    <a href="/saves" className="nav-dropdown-item" onClick={() => setProfileOpen(false)}>
                      Saved Items
                    </a>
                    <button
                      type="button"
                      className="nav-dropdown-item nav-dropdown-signout"
                      onClick={() => {
                        setProfileOpen(false);
                        logout({
                          logoutParams: {
                            returnTo: `${window.location.origin}/signin`,
                          },
                        });
                      }}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <a href="/signin" className="nav-dropdown-item" onClick={() => setProfileOpen(false)}>
                    Sign In
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

    </>
  );
}
