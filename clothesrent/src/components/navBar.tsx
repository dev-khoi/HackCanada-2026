import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import StyleSearchModal from "./StyleSearchModal";
import type { Listing } from "../types/listing";

const NAV_LINKS = ["Home", "Wardrobe", "Shop"];

export default function Navbar({
  onRecommendations,
}: {
  onRecommendations?: (listings: Listing[]) => void;
}) {
  const { isAuthenticated, logout, user } = useAuth0();
  const [scrolled, setScrolled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleRecommendations = (listings: Listing[]) => {
    onRecommendations?.(listings);
    setModalOpen(false);
  };

  return (
    <>
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <a href="/" className="brand">
          MAISON ORE
        </a>

        <div className="nav-links">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href={
                link === "Home"
                  ? "/"
                  : link === "Shop"
                  ? "/shop"
                  : link === "Wardrobe"
                  ? "/outfit"
                  : "#"
              }
              className="nav-link">
              {link}
            </a>
          ))}
        </div>

        <button
          type="button"
          className="nav-style-btn"
          onClick={() => setModalOpen(true)}>
          &#9733; Style Search
        </button>

        <div className="nav-auth-actions">
          {isAuthenticated && user && (
            <p className="text-decoration: underline">
              Signed in as <strong>{user.nickname ?? user.email}</strong>
            </p>
          )}
          <a
            href={isAuthenticated ? "/profile" : "/signin"}
            className="btn-outline nav-signin nav-signin-link">
            {isAuthenticated ? "Profile" : "Sign In"}
          </a>
          {isAuthenticated && (
            <button
              type="button"
              className="btn-outline nav-signin"
              onClick={() =>
                logout({
                  logoutParams: {
                    returnTo: `${window.location.origin}/signin`,
                  },
                })
              }>
              Sign Out
            </button>
          )}
        </div>
      </nav>

      <StyleSearchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        auth0Id={user?.sub ?? ""}
        onRecommendations={handleRecommendations}
      />
    </>
  );
}
