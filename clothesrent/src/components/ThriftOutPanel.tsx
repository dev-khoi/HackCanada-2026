import { useEffect, useState } from "react";
import {
  fetchListings,
  purchaseListing,
  searchListings,
} from "../api/listings";
import type { Listing } from "../types/listing";
import { buildDisplayUrl } from "../utils/cloudinaryUrl";

interface Props {
  userId: string;
}

export default function ThriftOutPanel({ userId }: Props) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [purchasing, setPurchasing] = useState<string | null>(null);

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

      {loading && (
        <p className="shop-section-subtitle">Loading available items...</p>
      )}

      {error && (
        <p className="shop-section-subtitle" style={{ color: "#b44" }}>
          {error}
        </p>
      )}

      {!loading && items.length === 0 && (
        <p className="shop-section-subtitle">
          No items found. Try a different search term.
        </p>
      )}

      <div className="shop-grid">
        {items.map((item) => {
          const isOwn = userId && item.sellerId === userId;
          const badge = getBadge(item);
          const displayUrl = item.cloudinaryUrl
            ? buildDisplayUrl(item.cloudinaryUrl, {
                width: 400,
                height: 533,
                badge,
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
