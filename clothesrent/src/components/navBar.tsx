import { useState, useEffect, type FormEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const NAV_LINKS = ["Home", "Shop"];
export default function Navbar() {
  const { isAuthenticated, logout } = useAuth0();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    const url = new URL(window.location.href);
    url.pathname = "/shop";
    url.searchParams.set("q", query);
    window.history.pushState({}, "", `${url.pathname}?${url.searchParams.toString()}`);

    // Placeholder integration point for future global search wiring.
    window.dispatchEvent(new CustomEvent("navbar-search", { detail: query }));
  };

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
      <a href="/" className="brand">
        MAISON ORE
      </a>

      <div className="nav-links">
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href={link === "Home" ? "/" : link === "Shop" ? "/shop" : "#"}
            className="nav-link">
            {link}
          </a>
        ))}
      </div>

      <form className="nav-search" onSubmit={handleSearchSubmit}>
        <input
          type="search"
          className="nav-search-input"
          placeholder="Search styles (coming soon)"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Search listings"
        />
        <button type="submit" className="btn-outline nav-search-btn">
          Search
        </button>
      </form>

      <div className="nav-auth-actions">
        <a href={isAuthenticated ? "/profile" : "/signin"} className="btn-outline nav-signin nav-signin-link">
          {isAuthenticated ? "Profile" : "Sign In"}
        </a>
        {isAuthenticated && (
          <button
            type="button"
            className="btn-outline nav-signin"
            onClick={() =>
              logout({
                logoutParams: { returnTo: `${window.location.origin}/signin` },
              })
            }>
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}
