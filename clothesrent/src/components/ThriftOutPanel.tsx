import { useEffect, useMemo, useState } from "react";
import {
  fetchListings,
  purchaseListing,
  searchListings,
} from "../api/listings";
import type { Listing } from "../types/listing";
import { buildDisplayUrl } from "../utils/cloudinaryUrl";
import { loadUserProfile, type UserProfileData } from "../utils/profileStorage";
import { geocodeAddressToCoords } from "../utils/location";

interface Props {
  userId: string;
}

function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function ThriftOutPanel({ userId }: Props) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [proximityOnly, setProximityOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState("25");
  const [profileCoords, setProfileCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locationCoords, setLocationCoords] = useState<
    Record<string, { lat: number; lng: number } | null>
  >({});

  const loadLive = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchListings("Live");
      setItems(data);
    } catch (err: any) {
      setError(err.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLive();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProfileCoords = async () => {
      if (!userId) {
        setProfileCoords(null);
        return;
      }

      const fallback: UserProfileData = {
        name: "",
        style: "",
        picture: "",
        location: "",
      };
      const profile = loadUserProfile(userId, fallback);
      if (!profile.location.trim()) {
        setProfileCoords(null);
        return;
      }

      const coords = await geocodeAddressToCoords(profile.location);
      if (!cancelled) setProfileCoords(coords);
    };

    loadProfileCoords();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (!proximityOnly || !profileCoords) return;

    const locations = Array.from(
      new Set(
        items
          .map((item) => item.location?.trim() || "")
          .filter((location) => location.length > 0),
      ),
    );

    const missing = locations.filter((location) => !(location in locationCoords));
    if (!missing.length) return;

    const loadMissing = async () => {
      const entries = await Promise.all(
        missing.map(async (location) => [location, await geocodeAddressToCoords(location)] as const),
      );
      if (cancelled) return;

      setLocationCoords((prev) => {
        const next = { ...prev };
        entries.forEach(([location, coords]) => {
          next[location] = coords;
        });
        return next;
      });
    };

    loadMissing();
    return () => {
      cancelled = true;
    };
  }, [items, locationCoords, profileCoords, proximityOnly]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadLive();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await searchListings(searchQuery.trim());
      setItems(results);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId: string) => {
    if (!userId) {
      alert("Please sign in to make a purchase.");
      return;
    }

    if (!confirm("Confirm purchase?")) return;

    setPurchasing(itemId);
    try {
      await purchaseListing(itemId, userId);
      alert("Purchase successful!");
      setItems((prev) => prev.filter((i) => i._id !== itemId));
    } catch (err: any) {
      alert(err.message || "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  /** Compute a badge label based on item metadata */
  const getBadge = (item: Listing): string | undefined => {
    const created = new Date(item.createdAt).getTime();
    const now = Date.now();
    if (now - created < 24 * 60 * 60 * 1000) return "NEW";
    return undefined;
  };

  const filteredItems = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    const radius = Number(radiusKm);

    return items.filter((item) => {
      if (min != null && Number.isFinite(min) && item.price < min) return false;
      if (max != null && Number.isFinite(max) && item.price > max) return false;

      if (!proximityOnly) return true;
      if (!profileCoords || !item.location?.trim()) return false;

      const coords = locationCoords[item.location.trim()];
      if (!coords) return false;

      return distanceKm(profileCoords, coords) <= radius;
    });
  }, [items, locationCoords, maxPrice, minPrice, profileCoords, proximityOnly, radiusKm]);

  return (
    <div>
      <div className="shop-search-bar">
        <input
          type="text"
          className="shop-search-input"
          placeholder="Search by style... (e.g. minimalist oversized hoodie)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          type="button"
          className="btn-primary shop-search-btn"
          onClick={handleSearch}>
          Search
        </button>
        {searchQuery && (
          <button
            type="button"
            className="btn-outline shop-search-btn"
            onClick={() => {
              setSearchQuery("");
              loadLive();
            }}>
            Clear
          </button>
        )}
      </div>

      <div className="shop-filter-bar">
        <div className="shop-filter-group">
          <label className="shop-filter-label" htmlFor="price-min">
            Min Price
          </label>
          <input
            id="price-min"
            type="number"
            min="0"
            className="shop-filter-input"
            placeholder="0"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
        </div>

        <div className="shop-filter-group">
          <label className="shop-filter-label" htmlFor="price-max">
            Max Price
          </label>
          <input
            id="price-max"
            type="number"
            min="0"
            className="shop-filter-input"
            placeholder="1000"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
        </div>

        <label className="shop-filter-toggle" htmlFor="proximity-toggle">
          <input
            id="proximity-toggle"
            type="checkbox"
            checked={proximityOnly}
            onChange={(event) => setProximityOnly(event.target.checked)}
          />
          <span>Near Me</span>
        </label>

        {proximityOnly && (
          <div className="shop-filter-group">
            <label className="shop-filter-label" htmlFor="radius-km">
              Radius
            </label>
            <select
              id="radius-km"
              className="shop-filter-input"
              value={radiusKm}
              onChange={(event) => setRadiusKm(event.target.value)}>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
            </select>
          </div>
        )}
      </div>

      {proximityOnly && !profileCoords && (
        <p className="shop-section-subtitle">
          Save a profile location to enable proximity filtering.
        </p>
      )}

      {loading && (
        <p className="shop-section-subtitle">Loading available items...</p>
      )}

      {error && (
        <p className="shop-section-subtitle" style={{ color: "#b44" }}>
          {error}
        </p>
      )}

      {!loading && filteredItems.length === 0 && (
        <p className="shop-section-subtitle">
          No items found. Try a different search term.
        </p>
      )}

      <div className="shop-grid">
        {filteredItems.map((item) => {
          const isOwn = userId && item.sellerId === userId;
          const badge = item.transformations?.badge || getBadge(item);
          const t = item.transformations;
          const itemCoords = item.location?.trim()
            ? locationCoords[item.location.trim()]
            : null;
          const itemDistance =
            proximityOnly && profileCoords && itemCoords
              ? distanceKm(profileCoords, itemCoords)
              : null;
          const displayUrl = item.cloudinaryUrl
            ? buildDisplayUrl(item.cloudinaryUrl, {
                width: 400,
                height: 533,
                removeBg: t?.removeBg,
                replaceBg: t?.replaceBg ?? undefined,
                badge,
                badgeColor: t?.badgeColor,
              })
            : "";

          return (
            <article key={item._id} className="shop-card">
              {displayUrl && (
                <div className="shop-card-img-wrap">
                  <img
                    src={displayUrl}
                    alt={item.title}
                    className="shop-card-img"
                    loading="lazy"
                  />
                </div>
              )}
              <h3 className="shop-card-title">{item.title}</h3>
              <p className="shop-card-meta">{item.description}</p>
              {item.location && (
                <p className="shop-card-meta shop-card-location">Location: {item.location}</p>
              )}
              <p className="shop-card-meta shop-card-location">
                Listed by:{" "}
                {item.sellerId ? (
                  <a
                    className="shop-card-user-link"
                    href={`/profile/${encodeURIComponent(item.sellerId)}`}>
                    {item.sellerName?.trim() || item.sellerId}
                  </a>
                ) : (
                  "Unknown seller"
                )}
              </p>
              {itemDistance != null && (
                <p className="shop-card-meta shop-card-location">
                  Distance: {itemDistance.toFixed(1)} km
                </p>
              )}
              <p className="shop-card-rate">
                ${item.price}
                {item.dailyRate > 0 && (
                  <span className="shop-card-daily">
                    {" "}· ${item.dailyRate}/day
                  </span>
                )}
              </p>
              {item.tags.length > 0 && (
                <div className="shop-card-tags">
                  {item.tags.map((tag) => (
                    <span key={tag} className="shop-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="shop-card-actions">
                {isOwn ? (
                  <span className="shop-pill shop-pill-own">Your listing</span>
                ) : (
                  <button
                    type="button"
                    className="btn-primary shop-action-btn"
                    disabled={purchasing === item._id || !userId}
                    onClick={() => handlePurchase(item._id)}>
                    {purchasing === item._id ? "Processing..." : "Purchase"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
